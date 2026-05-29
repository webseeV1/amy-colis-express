import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

/**
 * Service Gemini — TOUS les appels se font côté serveur (API Routes).
 * La clé n'est JAMAIS exposée au client (pas de NEXT_PUBLIC_*).
 */

// Modèle officiel utilisé dans toute l'application
export const GEMINI_MODEL = 'gemini-2.5-flash'

/**
 * Résout la clé API active.
 * Priorité : clé configurée dans les Paramètres (BDD) > variable d'env GEMINI_API_KEY.
 */
export async function getGeminiKey(): Promise<string | null> {
  try {
    const params = await prisma.parametres.findUnique({
      where: { id: 'singleton' },
      select: { geminiApiKey: true },
    })
    const dbKey = params?.geminiApiKey?.trim()
    if (dbKey) return dbKey
  } catch {
    // si la BDD est indisponible, on tente quand même l'env
  }
  const envKey = process.env.GEMINI_API_KEY?.trim()
  return envKey || null
}

/** Masque une clé pour affichage : ne montre que les 8 derniers caractères. */
export function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '•'.repeat(key.length)
  return '••••••••' + key.slice(-8)
}

/** Construit un modèle Gemini prêt à l'emploi. Lève une erreur si pas de clé. */
async function getModel() {
  const apiKey = await getGeminiKey()
  if (!apiKey) {
    throw new Error('Clé API Gemini non configurée (ni dans les Paramètres, ni dans GEMINI_API_KEY)')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: GEMINI_MODEL })
}

/**
 * Teste la connexion à Gemini avec un message simple.
 * Retourne un statut exploitable par l'UI.
 */
export async function testConnection(): Promise<{ ok: boolean; message: string; details?: string }> {
  try {
    const model = await getModel()
    const result = await model.generateContent(
      "Bonjour, réponds juste 'IA connectée' pour confirmer que tu fonctionnes bien avec Amy Colis Express."
    )
    const text = result.response.text().trim()
    return { ok: true, message: text || 'IA connectée' }
  } catch (error) {
    const details = (error as Error).message
    console.error('[Gemini] testConnection échoué:', details)
    return { ok: false, message: 'Erreur de connexion', details }
  }
}

/**
 * Analyse comptable complète à partir des données agrégées de l'entreprise.
 * Retourne le rapport en texte (markdown).
 */
export async function analyzeFinances(data: {
  totalCA: number
  totalDepenses: number
  tresorerie: number
  nbVoyages: number
  nbColis: number
  nbColisPayes: number
  nbColisAttente: number
  employeeStats: unknown
  voyages: unknown
  depenses: unknown
  auditLogs: unknown
}): Promise<string> {
  const model = await getModel()

  const prompt = `Tu es un expert-comptable et analyste financier pour une entreprise de fret aérien et maritime appelée "Amy Colis Express".

Voici les données complètes de l'entreprise :

**RÉSUMÉ GLOBAL**
- Chiffre d'affaires (colis encaissés): ${data.totalCA}€
- Total dépenses: ${data.totalDepenses}€
- Trésorerie: ${data.tresorerie}€
- Nombre de voyages: ${data.nbVoyages}
- Nombre total de colis: ${data.nbColis}
- Colis payés: ${data.nbColisPayes}
- Colis en attente: ${data.nbColisAttente}

**STATISTIQUES PAR EMPLOYÉ**
${JSON.stringify(data.employeeStats, null, 2)}

**VOYAGES**
${JSON.stringify(data.voyages, null, 2)}

**DÉPENSES DÉTAILLÉES**
${JSON.stringify(data.depenses, null, 2)}

**DERNIÈRES ACTIONS D'AUDIT**
${JSON.stringify(data.auditLogs, null, 2)}

Génère un rapport d'analyse complet en français avec :
1. **Résumé exécutif** (3-5 lignes)
2. **Analyse par employé** (performance, comportement, anomalies éventuelles)
3. **Analyse des dépenses** (dépenses suspectes, tendances)
4. **Écarts et alertes** (colis reçus vs payés, trous potentiels)
5. **Recommandations** (3-5 actions concrètes)
6. **Score de santé financière** (/100)

Sois factuel, professionnel, et si tu détectes des anomalies, signale-les clairement mais sans accusations directes. Utilise des emojis pour les sections.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * Reformate une analyse en rapport synthétique prêt pour l'export PDF.
 * (Condensé, sans markdown lourd.)
 */
export async function generateReport(analysis: string): Promise<string> {
  const model = await getModel()
  const prompt = `Voici une analyse financière détaillée :

${analysis}

Produis une version SYNTHÉTIQUE (1 page maximum) adaptée à un export PDF :
- Titre
- 5 points clés maximum (puces courtes)
- Le score de santé financière
- 3 recommandations prioritaires
Texte clair, sans markdown superflu (pas de #, pas de **).`
  const result = await model.generateContent(prompt)
  return result.response.text()
}
