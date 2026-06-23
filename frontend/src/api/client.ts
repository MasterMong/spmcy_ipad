import type { Student, Teacher, Assignment, DashboardSummary, Filters, AssignmentStatus } from '../types'
import studentsJson from '../data/students.json'
import teachersJson from '../data/teachers.json'
import assignmentsJson from '../data/assignments.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = '/api'

// ─── mock state (in-memory for demo) ─────────────────────────────────────────
let mockStudents: Student[] = studentsJson as Student[]
let mockTeachers: Teacher[] = teachersJson as Teacher[]
let mockAssignments: Assignment[] = (assignmentsJson as Assignment[]).map(a => ({
  ...a,
  student: a.student_id ? mockStudents.find(s => s.student_id === a.student_id) : undefined,
  teacher: a.teacher_email ? mockTeachers.find(t => t.email === a.teacher_email) : undefined,
}))

function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return fetch(`${BASE}${path}`, options).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface ClassroomStat { grade: number; class_room: string; total: number; delivered: number; assigned: number; pending: number }
export interface SubjectStat { subject_group: string; total: number; delivered: number; assigned: number; pending: number }
export interface GroupStats { classrooms: ClassroomStat[]; subjects: SubjectStat[] }

export async function getDashboardGroups(): Promise<GroupStats> {
  if (!USE_MOCK) return apiFetch('/dashboard/groups')
  return { classrooms: [], subjects: [] }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!USE_MOCK) return apiFetch('/dashboard/summary')

  const studentAssignments = mockAssignments.filter(a => a.assignee_type === 'student')
  const teacherAssignments = mockAssignments.filter(a => a.assignee_type === 'teacher')
  const assignedStudentIds = new Set(studentAssignments.map(a => a.student_id))
  const assignedTeacherEmails = new Set(teacherAssignments.map(a => a.teacher_email))
  return {
    total_students: 3000,
    total_teachers: 200,
    assigned_students: studentAssignments.filter(a => a.status === 'assigned').length,
    delivered_students: studentAssignments.filter(a => a.status === 'delivered').length,
    returned_students: studentAssignments.filter(a => a.status === 'returned').length,
    pending_students: 3000 - assignedStudentIds.size,
    assigned_teachers: teacherAssignments.filter(a => a.status === 'assigned').length,
    delivered_teachers: teacherAssignments.filter(a => a.status === 'delivered').length,
    returned_teachers: teacherAssignments.filter(a => a.status === 'returned').length,
    pending_teachers: 200 - assignedTeacherEmails.size,
  }
}

// ─── Students ─────────────────────────────────────────────────────────────────
export interface StudentPage {
  items: (Student & { assignment?: Assignment })[]
  total: number
  page: number
  page_size: number
  pages: number
}

export async function getStudents(filters: Filters = {}, page = 1, page_size = 50): Promise<StudentPage> {
  if (!USE_MOCK) {
    const params = new URLSearchParams()
    if (filters.grade) params.set('grade', String(filters.grade))
    if (filters.class_room) params.set('class_room', filters.class_room)
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    if (filters.sort_by) params.set('sort_by', filters.sort_by)
    params.set('page', String(page))
    params.set('page_size', String(page_size))
    return apiFetch(`/students?${params}`)
  }

  let students = mockStudents.map(s => ({
    ...s,
    assignment: mockAssignments.find(a => a.student_id === s.student_id),
  }))
  if (filters.grade) students = students.filter(s => s.grade === Number(filters.grade))
  if (filters.class_room) students = students.filter(s => s.class_room === filters.class_room)
  if (filters.status) students = students.filter(s => s.assignment?.status === filters.status)
  if (filters.q) {
    const q = filters.q.toLowerCase()
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.student_id.includes(q))
  }
  const total = students.length
  const pages = Math.max(1, Math.ceil(total / page_size))
  const start = (page - 1) * page_size
  return { items: students.slice(start, start + page_size), total, page, page_size, pages }
}

export async function getStudent(studentId: string): Promise<Student & { assignment?: Assignment }> {
  if (!USE_MOCK) return apiFetch(`/students/${studentId}`)
  const student = mockStudents.find(s => s.student_id === studentId)
  if (!student) throw new Error('Student not found')
  return { ...student, assignment: mockAssignments.find(a => a.student_id === studentId) }
}

export async function importStudents(rows: Omit<Student, 'created_at'>[]): Promise<{ imported: number }> {
  if (!USE_MOCK) {
    return apiFetch('/students/import-json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
  }
  const newStudents: Student[] = rows.map(r => ({ ...r, created_at: new Date().toISOString() }))
  const existingIds = new Set(mockStudents.map(s => s.student_id))
  const toAdd = newStudents.filter(s => !existingIds.has(s.student_id))
  mockStudents = [...mockStudents, ...toAdd]
  return { imported: toAdd.length }
}

export async function importTeachers(rows: Omit<Teacher, 'created_at'>[]): Promise<{ imported: number }> {
  if (!USE_MOCK) {
    return apiFetch('/teachers/import-json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
  }
  const newTeachers: Teacher[] = rows.map(r => ({ ...r, created_at: new Date().toISOString() }))
  const existingEmails = new Set(mockTeachers.map(t => t.email))
  const toAdd = newTeachers.filter(t => !existingEmails.has(t.email))
  mockTeachers = [...mockTeachers, ...toAdd]
  return { imported: toAdd.length }
}

// ─── Teachers ─────────────────────────────────────────────────────────────────
export async function getTeachers(filters: Filters = {}): Promise<(Teacher & { assignment?: Assignment })[]> {
  if (!USE_MOCK) {
    const params = new URLSearchParams()
    if (filters.subject_group) params.set('subject_group', filters.subject_group)
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    return apiFetch(`/teachers?${params}`)
  }

  let teachers = mockTeachers.map(t => ({
    ...t,
    assignment: mockAssignments.find(a => a.teacher_email === t.email),
  }))
  if (filters.subject_group) teachers = teachers.filter(t => t.subject_group === filters.subject_group)
  if (filters.status) teachers = teachers.filter(t => t.assignment?.status === filters.status)
  if (filters.q) {
    const q = filters.q.toLowerCase()
    teachers = teachers.filter(t => t.name.toLowerCase().includes(q) || t.email.includes(q))
  }
  return teachers
}

export async function addTeacher(data: Omit<Teacher, 'created_at'>): Promise<Teacher> {
  if (!USE_MOCK) return apiFetch('/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  const teacher: Teacher = { ...data, created_at: new Date().toISOString() }
  mockTeachers = [...mockTeachers, teacher]
  return teacher
}

export async function deleteTeacher(email: string): Promise<void> {
  if (!USE_MOCK) return apiFetch(`/teachers/${encodeURIComponent(email)}`, { method: 'DELETE' })
  mockTeachers = mockTeachers.filter(t => t.email !== email)
}

// ─── Assignments ──────────────────────────────────────────────────────────────
export async function getAssignments(filters: Filters = {}): Promise<Assignment[]> {
  if (!USE_MOCK) {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.assignee_type) params.set('assignee_type', filters.assignee_type)
    return apiFetch(`/assignments?${params}`)
  }
  let list = mockAssignments
  if (filters.status) list = list.filter(a => a.status === filters.status)
  if (filters.assignee_type) list = list.filter(a => a.assignee_type === filters.assignee_type)
  return list
}

export async function getAssignment(id: string): Promise<Assignment> {
  if (!USE_MOCK) return apiFetch(`/assignments/${id}`)
  const a = mockAssignments.find(x => x.id === id)
  if (!a) throw new Error('Assignment not found')
  return a
}

export async function createAssignment(data: {
  serial_number: string
  assignee_type: 'student' | 'teacher'
  student_id?: string
  teacher_email?: string
  assigned_by: string
}): Promise<Assignment> {
  if (!USE_MOCK) return apiFetch('/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

  const assignment: Assignment = {
    id: `assignment-${Date.now()}`,
    serial_number: data.serial_number,
    mac_address: null,
    assignee_type: data.assignee_type,
    student_id: data.student_id ?? null,
    teacher_email: data.teacher_email ?? null,
    assigned_at: new Date().toISOString(),
    assigned_by: data.assigned_by,
    status: 'assigned',
    delivered_at: null,
    delivered_by: null,
    student: data.student_id ? mockStudents.find(s => s.student_id === data.student_id) : undefined,
    teacher: data.teacher_email ? mockTeachers.find(t => t.email === data.teacher_email) : undefined,
  }
  mockAssignments = [...mockAssignments, assignment]
  return assignment
}

export async function deleteAssignment(id: string): Promise<void> {
  if (!USE_MOCK) return apiFetch(`/assignments/${id}`, { method: 'DELETE' })
  mockAssignments = mockAssignments.filter(a => a.id !== id)
}

export async function revertDelivery(id: string): Promise<Assignment> {
  if (!USE_MOCK) return apiFetch(`/assignments/${id}/revert`, { method: 'POST' })
  mockAssignments = mockAssignments.map(a =>
    a.id === id ? { ...a, status: 'assigned' as AssignmentStatus, delivered_at: null, delivered_by: null } : a
  )
  return mockAssignments.find(a => a.id === id)!
}

export async function deliverAssignment(id: string, deliveredBy: string): Promise<Assignment> {
  if (!USE_MOCK) {
    return apiFetch(`/assignments/${id}/deliver`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delivered_by: deliveredBy }) })
  }
  mockAssignments = mockAssignments.map(a =>
    a.id === id ? { ...a, status: 'delivered' as AssignmentStatus, delivered_at: new Date().toISOString(), delivered_by: deliveredBy } : a
  )
  return mockAssignments.find(a => a.id === id)!
}

export async function getSubjectGroups(): Promise<string[]> {
  if (!USE_MOCK) return apiFetch('/teachers/subject-groups')
  return [...new Set(mockTeachers.map(t => t.subject_group))].sort()
}

// ─── Photo gallery ───────────────────────────────────────────────────────────
export interface DeliveryPhotoItem {
  id: string
  photo_url: string
  taken_at: string
  taken_by: string
  assignee_type: 'student' | 'teacher'
  serial_number: string
  person_name: string
  grade: number | null
  class_room: string | null
  subject_group: string | null
}

export async function getDeliveryPhotos(): Promise<DeliveryPhotoItem[]> {
  if (!USE_MOCK) return apiFetch('/assignments/photos')
  return []
}

export async function uploadDeliveryPhoto(assignmentId: string, takenBy: string, photoDataUrl: string): Promise<{ photo_url: string }> {
  const blob = dataURLtoBlob(photoDataUrl)
  const fd = new FormData()
  fd.append('file', blob, 'photo.jpg')
  const params = new URLSearchParams({ taken_by: takenBy })
  const r = await fetch(`${BASE}/assignments/${assignmentId}/photo?${params}`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ─── Student portal ───────────────────────────────────────────────────────────
export interface StudentVerifyResult {
  student: { student_id: string; name: string; grade: number; class_room: string }
  assignment: { id: string; serial_number: string; status: string; assigned_at: string } | null
}

export async function verifyStudent(studentId: string, nationalId: string): Promise<StudentVerifyResult> {
  return apiFetch('/student-portal/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, national_id: nationalId }),
  })
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)![1]
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

export async function studentUploadPhotos(
  studentId: string,
  nationalId: string,
  assignmentId: string,
  photos: string[],
): Promise<{ uploaded: number }> {
  const fd = new FormData()
  photos.forEach((dataUrl, i) => fd.append('files', dataURLtoBlob(dataUrl), `photo_${i + 1}.jpg`))
  const params = new URLSearchParams({ student_id: studentId, national_id: nationalId, assignment_id: assignmentId })
  const r = await fetch(`${BASE}/student-portal/upload-photos?${params}`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function getClassRooms(): Promise<{ grade: number; class_room: string }[]> {
  if (!USE_MOCK) return apiFetch('/students/classrooms')
  const seen = new Set<string>()
  const result: { grade: number; class_room: string }[] = []
  for (const s of mockStudents) {
    const key = `${s.grade}-${s.class_room}`
    if (!seen.has(key)) { seen.add(key); result.push({ grade: s.grade, class_room: s.class_room }) }
  }
  return result.sort((a, b) => a.grade - b.grade || a.class_room.localeCompare(b.class_room))
}
