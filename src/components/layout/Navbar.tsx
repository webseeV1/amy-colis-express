'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  Package, LayoutDashboard, Wallet, Users, User, BarChart3,
  ClipboardList, Settings, LogOut, Menu, X, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: string[]
  children?: { href: string; label: string }[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  {
    href: '/colis',
    label: 'Colis',
    icon: <Package size={20} />,
    children: [
      { href: '/colis/stock', label: 'Stock Abidjan' },
      { href: '/colis/voyages', label: 'Voyages' },
      { href: '/colis/reception', label: 'Réception France' },
    ],
  },
  { href: '/caisse', label: 'Ma Caisse', icon: <Wallet size={20} /> },
  { href: '/admin/clients', label: 'Clients', icon: <Users size={20} />, roles: ['admin'] },
  { href: '/admin/users', label: 'Utilisateurs', icon: <User size={20} />, roles: ['admin'] },
  { href: '/admin/analyse', label: 'Analyse IA', icon: <BarChart3 size={20} />, roles: ['admin'] },
  { href: '/admin/audit', label: 'Journal Audit', icon: <ClipboardList size={20} />, roles: ['admin'] },
  { href: '/admin/parametres', label: 'Paramètres', icon: <Settings size={20} />, roles: ['admin'] },
]

interface NavbarProps {
  user: { username: string; role: string }
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = navItems.filter(item => !item.roles || item.roles.includes(user.role))

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Déconnecté')
    router.push('/login')
  }

  const roleLabel = {
    admin: 'Administrateur',
    employe_abidjan: 'Employé Abidjan',
    employe_france: 'Employé France',
  }[user.role] || user.role

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1A365D] min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1 shadow-md shrink-0">
              <Image src="/images/logo-icon.png" alt="Amy Colis Express" width={40} height={40} className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">AMY COLIS</p>
              <p className="text-orange-400 text-xs font-medium">EXPRESS</p>
            </div>
          </div>
          <div className="mt-3 px-2 py-1.5 bg-blue-800 rounded-lg">
            <p className="text-white text-sm font-semibold truncate">{user.username}</p>
            <p className="text-blue-300 text-xs">{roleLabel}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto ace-scrollbar">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItem === item.href

            if (hasChildren) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown size={16} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname === child.href ? 'bg-orange-500 text-white font-semibold' : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#1A365D] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg p-1 shadow shrink-0">
            <Image src="/images/logo-icon.png" alt="Amy Colis Express" width={28} height={28} className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">AMY COLIS EXPRESS</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#1A365D] h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-blue-800 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">{user.username}</p>
                <p className="text-blue-300 text-sm">{roleLabel}</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white p-1.5 hover:bg-blue-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleItems.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.href}>
                      <p className="text-blue-400 text-xs font-semibold uppercase px-3 py-2">{item.label}</p>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            pathname === child.href ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname.startsWith(item.href) ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-3 border-t border-blue-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
