/**
 * @Purpose: OCR selection overlay component
 * @Description: Displays selection rectangle and handles user interaction
 * @Author: zhanglei
 */

import { type OcrSelection } from '@/hooks/useOcrCapture'
import { Loader2, Type } from 'lucide-react'
import { useMemo } from 'react'

export interface OcrSelectionOverlayProps {
  isActive: boolean
  isSelecting: boolean
  selection: OcrSelection | null
  isRecognizing: boolean
  onMouseDown: (event: React.MouseEvent) => void
  onMouseMove: (event: React.MouseEvent) => void
  onMouseUp: () => void
  onCancel: () => void
}

export function OcrSelectionOverlay({
  isActive,
  isSelecting,
  selection,
  isRecognizing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onCancel,
}: OcrSelectionOverlayProps) {
  // Calculate selection rectangle
  const selectionRect = useMemo(() => {
    if (!selection) return null

    const left = Math.min(selection.startX, selection.endX)
    const top = Math.min(selection.startY, selection.endY)
    const width = Math.abs(selection.endX - selection.startX)
    const height = Math.abs(selection.endY - selection.startY)

    return { left, top, width, height }
  }, [selection])

  if (!isActive) return null

  return (
    <div
      className="absolute inset-0 z-[200]"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        cursor: isSelecting ? 'crosshair' : 'crosshair',
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Selection rectangle */}
      {selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && (
        <>
          {/* Selected area (transparent, shows original content) */}
          <div
            className="absolute border-2 border-blue-500 bg-transparent"
            style={{
              left: `${selectionRect.left}px`,
              top: `${selectionRect.top}px`,
              width: `${selectionRect.width}px`,
              height: `${selectionRect.height}px`,
            }}
          >
            {/* Corner decorations */}
            <div className="absolute -left-1 -top-1 w-3 h-3 border-l-2 border-t-2 border-blue-500" />
            <div className="absolute -right-1 -top-1 w-3 h-3 border-r-2 border-t-2 border-blue-500" />
            <div className="absolute -left-1 -bottom-1 w-3 h-3 border-l-2 border-b-2 border-blue-500" />
            <div className="absolute -right-1 -bottom-1 w-3 h-3 border-r-2 border-b-2 border-blue-500" />

            {/* Size label */}
            <div className="absolute -top-8 left-0 flex items-center gap-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">
              <Type className="w-3 h-3" />
              <span>
                {Math.round(selectionRect.width)} ×{' '}
                {Math.round(selectionRect.height)}
              </span>
            </div>
          </div>

          {/* Mask hole (allows selected area to show original content) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <mask id="selection-mask">
                <rect width="100%" height="100%" fill="currentColor" />
                <rect
                  x={selectionRect.left}
                  y={selectionRect.top}
                  width={selectionRect.width}
                  height={selectionRect.height}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.15)"
              mask="url(#selection-mask)"
            />
          </svg>
        </>
      )}

      {/* Recognizing indicator */}
      {isRecognizing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-500/90 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Recognizing text...</span>
          </div>
        </div>
      )}

      {/* Instruction text */}
      {!isSelecting && !selection && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Type className="w-4 h-4" />
            <span>Drag to select text area for recognition</span>
          </div>
        </div>
      )}

      {/* Cancel button */}
      <button
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        onClick={e => {
          e.stopPropagation()
          onCancel()
        }}
      >
        <span>ESC Cancel</span>
      </button>

      {/* Help text */}
      {!isSelecting && !selection && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-xs pointer-events-none">
          <div className="flex flex-col gap-1">
            <div>• Hold and drag to select area</div>
            <div>• Release to auto-recognize text</div>
            <div>• Text will be copied to clipboard</div>
            <div>• Press ESC or click Cancel to exit</div>
          </div>
        </div>
      )}
    </div>
  )
}
