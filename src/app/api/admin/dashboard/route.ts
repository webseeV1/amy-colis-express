import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const [totalColis, colisParStatut, voyages, finances, users] = await Promise.all([
      prisma.colis.count(),
      prisma.colis.groupBy({ by: ['statut'], _count: { id: true } }),
      prisma.voyage.findMany({ orderBy: { dateVoyage: 'desc' }, take: 5, include: { _count: { select: { colis: true } } } }),
      prisma.finance.findMany({ orderBy: { date: 'desc' } }),
      prisma.user.findMany({ where: { role: { not: 'admin' } }, select: { id: true, username: true, role: true } }),
    ])

    const totalCA = finances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
    const totalEntreesDiverses = finances.filter(f => f.type === 'entree_diverse').reduce((s, f) => s + f.montant, 0)
    const totalDepenses = finances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
    const tresorerie = totalCA + totalEntreesDiverses - totalDepenses

    const caisseParEmploye = await Promise.all(users.map(async u => {
      const myFinances = await prisma.finance.findMany({ where: { userId: u.id } })
      const ca = myFinances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
      const entreesDiverses = myFinances.filter(f => f.type === 'entree_diverse').reduce((s, f) => s + f.montant, 0)
      const depenses = myFinances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
      return { ...u, ca, entreesDiverses, depenses, tresorerie: ca + entreesDiverses - depenses }
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalColis,
        colisParStatut,
        voyagesRecents: voyages,
        totalCA,
        totalEntreesDiverses,
        totalDepenses,
        tresorerie,
        benefice: tresorerie, // alias rétro-compat
        caisseParEmploye,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
