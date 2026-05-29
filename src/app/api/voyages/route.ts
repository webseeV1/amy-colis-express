import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const voyages = await prisma.voyage.findMany({
      include: {
        _count: { select: { colis: true } },
      },
      orderBy: { dateVoyage: 'desc' },
    })

    return NextResponse.json({ success: true, data: voyages })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['admin', 'employe_abidjan'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { dateVoyage, colisIds, notes } = await request.json()
    if (!dateVoyage) return NextResponse.json({ error: 'Date de voyage requise' }, { status: 400 })

    const voyage = await prisma.voyage.create({
      data: {
        dateVoyage: new Date(dateVoyage),
        notes,
        nbColisAttendus: colisIds?.length || 0,
      },
    })

    if (colisIds?.length) {
      await prisma.colis.updateMany({
        where: { id: { in: colisIds } },
        data: { voyageId: voyage.id, statut: 'en_voyage' },
      })
    }

    await logAction({
      userId: session.id,
      action: 'creation',
      entityType: 'Voyage',
      entityId: voyage.id,
      details: { dateVoyage, nbColis: colisIds?.length || 0 },
    })

    return NextResponse.json({ success: true, data: voyage }, { status: 201 })
  } catch (error) {
    console.error('POST voyage error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
