import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudents, getTeachers, getClassRooms, getSubjectGroups } from '../api/client'
import { Printer, FileText, ClipboardList } from 'lucide-react'

type ReportType = 'class' | 'subject'

export function Reports() {
  const [reportType, setReportType] = useState<ReportType>('class')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const classRooms = getClassRooms()
  const subjectGroups = getSubjectGroups()
  const grades = [...new Set(classRooms.map(c => c.grade))].sort()
  const roomsForGrade = selectedGrade ? classRooms.filter(c => c.grade === Number(selectedGrade)).map(c => c.class_room) : []

  const { data: students = [] } = useQuery({
    queryKey: ['students-report', selectedGrade, selectedClass],
    queryFn: () => getStudents({ grade: selectedGrade ? Number(selectedGrade) as number : undefined, class_room: selectedClass || undefined }),
    enabled: reportType === 'class' && !!selectedGrade && !!selectedClass,
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-report', selectedSubject],
    queryFn: () => getTeachers({ subject_group: selectedSubject }),
    enabled: reportType === 'subject' && !!selectedSubject,
  })

  const canPreview =
    (reportType === 'class' && selectedGrade && selectedClass) ||
    (reportType === 'subject' && selectedSubject)

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ClipboardList size={20} /> รายงาน / ใบเซ็นชื่อ</h2>

      {/* Report type */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setReportType('class'); setShowPreview(false) }}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${reportType === 'class' ? 'border-blue-600 bg-blue-50' : 'border-gray-400 hover:border-gray-600 hover:bg-gray-50'}`}
        >
          <FileText size={20} className={reportType === 'class' ? 'text-blue-600' : 'text-gray-500'} />
          <p className={`mt-2 font-bold ${reportType === 'class' ? 'text-blue-900' : 'text-gray-800'}`}>ใบเซ็นชื่อรายห้อง</p>
          <p className="text-xs text-gray-600 mt-0.5 font-medium">สำหรับนักเรียน</p>
        </button>
        <button
          onClick={() => { setReportType('subject'); setShowPreview(false) }}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${reportType === 'subject' ? 'border-purple-600 bg-purple-50' : 'border-gray-400 hover:border-gray-600 hover:bg-gray-50'}`}
        >
          <FileText size={20} className={reportType === 'subject' ? 'text-purple-600' : 'text-gray-500'} />
          <p className={`mt-2 font-bold ${reportType === 'subject' ? 'text-purple-900' : 'text-gray-800'}`}>ใบเซ็นชื่อรายกลุ่มสาระ</p>
          <p className="text-xs text-gray-600 mt-0.5 font-medium">สำหรับครู</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {reportType === 'class' && (
          <>
            <select className="rounded-md border-2 border-gray-400 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white" value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedClass(''); setShowPreview(false) }}>
              <option value="">เลือกชั้น</option>
              {grades.map(g => <option key={g} value={g}>ม.{g}</option>)}
            </select>
            <select className="rounded-md border-2 border-gray-400 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setShowPreview(false) }} disabled={!selectedGrade}>
              <option value="">เลือกห้อง</option>
              {roomsForGrade.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
            </select>
          </>
        )}
        {reportType === 'subject' && (
          <select className="rounded-md border-2 border-gray-400 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setShowPreview(false) }}>
            <option value="">เลือกกลุ่มสาระ</option>
            {subjectGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        {canPreview && (
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 rounded-md bg-gray-800 border-2 border-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-gray-900">
            <FileText size={14} /> ดูตัวอย่าง
          </button>
        )}
        {showPreview && (
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md bg-blue-600 border-2 border-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
            <Printer size={14} /> พิมพ์
          </button>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div id="print-area" className="border-2 border-gray-400 rounded-xl bg-white p-8 space-y-6 print:border-none print:p-0">
          {/* Report header */}
          <div className="text-center space-y-1 border-b-2 border-gray-300 pb-4">
            <p className="text-base font-bold">แบบลงชื่อ</p>
            <p className="text-sm font-semibold">
              {reportType === 'class'
                ? `ชั้นมัธยมศึกษาปีที่ ${selectedGrade}/${selectedClass}`
                : `กลุ่มสาระ${selectedSubject}`
              }
            </p>
            <p className="text-xs text-gray-500">วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {reportType === 'class' && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-center w-8">ที่</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">รหัสนักเรียน</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">ชื่อ-นามสกุล</th>
                  <th className="border border-gray-400 px-3 py-2 text-center">Serial Number</th>
                  <th className="border border-gray-400 px-3 py-2 text-center w-32">ลายมือชื่อนักเรียน</th>
                  <th className="border border-gray-400 px-3 py-2 text-center w-32">ลายมือชื่อครูที่ปรึกษา</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.student_id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-3 text-center text-gray-500">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-3 font-mono text-xs">{s.student_id}</td>
                    <td className="border border-gray-300 px-3 py-3">{s.name}</td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-mono text-xs">{s.assignment?.serial_number ?? '—'}</td>
                    <td className="border border-gray-300 px-3 py-3 h-10" />
                    <td className="border border-gray-300 px-3 py-3 h-10" />
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-400">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                )}
              </tbody>
            </table>
          )}

          {reportType === 'subject' && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-center w-8">ที่</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">ชื่อ-นามสกุล</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">อีเมล</th>
                  <th className="border border-gray-400 px-3 py-2 text-center">Serial Number</th>
                  <th className="border border-gray-400 px-3 py-2 text-center w-40">ลายมือชื่อครู</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, i) => (
                  <tr key={t.email} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-3 text-center text-gray-500">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-3">{t.name}</td>
                    <td className="border border-gray-300 px-3 py-3 text-xs text-gray-500">{t.email}</td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-mono text-xs">{t.assignment?.serial_number ?? '—'}</td>
                    <td className="border border-gray-300 px-3 py-3 h-10" />
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-400">ไม่พบข้อมูลครูในกลุ่มสาระนี้</td></tr>
                )}
              </tbody>
            </table>
          )}

          <div className="text-xs text-gray-400 text-center pt-2">
            ผลิตโดยระบบแจก iPad — {new Date().toLocaleString('th-TH')}
          </div>
        </div>
      )}
    </div>
  )
}
