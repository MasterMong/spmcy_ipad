import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAssignment, deliverAssignment } from '../api/client'
import { CheckCircle, Camera, Tablet } from 'lucide-react'

export function Confirm() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [deliveredBy, setDeliveredBy] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: assignment, isLoading, isError } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignment(assignmentId!),
    enabled: !!assignmentId,
  })

  const mutation = useMutation({
    mutationFn: () => deliverAssignment(assignmentId!, deliveredBy.trim()),
    onSuccess: () => setDone(true),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">กำลังโหลด...</div>
  }

  if (isError || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <p className="text-lg font-semibold text-red-600">ไม่พบข้อมูลการจับคู่</p>
        <p className="text-sm text-gray-400 mt-1">ลิงก์นี้อาจหมดอายุหรือไม่ถูกต้อง</p>
      </div>
    )
  }

  if (done || assignment.status === 'delivered') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4">
        <CheckCircle size={64} className="text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900">ยืนยันการรับเครื่องแล้ว!</h2>
        <div className="bg-gray-50 rounded-xl p-5 text-center space-y-1 w-full max-w-sm">
          <p className="text-sm text-gray-500">ผู้รับ</p>
          <p className="font-semibold text-gray-900 text-lg">{assignment.student?.name ?? assignment.teacher?.name}</p>
          <p className="font-mono text-gray-700 text-sm">{assignment.serial_number}</p>
          {assignment.delivered_at && (
            <p className="text-xs text-gray-400">{new Date(assignment.delivered_at).toLocaleString('th-TH')}</p>
          )}
        </div>
        <p className="text-sm text-gray-400">ขอบคุณ สามารถปิดหน้านี้ได้</p>
      </div>
    )
  }

  const person = assignment.student ?? assignment.teacher
  const personType = assignment.assignee_type === 'student' ? 'นักเรียน' : 'ครู'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <Tablet size={28} />
            <div>
              <h1 className="text-lg font-bold">ยืนยันรับ iPad</h1>
              <p className="text-blue-200 text-sm">ระบบแจกอุปกรณ์โรงเรียน</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Device info */}
          <div className="rounded-xl bg-blue-50 border-2 border-blue-300 p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">ข้อมูลอุปกรณ์</p>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Serial Number</span>
              <span className="font-mono font-bold text-gray-900">{assignment.serial_number}</span>
            </div>
            {assignment.mac_address && (
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">MAC Address</span>
                <span className="font-mono text-sm font-semibold text-gray-800">{assignment.mac_address}</span>
              </div>
            )}
          </div>

          {/* Person info */}
          <div className="rounded-xl bg-gray-100 border-2 border-gray-300 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">ผู้รับอุปกรณ์ ({personType})</p>
            <p className="font-bold text-gray-900 text-base">{person?.name ?? '—'}</p>
            {assignment.student && (
              <p className="text-sm font-medium text-gray-700">ม.{assignment.student.grade}/{assignment.student.class_room} · รหัส {assignment.student.student_id}</p>
            )}
            {assignment.teacher && (
              <p className="text-sm font-medium text-gray-700">{assignment.teacher.subject_group} · {assignment.teacher.email}</p>
            )}
          </div>

          {/* Photo upload */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">ถ่ายภาพหลักฐาน (ไม่บังคับ)</p>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="หลักฐาน" className="w-full rounded-xl object-cover max-h-48" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 rounded-full bg-white/90 border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-800 hover:bg-white">ลบ</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-gray-400 py-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Camera size={24} className="mx-auto text-gray-500 mb-1" />
                <p className="text-sm font-semibold text-gray-700">แตะเพื่อถ่ายภาพหรือเลือกรูป</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                const reader = new FileReader()
                reader.onload = ev => setPhoto(ev.target?.result as string)
                reader.readAsDataURL(f)
              }}
            />
          </div>

          {/* Delivered by */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">ชื่อผู้ส่งมอบ (กรรมการ/ครูที่ปรึกษา)</label>
            <input
              className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="ชื่อ-นามสกุลผู้ยืนยัน"
              value={deliveredBy}
              onChange={e => setDeliveredBy(e.target.value)}
            />
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!deliveredBy.trim() || mutation.isPending}
            className="w-full rounded-xl bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'กำลังบันทึก...' : '✓ ยืนยันรับเครื่องแล้ว'}
          </button>

          <p className="text-center text-xs text-gray-400">
            จับคู่โดย {assignment.assigned_by} · {new Date(assignment.assigned_at).toLocaleString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  )
}
