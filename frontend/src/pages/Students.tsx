import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudents, deleteAssignment, getClassRooms } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { AssignModal } from '../components/AssignModal'
import { Search, Upload } from 'lucide-react'
import type { Filters, Student } from '../types'

const inputCls = 'rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white'

export function Students() {
  const [filters, setFilters] = useState<Filters>({})
  const [assigning, setAssigning] = useState<Student | null>(null)
  const qc = useQueryClient()
  const classRooms = getClassRooms()
  const grades = [...new Set(classRooms.map(c => c.grade))].sort()

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => getStudents(filters),
  })

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  const set = (key: keyof Filters, value: string) =>
    setFilters(f => ({ ...f, [key]: value || undefined }))

  const roomsForGrade = filters.grade
    ? classRooms.filter(c => c.grade === Number(filters.grade)).map(c => c.class_room)
    : []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">รายชื่อนักเรียน</h2>
        <Link
          to="/students/import"
          className="flex items-center gap-1.5 rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 hover:border-gray-500"
        >
          <Upload size={14} /> Import CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            className={`pl-8 w-52 ${inputCls}`}
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
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({})} className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-gray-400">
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="text-xs font-medium text-gray-600">แสดง {students.length} รายการ (ตัวอย่างจากทั้งหมด 3,000 คน)</div>

      <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th className="text-left px-4 py-3 font-bold text-gray-900">รหัส</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชั้น/ห้อง</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">Serial Number</th>
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
                <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{s.student_id}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">ม.{s.grade}/{s.class_room}</td>
                <td className="px-4 py-3 font-mono font-semibold text-gray-900">
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
                        className="rounded px-2.5 py-1 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 border border-blue-700"
                      >
                        จับคู่
                      </button>
                    )}
                    {s.assignment?.status === 'assigned' && (
                      <>
                        <Link
                          to={`/confirm/${s.assignment.id}`}
                          className="rounded px-2.5 py-1 text-xs font-bold bg-green-600 text-white hover:bg-green-700 border border-green-700"
                        >
                          ยืนยัน
                        </Link>
                        <button
                          onClick={() => { if (confirm('ยกเลิกการจับคู่?')) removeMutation.mutate(s.assignment!.id) }}
                          className="rounded px-2.5 py-1 text-xs font-bold bg-white text-red-700 hover:bg-red-50 border-2 border-red-400"
                        >
                          ยกเลิก
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
