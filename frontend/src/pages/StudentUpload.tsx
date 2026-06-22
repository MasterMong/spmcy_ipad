import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, Image, Tablet, X, Plus } from 'lucide-react'
import { verifyStudent, studentUploadPhotos } from '../api/client'

type Step = 'login' | 'upload' | 'done'

interface StudentInfo {
  student_id: string
  name: string
  grade: number
  class_room: string
}

interface AssignmentInfo {
  id: string
  serial_number: string
  status: string
  assigned_at: string
}

const MAX_PHOTOS = 3

export function StudentUpload() {
  const [step, setStep] = useState<Step>('login')
  const [studentId, setStudentId] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginPending, setLoginPending] = useState(false)

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentInfo | null>(null)

  const [photos, setPhotos] = useState<string[]>([])
  const [uploadPending, setUploadPending] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOpen])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginPending(true)
    try {
      const res = await verifyStudent(studentId.trim(), nationalId.trim())
      setStudentInfo(res.student)
      setAssignmentInfo(res.assignment)
      setStep('upload')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('401')) setLoginError('รหัสนักเรียนหรือเลขประจำตัวประชาชนไม่ถูกต้อง')
      else setLoginError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoginPending(false)
    }
  }

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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhotos(prev => [...prev, dataUrl])
    stopCamera()
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!assignmentInfo || !studentInfo || photos.length === 0) return
    setUploadError('')
    setUploadPending(true)
    try {
      await studentUploadPhotos(studentInfo.student_id, nationalId.trim(), assignmentInfo.id, photos)
      setStep('done')
    } catch {
      setUploadError('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่')
    } finally {
      setUploadPending(false)
    }
  }

  // ─── Login step ───────────────────────────────────────────────────────────────
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <Tablet size={28} />
              <div>
                <h1 className="text-lg font-bold">ส่งภาพหลักฐานการรับ iPad</h1>
                <p className="text-blue-200 text-sm">โรงเรียนภูเขียว</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <p className="text-sm text-gray-600">กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">รหัสนักเรียน</label>
              <input
                autoFocus
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="เช่น 12345"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">เลขประจำตัวประชาชน</label>
              <input
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="13 หลัก"
                maxLength={13}
                inputMode="numeric"
                value={nationalId}
                onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {loginError && (
              <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={!studentId.trim() || nationalId.length < 13 || loginPending}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginPending ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── Upload step ──────────────────────────────────────────────────────────────
  if (step === 'upload') {
    const canAdd = photos.length < MAX_PHOTOS && !cameraOpen
    const canSubmit = photos.length >= 1 && !uploadPending

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <Tablet size={28} />
              <div>
                <h1 className="text-lg font-bold">ส่งภาพหลักฐานการรับ iPad</h1>
                <p className="text-blue-200 text-sm">สวัสดี {studentInfo?.name}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Student info */}
            <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4 space-y-1">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">ข้อมูลนักเรียน</p>
              <p className="font-bold text-gray-900">{studentInfo?.name}</p>
              <p className="text-sm text-gray-700">ม.{studentInfo?.grade}/{studentInfo?.class_room} · รหัส {studentInfo?.student_id}</p>
            </div>

            {/* Assignment info */}
            {assignmentInfo ? (
              <div className="rounded-xl bg-gray-100 border-2 border-gray-300 p-4 space-y-1">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">ข้อมูลอุปกรณ์</p>
                <p className="font-mono font-bold text-gray-900">{assignmentInfo.serial_number}</p>
                <p className="text-xs text-gray-500">
                  {assignmentInfo.status === 'delivered' ? 'ส่งมอบแล้ว' : 'รอยืนยัน'}
                  {' · '}
                  {new Date(assignmentInfo.assigned_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-yellow-50 border-2 border-yellow-300 p-4 text-center">
                <p className="text-sm font-bold text-yellow-800">ยังไม่มีการจับคู่อุปกรณ์</p>
                <p className="text-xs text-yellow-700 mt-0.5">กรุณาติดต่อเจ้าหน้าที่</p>
              </div>
            )}

            {assignmentInfo && (
              <>
                {/* Photo section */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-sm font-bold text-gray-800">
                      ภาพหลักฐาน <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-gray-500">{photos.length}/{MAX_PHOTOS} ภาพ (อย่างน้อย 1 ภาพ)</p>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">เช่น ภาพนักเรียนพร้อม iPad, ภาพกับผู้ปกครอง</p>

                  {/* Live camera */}
                  {cameraOpen && (
                    <div className="relative rounded-xl overflow-hidden bg-black mb-3">
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
                          className="rounded-full bg-gray-800/70 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                          <img src={p} alt={`ภาพที่ ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 rounded-full bg-white/90 border border-gray-300 p-0.5 hover:bg-white"
                          >
                            <X size={12} className="text-gray-800" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add photo buttons */}
                  {canAdd && !cameraOpen && (
                    <div className="flex gap-2">
                      <button
                        onClick={openCamera}
                        className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-400 py-4 hover:border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Camera size={20} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">ถ่ายจากกล้อง</span>
                      </button>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-400 py-4 hover:border-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Image size={20} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-700">เลือกจากแกลเลอรี่</span>
                      </button>
                    </div>
                  )}

                  {photos.length > 0 && photos.length < MAX_PHOTOS && !cameraOpen && (
                    <button
                      onClick={openCamera}
                      className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-xs font-bold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={14} /> เพิ่มภาพอีก ({MAX_PHOTOS - photos.length} ภาพ)
                    </button>
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
                      reader.onload = ev => {
                        setPhotos(prev => [...prev, ev.target?.result as string])
                      }
                      reader.readAsDataURL(f)
                      e.target.value = ''
                    }}
                  />
                </div>

                {uploadError && (
                  <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">
                    {uploadError}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  {uploadPending ? 'กำลังอัปโหลด...' : `ส่งภาพหลักฐาน (${photos.length} ภาพ)`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Done step ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4">
      <CheckCircle size={64} className="text-green-500" />
      <h2 className="text-2xl font-bold text-gray-900 text-center">ส่งภาพเรียบร้อยแล้ว!</h2>
      <div className="bg-gray-50 rounded-xl p-5 text-center space-y-1 w-full max-w-sm">
        <p className="font-semibold text-gray-900">{studentInfo?.name}</p>
        <p className="text-sm text-gray-700">ม.{studentInfo?.grade}/{studentInfo?.class_room}</p>
        <p className="font-mono text-gray-700 text-sm">{assignmentInfo?.serial_number}</p>
      </div>

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          {photos.map((p, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
              <img src={p} alt={`ภาพที่ ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl px-5 py-3 text-center w-full max-w-sm">
        <p className="text-sm font-bold text-yellow-800">ขอบคุณ — สามารถปิดแท็บนี้ได้เลย</p>
        <p className="text-xs text-yellow-700 mt-0.5">ระบบได้รับภาพหลักฐานของคุณแล้ว</p>
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
