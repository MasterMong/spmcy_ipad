import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Students } from './pages/Students'
import { ImportStudents } from './pages/ImportStudents'
import { Teachers } from './pages/Teachers'
import { Confirm } from './pages/Confirm'
import { StudentUpload } from './pages/StudentUpload'
import { Reports } from './pages/Reports'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 3000 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* No-login shareable pages — outside Layout */}
          <Route path="/confirm/:assignmentId" element={<Confirm />} />
          <Route path="/student-upload" element={<StudentUpload />} />

          {/* Main app */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />

            {/* Password-protected (requires VITE_ADMIN_PASSWORD) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/students" element={<Students />} />
              <Route path="/students/import" element={<ImportStudents />} />
              <Route path="/teachers" element={<Teachers />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
