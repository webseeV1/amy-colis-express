import { cn, getStatutColor, getStatutLabel } from '@/lib/utils'

interface BadgeProps {
  statut: string
  className?: string
}

export function StatutBadge({ statut, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', getStatutColor(statut), className)}>
      {getStatutLabel(statut)}
    </span>
  )
}

interface GenericBadgeProps {
  label: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'
  className?: string
}

export function Badge({ label, color = 'blue', className }: GenericBadgeProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-800',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', colors[color], className)}>
      {label}
    </span>
  )
}
