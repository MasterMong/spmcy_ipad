# iPad Distribution System — Route & Database Design

---

## Database Design

### Tables

#### `students`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `student_id` | VARCHAR(20) | PK | รหัสนักเรียน |
| `name` | VARCHAR(150) | NOT NULL | ชื่อ-นามสกุล |
| `national_id` | VARCHAR(13) | UNIQUE NOT NULL | เลขบัตรประชาชน |
| `grade` | TINYINT | NOT NULL | ชั้น (1–6) |
| `class_room` | VARCHAR(10) | NOT NULL | ห้อง เช่น "1", "2/1" |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

#### `teachers`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `email` | VARCHAR(150) | PK | |
| `name` | VARCHAR(150) | NOT NULL | |
| `subject_group` | VARCHAR(100) | NOT NULL | กลุ่มสาระ |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

#### `device_assignments`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `serial_number` | VARCHAR(50) | UNIQUE NOT NULL | S/N ของ iPad |
| `mac_address` | VARCHAR(17) | NULLABLE | optional |
| `assignee_type` | ENUM | 'student' \| 'teacher' | |
| `student_id` | VARCHAR(20) | FK → students | NULL ถ้าเป็นครู |
| `teacher_email` | VARCHAR(150) | FK → teachers | NULL ถ้าเป็นนักเรียน |
| `assigned_at` | TIMESTAMP | DEFAULT NOW() | เวลาที่จับคู่ |
| `assigned_by` | VARCHAR(150) | NOT NULL | ผู้ดำเนินการ (ชื่อกรรมการ/ครู) |
| `status` | ENUM | DEFAULT 'assigned' | 'assigned' \| 'delivered' \| 'returned' |
| `delivered_at` | TIMESTAMP | NULLABLE | |
| `delivered_by` | VARCHAR(150) | NULLABLE | ผู้ยืนยันการส่งมอบ |

> **Constraint:** `CHECK (assignee_type = 'student' AND student_id IS NOT NULL AND teacher_email IS NULL) OR (assignee_type = 'teacher' AND teacher_email IS NOT NULL AND student_id IS NULL)`

#### `delivery_photos`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `assignment_id` | UUID | FK → device_assignments | |
| `photo_url` | VARCHAR(500) | NOT NULL | path หรือ URL รูป |
| `taken_at` | TIMESTAMP | DEFAULT NOW() | |
| `taken_by` | VARCHAR(150) | NOT NULL | ผู้ถ่ายภาพ |

---

### Entity Relationship Diagram

```
students ──────────────────────────────┐
  student_id (PK)                      │ (1:1)
  name                                 │
  national_id                          ▼
  grade                   device_assignments
  class_room                id (PK)
                            serial_number
teachers ─────────────────► assignee_type
  email (PK)                student_id (FK)
  name                      teacher_email (FK)
  subject_group             assigned_by
                            status
                            delivered_at
                            delivered_by
                                │
                                │ (1:N)
                                ▼
                        delivery_photos
                          id (PK)
                          assignment_id (FK)
                          photo_url
                          taken_at
                          taken_by
```

---

### Indexes
```sql
-- Fast class-room lookup for report generation
CREATE INDEX idx_students_grade_class ON students (grade, class_room);

-- Fast subject group lookup
CREATE INDEX idx_teachers_subject ON teachers (subject_group);

-- Fast status dashboard queries
CREATE INDEX idx_assignments_status ON device_assignments (status);

-- Lookup assignment by student / teacher
CREATE INDEX idx_assignments_student ON device_assignments (student_id);
CREATE INDEX idx_assignments_teacher ON device_assignments (teacher_email);
```

---

## Route Paths

### Page Routes (Frontend)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Dashboard — real-time overview table (status per student/teacher) |
| GET | `/students` | รายชื่อนักเรียนทั้งหมด พร้อมสถานะการรับเครื่อง |
| GET | `/students/import` | หน้า Import CSV รายชื่อนักเรียน |
| GET | `/teachers` | รายชื่อครูทั้งหมด พร้อมสถานะการรับเครื่อง |
| GET | `/assign` | หน้าจับคู่เครื่อง (เลือก นักเรียน/ครู → กรอก S/N) |
| GET | `/confirm/:assignmentId` | หน้า Confirm delivery + อัปโหลดภาพ (shareable link) |
| GET | `/reports` | หน้าเลือก Report |
| GET | `/reports/class/:grade/:classRoom` | ดูตัวอย่าง + ปริ้นใบเซ็นชื่อรายห้อง (นักเรียน) |
| GET | `/reports/subject/:subjectGroup` | ดูตัวอย่าง + ปริ้นใบเซ็นชื่อรายกลุ่มสาระ (ครู) |

---

### API Routes (Backend)

#### Students

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/api/students` | `?grade=&class_room=&status=` | ดึงรายชื่อนักเรียน (filter ได้) |
| POST | `/api/students/import` | `multipart/form-data` (CSV) | Import นักเรียนจาก CSV |
| GET | `/api/students/:studentId` | — | ดูข้อมูลนักเรียนรายคน |
| DELETE | `/api/students/:studentId` | — | ลบนักเรียน (admin only) |

#### Teachers

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/api/teachers` | `?subject_group=&status=` | ดึงรายชื่อครู |
| POST | `/api/teachers` | `{name, email, subject_group}` | เพิ่มครู |
| GET | `/api/teachers/:email` | — | ดูข้อมูลครูรายคน |
| DELETE | `/api/teachers/:email` | — | ลบครู |

#### Assignments

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/api/assignments` | `?status=&assignee_type=` | ดึงรายการจับคู่ทั้งหมด |
| POST | `/api/assignments` | `{serial_number, assignee_type, student_id \| teacher_email, assigned_by}` | จับคู่เครื่องกับผู้ใช้ |
| GET | `/api/assignments/:id` | — | ดูรายละเอียดการจับคู่ |
| PATCH | `/api/assignments/:id` | `{serial_number}` | แก้ไข S/N |
| DELETE | `/api/assignments/:id` | — | ยกเลิกการจับคู่ |
| POST | `/api/assignments/:id/deliver` | `{delivered_by}` | ยืนยันการส่งมอบ (status → delivered) |
| POST | `/api/assignments/:id/photo` | `multipart/form-data` | อัปโหลดภาพหลักฐาน |

#### Reports (PDF)

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/api/reports/class/:grade/:classRoom` | `?format=pdf\|preview` | ใบเซ็นชื่อรายห้อง (AWAT-03) |
| GET | `/api/reports/subject/:subjectGroup` | `?format=pdf\|preview` | ใบเซ็นชื่อรายกลุ่มสาระ |

#### Dashboard / Real-time

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | จำนวนรับแล้ว / ยังไม่รับ / ทั้งหมด |
| GET | `/api/dashboard/stream` | SSE endpoint สำหรับ real-time updates |

---

## CSV Import Format (Students)

```csv
student_id,name,national_id,grade,class_room
12345,นายสมชาย ใจดี,1234567890123,4,1
12346,นางสาวสมหญิง รักเรียน,1234567890124,4,2
```

---

## Shareable Link Flow

```
กรรมการ/ครู Generate link ────► /confirm/:assignmentId
                                     │
                          (ไม่ต้อง Login)
                                     │
                          นักเรียน/ครูเปิดลิงก์
                                     │
                          ✓ ยืนยันรับเครื่อง
                          + อัปโหลดภาพ (optional)
                                     │
                          POST /api/assignments/:id/deliver
```

---

## Status Flow

```
[ยังไม่จับคู่]
      │
      ▼  POST /api/assignments
  [assigned]  ──── จับคู่แล้ว รอส่งมอบ
      │
      ▼  POST /api/assignments/:id/deliver
  [delivered]  ─── ส่งมอบแล้ว (มีภาพหลักฐาน)
      │
      ▼  (optional)
  [returned]  ──── คืนเครื่องแล้ว
```
