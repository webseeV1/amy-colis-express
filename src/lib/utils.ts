import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatMontant(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function validateTelephoneFR(tel: string): boolean {
  const cleaned = tel.replace(/[\s\-\(\)\.]/g, '')
  return /^(0[1-9]){1}[0-9]{8}$/.test(cleaned) || /^(\+33|0033)[1-9][0-9]{8}$/.test(cleaned)
}

export function daysUntilExpiry(expiresAt: Date | string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    en_stock: 'En stock',
    en_voyage: 'En voyage',
    receptionne: 'Réceptionné',
    notifie: 'Notifié',
    paye: 'Payé',
    prepaye: 'Prépayé',
    attente_montant: 'Attente montant',
    impaye: 'Impayé',
  }
  return labels[statut] || statut
}

export function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    en_stock: 'bg-yellow-100 text-yellow-800',
    en_voyage: 'bg-blue-100 text-blue-800',
    receptionne: 'bg-purple-100 text-purple-800',
    notifie: 'bg-indigo-100 text-indigo-800',
    paye: 'bg-green-100 text-green-800',
    prepaye: 'bg-teal-100 text-teal-800',
    attente_montant: 'bg-orange-100 text-orange-800',
    impaye: 'bg-red-100 text-red-800',
  }
  return colors[statut] || 'bg-gray-100 text-gray-800'
}
