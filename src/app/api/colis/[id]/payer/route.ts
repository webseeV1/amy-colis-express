import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params
    const { modePayment, payeParId, montant } = await request.json()

    const colis = await prisma.colis.findUnique({ where: { id }, include: { client: true } })
    if (!colis) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 })
    if (colis.statut === 'paye') return NextResponse.json({ error: 'Colis déjà payé' }, { status: 400 })

    // ─── Attribution de l'encaissement ───
    // Employé non-admin : forcément attribué à lui-même.
    // Admin : peut attribuer le paiement à un employé via payeParId.
    let payeurId = session.id
    if (session.role === 'admin' && payeParId) {
      const cible = await prisma.user.findUnique({ where: { id: payeParId }, select: { id: true, actif: true } })
      if (!cible) return NextResponse.json({ error: 'Employé à attribuer introuvable' }, { status: 400 })
      payeurId = cible.id
    }

    // Montant encaissé : valeur confirmée (modifiable), sinon montant du colis.
    const montantEncaisse =
      typeof montant === 'number' && Number.isFinite(montant) && montant >= 0 ? montant : colis.montant

    const updated = await prisma.colis.update({
      where: { id },
      data: {
        statut: 'paye',
        montant: montantEncaisse,
        modePayment: modePayment || 'especes',
        payeParId: payeurId,
        datePaiement: new Date(),
      },
    })

    // Record in finances (compte dans le CA car type = entree)
    await prisma.finance.create({
      data: {
        type: 'entree',
        motif: `Paiement colis - ${colis.client.nom} ${colis.client.prenom}`,
        montant: montantEncaisse,
        modePayment: modePayment || 'especes',
        voyageId: colis.voyageId || undefined,
        userId: payeurId,
        colisId: id,
      },
    })

    await logAction({
      userId: session.id,
      action: 'paiement',
      entityType: 'Colis',
      entityId: id,
      details: {
        montant: montantEncaisse,
        modePayment: modePayment || 'especes',
        payeParId: payeurId,
        attribueParAdmin: payeurId !== session.id,
        client: `${colis.client.nom} ${colis.client.prenom}`,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Payer error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
