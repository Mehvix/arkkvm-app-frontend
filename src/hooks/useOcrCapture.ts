/**
 * @Purpose: OCR capture hook for text recognition from video stream
 * @Description: Provides functionality to select region, capture, and recognize text
 * @Author: zhanglei
 */

import { createLogger } from '@/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js'

const logger = createLogger('useOcrCapture')

export interface OcrSelection {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface UseOcrCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  language?: string // Recognition language, default 'eng+chi_sim' (English + Simplified Chinese)
  onTextRecognized?: (text: string) => void
}

export interface UseOcrCaptureReturn {
  isSelecting: boolean
  selection: OcrSelection | null
  isRecognizing: boolean
  recognizedText: string | null
  startSelection: (event: React.MouseEvent) => void
  updateSelection: (event: React.MouseEvent) => void
  endSelection: () => void
  cancelSelection: () => void
  captureAndRecognize: () => Promise<void>
}

export function useOcrCapture({
  videoRef,
  language = 'eng+chi_sim',
  onTextRecognized,
}: UseOcrCaptureOptions): UseOcrCaptureReturn {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selection, setSelection] = useState<OcrSelection | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognizedText, setRecognizedText] = useState<string | null>(null)

  const workerRef = useRef<TesseractWorker | null>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize Tesseract Worker
  const initWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current

    try {
      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            logger.debug('OCR Progress', {
              progress: Math.round(m.progress * 100),
            })
          }
        },
      })
      workerRef.current = worker
      return worker
    } catch (error) {
      logger.error('Failed to initialize OCR worker', error)
      toast.error('OCR initialization failed')
      return null
    }
  }, [language])

  // Start selecting region
  const startSelection = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    selectionStartRef.current = { x, y }
    setIsSelecting(true)
    setSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    })
  }, [])

  // Update selection region
  const updateSelection = useCallback(
    (event: React.MouseEvent) => {
      if (!isSelecting || !selectionStartRef.current) return

      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setSelection({
        startX: selectionStartRef.current.x,
        startY: selectionStartRef.current.y,
        endX: x,
        endY: y,
      })
    },
    [isSelecting]
  )

  // End selection and trigger recognition
  const endSelection = useCallback(() => {
    if (isSelecting && selection) {
      setIsSelecting(false)
      // Auto trigger recognition after selection ends
      captureAndRecognize()
    }
  }, [isSelecting, selection])

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setIsSelecting(false)
    setSelection(null)
    selectionStartRef.current = null
  }, [])

  // Capture selected region and recognize text
  const captureAndRecognize = useCallback(async () => {
    if (!selection || !videoRef.current) return

    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Video stream not ready')
      return
    }

    setIsRecognizing(true)
    toast.info('Recognizing text...')

    try {
      // Create canvas to capture selected region
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      // Calculate actual video coordinates (considering scaling)
      const videoRect = video.getBoundingClientRect()
      const scaleX = video.videoWidth / videoRect.width
      const scaleY = video.videoHeight / videoRect.height

      const x1 = Math.min(selection.startX, selection.endX) * scaleX
      const y1 = Math.min(selection.startY, selection.endY) * scaleY
      const x2 = Math.max(selection.startX, selection.endX) * scaleX
      const y2 = Math.max(selection.startY, selection.endY) * scaleY
      const width = x2 - x1
      const height = y2 - y1

      // Set canvas size to selection size
      canvas.width = width
      canvas.height = height

      // Draw selected content
      ctx.drawImage(
        video,
        x1,
        y1,
        width,
        height, // source
        0,
        0,
        width,
        height // destination
      )

      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (!blob) throw new Error('Failed to create image blob')

      // Initialize worker and recognize
      const worker = await initWorker()
      if (!worker) throw new Error('Failed to initialize worker')

      const {
        data: { text },
      } = await worker.recognize(blob)

      if (!text || text.trim() === '') {
        toast.warning('No text recognized')
        setRecognizedText(null)
        return
      }

      // Clean text (remove extra spaces and line breaks)
      const cleanedText = text.trim().replace(/\s+/g, ' ')
      setRecognizedText(cleanedText)

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(cleanedText)
        toast.success(
          `Text recognized and copied: ${cleanedText.substring(0, 50)}${cleanedText.length > 50 ? '...' : ''}`
        )
      } catch (clipboardError) {
        logger.warn('Failed to copy to clipboard', clipboardError)
        toast.success(
          `Text recognized: ${cleanedText.substring(0, 50)}${cleanedText.length > 50 ? '...' : ''}`
        )
      }

      // Callback
      if (onTextRecognized) {
        onTextRecognized(cleanedText)
      }
    } catch (error) {
      logger.error('OCR recognition failed', error)
      toast.error('Text recognition failed')
      setRecognizedText(null)
    } finally {
      setIsRecognizing(false)
      // Clear selection after recognition completes
      setSelection(null)
      selectionStartRef.current = null
    }
  }, [selection, videoRef, initWorker, onTextRecognized])

  // Cleanup worker on component unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  return {
    isSelecting,
    selection,
    isRecognizing,
    recognizedText,
    startSelection,
    updateSelection,
    endSelection,
    cancelSelection,
    captureAndRecognize,
  }
}
