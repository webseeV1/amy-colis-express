import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amy Colis Express',
  description: 'Gestion de colis - Fret aérien & maritime Abidjan-Paris',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Amy Colis Express',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { background: '#1A365D', color: '#fff', borderRadius: '8px' },
            success: { style: { background: '#166534', color: '#fff' } },
            error: { style: { background: '#991B1B', color: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
