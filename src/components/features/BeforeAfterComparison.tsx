import { useRef, useState, useCallback } from 'react'
import { Upload, SplitSquareHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  currentImage: string | null
}

export function BeforeAfterComparison({ currentImage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [sliderPct, setSliderPct] = useState(50)
  const [dragging, setDragging] = useState(false)

  const updateSlider = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
      setSliderPct(pct)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      updateSlider(e.clientX)
    },
    [dragging, updateSlider],
  )

  const loadBefore = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBeforeImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const afterImage = currentImage

  if (!afterImage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SplitSquareHorizontal className="h-10 w-10 text-slate-300" />
        <p className="mt-4 text-slate-500">
          Upload and run a scan first — that image becomes the "after" side.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {!beforeImage ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => loadBefore(e.target.files?.[0])}
          />
          <Upload className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600">
            Upload an older smile photo to compare with your current scan.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fileRef.current?.click()}
          >
            Choose "before" photo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="font-medium">Before</span>
            <span className="text-slate-400">Drag the divider</span>
            <span className="font-medium">After</span>
          </div>

          {/* Comparison container */}
          <div
            ref={containerRef}
            className="relative aspect-[4/3] w-full cursor-col-resize select-none overflow-hidden rounded-[1.5rem] bg-slate-100"
            onPointerMove={onPointerMove}
            onPointerDown={(e) => {
              setDragging(true)
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
              updateSlider(e.clientX)
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            {/* After (full width, behind clip) */}
            <img
              src={afterImage}
              alt="After"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />

            {/* Before (clipped to left portion) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPct}%` }}
            >
              <img
                src={beforeImage}
                alt="Before"
                className="absolute inset-0 h-full object-cover"
                style={{ width: containerRef.current?.clientWidth ?? '100%' }}
                draggable={false}
              />
              {/* Before label */}
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                Before
              </div>
            </div>

            {/* After label */}
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              After
            </div>

            {/* Divider line */}
            <div
              className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
              style={{ left: `${sliderPct}%` }}
            >
              {/* Handle */}
              <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200">
                <SplitSquareHorizontal className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBeforeImage(null)
              if (fileRef.current) fileRef.current.value = ''
            }}
          >
            <Upload className="h-4 w-4" /> Change before photo
          </Button>
        </div>
      )}
    </div>
  )
}
