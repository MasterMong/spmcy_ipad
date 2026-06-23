import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeliveryPhotos } from '../api/client'
import type { DeliveryPhotoItem } from '../api/client'
import { Images, GraduationCap, Users, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Filter = 'all' | 'student' | 'teacher'

export function Gallery() {
  const [filter, setFilter] = useState<Filter>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['delivery-photos'],
    queryFn: getDeliveryPhotos,
    refetchInterval: 10_000,
  })

  const filtered = filter === 'all' ? photos : photos.filter(p => p.assignee_type === filter)

  function openLightbox(idx: number) { setLightbox(idx) }
  function closeLightbox() { setLightbox(null) }
  function prev() { setLightbox(i => i !== null ? (i - 1 + filtered.length) % filtered.length : null) }
  function next() { setLightbox(i => i !== null ? (i + 1) % filtered.length : null) }

  const current = lightbox !== null ? filtered[lightbox] : null

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Images size={20} /> แกลเลอรีภาพการรับ iPad
        </h2>
        <span className="text-xs font-medium text-gray-500">{filtered.length} รูป</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([['all', 'ทั้งหมด'], ['student', 'นักเรียน'], ['teacher', 'ครู']] as [Filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold border-2 transition-colors ${
              filter === val
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-400 text-gray-700 hover:border-gray-600 hover:bg-gray-50'
            }`}
          >
            {val === 'student' && <GraduationCap size={13} />}
            {val === 'teacher' && <Users size={13} />}
            {val === 'all' && <Images size={13} />}
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading && (
        <p className="text-center text-gray-500 py-12 font-medium">กำลังโหลด...</p>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <Images size={40} className="mx-auto opacity-40" />
          <p className="font-medium">ยังไม่มีภาพการรับ iPad</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((photo, idx) => (
          <PhotoCard key={photo.id} photo={photo} onClick={() => openLightbox(idx)} />
        ))}
      </div>

      {/* Lightbox */}
      {current && lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="relative max-w-2xl w-full flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={current.photo_url}
              alt={current.person_name}
              className="max-h-[70vh] w-full object-contain rounded-xl"
            />
            <div className="bg-black/60 text-white rounded-xl px-4 py-3 w-full text-sm space-y-1">
              <p className="font-bold text-base">{current.person_name}</p>
              {current.grade && <p className="text-gray-300">ม.{current.grade}/{current.class_room}</p>}
              {current.subject_group && <p className="text-gray-300">{current.subject_group}</p>}
              <p className="text-gray-400 text-xs">S/N: {current.serial_number}</p>
              <p className="text-gray-400 text-xs">{new Date(current.taken_at).toLocaleString('th-TH')}</p>
            </div>
            <p className="text-gray-400 text-xs">{lightbox + 1} / {filtered.length}</p>
          </div>

          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <ChevronRight size={24} />
          </button>

          <button
            onClick={closeLightbox}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, onClick }: { photo: DeliveryPhotoItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-colors bg-white shadow-sm"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={photo.photo_url}
          alt={photo.person_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-bold text-gray-900 truncate">{photo.person_name}</p>
        <p className="text-xs text-gray-500 truncate">
          {photo.grade ? `ม.${photo.grade}/${photo.class_room}` : photo.subject_group ?? ''}
        </p>
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold border ${
          photo.assignee_type === 'student'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-purple-100 text-purple-800 border-purple-300'
        }`}>
          {photo.assignee_type === 'student' ? 'นร.' : 'ครู'}
        </span>
      </div>
    </div>
  )
}
