export type AssignmentStatus = 'assigned' | 'delivered' | 'returned'
export type AssigneeType = 'student' | 'teacher'

export interface Student {
  student_id: string
  name: string
  national_id: string
  grade: number
  class_room: string
  created_at: string
}

export interface Teacher {
  email: string
  name: string
  subject_group: string
  created_at: string
}

export interface Assignment {
  id: string
  serial_number: string
  mac_address: string | null
  assignee_type: AssigneeType
  student_id: string | null
  teacher_email: string | null
  assigned_at: string
  assigned_by: string
  status: AssignmentStatus
  delivered_at: string | null
  delivered_by: string | null
  student?: Student
  teacher?: Teacher
}

export interface DeliveryPhoto {
  id: string
  assignment_id: string
  photo_url: string
  taken_at: string
  taken_by: string
}

export interface DashboardSummary {
  total_students: number
  total_teachers: number
  assigned_students: number
  delivered_students: number
  returned_students: number
  pending_students: number
  assigned_teachers: number
  delivered_teachers: number
  returned_teachers: number
  pending_teachers: number
}

export interface Filters {
  grade?: number | ''
  class_room?: string
  status?: AssignmentStatus | ''
  subject_group?: string
  assignee_type?: AssigneeType | ''
  q?: string
  sort_by?: 'student_id' | 'name'
}
