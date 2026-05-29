import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A365D] to-[#2563EB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Page introuvable</h1>
        <p className="text-gray-500 text-sm mb-6">La page que vous cherchez n'existe pas.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Home size={18} />
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
