import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const users = await prisma.user.findMany({
      select: { id: true, username: true, telephone: true, role: true, actif: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('Users list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const username = (body.username || '').trim().toLowerCase()
    const pin = body.pin || ''
    const role = body.role || ''
    const telephone = (body.telephone || '').replace(/\D/g, '')

    if (!username || !pin || !role || !telephone) {
      return NextResponse.json({ error: 'Tous les champs sont requis (nom, téléphone, PIN, rôle)' }, { status: 400 })
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Nom d\'utilisateur invalide (3-30 caractères, minuscules/chiffres/_)' }, { status: 400 })
    }

    if (telephone.length < 8 || telephone.length > 15) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide (8 à 15 chiffres)' }, { status: 400 })
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'Le PIN doit être exactement 6 chiffres' }, { status: 400 })
    }

    // Le PIN maître admin est réservé et ne peut pas être attribué à un employé
    const ADMIN_PIN = process.env.ADMIN_PIN || '020106'
    if (pin === ADMIN_PIN) {
      return NextResponse.json({ error: 'Ce PIN est réservé et ne peut pas être utilisé' }, { status: 409 })
    }

    if (!['employe_abidjan', 'employe_france', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 409 })
    }

    const pinHash = await hashPin(pin)
    const user = await prisma.user.create({
      data: { username, telephone, pinHash, role },
      select: { id: true, username: true, telephone: true, role: true, actif: true, createdAt: true },
    })

    await logAction({
      userId: session.id,
      action: 'creation',
      entityType: 'User',
      entityId: user.id,
      details: { username, telephone, role, creePar: session.username },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
