'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import PinInput from '@/components/ui/PinInput'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setError('Nom d\'utilisateur requis'); return }
    if (pin.length !== 6) { setError('PIN à 6 chiffres requis'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur de connexion'); setLoading(false); return }
      toast.success(`Bienvenue, ${data.user.username} !`)
      router.push('/dashboard')
    } catch {
      setError('Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A365D] via-[#2563EB] to-[#1D4ED8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo centré */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo.png"
            alt="Amy Colis Express — Fret aérien & maritime"
            width={240}
            height={236}
            priority
            className="w-44 h-auto drop-shadow-2xl"
          />
        </div>

        {/* Logo Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Login Form */}
          <div className="p-6">
            <h2 className="text-lg font-bold text-blue-900 text-center mb-5">Connexion</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                autoComplete="username"
              />

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2 text-center">
                  Code PIN (6 chiffres)
                </label>
                <PinInput value={pin} onChange={setPin} error={error && pin.length !== 6 ? error : undefined} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Se connecter
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-400">
              Amy Colis Express © 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
