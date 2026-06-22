import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudents, deleteAssignment, getClassRooms } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { AssignModal } from '../components/AssignModal'
import { useFilterParams } from '../hooks/useFilterParams'
import { Search, Upload, Link2, CheckCircle, X, GraduationCap } from 'lucide-react'
import type { Student } from '../types'

const inputCls = 'rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white'

export function Students() {
  const { filters, page, set, setPage, clear, hasFilters } = useFilterParams()
  const [assigning, setAssigning] = useState<Student | null>(null)
  const qc = useQueryClient()
  const { data: classRooms = [] } = useQuery({ queryKey: ['classrooms'], queryFn: getClassRooms })
  const grades = [...new Set(classRooms.map(c => c.grade))].sort()

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters, page],
    queryFn: () => getStudents(filters, page),
  })
  const students = data?.items ?? []

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  const roomsForGrade = filters.grade
    ? classRooms.filter(c => c.grade === filters.grade).map(c => c.class_room)
    : []

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={20} /> รายชื่อนักเรียน</h2>
        <Link
          to="/students/import"
          className="flex items-center gap-1.5 rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 hover:border-gray-500"
        >
          <Upload size={14} /> Import CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            className={`pl-8 w-full ${inputCls}`}
            placeholder="ค้นหาชื่อ / รหัสนักเรียน"
            value={filters.q ?? ''}
            onChange={e => set('q', e.target.value)}
          />
        </div>
        <select
          className={inputCls}
          value={filters.grade ?? ''}
          onChange={e => { set('grade', e.target.value); set('class_room', '') }}
        >
          <option value="">ทุกชั้น</option>
          {grades.map(g => <option key={g} value={g}>ม.{g}</option>)}
        </select>
        <select
          className={inputCls}
          value={filters.class_room ?? ''}
          onChange={e => set('class_room', e.target.value)}
          disabled={!filters.grade}
        >
          <option value="">ทุกห้อง</option>
          {roomsForGrade.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
        </select>
        <select
          className={inputCls}
          value={filters.status ?? ''}
          onChange={e => set('status', e.target.value)}
        >
          <option value="">ทุกสถานะ</option>
          <option value="assigned">จับคู่แล้ว</option>
          <option value="delivered">ส่งมอบแล้ว</option>
          <option value="returned">คืนแล้ว</option>
        </select>
        {hasFilters && (
          <button onClick={clear} className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-gray-400">
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="text-xs font-medium text-gray-600">
        {data?.total != null ? `หน้า ${data.page}/${data.pages} · ทั้งหมด ${data.total.toLocaleString()} รายการ` : 'กำลังโหลด...'}
      </div>

      <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">รหัส</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชั้น/ห้อง</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">Serial Number</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">สถานะ</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600 font-medium">กำลังโหลด...</td></tr>
            )}
            {!isLoading && students.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600 font-medium">ไม่พบข้อมูล</td></tr>
            )}
            {students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="hidden sm:table-cell px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{s.student_id}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">ม.{s.grade}/{s.class_room}</td>
                <td className="hidden sm:table-cell px-4 py-3 font-mono font-semibold text-gray-900">
                  {s.assignment?.serial_number ?? <span className="text-gray-400 font-normal">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.assignment?.status ?? 'pending'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {!s.assignment && (
                      <button
                        onClick={() => setAssigning(s)}
                        className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 border border-blue-700"
                      >
                        <Link2 size={11} /> จับคู่
                      </button>
                    )}
                    {s.assignment?.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => window.open(`/confirm/${s.assignment!.id}`, '_blank')}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-green-600 text-white hover:bg-green-700 border border-green-700"
                        >
                          <CheckCircle size={11} /> ยืนยัน
                        </button>
                        <button
                          onClick={() => { if (confirm('ยกเลิกการจับคู่?')) removeMutation.mutate(s.assignment!.id) }}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-white text-red-700 hover:bg-red-50 border-2 border-red-400"
                        >
                          <X size={11} /> ยกเลิก
                        </button>
                      </>
                    )}
                    {s.assignment?.status === 'delivered' && (
                      <span className="text-xs font-medium text-gray-600">
                        {s.assignment.delivered_at ? new Date(s.assignment.delivered_at).toLocaleDateString('th-TH') : 'ส่งมอบแล้ว'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹ ก่อนหน้า
          </button>
          {Array.from({ length: data.pages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === data.pages || Math.abs(p - page) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '…'
                ? <span key={`ellipsis-${i}`} className="px-2 text-gray-500">…</span>
                : <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`rounded-md border-2 px-3 py-1.5 text-sm font-bold ${page === p ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-800 hover:bg-gray-100'}`}
                  >{p}</button>
            )
          }
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= data.pages}
            className="rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป ›
          </button>
        </div>
      )}

      {assigning && (
        <AssignModal
          assigneeType="student"
          person={{ id: assigning.student_id, name: assigning.name, subtitle: `ม.${assigning.grade}/${assigning.class_room} · รหัส ${assigning.student_id}` }}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  )
}
