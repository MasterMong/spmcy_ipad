import { Clock, PackageCheck, RotateCcw, CircleSlash } from 'lucide-react'
import type { AssignmentStatus } from '../types'

const config: Record<AssignmentStatus | 'pending', { label: string; cls: string; Icon: React.ElementType }> = {
  assigned: { label: 'จับคู่แล้ว',   cls: 'bg-amber-100 text-amber-900 border border-amber-500', Icon: Clock },
  delivered: { label: 'ส่งมอบแล้ว', cls: 'bg-green-100 text-green-900 border border-green-500', Icon: PackageCheck },
  returned:  { label: 'คืนแล้ว',     cls: 'bg-gray-200  text-gray-800  border border-gray-500', Icon: RotateCcw },
  pending:   { label: 'ยังไม่จับคู่', cls: 'bg-red-100   text-red-900   border border-red-500',  Icon: CircleSlash },
}

export function StatusBadge({ status }: { status: AssignmentStatus | 'pending' }) {
  const { label, cls, Icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  )
}
