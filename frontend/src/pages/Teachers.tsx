import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getTeachers, getSubjectGroups, deleteTeacher } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { AssignModal } from '../components/AssignModal'
import { useFilterParams } from '../hooks/useFilterParams'
import { Search, UserPlus, Link2, CheckCircle, Trash2, Users } from 'lucide-react'
import type { Teacher } from '../types'

const inputCls = 'rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white'

export function Teachers() {
  const { filters, set, clear, hasFilters } = useFilterParams()
  const [showAdd, setShowAdd] = useState(false)
  const [assigning, setAssigning] = useState<Teacher | null>(null)
  const qc = useQueryClient()
  const { data: subjectGroups = [] } = useQuery({ queryKey: ['subject-groups'], queryFn: getSubjectGroups })

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', filters],
    queryFn: () => getTeachers(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: (email: string) => deleteTeacher(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Users size={20} /> รายชื่อครู</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 hover:border-gray-500"
        >
          <UserPlus size={14} /> เพิ่มครู
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            className={`pl-8 w-full ${inputCls}`}
            placeholder="ค้นหาชื่อ / อีเมล"
            value={filters.q ?? ''}
            onChange={e => set('q', e.target.value)}
          />
        </div>
        <select className={inputCls} value={filters.subject_group ?? ''} onChange={e => set('subject_group', e.target.value)}>
          <option value="">ทุกกลุ่มสาระ</option>
          {subjectGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={inputCls} value={filters.status ?? ''} onChange={e => set('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="assigned">จับคู่แล้ว</option>
          <option value="delivered">ส่งมอบแล้ว</option>
          <option value="returned">คืนแล้ว</option>
        </select>
        {hasFilters && (
          <button onClick={clear} className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-gray-400">ล้างตัวกรอง</button>
        )}
      </div>

      <div className="text-xs font-medium text-gray-600">แสดง {teachers.length} รายการ</div>

      <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th className="text-left px-4 py-3 font-bold text-gray-900">ชื่อ-นามสกุล</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">กลุ่มสาระ</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-bold text-gray-900">Serial Number</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">สถานะ</th>
              <th className="text-left px-4 py-3 font-bold text-gray-900">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600 font-medium">กำลังโหลด...</td></tr>}
            {!isLoading && teachers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600 font-medium">ไม่พบข้อมูล</td></tr>}
            {teachers.map(t => (
              <tr key={t.email} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{t.name}</td>
                <td className="hidden sm:table-cell px-4 py-3 font-semibold text-gray-800">{t.subject_group}</td>
                <td className="hidden sm:table-cell px-4 py-3 font-mono font-semibold text-gray-900">
                  {t.assignment?.serial_number ?? <span className="text-gray-400 font-normal">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={t.assignment?.status ?? 'pending'} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {!t.assignment && (
                      <button
                        onClick={() => setAssigning(t)}
                        className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 border border-blue-700"
                      >
                        <Link2 size={11} /> จับคู่
                      </button>
                    )}
                    {t.assignment?.status === 'assigned' && (
                      <Link to={`/confirm/${t.assignment.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-green-600 text-white hover:bg-green-700 border border-green-700">
                        <CheckCircle size={11} /> ยืนยัน
                      </Link>
                    )}
                    {t.assignment?.status === 'delivered' && (
                      <span className="text-xs font-medium text-gray-600">ส่งมอบแล้ว</span>
                    )}
                    <button
                      onClick={() => { if (confirm(`ลบครู ${t.name}?`)) deleteMutation.mutate(t.email) }}
                      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-white text-red-700 hover:bg-red-50 border-2 border-red-400"
                    >
                      <Trash2 size={11} /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddTeacherModal subjectGroups={subjectGroups} onClose={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['teachers'] }) }} />}
      {assigning && (
        <AssignModal
          assigneeType="teacher"
          person={{ id: assigning.email, name: assigning.name, subtitle: assigning.subject_group }}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  )
}

function AddTeacherModal({ subjectGroups, onClose }: { subjectGroups: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', subject_group: '' })
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => import('../api/client').then(m => m.addTeacher(form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); onClose() },
  })

  const inputCls = 'w-full rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">เพิ่มครูใหม่</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">ชื่อ-นามสกุล</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">อีเมล</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">กลุ่มสาระ</label>
            <select className={inputCls} value={form.subject_group} onChange={e => setForm(f => ({ ...f, subject_group: e.target.value }))}>
              <option value="">เลือกกลุ่มสาระ</option>
              {subjectGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100">ยกเลิก</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.email || !form.subject_group || mutation.isPending}
            className="rounded-md bg-blue-600 border-2 border-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
