import type { AssignmentStatus } from '../types'

const config: Record<AssignmentStatus | 'pending', { label: string; cls: string }> = {
  assigned: { label: 'จับคู่แล้ว', cls: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'ส่งมอบแล้ว', cls: 'bg-green-100 text-green-800' },
  returned: { label: 'คืนแล้ว', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'ยังไม่จับคู่', cls: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: AssignmentStatus | 'pending' }) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
