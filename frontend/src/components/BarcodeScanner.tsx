import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { FlipHorizontal, X } from 'lucide-react'

interface Props {
  onScan: (value: string) => void
  onClose: () => void
}

// Must match the overlay box dimensions below (w-56 = 224px, h-24 = 96px)
const VF_W = 224
const VF_H = 96
const SCAN_INTERVAL_MS = 150

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [camIndex, setCamIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        if (devices.length === 0) { setError('ไม่พบกล้องในอุปกรณ์นี้'); return }
        const backIdx = devices.findIndex(d => /back|rear|environment/i.test(d.label))
        setCameras(devices)
        setCamIndex(backIdx >= 0 ? backIdx : 0)
      })
      .catch(() => setError('ไม่สามารถเข้าถึงกล้องได้ — กรุณาอนุญาตสิทธิ์กล้อง'))
  }, [])

  useEffect(() => {
    if (cameras.length === 0 || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const reader = new BrowserMultiFormatReader()
    setHint(false)

    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: { exact: cameras[camIndex].deviceId } } })
      .then(stream => {
        streamRef.current = stream
        video.srcObject = stream
        video.play()
      })
      .catch(() => setError('ไม่สามารถเปิดกล้องได้'))

    const hintTimer = setTimeout(() => setHint(true), 2000)

    const interval = setInterval(() => {
      if (!video.videoWidth || video.readyState < 2) return

      const vw = video.videoWidth
      const vh = video.videoHeight
      const cssW = video.clientWidth
      const cssH = video.clientHeight

      // Compute object-cover scale and offset
      const scale = Math.max(cssW / vw, cssH / vh)
      const offsetX = (cssW - vw * scale) / 2  // negative = sides are cropped
      const offsetY = (cssH - vh * scale) / 2  // negative = top/bottom cropped

      // Viewfinder top-left in CSS pixels (centered)
      const vfCSSX = (cssW - VF_W) / 2
      const vfCSSY = (cssH - VF_H) / 2

      // Map CSS coords → video pixel coords
      const srcX = (vfCSSX - offsetX) / scale
      const srcY = (vfCSSY - offsetY) / scale
      const srcW = VF_W / scale
      const srcH = VF_H / scale

      canvas.width = Math.round(srcW)
      canvas.height = Math.round(srcH)
      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

      try {
        const result = reader.decodeFromCanvas(canvas)
        if (result) onScan(result.getText())
      } catch {
        // NotFoundException on every empty frame — ignore
      }
    }, SCAN_INTERVAL_MS)

    return () => {
      clearTimeout(hintTimer)
      clearInterval(interval)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [cameras, camIndex, onScan])

  const switchCamera = () => setCamIndex(i => (i + 1) % cameras.length)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-black relative">
      {/* Hidden canvas used for ROI cropping — not displayed */}
      <canvas ref={canvasRef} className="hidden" />

      {error ? (
        <div className="flex flex-col items-center justify-center h-44 text-center px-4 space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={onClose} className="text-xs text-gray-400 underline">ปิด</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="w-full h-44 object-cover" muted playsInline />

          {/* Viewfinder overlay — dimensions must match VF_W / VF_H constants above */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dark mask outside the viewfinder */}
            <div className="absolute inset-0 bg-black/40" />
            <div className="w-56 h-24 relative z-10">
              {/* Clear window */}
              <div className="absolute inset-0 bg-transparent" />
              {/* Red border */}
              <div className="absolute inset-0 border-2 border-red-500 rounded-sm" />
              {/* Corner brackets */}
              {(['tl','tr','bl','br'] as const).map(c => (
                <span key={c} className={`absolute w-5 h-5 border-red-400 border-2
                  ${c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0' : ''}
                  ${c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0' : ''}
                  ${c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0' : ''}
                  ${c === 'br' ? 'bottom-0 right-0 border-l-0 border-t-0' : ''}
                `} />
              ))}
              {/* Scan line animation */}
              <div className="absolute left-0 right-0 h-px bg-red-400 opacity-80 animate-bounce top-1/2" />
            </div>
          </div>

          {/* Hint text */}
          {hint && (
            <div className="absolute bottom-8 inset-x-0 text-center">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                จ่อบาร์โค้ดให้อยู่ในกรอบแดง
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
