/**
 * OCR capture hook for text recognition from a video stream.
 * Supports region selection, image capture, and text recognition.
 */

import { createLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';

const logger = createLogger('useOcrCapture');

export interface OcrSelection {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface UseOcrCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  /** Recognition language. Default covers English, Simplified Chinese, Vietnamese, Spanish, Czech, Portuguese, German, Dutch and French. */
  language?: string
  onTextRecognized?: (text: string) => void
}

export interface UseOcrCaptureReturn {
  isSelecting: boolean
  selection: OcrSelection | null
  isRecognizing: boolean
  recognizedText: string | null
  copyRecognizedText: () => Promise<boolean>
  resetOcrTask: () => void
  startSelection: (event: React.MouseEvent) => void
  updateSelection: (event: React.MouseEvent) => void
  endSelection: () => void
  cancelSelection: () => void
  captureAndRecognize: () => Promise<void>
}

export function useOcrCapture({
  videoRef,
  language = 'eng+chi_sim+vie+spa+ces+por+deu+nld+fra',
  onTextRecognized,
}: UseOcrCaptureOptions): UseOcrCaptureReturn {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<OcrSelection | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  const fallbackCopyWithExecCommand = useCallback((textToCopy: string): boolean => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch (error) {
      logger.warn('Fallback copy via execCommand failed', error);
      return false;
    }
  }, []);

  const copyTextToClipboard = useCallback(async (textToCopy: string): Promise<boolean> => {
    // Try Clipboard API first; it fails if the document is not focused
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch (clipboardError) {
        logger.warn('Clipboard API writeText failed, falling back to execCommand', clipboardError);
      }
    }
    // Fallback: execCommand works even when document focus is uncertain
    if (fallbackCopyWithExecCommand(textToCopy)) {
      return true;
    }
    logger.warn('Failed to copy to clipboard: all methods failed');
    return false;
  }, [fallbackCopyWithExecCommand]);

  const copyRecognizedText = useCallback(async (): Promise<boolean> => {
    if (!recognizedText) {
      toast.warning('No recognized text to copy');
      return false;
    }
    return copyTextToClipboard(recognizedText);
  }, [recognizedText, copyTextToClipboard]);

  const workerRef = useRef<TesseractWorker | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  // The overlay DOM rect captured at selection-start. Selection coords
  // are stored relative to the overlay element (what the user
  // visually drags on); when we later map them to video-source
  // pixels, we need to know where the overlay sat relative to the
  // video element, because they don't coincide when the video is
  // letterboxed inside its container.
  const overlayRectRef = useRef<{ left: number; top: number } | null>(null);

  // Initialize Tesseract Worker
  const initWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    try {
      // Use CDN to load language data (reduces bundle size for device)
      logger.info('Initializing OCR worker with language:', language);

      // Tesseract.js v6: Create worker with specified language
      // Language data will be loaded from CDN (unpkg or jsdelivr)
      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            logger.debug('OCR Progress', { progress: Math.round(m.progress * 100) });
          } else if (m.status?.includes('error') || m.status?.includes('failed')) {
            logger.error('OCR Worker error:', m);
          }

        },
        // Use default CDN (unpkg) to load language data
        // This keeps the build size small for device deployment
      });
      // Tune recognizer for the "user drag-selects a region" scenario:
      // - PSM 6: treat the crop as a single uniform block of text.
      //   Tesseract's official recommendation for user-cropped
      //   regions. PSM 3 (auto) runs extra layout analysis that often
      //   fails on small/single-word selections.
      // - preserve_interword_spaces: keep spaces so commands/paths
      //   stay intact.
      try {
        await worker.setParameters({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tessedit_pageseg_mode: '6' as any,
          preserve_interword_spaces: '1',
        });
      } catch (e) {
        logger.warn('setParameters failed, using defaults', e);
      }
      workerRef.current = worker;
      return worker;
    } catch (error) {
      logger.error('Failed to initialize OCR worker', error);
      toast.error('OCR initialization failed');
      return null;
    }
  }, [language]);

  /**
   * Preprocess the captured canvas to boost OCR accuracy:
   * 1. grayscale via ITU-R BT.601 luma
   * 2. Otsu's method — pick the binarization threshold that maximizes
   *    between-class variance, so it adapts per-image. This preserves
   *    light-colored syntax-highlighted tokens on white backgrounds
   *    (which a fixed threshold would wipe out) and still cuts H.264
   *    noise from video streams.
   * 3. Auto-detect polarity: invert dark-background scenes (terminal,
   *    BIOS) so text always ends up dark-on-light — tesseract's
   *    preferred polarity.
   * 4. If the image has very little contrast (std-dev < 18) we skip
   *    binarization and leave the grayscale in place — binarizing low
   *    contrast images loses more signal than it gains.
   */
  const preprocessForOcr = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = img.data;
      const pixelCount = data.length / 4;
      const gray = new Uint8ClampedArray(pixelCount);
      const histogram = new Array<number>(256).fill(0);
      let sum = 0;
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const g = Math.round(
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        );
        gray[j] = g;
        histogram[g]++;
        sum += g;
      }
      const mean = sum / pixelCount;

      // Compute std-dev to detect very flat (low-info) inputs.
      let varSum = 0;
      for (let j = 0; j < pixelCount; j++) {
        const d = gray[j] - mean;
        varSum += d * d;
      }
      const stdDev = Math.sqrt(varSum / pixelCount);

      // Otsu's method — maximize between-class variance.
      let totalIxHist = 0;
      for (let t = 0; t < 256; t++) totalIxHist += t * histogram[t];
      let wB = 0;
      let sumB = 0;
      let maxBetween = 0;
      let otsu = 127;
      for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        const wF = pixelCount - wB;
        if (wF === 0) break;
        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (totalIxHist - sumB) / wF;
        const between = wB * wF * (mB - mF) * (mB - mF);
        if (between > maxBetween) {
          maxBetween = between;
          otsu = t;
        }
      }

      const invert = mean < 110;
      const LOW_CONTRAST_STD = 18;

      if (stdDev < LOW_CONTRAST_STD) {
        // Flat image: just paint back grayscale, optionally inverted.
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const v = invert ? 255 - gray[j] : gray[j];
          data[i] = data[i + 1] = data[i + 2] = v;
        }
      } else {
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          let v = gray[j] > otsu ? 255 : 0;
          if (invert) v = 255 - v;
          data[i] = data[i + 1] = data[i + 2] = v;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    []
  );

  // Start selecting region
  const startSelection = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // Prevent default touch behavior (scrolling) on mobile
    if ('touches' in event) {
      event.preventDefault();
    }

    const rect = event.currentTarget.getBoundingClientRect();
    // Remember where the overlay sat in the viewport so we can later
    // translate overlay-local selection coords into video-local coords.
    overlayRectRef.current = { left: rect.left, top: rect.top };

    // Get coordinates from mouse or touch event
    let clientX, clientY;
    if ('touches' in event) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    selectionStartRef.current = { x, y };
    setIsSelecting(true);
    setRecognizedText(null);
    setSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  }, []);

  // Update selection region
  const updateSelection = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isSelecting || !selectionStartRef.current) return;

      // Prevent default touch behavior (scrolling) on mobile
      if ('touches' in event) {
        event.preventDefault();
      }

      const rect = event.currentTarget.getBoundingClientRect();

      // Get coordinates from mouse or touch event
      let clientX, clientY;
      if ('touches' in event) {
        // Touch event
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setSelection({
        startX: selectionStartRef.current.x,
        startY: selectionStartRef.current.y,
        endX: x,
        endY: y,
      });
    },
    [isSelecting]
  );

  // End selection and trigger recognition
  const endSelection = useCallback(() => {
    if (isSelecting && selection) {
      setIsSelecting(false);
      // Auto trigger recognition after selection ends
      captureAndRecognize();
    }
  }, [isSelecting, selection]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelection(null);
    setRecognizedText(null);
    selectionStartRef.current = null;
  }, []);

  const resetOcrTask = useCallback(() => {
    setIsSelecting(false);
    setSelection(null);
    setRecognizedText(null);
    selectionStartRef.current = null;
  }, []);

  // Capture selected region and recognize text
  const captureAndRecognize = useCallback(async () => {
    if (!selection || !videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Video stream not ready');
      return;
    }

    setIsRecognizing(true);

    try {
      // Create canvas to capture selected region
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Map overlay-local selection → video-source pixel coordinates.
      //
      // `selection.{startX,startY,endX,endY}` are relative to the
      // overlay <div> (event.currentTarget at startSelection time),
      // which covers the whole video container and can therefore be
      // larger than / offset from the actual <video> element due to
      // object-fit letterboxing. We translate into video-local coords
      // by subtracting the overlay-vs-video origin offset, then scale
      // from CSS pixels to source pixels.
      const videoRect = video.getBoundingClientRect();
      const overlayRect = overlayRectRef.current ?? {
        left: videoRect.left,
        top: videoRect.top,
      };
      const overlayToVideoDX = overlayRect.left - videoRect.left;
      const overlayToVideoDY = overlayRect.top - videoRect.top;

      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;

      const rawSx = Math.min(selection.startX, selection.endX) + overlayToVideoDX;
      const rawSy = Math.min(selection.startY, selection.endY) + overlayToVideoDY;
      const rawEx = Math.max(selection.startX, selection.endX) + overlayToVideoDX;
      const rawEy = Math.max(selection.startY, selection.endY) + overlayToVideoDY;

      // Clamp into the video-display area so dragging into the
      // letterbox (or outside) doesn't corrupt the crop.
      const clampedSx = Math.max(0, Math.min(videoRect.width, rawSx));
      const clampedSy = Math.max(0, Math.min(videoRect.height, rawSy));
      const clampedEx = Math.max(0, Math.min(videoRect.width, rawEx));
      const clampedEy = Math.max(0, Math.min(videoRect.height, rawEy));

      const x1 = clampedSx * scaleX;
      const y1 = clampedSy * scaleY;
      const x2 = clampedEx * scaleX;
      const y2 = clampedEy * scaleY;
      const width = x2 - x1;
      const height = y2 - y1;

      if (width < 2 || height < 2) {
        return;
      }

      // Upscale the crop so small glyphs become legible to tesseract.
      // Short/small selections (single word, small font) benefit a lot
      // from a higher factor — and their absolute size stays tiny so
      // memory is a non-issue. Large selections cap at 3x and at
      // MAX_SIDE on either axis.
      const MAX_SIDE = 4096;
      const shortestSide = Math.min(width, height);
      const rawScale = shortestSide < 80 ? 5 : shortestSide < 200 ? 4 : 3;
      const scale = Math.min(
        rawScale,
        MAX_SIDE / Math.max(width, 1),
        MAX_SIDE / Math.max(height, 1)
      );
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));

      // Use high-quality resampling when scaling up
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw (and upscale) selected content
      ctx.drawImage(
        video,
        x1,
        y1,
        width,
        height, // source
        0,
        0,
        canvas.width,
        canvas.height // destination
      );

      // Grayscale + adaptive-polarity binarization to cut H.264 noise
      preprocessForOcr(ctx, canvas);

      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Initialize worker and recognize
      const worker = await initWorker();
      if (!worker) throw new Error('Failed to initialize worker');

      const {
        data: { text },
      } = await worker.recognize(blob);


      if (!text || text.trim() === '') {
        toast.warning('No text recognized');
        setRecognizedText(null);
        return;
      }

      // Clean text while preserving line breaks:
      // - collapse runs of spaces/tabs within a line
      // - strip trailing whitespace per line
      // - collapse 3+ blank lines to a single blank line
      const cleanedText = text
        .split('\n')
        .map(l => l.replace(/[ \t]+/g, ' ').trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setRecognizedText(cleanedText);

      // Try copy to clipboard, but keep recognized text available for manual copy.
      await copyTextToClipboard(cleanedText);

      // Callback
      if (onTextRecognized) {
        onTextRecognized(cleanedText);
      }
    } catch (error) {
      logger.error('OCR recognition failed', error);
      toast.error('Text recognition failed');
      setRecognizedText(null);
    } finally {
      setIsRecognizing(false);
      // Clear selection after recognition completes
      setSelection(null);
      selectionStartRef.current = null;
    }
  }, [selection, videoRef, initWorker, onTextRecognized, preprocessForOcr, copyTextToClipboard]);

  // Cleanup worker on component unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    isSelecting,
    selection,
    isRecognizing,
    recognizedText,
    copyRecognizedText,
    resetOcrTask,
    startSelection,
    updateSelection,
    endSelection,
    cancelSelection,
    captureAndRecognize,
  };
}
