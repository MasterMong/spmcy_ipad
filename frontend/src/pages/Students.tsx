import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudents, deleteAssignment, getClassRooms } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { AssignModal } from '../components/AssignModal'
import { Search, Upload } from 'lucide-react'
import type { Filters, Student } from '../types'

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
        <h2 className="text-xl font-semibold text-gray-900">รายชื่อนักเรียน</h2>
        <Link to="/students/import" className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Upload size={14} /> Import CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            className="pl-8 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
            placeholder="ค้นหาชื่อ / รหัสนักเรียน"
            value={filters.q ?? ''}
            onChange={e => set('q', e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filters.grade ?? ''}
          onChange={e => { set('grade', e.target.value); set('class_room', '') }}
        >
          <option value="">ทุกชั้น</option>
          {grades.map(g => <option key={g} value={g}>ม.{g}</option>)}
        </select>
        <select
          className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filters.class_room ?? ''}
          onChange={e => set('class_room', e.target.value)}
          disabled={!filters.grade}
        >
          <option value="">ทุกห้อง</option>
          {roomsForGrade.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
        </select>
        <select
          className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filters.status ?? ''}
          onChange={e => set('status', e.target.value)}
        >
          <option value="">ทุกสถานะ</option>
          <option value="assigned">จับคู่แล้ว</option>
          <option value="delivered">ส่งมอบแล้ว</option>
          <option value="returned">คืนแล้ว</option>
        </select>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({})} className="rounded-md px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="text-xs text-gray-400">แสดง {students.length} รายการ (ตัวอย่างจากทั้งหมด 3,000 คน)</div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชั้น/ห้อง</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Serial Number</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">สถานะ</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>
            )}
            {!isLoading && students.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>
            )}
            {students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">{s.student_id}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-600">ม.{s.grade}/{s.class_room}</td>
                <td className="px-4 py-2.5 font-mono text-gray-700">{s.assignment?.serial_number ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={s.assignment?.status ?? 'pending'} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {!s.assignment && (
                      <button
                        onClick={() => setAssigning(s)}
                        className="rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        จับคู่
                      </button>
                    )}
                    {s.assignment?.status === 'assigned' && (
                      <>
                        <Link to={`/confirm/${s.assignment.id}`} className="rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100">
                          ยืนยัน
                        </Link>
                        <button
                          onClick={() => { if (confirm('ยกเลิกการจับคู่?')) removeMutation.mutate(s.assignment!.id) }}
                          className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          ยกเลิก
                        </button>
                      </>
                    )}
                    {s.assignment?.status === 'delivered' && (
                      <span className="text-xs text-gray-400">ส่งมอบแล้ว {s.assignment.delivered_at ? new Date(s.assignment.delivered_at).toLocaleDateString('th-TH') : ''}</span>
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
