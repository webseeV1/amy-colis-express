import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const clients = await prisma.client.findMany({
      include: {
        colis: {
          select: { id: true, statut: true, montant: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('GET clients error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
