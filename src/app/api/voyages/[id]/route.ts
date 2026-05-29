import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params

    const voyage = await prisma.voyage.findUnique({
      where: { id },
      include: {
        colis: {
          include: {
            client: true,
            enregistrePar: { select: { id: true, username: true } },
            payePar: { select: { id: true, username: true } },
          },
        },
        finances: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    })

    if (!voyage) return NextResponse.json({ error: 'Voyage introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    const voyage = await prisma.voyage.update({
      where: { id },
      data: body,
    })

    await logAction({
      userId: session.id,
      action: 'modification',
      entityType: 'Voyage',
      entityId: id,
      details: body,
    })

    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
