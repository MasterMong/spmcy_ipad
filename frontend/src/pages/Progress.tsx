import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudents, getClassRooms, getDashboardSummary, getStudentPortalPhotos } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { useFilterParams } from '../hooks/useFilterParams'
import {
  Activity, Search, CheckCircle2, CircleSlash, Clock,
  PackageCheck, ArrowUp, ArrowUpDown, Image,
} from 'lucide-react'

const inputCls = 'rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white'

export function Progress() {
  const { filters, page, set, setPage, clear, hasFilters } = useFilterParams()

  const { data: classRooms = [] } = useQuery({ queryKey: ['classrooms'], queryFn: getClassRooms })
  const grades = [...new Set(classRooms.map(c => c.grade))].sort()
  const roomsForGrade = filters.grade
    ? classRooms.filter(c => c.grade === filters.grade).map(c => c.class_room)
    : []

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters, page],
    queryFn: () => getStudents(filters, page, 50),
    refetchInterval: 10_000,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    staleTime: 15_000,
  })

  const { data: portalPhotos = [] } = useQuery({
    queryKey: ['student-portal-photos'],
    queryFn: getStudentPortalPhotos,
    refetchInterval: 30_000,
  })

  const photoStudentIds = useMemo(
    () => new Set(portalPhotos.map(p => p.student_id).filter(Boolean) as string[]),
    [portalPhotos]
  )

  const students = data?.items ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4">

      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Activity size={20} /> ติดตามความคืบหน้า
      </h2>

      {/* Summary chips */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatChip
            icon={<Activity size={14} />}
            label="นักเรียนทั้งหมด"
            value={summary.total_students}
            cls="bg-gray-100 border-gray-300 text-gray-800"
          />
          <StatChip
            icon={<PackageCheck size={14} />}
            label="ส่งมอบแล้ว"
            value={summary.delivered_students}
            pct={pct(summary.delivered_students, summary.total_students)}
            cls="bg-green-50 border-green-400 text-green-800"
          />
          <StatChip
            icon={<Clock size={14} />}
            label="จับคู่แล้ว"
            value={summary.assigned_students}
            pct={pct(summary.assigned_students, summary.total_students)}
            cls="bg-amber-50 border-amber-400 text-amber-800"
          />
          <StatChip
            icon={<CircleSlash size={14} />}
            label="ยังไม่จับคู่"
            value={summary.pending_students}
            pct={pct(summary.pending_students, summary.total_students)}
            cls="bg-red-50 border-red-400 text-red-800"
          />
          <StatChip
            icon={<Image size={14} />}
            label="ส่งภาพแล้ว"
            value={photoStudentIds.size}
            pct={pct(photoStudentIds.size, summary.delivered_students || 1)}
            cls="bg-blue-50 border-blue-400 text-blue-800"
          />
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.total_students > 0 && (
        <div className="space-y-1">
          <div className="flex rounded-full overflow-hidden h-3 bg-red-100 border border-gray-200">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${pct(summary.delivered_students, summary.total_students)}%` }}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${pct(summary.assigned_students, summary.total_students)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            ส่งมอบแล้ว {pct(summary.delivered_students, summary.total_students)}% ·
            จับคู่แล้ว {pct(summary.assigned_students, summary.total_students)}% ·
            รอ {pct(summary.pending_students, summary.total_students)}%
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            className={`pl-8 w-full ${inputCls}`}
            placeholder="ค้นหาชื่อ / รหัส / S/N"
            value={filters.q ?? ''}
            onChange={e => set('q', e.target.value)}
          />
        </div>
        <select className={inputCls} value={filters.grade ?? ''} onChange={e => { set('grade', e.target.value); set('class_room', '') }}>
          <option value="">ทุกชั้น</option>
          {grades.map(g => <option key={g} value={g}>ม.{g}</option>)}
        </select>
        <select className={inputCls} value={filters.class_room ?? ''} onChange={e => set('class_room', e.target.value)} disabled={!filters.grade}>
          <option value="">ทุกห้อง</option>
          {roomsForGrade.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
        </select>
        <select className={inputCls} value={filters.status ?? ''} onChange={e => set('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="pending">ยังไม่จับคู่</option>
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
        {data?.total != null
          ? `หน้า ${data.page}/${data.pages} · ทั้งหมด ${data.total.toLocaleString()} รายการ`
          : 'กำลังโหลด...'}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th className="text-left px-4 py-3 font-bold text-gray-900">
                <SortBtn label="เลขที่" col="student_number" active={filters.sort_by} onSort={v => set('sort_by', v)} />
              </th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">
                <SortBtn label="รหัส" col="student_id" active={filters.sort_by} onSort={v => set('sort_by', v)} />
              </th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">
                <SortBtn label="ชื่อ-นามสกุล" col="name" active={filters.sort_by} onSort={v => set('sort_by', v)} />
              </th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชั้น/ห้อง</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">สถานะ</th>
              <th className="text-center px-4 py-3 font-bold text-gray-900">ส่งภาพ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">กำลังโหลด...</td></tr>
            )}
            {!isLoading && students.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">ไม่พบข้อมูล</td></tr>
            )}
            {students.map(s => {
              const hasPhoto = photoStudentIds.has(s.student_id)
              return (
                <tr key={s.student_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-center text-gray-600 text-sm font-semibold">{s.student_number ?? '—'}</td>
                  <td className="hidden sm:table-cell px-4 py-2.5 font-mono text-xs text-gray-500">{s.student_id}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{s.name}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap">ม.{s.grade}/{s.class_room}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={s.assignment?.status ?? 'pending'} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {hasPhoto
                      ? <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <PagBtn onClick={() => setPage(page - 1)} disabled={page <= 1}>‹ ก่อนหน้า</PagBtn>
          {pageNums(page, data.pages).map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
              : <PagBtn key={p} onClick={() => setPage(p as number)} active={page === p}>{p}</PagBtn>
          )}
          <PagBtn onClick={() => setPage(page + 1)} disabled={page >= data.pages}>ถัดไป ›</PagBtn>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

function pageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

function StatChip({ icon, label, value, pct: p, cls }: {
  icon: React.ReactNode; label: string; value: number; pct?: number; cls: string
}) {
  return (
    <div className={`rounded-xl border-2 px-3 py-2.5 flex items-center gap-2 ${cls}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-lg font-bold leading-tight">
          {value.toLocaleString()}
          {p !== undefined && <span className="text-xs font-semibold ml-1 opacity-70">{p}%</span>}
        </p>
      </div>
    </div>
  )
}

function SortBtn({ label, col, active, onSort }: {
  label: string; col: string; active?: string; onSort: (col: string) => void
}) {
  const isActive = active === col || (!active && col === 'student_id')
  return (
    <button className="flex items-center gap-1 hover:text-blue-700" onClick={() => onSort(col)}>
      {label}
      {isActive ? <ArrowUp size={13} /> : <ArrowUpDown size={13} className="text-gray-400" />}
    </button>
  )
}

function PagBtn({ onClick, disabled, active, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border-2 px-3 py-1.5 text-sm font-bold transition-colors
        ${active ? 'border-blue-600 bg-blue-600 text-white'
          : disabled ? 'border-gray-200 text-gray-300 cursor-not-allowed'
          : 'border-gray-400 text-gray-800 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}
