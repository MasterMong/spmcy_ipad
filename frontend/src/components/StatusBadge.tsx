import type { AssignmentStatus } from '../types'

const config: Record<AssignmentStatus | 'pending', { label: string; cls: string }> = {
  assigned: { label: 'จับคู่แล้ว',   cls: 'bg-amber-100 text-amber-900 border border-amber-500' },
  delivered: { label: 'ส่งมอบแล้ว', cls: 'bg-green-100 text-green-900 border border-green-500' },
  returned:  { label: 'คืนแล้ว',     cls: 'bg-gray-200  text-gray-800  border border-gray-500' },
  pending:   { label: 'ยังไม่จับคู่', cls: 'bg-red-100   text-red-900   border border-red-500' },
}

export function StatusBadge({ status }: { status: AssignmentStatus | 'pending' }) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}
