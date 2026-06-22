import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Lock } from 'lucide-react'

const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
const SESSION_KEY = 'admin_auth'

export function ProtectedRoute() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'ok')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (!PASSWORD || authed) return <Outlet />

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'ok')
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white border-2 border-gray-300 rounded-xl shadow-sm p-8 w-80 space-y-5"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Lock size={28} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">ต้องการรหัสผ่าน</h2>
          <p className="text-sm text-gray-500">กรุณาใส่รหัสผ่านเพื่อเข้าถึงหน้านี้</p>
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
