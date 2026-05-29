import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { id } = await params
    const colis = await prisma.colis.findUnique({
      where: { id },
      include: {
        client: true,
        voyage: true,
        enregistrePar: { select: { id: true, username: true } },
        receptionnePar: { select: { id: true, username: true } },
        payePar: { select: { id: true, username: true } },
      },
    })
    if (!colis) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: colis })
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

    const existing = await prisma.colis.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 })

    const colis = await prisma.colis.update({
      where: { id },
      data: body,
      include: { client: true },
    })

    await logAction({
      userId: session.id,
      action: 'modification',
      entityType: 'Colis',
      entityId: id,
      details: { avant: existing, apres: body },
    })

    return NextResponse.json({ success: true, data: colis })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const { id } = await params
    await prisma.colis.delete({ where: { id } })
    await logAction({ userId: session.id, action: 'suppression', entityType: 'Colis', entityId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
