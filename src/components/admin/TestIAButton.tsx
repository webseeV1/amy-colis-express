'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Bot, CheckCircle2, XCircle } from 'lucide-react'

type Status =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; message: string; model?: string; keyPreview?: string }
  | { state: 'error'; details: string }

export default function TestIAButton({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<Status>({ state: 'idle' })

  async function runTest() {
    setStatus({ state: 'loading' })
    try {
      const res = await fetch('/api/admin/test-ia')
      const data = await res.json()
      if (res.ok && data.status === 'ok') {
        setStatus({ state: 'ok', message: data.message, model: data.model, keyPreview: data.keyPreview })
      } else {
        setStatus({ state: 'error', details: data.details || data.error || 'Erreur inconnue' })
      }
    } catch (e) {
      setStatus({ state: 'error', details: (e as Error).message })
    }
  }

  return (
    <div className={className}>
      <Button variant="primary" onClick={runTest} loading={status.state === 'loading'}>
        <Bot size={16} />
        Tester la connexion IA
      </Button>

      {status.state === 'ok' && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold">IA Gemini connectée et opérationnelle</p>
            <p className="text-xs text-green-700 mt-0.5">
              Réponse : « {status.message} »
              {status.model && <> · Modèle : {status.model}</>}
              {status.keyPreview && <> · Clé : {status.keyPreview}</>}
            </p>
          </div>
        </div>
      )}

      {status.state === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Erreur de connexion — vérifier la clé API</p>
            <p className="text-xs text-red-700 mt-0.5 break-words">{status.details}</p>
          </div>
        </div>
      )}
    </div>
  )
}
