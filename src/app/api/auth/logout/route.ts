import { NextResponse } from 'next/server'
import { getSession, clearSessionCookie } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST() {
  try {
    const session = await getSession()
    if (session) {
      await logAction({ userId: session.id, action: 'deconnexion', entityType: 'User', entityId: session.id })
    }
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
