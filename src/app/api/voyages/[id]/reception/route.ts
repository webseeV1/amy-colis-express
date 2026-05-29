import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params
    const { colisReceptionnes } = await request.json()
    // colisReceptionnes: Array<{ id: string, photoUrl?: string }>

    const now = new Date()
    const parametres = await prisma.parametres.findUnique({ where: { id: 'singleton' } })
    const jours = parametres?.dureeConservationPhoto || 14
    const photoExpiresAt = new Date(now.getTime() + jours * 24 * 60 * 60 * 1000)

    for (const c of colisReceptionnes) {
      await prisma.colis.update({
        where: { id: c.id },
        data: {
          statut: 'receptionne',
          receptionneParId: session.id,
          dateReception: now,
          photoUrl: c.photoUrl || undefined,
          photoExpiresAt: c.photoUrl ? photoExpiresAt : undefined,
        },
      })
    }

    await prisma.voyage.update({
      where: { id },
      data: {
        statut: 'receptionne',
        nbColisRecus: colisReceptionnes.length,
      },
    })

    await logAction({
      userId: session.id,
      action: 'reception',
      entityType: 'Voyage',
      entityId: id,
      details: { nbColisRecus: colisReceptionnes.length },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reception error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
