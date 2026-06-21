import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getStudents, getTeachers, createAssignment } from '../api/client'
import { ScanLine, CheckCircle } from 'lucide-react'
import type { AssigneeType } from '../types'

export function Assign() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [type, setType] = useState<AssigneeType>((params.get('type') as AssigneeType) ?? 'student')
  const [selectedId, setSelectedId] = useState(params.get('id') ?? params.get('email') ?? '')
  const [serialNumber, setSerialNumber] = useState('')
  const [assignedBy, setAssignedBy] = useState('')
  const [success, setSuccess] = useState(false)
  const snRef = useRef<HTMLInputElement>(null)

  const { data: students = [] } = useQuery({ queryKey: ['students-all'], queryFn: () => getStudents() })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers-all'], queryFn: () => getTeachers() })

  const unassignedStudents = students.filter(s => !s.assignment)
  const unassignedTeachers = teachers.filter(t => !t.assignment)

  const mutation = useMutation({
    mutationFn: () => createAssignment({
      serial_number: serialNumber.trim().toUpperCase(),
      assignee_type: type,
      student_id: type === 'student' ? selectedId : undefined,
      teacher_email: type === 'teacher' ? selectedId : undefined,
      assigned_by: assignedBy.trim(),
    }),
    onSuccess: (assignment) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSuccess(true)
      setTimeout(() => navigate(`/confirm/${assignment.id}`), 1200)
    },
  })

  if (success) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 space-y-3">
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-lg font-semibold text-gray-900">จับคู่สำเร็จ!</p>
        <p className="text-sm text-gray-500">กำลังไปหน้ายืนยันการส่งมอบ...</p>
      </div>
    )
  }

  const canSubmit = selectedId && serialNumber.trim().length >= 8 && assignedBy.trim()

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">จับคู่เครื่อง iPad</h2>

      <div className="max-w-lg space-y-5">
        {/* Assignee type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทผู้รับ</label>
          <div className="flex gap-3">
            {(['student', 'teacher'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setType(t); setSelectedId('') }}
                className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {t === 'student' ? '🎓 นักเรียน' : '👨‍🏫 ครู'}
              </button>
            ))}
          </div>
        </div>

        {/* Select person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'student' ? 'เลือกนักเรียน' : 'เลือกครู'}
          </label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); snRef.current?.focus() }}
          >
            <option value="">-- เลือก{type === 'student' ? 'นักเรียน' : 'ครู'} --</option>
            {type === 'student'
              ? unassignedStudents.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.student_id} — {s.name} (ม.{s.grade}/{s.class_room})
                </option>
              ))
              : unassignedTeachers.map(t => (
                <option key={t.email} value={t.email}>
                  {t.name} ({t.subject_group})
                </option>
              ))
            }
          </select>
          {type === 'student' && unassignedStudents.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">นักเรียนทุกคนในตัวอย่างจับคู่แล้ว</p>
          )}
        </div>

        {/* Serial number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number (S/N)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                ref={snRef}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="สแกนหรือพิมพ์ S/N..."
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) mutation.mutate() }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">รองรับการสแกน Barcode — กด Enter เพื่อบันทึก</p>
        </div>

        {/* Assigned by */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ดำเนินการ (กรรมการ/ครู)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ชื่อ-นามสกุลผู้จับคู่"
            value={assignedBy}
            onChange={e => setAssignedBy(e.target.value)}
          />
        </div>

        {mutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            เกิดข้อผิดพลาด กรุณาตรวจสอบข้อมูลและลองใหม่
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการจับคู่'}
          </button>
          <button onClick={() => navigate(-1)} className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
