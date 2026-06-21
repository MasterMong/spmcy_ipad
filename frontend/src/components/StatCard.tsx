import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  icon?: LucideIcon
}

const colors = {
  blue:   'bg-blue-50   border-2 border-blue-400   text-blue-900',
  green:  'bg-green-50  border-2 border-green-500  text-green-900',
  yellow: 'bg-amber-50  border-2 border-amber-400  text-amber-900',
  red:    'bg-red-50    border-2 border-red-400    text-red-900',
  gray:   'bg-gray-100  border-2 border-gray-400   text-gray-900',
}

const iconColors = {
  blue:   'text-blue-400',
  green:  'text-green-500',
  yellow: 'text-amber-400',
  red:    'text-red-400',
  gray:   'text-gray-400',
}

export function StatCard({ label, value, sub, color = 'blue', icon: Icon }: StatCardProps) {
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold">{label}</p>
        {Icon && <Icon size={20} className={iconColors[color]} strokeWidth={2} />}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs font-medium opacity-70">{sub}</p>}
    </div>
  )
}
