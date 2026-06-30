import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudents, deleteAssignment, revertDelivery, getClassRooms } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { AssignModal } from '../components/AssignModal'
import { CancelPasswordModal } from '../components/CancelPasswordModal'
import { useFilterParams } from '../hooks/useFilterParams'
import { Search, Upload, Download, Link2, CheckCircle, X, RotateCcw, GraduationCap, ArrowUpDown, ArrowUp } from 'lucide-react'
import type { Student } from '../types'

const STATUS_LABEL: Record<string, string> = {
  assigned: 'จับคู่แล้ว', delivered: 'ส่งมอบแล้ว', returned: 'คืนแล้ว', pending: 'รอดำเนินการ',
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => { const s = String(v); return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const csv = [headers as (string | number)[], ...rows].map(r => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

type CancelTarget = { assignmentId: string; action: 'pair' | 'confirm'; label: string }

const inputCls = 'rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white'

export function Students() {
  const { filters, page, set, setPage, clear, hasFilters } = useFilterParams()
  const [assigning, setAssigning] = useState<Student | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null)
  const [downloading, setDownloading] = useState(false)
  const qc = useQueryClient()

  async function handleDownload() {
    setDownloading(true)
    try {
      const all = await getStudents(filters, 1, 99999)
      const rows = all.items.map(s => [
        s.student_id, s.name, `ม.${s.grade}`, s.class_room,
        s.student_number ?? '', s.assignment?.serial_number ?? '',
        STATUS_LABEL[s.assignment?.status ?? 'pending'],
      ])
      downloadCSV('students_ipad.csv', ['รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'ห้อง', 'เลขที่', 'Serial Number', 'สถานะ'], rows)
    } finally {
      setDownloading(false)
    }
  }
  const { data: classRooms = [] } = useQuery({ queryKey: ['classrooms'], queryFn: getClassRooms })
  const grades = [...new Set(classRooms.map(c => c.grade))].sort()

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters, page],
    queryFn: () => getStudents(filters, page),
    refetchInterval: 5000,
  })
  const students = data?.items ?? []

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  const revertMutation = useMutation({
    mutationFn: (assignmentId: string) => revertDelivery(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  function handleCancelConfirmed() {
    if (!cancelTarget) return
    if (cancelTarget.action === 'pair') removeMutation.mutate(cancelTarget.assignmentId)
    else revertMutation.mutate(cancelTarget.assignmentId)
  }

  const roomsForGrade = filters.grade
    ? classRooms.filter(c => c.grade === filters.grade).map(c => c.class_room)
    : []

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={20} /> รายชื่อนักเรียน</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 hover:border-gray-500 disabled:opacity-50"
          >
            <Download size={14} /> {downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด CSV'}
          </button>
          <Link
            to="/students/import"
            className="flex items-center gap-1.5 rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 hover:border-gray-500"
          >
            <Upload size={14} /> Import CSV
          </Link>
        </div>
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
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">
                <button
                  className="flex items-center gap-1 hover:text-blue-700"
                  onClick={() => set('sort_by', 'student_id')}
                >
                  รหัส {filters.sort_by === 'student_id' || !filters.sort_by ? <ArrowUp size={13} /> : <ArrowUpDown size={13} className="text-gray-400" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">
                <button
                  className="flex items-center gap-1 hover:text-blue-700"
                  onClick={() => set('sort_by', 'student_number')}
                >
                  เลขที่ {filters.sort_by === 'student_number' ? <ArrowUp size={13} /> : <ArrowUpDown size={13} className="text-gray-400" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">
                <button
                  className="flex items-center gap-1 hover:text-blue-700"
                  onClick={() => set('sort_by', 'name')}
                >
                  ชื่อ-นามสกุล {filters.sort_by === 'name' ? <ArrowUp size={13} /> : <ArrowUpDown size={13} className="text-gray-400" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชั้น/ห้อง</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">Serial Number</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">สถานะ</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600 font-medium">กำลังโหลด...</td></tr>
            )}
            {!isLoading && students.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600 font-medium">ไม่พบข้อมูล</td></tr>
            )}
            {students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="hidden sm:table-cell px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{s.student_id}</td>
                <td className="px-4 py-3 text-center text-gray-600 text-sm font-semibold">{s.student_number ?? '—'}</td>
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
                          onClick={() => setCancelTarget({ assignmentId: s.assignment!.id, action: 'pair', label: s.name })}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-white text-red-700 hover:bg-red-50 border-2 border-red-400"
                        >
                          <X size={11} /> ยกเลิกจับคู่
                        </button>
                      </>
                    )}
                    {s.assignment?.status === 'delivered' && (
                      <>
                        <span className="text-xs font-medium text-gray-600">
                          {s.assignment.delivered_at ? new Date(s.assignment.delivered_at).toLocaleDateString('th-TH') : 'ส่งมอบแล้ว'}
                        </span>
                        <button
                          onClick={() => setCancelTarget({ assignmentId: s.assignment!.id, action: 'confirm', label: s.name })}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-white text-orange-700 hover:bg-orange-50 border-2 border-orange-400"
                        >
                          <RotateCcw size={11} /> ยกเลิกยืนยัน
                        </button>
                      </>
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
      {cancelTarget && (
        <CancelPasswordModal
          title={cancelTarget.action === 'pair' ? 'ยกเลิกการจับคู่' : 'ยกเลิกการยืนยันส่งมอบ'}
          description={`${cancelTarget.label}`}
          onConfirm={handleCancelConfirmed}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}
