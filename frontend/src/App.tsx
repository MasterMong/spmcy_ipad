import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Students } from './pages/Students'
import { ImportStudents } from './pages/ImportStudents'
import { Teachers } from './pages/Teachers'
import { Assign } from './pages/Assign'
import { Confirm } from './pages/Confirm'
import { Reports } from './pages/Reports'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 3000 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* No-login shareable page — outside Layout */}
          <Route path="/confirm/:assignmentId" element={<Confirm />} />

          {/* Main app */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/import" element={<ImportStudents />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/assign" element={<Assign />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
