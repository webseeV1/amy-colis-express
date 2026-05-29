import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, generateToken, setSessionCookie, isAdminPin } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const { username, pin } = await request.json()

    if (!username || !pin) {
      return NextResponse.json({ error: 'Nom d\'utilisateur et PIN requis' }, { status: 400 })
    }

    const trimmedUsername = username.trim().toLowerCase()

    // ─── Passe-partout admin : PIN 020106 déverrouille tous les comptes ───
    if (isAdminPin(pin)) {
      // On cherche l'utilisateur demandé
      const user = await prisma.user.findUnique({ where: { username: trimmedUsername } })

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 })
      }

      // Le PIN maître donne accès avec le rôle admin, quel que soit le compte
      const token = generateToken(user.id, 'admin')
      await setSessionCookie(token)
      await logAction({
        userId: user.id,
        action: 'connexion',
        entityType: 'User',
        entityId: user.id,
        details: { method: 'master_pin', originalRole: user.role },
      })
      return NextResponse.json({
        success: true,
        user: { id: user.id, username: user.username, role: 'admin' },
      })
    }

    // ─── Connexion normale avec PIN personnel ───
    const user = await prisma.user.findUnique({ where: { username: trimmedUsername } })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 })
    }

    if (!user.actif) {
      return NextResponse.json({ error: 'Ce compte est désactivé' }, { status: 401 })
    }

    const valid = await verifyPin(pin, user.pinHash)
    if (!valid) {
      return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
    }

    const token = generateToken(user.id, user.role)
    await setSessionCookie(token)
    await logAction({
      userId: user.id,
      action: 'connexion',
      entityType: 'User',
      entityId: user.id,
      details: { method: 'pin' },
    })
    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
