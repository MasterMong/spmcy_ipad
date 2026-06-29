import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudentPortalPhotos } from '../api/client'
import type { StudentPortalPhoto } from '../api/client'
import {
  Lock, Camera, X, ChevronLeft, ChevronRight,
  GraduationCap, Tablet, ArrowUpDown, ChevronsLeft, ChevronsRight,
} from 'lucide-react'

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
      <form onSubmit={submit} className="bg-white border-2 border-gray-300 rounded-xl shadow-sm p-8 w-80 space-y-5">
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
        <button type="submit" className="w-full bg-blue-600 text-white font-bold text-sm rounded-md py-2 hover:bg-blue-700">
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StudentGroup {
  student_id: string | null
  student_name: string
  grade: number | null
  class_room: string | null
  serial_number: string
  photos: StudentPortalPhoto[]
  latest_at: string
}

type SortKey = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'photos_desc'

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'ล่าสุดก่อน',
  oldest: 'เก่าสุดก่อน',
  name_asc: 'ชื่อ ก→ฮ',
  name_desc: 'ชื่อ ฮ→ก',
  photos_desc: 'ภาพมากสุด',
}

const PAGE_SIZES = [10, 20, 50]

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
  return Array.from(map.values())
}

function sortGroups(groups: StudentGroup[], sort: SortKey): StudentGroup[] {
  return [...groups].sort((a, b) => {
    switch (sort) {
      case 'newest':    return b.latest_at.localeCompare(a.latest_at)
      case 'oldest':    return a.latest_at.localeCompare(b.latest_at)
      case 'name_asc':  return a.student_name.localeCompare(b.student_name, 'th')
      case 'name_desc': return b.student_name.localeCompare(a.student_name, 'th')
      case 'photos_desc': return b.photos.length - a.photos.length
    }
  })
}

// ─── Select helper ─────────────────────────────────────────────────────────────
function Select({ value, onChange, children, className = '' }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border-2 border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white outline-none focus:border-blue-500 ${className}`}
    >
      {children}
    </select>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function StudentUploadReview() {
  const [authed, setAuthed] = useState(() => !PASSWORD || sessionStorage.getItem(SESSION_KEY) === 'ok')
  const [lightbox, setLightbox] = useState<{ photos: StudentPortalPhoto[]; idx: number } | null>(null)

  // Filter / sort / page state
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)

  const { data = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['student-portal-photos'],
    queryFn: getStudentPortalPhotos,
    enabled: authed,
    refetchInterval: 15_000,
  })

  // Derived grade / room lists from data
  const allGroups = useMemo(() => groupByStudent(data), [data])

  const grades = useMemo(() =>
    Array.from(new Set(allGroups.map(g => g.grade).filter(Boolean) as number[])).sort((a, b) => a - b),
    [allGroups]
  )
  const rooms = useMemo(() => {
    const base = gradeFilter === 'all' ? allGroups : allGroups.filter(g => String(g.grade) === gradeFilter)
    return Array.from(new Set(base.map(g => g.class_room).filter(Boolean) as string[]))
      .sort((a, b) => Number(a) - Number(b))
  }, [allGroups, gradeFilter])

  // Today / this-week boundaries
  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
  }, [])
  const weekStart = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d.toISOString()
  }, [])

  // Filter + sort pipeline
  const filtered = useMemo(() => {
    let gs = allGroups

    if (gradeFilter !== 'all') gs = gs.filter(g => String(g.grade) === gradeFilter)
    if (roomFilter !== 'all')  gs = gs.filter(g => g.class_room === roomFilter)

    if (dateFilter === 'today') gs = gs.filter(g => g.latest_at >= todayStart)
    else if (dateFilter === 'week') gs = gs.filter(g => g.latest_at >= weekStart)

    if (search.trim()) {
      const q = search.trim()
      gs = gs.filter(g =>
        g.student_name.includes(q) ||
        (g.student_id ?? '').includes(q) ||
        g.serial_number.includes(q)
      )
    }

    return sortGroups(gs, sort)
  }, [allGroups, gradeFilter, roomFilter, dateFilter, search, sort, todayStart, weekStart])

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  function resetFilters() {
    setSearch(''); setGradeFilter('all'); setRoomFilter('all')
    setDateFilter('all'); setSort('newest'); setPage(1)
  }

  function setGrade(v: string) { setGradeFilter(v); setRoomFilter('all'); setPage(1) }

  const current = lightbox ? lightbox.photos[lightbox.idx] : null
  function prevPhoto() { setLightbox(lb => lb ? { ...lb, idx: (lb.idx - 1 + lb.photos.length) % lb.photos.length } : null) }
  function nextPhoto() { setLightbox(lb => lb ? { ...lb, idx: (lb.idx + 1) % lb.photos.length } : null) }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  const hasFilters = search || gradeFilter !== 'all' || roomFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Camera size={20} /> ภาพหลักฐานจากนักเรียน
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {data.length} ภาพ · {allGroups.length} คน
            {dataUpdatedAt ? ` · อัปเดต ${new Date(dataUpdatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2.5 py-1 hover:bg-blue-50"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="ค้นหาชื่อ, รหัส, S/N..."
          className="border-2 border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-44"
        />

        {/* Grade */}
        <Select value={gradeFilter} onChange={setGrade}>
          <option value="all">ทุกชั้น</option>
          {grades.map(g => <option key={g} value={String(g)}>ม.{g}</option>)}
        </Select>

        {/* Room */}
        <Select value={roomFilter} onChange={v => { setRoomFilter(v); setPage(1) }} className={rooms.length === 0 ? 'opacity-50' : ''}>
          <option value="all">ทุกห้อง</option>
          {rooms.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
        </Select>

        {/* Date */}
        <Select value={dateFilter} onChange={v => { setDateFilter(v); setPage(1) }}>
          <option value="all">ทุกวัน</option>
          <option value="today">วันนี้</option>
          <option value="week">7 วันล่าสุด</option>
        </Select>

        {/* Sort */}
        <div className="flex items-center gap-1 border-2 border-gray-300 rounded-md px-2 py-1.5 bg-white">
          <ArrowUpDown size={13} className="text-gray-500 shrink-0" />
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
            className="text-sm outline-none bg-transparent"
          >
            {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-red-600 border border-red-300 rounded px-2.5 py-1.5 hover:bg-red-50"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Result count + page size */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {filtered.length > 0
            ? `แสดง ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} จาก ${filtered.length} คน`
            : 'ไม่พบข้อมูล'}
        </span>
        <div className="flex items-center gap-1.5">
          <span>แสดง</span>
          <Select value={String(pageSize)} onChange={v => { setPageSize(Number(v)); setPage(1) }}>
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
          <span>คน/หน้า</span>
        </div>
      </div>

      {/* Content */}
      {isLoading && <p className="text-center text-gray-500 py-12 font-medium">กำลังโหลด...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <Camera size={40} className="mx-auto opacity-40" />
          <p className="font-medium">{hasFilters ? 'ไม่พบผลการค้นหา' : 'ยังไม่มีภาพที่นักเรียนส่งมา'}</p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">ล้างตัวกรอง</button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {paginated.map(group => (
          <StudentCard
            key={group.student_id ?? group.student_name}
            group={group}
            onOpen={(photos, idx) => setLightbox({ photos, idx })}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}><ChevronsLeft size={14} /></PagBtn>
          <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={14} /></PagBtn>

          {pageNumbers(safePage, totalPages).map((n, i) =>
            n === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <PagBtn
                key={n}
                onClick={() => setPage(Number(n))}
                active={safePage === Number(n)}
              >
                {n}
              </PagBtn>
            )
          )}

          <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={14} /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={14} /></PagBtn>
        </div>
      )}

      {/* Lightbox */}
      {current && lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); prevPhoto() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
            <ChevronLeft size={24} />
          </button>

          <div className="relative max-w-2xl w-full flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img src={current.photo_url} alt={current.student_name} className="max-h-[70vh] w-full object-contain rounded-xl" />
            <div className="bg-black/60 text-white rounded-xl px-4 py-3 w-full text-sm space-y-1">
              <p className="font-bold text-base">{current.student_name}</p>
              {current.grade && (
                <p className="text-gray-300 flex items-center gap-1.5"><GraduationCap size={13} /> ม.{current.grade}/{current.class_room}</p>
              )}
              <p className="text-gray-300 flex items-center gap-1.5"><Tablet size={13} /> S/N: {current.serial_number}</p>
              <p className="text-gray-400 text-xs">{new Date(current.taken_at).toLocaleString('th-TH')}</p>
            </div>
            <p className="text-gray-400 text-xs">{lightbox.idx + 1} / {lightbox.photos.length}</p>
          </div>

          <button onClick={e => { e.stopPropagation(); nextPhoto() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
            <ChevronRight size={24} />
          </button>
          <button onClick={() => setLightbox(null)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pagination helpers ────────────────────────────────────────────────────────
function PagBtn({ onClick, disabled, active, children }: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] h-8 px-2 rounded text-sm font-bold border-2 transition-colors
        ${active
          ? 'bg-blue-600 border-blue-600 text-white'
          : disabled
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-700'
        }`}
    >
      {children}
    </button>
  )
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

// ─── Student card ──────────────────────────────────────────────────────────────
function StudentCard({ group, onOpen }: {
  group: StudentGroup
  onOpen: (photos: StudentPortalPhoto[], idx: number) => void
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{group.student_name}</p>
          <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
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
            {new Date(group.latest_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
            {' '}
            {new Date(group.latest_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

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
