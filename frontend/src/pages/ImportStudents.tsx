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
        <h2 className="text-xl font-semibold text-gray-900">Import รายชื่อนักเรียน (CSV)</h2>
        <button
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students_template.csv'; a.click()
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ดาวน์โหลด Template
        </button>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">{fileName || 'ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือก'}</p>
        <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ .csv เท่านั้น</p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3 font-mono">
        <p className="font-semibold text-gray-600 mb-1">รูปแบบ CSV:</p>
        student_id,name,national_id,grade,class_room<br />
        66100,นายตัวอย่าง ทดสอบ,1100100199001,4,7
      </div>

      {preview.length > 0 && (
        <>
          <div className="flex gap-4 text-sm">
            {validRows.length > 0 && (
              <span className="flex items-center gap-1.5 text-green-700"><CheckCircle size={14} /> {validRows.length} รายการที่ถูกต้อง</span>
            )}
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1.5 text-red-700"><AlertCircle size={14} /> {errorRows.length} รายการที่มีข้อผิดพลาด</span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">รหัส</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชื่อ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">เลขบัตรฯ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">ชั้น</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">ห้อง</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((r, i) => (
                  <tr key={i} className={r.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 font-mono text-xs">{r.student_id}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.national_id}</td>
                    <td className="px-4 py-2">ม.{r.grade}</td>
                    <td className="px-4 py-2">{r.class_room}</td>
                    <td className="px-4 py-2 text-xs">
                      {r.error
                        ? <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12} />{r.error}</span>
                        : <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} />ถูกต้อง</span>
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
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'กำลังนำเข้า...' : `นำเข้า ${validRows.length} รายการ`}
            </button>
            <button onClick={() => { setPreview([]); setFileName('') }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">ล้าง</button>
          </div>
        </>
      )}
    </div>
  )
}
