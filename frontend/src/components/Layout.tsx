import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../api/client'
import { LayoutDashboard, Users, GraduationCap, FileText, Menu, X } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'นักเรียน', icon: GraduationCap },
  { to: '/teachers', label: 'ครู', icon: Users },
  { to: '/reports', label: 'รายงาน', icon: FileText },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: summary } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary, staleTime: 30_000 })

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 flex flex-col shrink-0
        transform transition-transform duration-200
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-4 py-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white leading-tight">ระบบแจก iPad</h1>
            <p className="text-xs text-gray-400 mt-0.5">โรงเรียนพูลเจริญวิทยาคม</p>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-white p-1 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            นักเรียน {summary ? summary.total_students.toLocaleString() : '…'} · ครู {summary ? summary.total_teachers.toLocaleString() : '…'}
          </p>
        </div>
      </aside>

      {/* Page area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 shrink-0 border-b border-gray-700">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="text-white font-bold text-sm">ระบบแจก iPad</span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
