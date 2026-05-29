import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { testConnection, getGeminiKey, maskKey, GEMINI_MODEL } from '@/lib/gemini'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error', details: 'Non autorisé' }, { status: 403 })
  }

  const key = await getGeminiKey()
  if (!key) {
    return NextResponse.json(
      { status: 'error', details: 'Aucune clé API Gemini configurée' },
      { status: 400 }
    )
  }

  const res = await testConnection()
  if (res.ok) {
    return NextResponse.json({
      status: 'ok',
      message: res.message || 'IA connectée',
      model: GEMINI_MODEL,
      keyPreview: maskKey(key),
    })
  }

  return NextResponse.json(
    { status: 'error', details: res.details || res.message, model: GEMINI_MODEL },
    { status: 502 }
  )
}
