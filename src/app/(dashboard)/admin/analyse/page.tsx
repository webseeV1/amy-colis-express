'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { BarChart3, Download, Sparkles, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatMontant } from '@/lib/utils'
import TestIAButton from '@/components/admin/TestIAButton'

interface AnalyseStats {
  totalCA: number
  totalDepenses: number
  benefice: number
  nbVoyages: number
  nbColis: number
  employeeStats: Array<{
    username: string
    role: string
    encaisse: number
    depenses: number
    solde: number
    colisEnregistres: number
    colisPaies: number
  }>
}

export default function AnalysePage() {
  const [loading, setLoading] = useState(false)
  const [rapport, setRapport] = useState<string | null>(null)
  const [stats, setStats] = useState<AnalyseStats | null>(null)

  async function handleAnalyse() {
    setLoading(true)
    setRapport(null)
    try {
      const res = await fetch('/api/admin/analyse', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'analyse')
        return
      }
      setRapport(data.data.rapport)
      setStats(data.data.stats)
      toast.success('Analyse IA terminée !')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPDF() {
    if (!rapport || !stats) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const margin = 15
      const contentW = pageW - margin * 2
      let y = margin

      // Header
      doc.setFillColor(26, 54, 93)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('AMY COLIS EXPRESS', margin, 15)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Rapport d\'Analyse Financière — Généré par IA', margin, 24)
      doc.setFontSize(9)
      doc.text(new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' }), margin, 31)

      y = 45
      doc.setTextColor(26, 54, 93)

      // Summary stats box
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('RÉSUMÉ FINANCIER', margin + 5, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const col = contentW / 4
      const items = [
        ['CA Total', formatMontant(stats.totalCA)],
        ['Dépenses', formatMontant(stats.totalDepenses)],
        ['Bénéfice', formatMontant(stats.benefice)],
        ['Colis', `${stats.nbColis}`],
      ]
      items.forEach(([label, value], idx) => {
        const x = margin + 5 + idx * col
        doc.setTextColor(100, 116, 139)
        doc.text(label, x, y + 16)
        doc.setTextColor(26, 54, 93)
        doc.setFont('helvetica', 'bold')
        doc.text(value, x, y + 23)
        doc.setFont('helvetica', 'normal')
      })

      y += 36
      doc.setTextColor(26, 54, 93)

      // Rapport text
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('ANALYSE COMPLÈTE PAR L\'IA', margin, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(50, 50, 50)

      // Clean markdown
      const cleanRapport = rapport
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/#{1,4} /g, '')
        .replace(/\*/g, '-')

      const lines = doc.splitTextToSize(cleanRapport, contentW)
      for (const line of lines) {
        if (y > 270) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += 5
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Amy Colis Express — Rapport confidentiel — Page ${i}/${pageCount}`, margin, 292)
      }

      doc.save(`ace-rapport-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('PDF téléchargé !')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  // Simple markdown-ish renderer
  function renderRapport(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return <h3 key={i} className="text-base font-bold text-blue-900 mt-4 mb-1">{line.replace(/^#{1,2} /, '')}</h3>
      }
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-blue-800 mt-3 mb-1">{line.replace('### ', '')}</h4>
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="text-sm text-gray-700 ml-4 list-disc">{line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>
      }
      if (line.startsWith('⚠️') || line.startsWith('🚨')) {
        return <div key={i} className="bg-orange-50 border-l-4 border-orange-400 pl-3 py-1.5 my-1 text-sm text-orange-800">{line}</div>
      }
      if (line.startsWith('✅') || line.startsWith('🎯')) {
        return <div key={i} className="bg-green-50 border-l-4 border-green-400 pl-3 py-1.5 my-1 text-sm text-green-800">{line}</div>
      }
      if (line.trim() === '') return <div key={i} className="h-2" />
      // Bold inline
      const boldified = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`)
      return <p key={i} className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: boldified }} />
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Analyse IA</h1>
          <p className="text-gray-500 text-sm">Powered by Google Gemini 2.0 Flash</p>
        </div>
      </div>

      {/* Test de connexion IA */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-medium text-blue-900 mb-2">État de la connexion IA</p>
        <TestIAButton />
      </div>

      {/* Launch button */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Analyse Comptable Complète</h2>
            <p className="text-blue-200 text-sm">Anomalies · Performance · Recommandations</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm mb-4">
          L&apos;IA analyse toutes vos données : caisses, colis, employés, voyages et journal d&apos;audit
          pour générer un rapport financier détaillé avec alertes et recommandations.
        </p>
        <Button
          variant="secondary"
          size="lg"
          loading={loading}
          onClick={handleAnalyse}
          className="bg-white text-blue-700 hover:bg-blue-50 border-0"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Lancer l&apos;analyse IA
            </>
          )}
        </Button>
      </div>

      {/* Stats quick view */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'CA Total', value: formatMontant(stats.totalCA), color: 'text-green-600' },
            { label: 'Dépenses', value: formatMontant(stats.totalDepenses), color: 'text-red-600' },
            { label: 'Bénéfice', value: formatMontant(stats.benefice), color: stats.benefice >= 0 ? 'text-blue-600' : 'text-red-600' },
            { label: 'Voyages', value: stats.nbVoyages, color: 'text-purple-600' },
            { label: 'Colis', value: stats.nbColis, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rapport */}
      {rapport && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-blue-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Rapport d&apos;Analyse
            </h2>
            <Button variant="orange" size="sm" onClick={handleDownloadPDF}>
              <Download size={16} />
              Télécharger PDF
            </Button>
          </div>
          <div className="p-5 prose prose-sm max-w-none">
            {renderRapport(rapport)}
          </div>
        </div>
      )}

      {!rapport && !loading && (
        <div className="text-center py-10 text-gray-400">
          <BarChart3 size={52} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Cliquez sur &quot;Lancer l&apos;analyse&quot; pour générer le rapport</p>
          <p className="text-xs mt-1">Assurez-vous d&apos;avoir configuré votre clé API Gemini dans les paramètres</p>
        </div>
      )}
    </div>
  )
}
