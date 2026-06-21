import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, Tablet, FileText } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'นักเรียน', icon: GraduationCap },
  { to: '/teachers', label: 'ครู', icon: Users },
  { to: '/assign', label: 'จับคู่เครื่อง', icon: Tablet },
  { to: '/reports', label: 'รายงาน', icon: FileText },
]

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-base font-bold text-gray-800 leading-tight">ระบบแจก iPad</h1>
          <p className="text-xs text-gray-400 mt-0.5">โรงเรียนพูลเจริญวิทยาคม</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">นักเรียน 3,000 คน · ครู 200 คน</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
