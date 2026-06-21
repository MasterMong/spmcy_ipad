import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { importStudents } from '../api/client'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import type { Student } from '../types'

type PreviewRow = Omit<Student, 'created_at'> & { error?: string }

function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = vals[i] ?? '' })
    const errors: string[] = []
    if (!row.student_id) errors.push('ไม่มีรหัสนักเรียน')
    if (!row.name) errors.push('ไม่มีชื่อ')
    if (!row.national_id || row.national_id.length !== 13) errors.push('เลขบัตรฯ ผิดรูปแบบ')
    if (!row.grade || isNaN(Number(row.grade))) errors.push('ชั้นไม่ถูกต้อง')
    if (!row.class_room) errors.push('ไม่มีห้อง')
    return {
      student_id: row.student_id,
      name: row.name,
      national_id: row.national_id,
      grade: Number(row.grade),
      class_room: row.class_room,
      error: errors.join(', ') || undefined,
    }
  })
}

const SAMPLE_CSV = `student_id,name,national_id,grade,class_room
66100,นายตัวอย่าง ทดสอบ,1100100199001,4,7
66101,นางสาวตัวอย่าง สอง,1100100199002,5,7`

export function ImportStudents() {
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => importStudents(preview.filter(r => !r.error)),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      alert(`นำเข้าสำเร็จ ${result.imported} รายการ`)
      navigate('/students')
    },
  })

  function handleFile(file: File) {
    setFileName(file.name)
    file.text().then(text => setPreview(parseCSV(text)))
  }

  const validRows = preview.filter(r => !r.error)
  const errorRows = preview.filter(r => r.error)

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Import รายชื่อนักเรียน (CSV)</h2>
        <button
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students_template.csv'; a.click()
          }}
          className="rounded-md border-2 border-gray-400 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-500"
        >
          ดาวน์โหลด Template
        </button>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-400 hover:border-gray-600 hover:bg-gray-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-sm font-bold text-gray-800">{fileName || 'ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือก'}</p>
        <p className="text-xs text-gray-600 font-medium mt-1">รองรับไฟล์ .csv เท่านั้น</p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      <div className="text-xs text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-md p-3 font-mono">
        <p className="font-bold text-gray-800 mb-1">รูปแบบ CSV:</p>
        student_id,name,national_id,grade,class_room<br />
        66100,นายตัวอย่าง ทดสอบ,1100100199001,4,7
      </div>

      {preview.length > 0 && (
        <>
          <div className="flex gap-4 text-sm">
            {validRows.length > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-green-800 bg-green-50 border border-green-400 rounded px-2.5 py-1"><CheckCircle size={14} /> {validRows.length} รายการที่ถูกต้อง</span>
            )}
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-red-800 bg-red-50 border border-red-400 rounded px-2.5 py-1"><AlertCircle size={14} /> {errorRows.length} รายการที่มีข้อผิดพลาด</span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border-2 border-gray-400 bg-white max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">รหัส</th>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">ชื่อ</th>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">เลขบัตรฯ</th>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">ชั้น</th>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">ห้อง</th>
                  <th className="text-left px-4 py-2.5 font-bold text-gray-900">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {preview.map((r, i) => (
                  <tr key={i} className={r.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 font-mono font-semibold text-xs text-gray-800">{r.student_id}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900">{r.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">{r.national_id}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800">ม.{r.grade}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800">{r.class_room}</td>
                    <td className="px-4 py-2 text-xs">
                      {r.error
                        ? <span className="text-red-700 font-bold flex items-center gap-1"><AlertCircle size={12} />{r.error}</span>
                        : <span className="text-green-700 font-bold flex items-center gap-1"><CheckCircle size={12} />ถูกต้อง</span>
                      }
                    </td>
                  </tr>
                ))}
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
            <button onClick={() => { setPreview([]); setFileName('') }} className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100">ล้าง</button>
          </div>
        </>
      )}
    </div>
  )
}
