import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { analyzeFinances, getGeminiKey } from '@/lib/gemini'

export async function POST() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const apiKey = await getGeminiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini non configurée dans les paramètres' }, { status: 400 })
    }

    // Gather all data for AI analysis
    const [users, voyages, colis, finances, auditLogs] = await Promise.all([
      prisma.user.findMany({ select: { id: true, username: true, role: true } }),
      prisma.voyage.findMany({ include: { _count: { select: { colis: true } } } }),
      prisma.colis.findMany({
        include: { client: { select: { nom: true, prenom: true } }, enregistrePar: { select: { username: true } }, payePar: { select: { username: true } } },
      }),
      prisma.finance.findMany({
        include: { user: { select: { username: true } }, voyage: { select: { numero: true } } },
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ])

    // CA = encaissements (finance type 'entree'), Trésorerie = CA + diverses - dépenses
    const totalCA = finances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
    const totalEntreesDiverses = finances.filter(f => f.type === 'entree_diverse').reduce((s, f) => s + f.montant, 0)
    const totalDepenses = finances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
    const tresorerie = totalCA + totalEntreesDiverses - totalDepenses

    const employeeStats = users.map(u => {
      const myFinances = finances.filter(f => f.user.username === u.username)
      const encaisse = myFinances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
      const depenses = myFinances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
      const colisEnregistres = colis.filter(c => c.enregistrePar?.username === u.username).length
      const colisPaies = colis.filter(c => c.payePar?.username === u.username).length
      return { username: u.username, role: u.role, encaisse, depenses, solde: encaisse - depenses, colisEnregistres, colisPaies }
    })

    const rapport = await analyzeFinances({
      totalCA,
      totalDepenses,
      tresorerie,
      nbVoyages: voyages.length,
      nbColis: colis.length,
      nbColisPayes: colis.filter(c => c.statut === 'paye').length,
      nbColisAttente: colis.filter(c => !['paye', 'prepaye'].includes(c.statut)).length,
      employeeStats,
      voyages: voyages.map(v => ({ numero: v.numero, date: v.dateVoyage, statut: v.statut, nbColis: v._count.colis })),
      depenses: finances.filter(f => f.type === 'depense').map(f => ({ motif: f.motif, montant: f.montant, user: f.user.username, date: f.date })),
      auditLogs: auditLogs.slice(0, 100).map(l => ({ action: l.action, user: l.user.username, entity: l.entityType, date: l.createdAt })),
    })

    return NextResponse.json({
      success: true,
      data: {
        rapport,
        stats: { totalCA, totalDepenses, benefice: tresorerie, tresorerie, employeeStats, nbVoyages: voyages.length, nbColis: colis.length },
      },
    })
  } catch (error) {
    console.error('Analyse IA error:', error)
    return NextResponse.json({ error: `Erreur analyse IA: ${(error as Error).message}` }, { status: 500 })
  }
}
