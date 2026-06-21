import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { FlipHorizontal, X } from 'lucide-react'

interface Props {
  onScan: (value: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [camIndex, setCamIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        if (devices.length === 0) {
          setError('ไม่พบกล้องในอุปกรณ์นี้')
          return
        }
        // prefer back camera
        const backIdx = devices.findIndex(d => /back|rear|environment/i.test(d.label))
        setCameras(devices)
        setCamIndex(backIdx >= 0 ? backIdx : 0)
      })
      .catch(() => setError('ไม่สามารถเข้าถึงกล้องได้ — กรุณาอนุญาตสิทธิ์กล้อง'))
  }, [])

  useEffect(() => {
    if (cameras.length === 0 || !videoRef.current) return

    const reader = new BrowserMultiFormatReader()
    setHint(false)

    const deviceId = cameras[camIndex].deviceId
    reader
      .decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
        if (result) {
          onScan(result.getText())
        }
        // NotFoundException fires every frame with no barcode — ignore
      })
      .then(controls => { controlsRef.current = controls })
      .catch(() => setError('ไม่สามารถเปิดกล้องได้'))

    // show scanning hint after 2 s
    const t = setTimeout(() => setHint(true), 2000)

    return () => {
      clearTimeout(t)
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [cameras, camIndex, onScan])

  const switchCamera = () => setCamIndex(i => (i + 1) % cameras.length)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-black relative">
      {error ? (
        <div className="flex flex-col items-center justify-center h-44 text-center px-4 space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={onClose} className="text-xs text-gray-400 underline">ปิด</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="w-full h-44 object-cover" muted playsInline />

          {/* Viewfinder overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-24 relative">
              {/* corner brackets */}
              {(['tl','tr','bl','br'] as const).map(c => (
                <span key={c} className={`absolute w-5 h-5 border-white border-2
                  ${c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0' : ''}
                  ${c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0' : ''}
                  ${c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0' : ''}
                  ${c === 'br' ? 'bottom-0 right-0 border-l-0 border-t-0' : ''}
                `} />
              ))}
              {/* scan line animation */}
              <div className="absolute left-0 right-0 h-px bg-red-400 opacity-80 animate-bounce top-1/2" />
            </div>
          </div>

          {/* Hint text */}
          {hint && (
            <div className="absolute bottom-8 inset-x-0 text-center">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                จ่อบาร์โค้ดให้อยู่ในกรอบ
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                title="สลับกล้อง"
              >
                <FlipHorizontal size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
              title="ปิดกล้อง"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
