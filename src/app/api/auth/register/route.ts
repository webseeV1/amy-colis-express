import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { username, pin, role } = await request.json()

    if (!username || !pin || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'Le PIN doit être 6 chiffres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Nom d\'utilisateur déjà pris' }, { status: 409 })
    }

    const pinHash = await hashPin(pin)
    const user = await prisma.user.create({
      data: { username, pinHash, role },
      select: { id: true, username: true, role: true },
    })

    await logAction({ userId: session.id, action: 'creation', entityType: 'User', entityId: user.id, details: { username, role } })
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
