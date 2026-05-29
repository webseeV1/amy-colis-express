import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')
    const voyageId = searchParams.get('voyageId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (statut) where.statut = statut
    if (voyageId) where.voyageId = voyageId
    if (search) {
      where.client = {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { telephone: { contains: search } },
        ],
      }
    }

    // Employees only see their own scope
    if (session.role === 'employe_abidjan') {
      where.enregistreParId = session.id
    }

    const colis = await prisma.colis.findMany({
      where,
      include: {
        client: true,
        voyage: { select: { id: true, numero: true, dateVoyage: true, statut: true } },
        enregistrePar: { select: { id: true, username: true } },
        receptionnePar: { select: { id: true, username: true } },
        payePar: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: colis })
  } catch (error) {
    console.error('GET colis error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!['admin', 'employe_abidjan'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { nom, prenom, telephoneDestinataire, telephoneExpediteur, poids, description, estPrepaye, montant, photoUrl } = body

    if (!nom || !prenom || !telephoneDestinataire || !poids || !description) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    // Upsert client
    let client = await prisma.client.findUnique({ where: { telephone: telephoneDestinataire } })
    if (!client) {
      client = await prisma.client.create({ data: { nom, prenom, telephone: telephoneDestinataire } })
    }

    const duree = await prisma.parametres.findUnique({ where: { id: 'singleton' } })
    const jours = duree?.dureeConservationPhoto || 14
    const photoExpiresAt = photoUrl ? new Date(Date.now() + jours * 24 * 60 * 60 * 1000) : undefined

    const colis = await prisma.colis.create({
      data: {
        clientId: client.id,
        expediteurTel: telephoneExpediteur || '',
        poids: parseFloat(poids),
        description,
        montant: parseFloat(montant) || 0,
        statut: estPrepaye ? 'prepaye' : 'en_stock',
        estPrepaye: !!estPrepaye,
        photoUrl,
        photoExpiresAt,
        enregistreParId: session.id,
      },
      include: { client: true },
    })

    await logAction({
      userId: session.id,
      action: 'creation',
      entityType: 'Colis',
      entityId: colis.id,
      details: { nom, prenom, telephone: telephoneDestinataire, poids, montant },
    })

    return NextResponse.json({ success: true, data: colis }, { status: 201 })
  } catch (error) {
    console.error('POST colis error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
