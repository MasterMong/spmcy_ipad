import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAssignment } from '../api/client'
import { BarcodeScanner } from './BarcodeScanner'
import { Camera, ScanLine, X } from 'lucide-react'

interface Props {
  person: { id: string; name: string; subtitle: string }
  assigneeType: 'student' | 'teacher'
  onClose: () => void
}

export function AssignModal({ person, assigneeType, onClose }: Props) {
  const [sn, setSn] = useState('')
  const [assignedBy, setAssignedBy] = useState(() => localStorage.getItem('assignedBy') ?? '')
  const [scanning, setScanning] = useState(false)
  const snRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      createAssignment({
        serial_number: sn.trim().toUpperCase(),
        assignee_type: assigneeType,
        student_id: assigneeType === 'student' ? person.id : undefined,
        teacher_email: assigneeType === 'teacher' ? person.id : undefined,
        assigned_by: assignedBy.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  function handleScan(value: string) {
    setSn(value)
    setScanning(false)
    setTimeout(() => snRef.current?.focus(), 50)
  }

  const canSubmit = sn.trim().length >= 4 && assignedBy.trim()

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full max-w-sm space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
              {assigneeType === 'student' ? 'จับคู่เครื่องให้นักเรียน' : 'จับคู่เครื่องให้ครู'}
            </p>
            <p className="font-bold text-gray-900 text-base">{person.name}</p>
            <p className="text-sm text-gray-700">{person.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 mt-0.5 p-1 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Camera scanner */}
        {scanning && (
          <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />
        )}

        {/* S/N input */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">Serial Number (S/N)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
              <input
                ref={snRef}
                autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-md border-2 border-gray-400 text-sm font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400"
                placeholder="สแกนหรือพิมพ์ S/N..."
                value={sn}
                onChange={e => setSn(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) mutation.mutate() }}
              />
            </div>
            <button
              type="button"
              onClick={() => setScanning(s => !s)}
              title="เปิดกล้องสแกน Barcode"
              className={`rounded-md border-2 px-2.5 py-2 transition-colors font-medium ${
                scanning
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-400 text-gray-700 hover:border-gray-600 hover:bg-gray-100'
              }`}
            >
              <Camera size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {scanning ? 'จ่อบาร์โค้ดให้อยู่ในกรอบแดง' : 'พิมพ์ S/N · สแกน Barcode reader · หรือกดกล้องเพื่อสแกนผ่านกล้อง'}
          </p>
        </div>

        {/* Assigned by */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">ชื่อผู้ดำเนินการ</label>
          <input
            className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
            placeholder="ชื่อกรรมการ / ครูที่ปรึกษา"
            value={assignedBy}
            onChange={e => { setAssignedBy(e.target.value); localStorage.setItem('assignedBy', e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit) mutation.mutate() }}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">
            เกิดข้อผิดพลาด — S/N นี้อาจถูกใช้แล้ว
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 rounded-md bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-blue-600"
          >
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            onClick={onClose}
            className="rounded-md border-2 border-gray-400 px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-500"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
