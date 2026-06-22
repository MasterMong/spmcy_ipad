import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAssignment, deliverAssignment } from '../api/client'
import { CheckCircle, Camera, Tablet, Image, X } from 'lucide-react'

export function Confirm() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [deliveredBy, setDeliveredBy] = useState(() => localStorage.getItem('assignedBy') ?? '')
  const [photo, setPhoto] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { data: assignment, isLoading, isError } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignment(assignmentId!),
    enabled: !!assignmentId,
  })

  const mutation = useMutation({
    mutationFn: () => deliverAssignment(assignmentId!, deliveredBy.trim()),
    onSuccess: () => setDone(true),
  })

  async function openCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ — กรุณาอนุญาตการใช้งานกล้อง')
    }
  }

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOpen])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    setPhoto(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
  }

  // Stop stream if component unmounts
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

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
        {photo && (
          <div className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-gray-200">
            <img src={photo} alt="หลักฐานการรับ" className="w-full object-cover" />
          </div>
        )}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl px-5 py-3 text-center w-full max-w-sm">
          <p className="text-sm font-bold text-yellow-800">ขอบคุณ — สามารถปิดแท็บนี้ได้เลย</p>
          <p className="text-xs text-yellow-700 mt-0.5">หน้านี้ไม่จำเป็นต้องเปิดทิ้งไว้</p>
        </div>
        <button
          onClick={() => window.close()}
          className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-900"
        >
          ปิดแท็บนี้
        </button>
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

          {/* Photo — required */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">
              ถ่ายภาพหลักฐาน <span className="text-red-500">*</span>
            </p>

            {/* Live camera view */}
            {cameraOpen && (
              <div className="relative rounded-xl overflow-hidden bg-black mb-2">
                <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-gray-900 shadow hover:bg-gray-100"
                  >
                    ถ่าย
                  </button>
                  <button
                    onClick={stopCamera}
                    className="rounded-full bg-gray-800/70 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Photo preview */}
            {photo && !cameraOpen && (
              <div className="relative mb-2">
                <img src={photo} alt="หลักฐาน" className="w-full rounded-xl object-cover max-h-48" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 rounded-full bg-white/90 border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-800 hover:bg-white"
                >
                  ลบ
                </button>
              </div>
            )}

            {/* Buttons */}
            {!photo && !cameraOpen && (
              <div className="flex gap-2">
                <button
                  onClick={openCamera}
                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-400 py-5 text-center hover:border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Camera size={22} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">ถ่ายจากกล้อง</span>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-400 py-5 text-center hover:border-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Image size={22} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-700">เลือกจากแกลเลอรี่</span>
                </button>
              </div>
            )}

            {cameraError && <p className="text-xs text-red-600 font-semibold mt-1">{cameraError}</p>}

            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
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
              onChange={e => { setDeliveredBy(e.target.value); localStorage.setItem('assignedBy', e.target.value) }}
            />
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!deliveredBy.trim() || !photo || mutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={18} />
            {mutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันรับเครื่องแล้ว'}
          </button>

          <p className="text-center text-xs text-gray-400">
            จับคู่โดย {assignment.assigned_by} · {new Date(assignment.assigned_at).toLocaleString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  )
}
