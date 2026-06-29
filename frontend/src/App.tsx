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
import { HowTo } from './pages/HowTo'
import { Gallery } from './pages/Gallery'
import { StudentUploadReview } from './pages/StudentUploadReview'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 3000 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* No-login shareable pages — outside Layout */}
          <Route path="/confirm/:assignmentId" element={<Confirm />} />

          {/* Main app */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/student-upload" element={<StudentUpload />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/how-to" element={<HowTo />} />

            {/* Password-protected (requires VITE_ADMIN_PASSWORD) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/students" element={<Students />} />
              <Route path="/students/import" element={<ImportStudents />} />
              <Route path="/teachers" element={<Teachers />} />
            </Route>

            {/* Admin-only: review student-uploaded photos (own password gate) */}
            <Route path="/student-upload-review" element={<StudentUploadReview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
