import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudentPortalPhotos } from '../api/client'
import type { StudentPortalPhoto } from '../api/client'
import { Lock, Camera, X, ChevronLeft, ChevronRight, GraduationCap, Tablet } from 'lucide-react'

const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
const SESSION_KEY = 'student_upload_review_auth'

// ─── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!PASSWORD || input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'ok')
      onAuth()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full bg-gray-100 p-4">
      <form
        onSubmit={submit}
        className="bg-white border-2 border-gray-300 rounded-xl shadow-sm p-8 w-80 space-y-5"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Lock size={28} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">ภาพหลักฐานจากนักเรียน</h2>
          <p className="text-sm text-gray-500">กรุณาใส่รหัสผ่านเพื่อดูภาพ</p>
        </div>
        <div className="space-y-2">
          <input
            type="password"
            autoFocus
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="รหัสผ่าน"
            className={`w-full border-2 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
          />
          {error && <p className="text-xs text-red-600 font-semibold">รหัสผ่านไม่ถูกต้อง</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold text-sm rounded-md py-2 hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  )
}

// ─── Grouped by student ────────────────────────────────────────────────────────
interface StudentGroup {
  student_id: string | null
  student_name: string
  grade: number | null
  class_room: string | null
  serial_number: string
  photos: StudentPortalPhoto[]
  latest_at: string
}

function groupByStudent(photos: StudentPortalPhoto[]): StudentGroup[] {
  const map = new Map<string, StudentGroup>()
  for (const p of photos) {
    const key = p.student_id ?? p.taken_by
    if (!map.has(key)) {
      map.set(key, {
        student_id: p.student_id,
        student_name: p.student_name,
        grade: p.grade,
        class_room: p.class_room,
        serial_number: p.serial_number,
        photos: [],
        latest_at: p.taken_at,
      })
    }
    map.get(key)!.photos.push(p)
  }
  return Array.from(map.values()).sort((a, b) => b.latest_at.localeCompare(a.latest_at))
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function StudentUploadReview() {
  const [authed, setAuthed] = useState(() => !PASSWORD || sessionStorage.getItem(SESSION_KEY) === 'ok')
  const [lightbox, setLightbox] = useState<{ photos: StudentPortalPhoto[]; idx: number } | null>(null)
  const [search, setSearch] = useState('')

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['student-portal-photos'],
    queryFn: getStudentPortalPhotos,
    enabled: authed,
    refetchInterval: 15_000,
  })

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  const groups = groupByStudent(data)
  const filtered = search.trim()
    ? groups.filter(g =>
        g.student_name.includes(search) ||
        (g.student_id ?? '').includes(search) ||
        g.serial_number.includes(search) ||
        `${g.grade ?? ''}${g.class_room ?? ''}`.includes(search)
      )
    : groups

  const current = lightbox ? lightbox.photos[lightbox.idx] : null

  function prevPhoto() {
    setLightbox(lb => lb ? { ...lb, idx: (lb.idx - 1 + lb.photos.length) % lb.photos.length } : null)
  }
  function nextPhoto() {
    setLightbox(lb => lb ? { ...lb, idx: (lb.idx + 1) % lb.photos.length } : null)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Camera size={20} /> ภาพหลักฐานจากนักเรียน
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">{data.length} ภาพ · {groups.length} คน</span>
          <button
            onClick={() => refetch()}
            className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2.5 py-1 hover:bg-blue-50"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ, รหัสนักเรียน, S/N..."
        className="w-full max-w-sm rounded-md border-2 border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      {/* Content */}
      {isLoading && <p className="text-center text-gray-500 py-12 font-medium">กำลังโหลด...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <Camera size={40} className="mx-auto opacity-40" />
          <p className="font-medium">{search ? 'ไม่พบผลการค้นหา' : 'ยังไม่มีภาพที่นักเรียนส่งมา'}</p>
        </div>
      )}

      {/* Student cards */}
      <div className="space-y-4">
        {filtered.map(group => (
          <StudentCard key={group.student_id ?? group.student_name} group={group} onOpen={(photos, idx) => setLightbox({ photos, idx })} />
        ))}
      </div>

      {/* Lightbox */}
      {current && lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); prevPhoto() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="relative max-w-2xl w-full flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={current.photo_url}
              alt={current.student_name}
              className="max-h-[70vh] w-full object-contain rounded-xl"
            />
            <div className="bg-black/60 text-white rounded-xl px-4 py-3 w-full text-sm space-y-1">
              <p className="font-bold text-base">{current.student_name}</p>
              {current.grade && <p className="text-gray-300 flex items-center gap-1.5"><GraduationCap size={13} /> ม.{current.grade}/{current.class_room}</p>}
              <p className="text-gray-300 flex items-center gap-1.5"><Tablet size={13} /> S/N: {current.serial_number}</p>
              <p className="text-gray-400 text-xs">{new Date(current.taken_at).toLocaleString('th-TH')}</p>
            </div>
            <p className="text-gray-400 text-xs">{lightbox.idx + 1} / {lightbox.photos.length}</p>
          </div>

          <button
            onClick={e => { e.stopPropagation(); nextPhoto() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <ChevronRight size={24} />
          </button>

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

function StudentCard({
  group,
  onOpen,
}: {
  group: StudentGroup
  onOpen: (photos: StudentPortalPhoto[], idx: number) => void
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Student info header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{group.student_name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
            {group.grade && (
              <span className="flex items-center gap-1"><GraduationCap size={11} /> ม.{group.grade}/{group.class_room}</span>
            )}
            {group.student_id && <span>รหัส {group.student_id}</span>}
            <span className="flex items-center gap-1"><Tablet size={11} /> {group.serial_number}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded px-2 py-0.5">
            {group.photos.length} ภาพ
          </span>
          <span className="text-xs text-gray-400">
            {new Date(group.latest_at).toLocaleDateString('th-TH')}
          </span>
        </div>
      </div>

      {/* Photo strip */}
      <div className="flex gap-2 p-3 overflow-x-auto">
        {group.photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => onOpen(group.photos, idx)}
            className="shrink-0 w-28 h-28 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors focus:outline-none focus:border-blue-600"
          >
            <img
              src={photo.photo_url}
              alt={`ภาพที่ ${idx + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
