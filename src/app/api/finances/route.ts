import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const voyageId = searchParams.get('voyageId')
    const modePayment = searchParams.get('modePayment')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    // Non-admin employees only see their own finances
    if (session.role !== 'admin') {
      where.userId = session.id
    } else if (userId) {
      where.userId = userId
    }
    if (voyageId) where.voyageId = voyageId
    if (modePayment) where.modePayment = modePayment
    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to)
      where.date = dateFilter
    }

    const finances = await prisma.finance.findMany({
      where,
      include: {
        user: { select: { id: true, username: true } },
        voyage: { select: { id: true, numero: true } },
      },
      orderBy: { date: 'desc' },
    })

    // CA = encaissements (paiements colis + encaissements manuels) → type 'entree'
    // Entrées diverses → type 'entree_diverse' (n'entrent PAS dans le CA)
    // Dépenses → type 'depense'
    // Trésorerie = CA + entrées diverses - dépenses
    const ca = finances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
    const entreesDiverses = finances.filter(f => f.type === 'entree_diverse').reduce((s, f) => s + f.montant, 0)
    const depenses = finances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
    const tresorerie = ca + entreesDiverses - depenses

    return NextResponse.json({
      success: true,
      data: finances,
      totals: { ca, entreesDiverses, depenses, tresorerie },
    })
  } catch (error) {
    console.error('GET finances error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { type, motif, montant, voyageId, colisId, modePayment } = await request.json()

    if (!type || !motif || montant === undefined) {
      return NextResponse.json({ error: 'Type, motif et montant requis' }, { status: 400 })
    }
    if (!['entree', 'depense', 'entree_diverse'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }
    if (!motif.trim()) {
      return NextResponse.json({ error: 'Motif obligatoire' }, { status: 400 })
    }
    if (parseFloat(montant) <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const finance = await prisma.finance.create({
      data: {
        type,
        motif: motif.trim(),
        montant: parseFloat(montant),
        modePayment: type === 'depense' ? null : (modePayment || null),
        voyageId: voyageId || null,
        userId: session.id,
        colisId: colisId || null,
      },
    })

    await logAction({
      userId: session.id,
      action: type === 'depense' ? 'depense' : 'entree',
      entityType: 'Finance',
      entityId: finance.id,
      details: { type, motif, montant },
    })

    return NextResponse.json({ success: true, data: finance }, { status: 201 })
  } catch (error) {
    console.error('POST finances error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
