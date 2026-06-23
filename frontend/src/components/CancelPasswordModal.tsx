import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

const CANCEL_PASSWORD = import.meta.env.VITE_CANCEL_PASSWORD ?? ''

interface Props {
  title: string
  description: string
  onConfirm: () => void
  onClose: () => void
}

export function CancelPasswordModal({ title, description, onConfirm, onClose }: Props) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit() {
    if (CANCEL_PASSWORD && pwd !== CANCEL_PASSWORD) {
      setError(true)
      setPwd('')
      return
    }
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full max-w-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-600 shrink-0" />
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">รหัสผ่าน</label>
          <input
            type="password"
            autoFocus
            className={`w-full rounded-md border-2 px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-400' : 'border-gray-400'}`}
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-red-600 text-xs mt-1 font-medium">รหัสผ่านไม่ถูกต้อง</p>}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-red-600 border-2 border-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  )
}
