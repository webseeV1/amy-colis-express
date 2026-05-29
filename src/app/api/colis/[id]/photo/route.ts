import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params

    const colis = await prisma.colis.findUnique({ where: { id } })
    if (!colis) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 })

    const currentExpiry = colis.photoExpiresAt || new Date()
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + 14 * 24 * 60 * 60 * 1000)

    await prisma.colis.update({
      where: { id },
      data: { photoExpiresAt: newExpiry },
    })

    await logAction({
      userId: session.id,
      action: 'modification',
      entityType: 'Colis',
      entityId: id,
      details: { action: 'prolongation_photo', newExpiry },
    })

    return NextResponse.json({ success: true, newExpiry })
  } catch (error) {
    console.error('PATCH photo error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
