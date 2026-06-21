import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getTeachers, getSubjectGroups, deleteTeacher } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { Search, UserPlus, Clipboard } from 'lucide-react'
import type { Filters } from '../types'

export function Teachers() {
  const [filters, setFilters] = useState<Filters>({})
  const [showAdd, setShowAdd] = useState(false)
  const qc = useQueryClient()
  const subjectGroups = getSubjectGroups()

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', filters],
    queryFn: () => getTeachers(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: (email: string) => deleteTeacher(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })

  const set = (key: keyof Filters, value: string) =>
    setFilters(f => ({ ...f, [key]: value || undefined }))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">รายชื่อครู</h2>
        <div className="flex gap-2">
          <Link to="/assign?type=teacher" className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Clipboard size={14} /> จับคู่เครื่อง
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <UserPlus size={14} /> เพิ่มครู
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            className="pl-8 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
            placeholder="ค้นหาชื่อ / อีเมล"
            value={filters.q ?? ''}
            onChange={e => set('q', e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filters.subject_group ?? ''}
          onChange={e => set('subject_group', e.target.value)}
        >
          <option value="">ทุกกลุ่มสาระ</option>
          {subjectGroups.map(g => <option key={g} value={g}>{g}</option>)}
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
          <button onClick={() => setFilters({})} className="rounded-md px-3 py-2 text-sm text-gray-500 hover:text-gray-700">ล้างตัวกรอง</button>
        )}
      </div>

      <div className="text-xs text-gray-400">แสดง {teachers.length} รายการ (ตัวอย่างจากทั้งหมด 200 คน)</div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">กลุ่มสาระ</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">อีเมล</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Serial Number</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">สถานะ</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>}
            {!isLoading && teachers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>}
            {teachers.map(t => (
              <tr key={t.email} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.subject_group}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{t.email}</td>
                <td className="px-4 py-2.5 font-mono text-gray-700">{t.assignment?.serial_number ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.assignment?.status ?? 'pending'} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {!t.assignment && (
                      <Link to={`/assign?type=teacher&email=${t.email}`} className="rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">จับคู่</Link>
                    )}
                    {t.assignment?.status === 'assigned' && (
                      <Link to={`/confirm/${t.assignment.id}`} className="rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100">ยืนยัน</Link>
                    )}
                    {t.assignment?.status === 'delivered' && (
                      <span className="text-xs text-gray-400">ส่งมอบแล้ว</span>
                    )}
                    <button
                      onClick={() => { if (confirm(`ลบครู ${t.name}?`)) deleteMutation.mutate(t.email) }}
                      className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddTeacherModal onClose={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['teachers'] }) }} />}
    </div>
  )
}

function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', subject_group: '' })
  const qc = useQueryClient()
  const subjectGroups = getSubjectGroups()

  const mutation = useMutation({
    mutationFn: () => import('../api/client').then(m => m.addTeacher(form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">เพิ่มครูใหม่</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ-นามสกุล</label>
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">อีเมล</label>
            <input type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">กลุ่มสาระ</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.subject_group} onChange={e => setForm(f => ({ ...f, subject_group: e.target.value }))}>
              <option value="">เลือกกลุ่มสาระ</option>
              {subjectGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">ยกเลิก</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.email || !form.subject_group || mutation.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
