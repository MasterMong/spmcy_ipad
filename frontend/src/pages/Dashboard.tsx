import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getDashboardSummary, getAssignments } from '../api/client'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { GraduationCap, Users, PackageCheck, Clock, CircleSlash } from 'lucide-react'
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
        <h2 className="text-xl font-bold text-gray-900">ภาพรวมการแจก iPad</h2>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className={`h-2 w-2 rounded-full ${pulse ? 'bg-green-400' : 'bg-green-600'} transition-colors`} />
          อัปเดตทุก 5 วินาที
        </span>
      </div>

      {summary && (
        <>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><GraduationCap size={14} /> นักเรียน</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="ทั้งหมด" value={summary.total_students} color="blue" icon={GraduationCap} />
              <StatCard label="ส่งมอบแล้ว" value={summary.delivered_students} color="green" icon={PackageCheck} />
              <StatCard label="จับคู่แล้ว รอส่ง" value={summary.assigned_students} color="yellow" icon={Clock} />
              <StatCard label="ยังไม่จับคู่" value={summary.pending_students} color="red" icon={CircleSlash} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users size={14} /> ครู</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="ทั้งหมด" value={summary.total_teachers} color="blue" icon={Users} />
              <StatCard label="ส่งมอบแล้ว" value={summary.delivered_teachers} color="green" icon={PackageCheck} />
              <StatCard label="จับคู่แล้ว รอส่ง" value={summary.assigned_teachers} color="yellow" icon={Clock} />
              <StatCard label="ยังไม่จับคู่" value={summary.pending_teachers} color="red" icon={CircleSlash} />
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">กิจกรรมล่าสุด</h3>
        <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-gray-400">
                <th className="text-left px-4 py-3 font-bold text-gray-900">ประเภท</th>
                <th className="text-left px-4 py-3 font-bold text-gray-900">ชื่อ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-900">Serial Number</th>
                <th className="text-left px-4 py-3 font-bold text-gray-900">สถานะ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-900">เวลา</th>
                <th className="text-left px-4 py-3 font-bold text-gray-900">ดำเนินการโดย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {recent.map((a: Assignment) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold border ${
                      a.assignee_type === 'student'
                        ? 'bg-blue-100 text-blue-900 border-blue-400'
                        : 'bg-purple-100 text-purple-900 border-purple-400'
                    }`}>
                      {a.assignee_type === 'student' ? 'นักเรียน' : 'ครู'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {a.student?.name ?? a.teacher?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{a.serial_number}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">{new Date(a.assigned_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">{a.assigned_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
