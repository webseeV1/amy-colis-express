import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    let parametres = await prisma.parametres.findUnique({ where: { id: 'singleton' } })
    if (!parametres) {
      parametres = await prisma.parametres.create({ data: { id: 'singleton' } })
    }

    // Non-admin: don't expose Gemini API key
    if (session.role !== 'admin') {
      const { geminiApiKey: _, ...rest } = parametres
      return NextResponse.json({ success: true, data: rest })
    }

    return NextResponse.json({ success: true, data: parametres })
  } catch (error) {
    console.error('GET parametres error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    const parametres = await prisma.parametres.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...body },
      update: body,
    })

    await logAction({
      userId: session.id,
      action: 'modification',
      entityType: 'Parametres',
      entityId: 'singleton',
      details: { champs: Object.keys(body) },
    })

    return NextResponse.json({ success: true, data: parametres })
  } catch (error) {
    console.error('PATCH parametres error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
