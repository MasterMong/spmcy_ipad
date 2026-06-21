import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, FileText } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'นักเรียน', icon: GraduationCap },
  { to: '/teachers', label: 'ครู', icon: Users },
  { to: '/reports', label: 'รายงาน', icon: FileText },
]

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 shrink-0 bg-gray-900 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <h1 className="text-base font-bold text-white leading-tight">ระบบแจก iPad</h1>
          <p className="text-xs text-gray-400 mt-0.5">โรงเรียนพูลเจริญวิทยาคม</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
          <p className="text-xs text-gray-500">นักเรียน 3,000 · ครู 200</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
