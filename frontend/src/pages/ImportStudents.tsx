import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { importStudents, importTeachers } from '../api/client'
import { Upload, CheckCircle, AlertCircle, FileUp, GraduationCap, Users } from 'lucide-react'
import type { Student, Teacher } from '../types'

// ─── Student CSV (school format) ─────────────────────────────────────────────
// Columns: ชั้น,ห้อง,เลขที่,ID-04,prefix,name,surname,class,อีเมล์,ชื่อนักเรียน,ID-03
type StudentRow = Omit<Student, 'created_at'> & { error?: string }

function parseStudentCSV(text: string): StudentRow[] {
  const clean = text.replace(/^﻿/, '').trim()
  const lines = clean.split('\n').filter(l => l.trim())
  const header = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim())
    const r: Record<string, string> = {}
    header.forEach((h, i) => { r[h] = vals[i] ?? '' })
    const errors: string[] = []
    if (!r['ID-04']) errors.push('ไม่มีรหัสนักเรียน')
    if (!r['ชื่อนักเรียน']) errors.push('ไม่มีชื่อ')
    if (!r['ID-03'] || r['ID-03'].length !== 13) errors.push('เลขบัตรฯ ผิดรูปแบบ')
    if (!r['ชั้น'] || isNaN(Number(r['ชั้น']))) errors.push('ชั้นไม่ถูกต้อง')
    if (!r['ห้อง']) errors.push('ไม่มีห้อง')
    return {
      student_id: r['ID-04'] ?? '',
      name: r['ชื่อนักเรียน'] ?? '',
      national_id: r['ID-03'] ?? '',
      grade: Number(r['ชั้น']),
      class_room: r['ห้อง'] ?? '',
      error: errors.join(', ') || undefined,
    }
  })
}

// ─── Teacher CSV (school format) ──────────────────────────────────────────────
// No header — positional: name, subject_group, email
type TeacherRow = Omit<Teacher, 'created_at'> & { error?: string }

function parseTeacherCSV(text: string): TeacherRow[] {
  const clean = text.replace(/^﻿/, '').trim()
  return clean.split('\n').filter(l => l.trim()).map(line => {
    const [name = '', subject_group = '', email = ''] = line.split(',').map(v => v.trim())
    const errors: string[] = []
    if (!name) errors.push('ไม่มีชื่อ')
    if (!subject_group) errors.push('ไม่มีกลุ่มสาระ')
    if (!email || !email.includes('@')) errors.push('อีเมลไม่ถูกต้อง')
    return { name, subject_group, email, error: errors.join(', ') || undefined }
  })
}

const tabCls = (active: boolean) =>
  `flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-lg border-2 transition-colors ${
    active
      ? 'border-blue-600 border-b-white bg-white text-blue-700 -mb-0.5'
      : 'border-gray-400 bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`

export function ImportStudents() {
  const [mode, setMode] = useState<'student' | 'teacher'>('student')
  const [studentRows, setStudentRows] = useState<StudentRow[]>([])
  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>([])
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const studentMutation = useMutation({
    mutationFn: () => importStudents(studentRows.filter(r => !r.error)),
    onSuccess: r => { qc.invalidateQueries({ queryKey: ['students'] }); qc.invalidateQueries({ queryKey: ['classrooms'] }); alert(`นำเข้านักเรียนสำเร็จ ${r.imported} รายการ`); navigate('/students') },
  })

  const teacherMutation = useMutation({
    mutationFn: () => importTeachers(teacherRows.filter(r => !r.error)),
    onSuccess: r => { qc.invalidateQueries({ queryKey: ['teachers'] }); qc.invalidateQueries({ queryKey: ['subject-groups'] }); alert(`นำเข้าครูสำเร็จ ${r.imported} รายการ`); navigate('/teachers') },
  })

  function handleFile(file: File) {
    setFileName(file.name)
    setStudentRows([])
    setTeacherRows([])
    file.text().then(text => {
      if (mode === 'student') setStudentRows(parseStudentCSV(text))
      else setTeacherRows(parseTeacherCSV(text))
    })
  }

  function reset() { setStudentRows([]); setTeacherRows([]); setFileName('') }

  const rows = mode === 'student' ? studentRows : teacherRows
  const validRows = rows.filter(r => !r.error)
  const errorRows = rows.filter(r => r.error)
  const mutation = mode === 'student' ? studentMutation : teacherMutation

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileUp size={20} /> Import ข้อมูล (CSV)</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-gray-400">
        <button className={tabCls(mode === 'student')} onClick={() => { setMode('student'); reset() }}>
          <GraduationCap size={15} /> นักเรียน
        </button>
        <button className={tabCls(mode === 'teacher')} onClick={() => { setMode('teacher'); reset() }}>
          <Users size={15} /> ครู
        </button>
      </div>

      {/* Column hint */}
      <div className="text-xs text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-md p-3 font-mono leading-5">
        {mode === 'student' ? (
          <>
            <p className="font-bold text-gray-800 mb-1">คอลัมน์ที่ใช้ (จาก CSV ของโรงเรียน):</p>
            <span className="text-blue-700">ID-04</span> = รหัสนักเรียน &nbsp;·&nbsp;
            <span className="text-blue-700">ชื่อนักเรียน</span> = ชื่อเต็ม &nbsp;·&nbsp;
            <span className="text-blue-700">ID-03</span> = เลขบัตรฯ &nbsp;·&nbsp;
            <span className="text-blue-700">ชั้น</span> = ระดับชั้น &nbsp;·&nbsp;
            <span className="text-blue-700">ห้อง</span> = ห้อง
          </>
        ) : (
          <>
            <p className="font-bold text-gray-800 mb-1">รูปแบบ CSV ครู (ไม่มี header):</p>
            ชื่อ-นามสกุล , กลุ่มสาระ , อีเมล
          </>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-400 hover:border-gray-600 hover:bg-gray-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-sm font-bold text-gray-800">{fileName || 'ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือก'}</p>
        <p className="text-xs text-gray-600 font-medium mt-1">รองรับไฟล์ .csv (UTF-8)</p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex gap-3 text-sm">
            {validRows.length > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-green-800 bg-green-50 border border-green-400 rounded px-2.5 py-1">
                <CheckCircle size={14} /> {validRows.length} รายการถูกต้อง
              </span>
            )}
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-red-800 bg-red-50 border border-red-400 rounded px-2.5 py-1">
                <AlertCircle size={14} /> {errorRows.length} รายการมีข้อผิดพลาด
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
                <tr>
                  {mode === 'student' ? (
                    <>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">รหัส</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">ชื่อ-นามสกุล</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">เลขบัตรฯ</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">ชั้น/ห้อง</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">ชื่อ-นามสกุล</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">กลุ่มสาระ</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-900">อีเมล</th>
                    </>
                  )}
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {mode === 'student'
                  ? studentRows.map((r, i) => (
                    <tr key={i} className={r.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 font-mono font-semibold text-xs text-gray-800">{r.student_id}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{r.name}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{r.national_id}</td>
                      <td className="px-4 py-2 font-semibold text-gray-800">ม.{r.grade}/{r.class_room}</td>
                      <td className="px-4 py-2 text-xs">
                        {r.error
                          ? <span className="text-red-700 font-bold flex items-center gap-1"><AlertCircle size={12} />{r.error}</span>
                          : <span className="text-green-700 font-bold flex items-center gap-1"><CheckCircle size={12} />ถูกต้อง</span>}
                      </td>
                    </tr>
                  ))
                  : teacherRows.map((r, i) => (
                    <tr key={i} className={r.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 font-semibold text-gray-900">{r.name}</td>
                      <td className="px-4 py-2 text-gray-800 text-xs">{r.subject_group}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{r.email}</td>
                      <td className="px-4 py-2 text-xs">
                        {r.error
                          ? <span className="text-red-700 font-bold flex items-center gap-1"><AlertCircle size={12} />{r.error}</span>
                          : <span className="text-green-700 font-bold flex items-center gap-1"><CheckCircle size={12} />ถูกต้อง</span>}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={validRows.length === 0 || mutation.isPending}
              className="rounded-md bg-blue-600 border-2 border-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'กำลังนำเข้า...' : `นำเข้า ${validRows.length} รายการ`}
            </button>
            <button onClick={reset} className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100">ล้าง</button>
          </div>
        </>
      )}
    </div>
  )
}
