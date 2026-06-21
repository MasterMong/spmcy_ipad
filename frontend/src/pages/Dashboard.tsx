import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getDashboardSummary, getAssignments } from '../api/client'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import type { Assignment } from '../types'

export function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary, refetchInterval: 5000 })
  const { data: assignments, refetch } = useQuery({
    queryKey: ['assignments-recent'],
    queryFn: () => getAssignments(),
    refetchInterval: 5000,
  })

  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setPulse(p => !p); refetch() }, 5000)
    return () => clearInterval(t)
  }, [refetch])

  const recent = [...(assignments ?? [])].sort((a, b) => b.assigned_at.localeCompare(a.assigned_at)).slice(0, 15)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">ภาพรวมการแจก iPad</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${pulse ? 'bg-green-400' : 'bg-green-500'} transition-colors`} />
          อัปเดตทุก 5 วินาที
        </span>
      </div>

      {summary && (
        <>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">นักเรียน</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="ทั้งหมด" value={summary.total_students} color="blue" />
              <StatCard label="ส่งมอบแล้ว" value={summary.delivered_students} color="green" />
              <StatCard label="จับคู่แล้ว รอส่ง" value={summary.assigned_students} color="yellow" />
              <StatCard label="ยังไม่จับคู่" value={summary.pending_students} color="red" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">ครู</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="ทั้งหมด" value={summary.total_teachers} color="blue" />
              <StatCard label="ส่งมอบแล้ว" value={summary.delivered_teachers} color="green" />
              <StatCard label="จับคู่แล้ว รอส่ง" value={summary.assigned_teachers} color="yellow" />
              <StatCard label="ยังไม่จับคู่" value={summary.pending_teachers} color="red" />
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">กิจกรรมล่าสุด</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">ประเภท</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชื่อ</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Serial Number</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">สถานะ</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">เวลา</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">ดำเนินการโดย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((a: Assignment) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${a.assignee_type === 'student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {a.assignee_type === 'student' ? 'นักเรียน' : 'ครู'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {a.student?.name ?? a.teacher?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{a.serial_number}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(a.assigned_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{a.assigned_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
