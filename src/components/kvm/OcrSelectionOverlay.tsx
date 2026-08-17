/**
 * @Purpose: OCR selection overlay component - Lightweight screenshot tool style
 * @Description: Minimal and natural text selection experience
 * @Author: zhanglei
 */

import { type OcrSelection } from '@/hooks/useOcrCapture';
import { AlertCircle, Check, Copy, Loader2, Maximize2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface OcrSelectionOverlayProps {
  isActive: boolean
  isSelecting: boolean
  selection: OcrSelection | null
  isRecognizing: boolean
  recognizedText?: string | null
  onCopyText?: () => Promise<boolean>
  onResetTask?: () => void
  onMouseDown: (event: React.MouseEvent | React.TouchEvent) => void
  onMouseMove: (event: React.MouseEvent | React.TouchEvent) => void
  onMouseUp: () => void
  onCancel: () => void
}

// Lightweight selection states
enum OcrPhase {
  IDLE = 'idle',              // Not active
  SELECTING = 'selecting',   // User dragging
  SELECTED = 'selected',     // Area selected, ready to recognize
  RECOGNIZING = 'recognizing', // Processing
  SUCCESS = 'success',       // Recognition done
  FAILED = 'failed',         // Error occurred
}

export function OcrSelectionOverlay({
  isActive,
  isSelecting,
  selection,
  isRecognizing,
  recognizedText,
  onCopyText,
  onResetTask,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onCancel,
}: OcrSelectionOverlayProps) {
  const { t } = useTranslation('common');
  const [autoCopied, setAutoCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Calculate selection rectangle
  const selectionRect = useMemo(() => {
    if (!selection) return null;

    const left = Math.min(selection.startX, selection.endX);
    const top = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    return { left, top, width, height };
  }, [selection]);

  // Determine current phase
  const phase = useMemo(() => {
    if (!isActive) return OcrPhase.IDLE;
    if (isRecognizing) return OcrPhase.RECOGNIZING;
    if (recognizedText) return OcrPhase.SUCCESS;
    if (isSelecting) return OcrPhase.SELECTING;
    if (selectionRect && selectionRect.width > 5 && selectionRect.height > 5) return OcrPhase.SELECTED;
    return OcrPhase.IDLE;
  }, [isActive, isSelecting, isRecognizing, recognizedText, selectionRect]);

  // Auto copy and show result when recognition succeeds
  useEffect(() => {
    if (phase === OcrPhase.SUCCESS && recognizedText && !autoCopied) {
      setAutoCopied(true);
      setShowResult(true);
      setRecognitionError(null);
      // Auto copy after a brief delay to let user see the result
      const timer = setTimeout(() => {
        onCopyText?.();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (phase === OcrPhase.FAILED) {
      setRecognitionError(t('ocr.errorHint'));
      setShowResult(true);
    }
    if (phase !== OcrPhase.SUCCESS && phase !== OcrPhase.FAILED) {
      setAutoCopied(false);
      setShowResult(false);
      setRecognitionError(null);
    }
  }, [phase, recognizedText, autoCopied, onCopyText]);

  // Handle Escape key to exit OCR mode (capture phase to ensure it works with iframe)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    // Use capture phase to intercept before iframe or other elements
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isActive, onCancel]);

  if (!isActive) return null;

  // Check if we have a valid selection
  const hasSelection = selectionRect && selectionRect.width > 5 && selectionRect.height > 5;

  // When result is shown, clicking outside doesn't start new selection
  const isResultPhase = phase === OcrPhase.SUCCESS;

  return (
    <div
      className="absolute inset-0 z-[200] touch-none"
      style={{ cursor: isResultPhase ? 'default' : 'crosshair' }}
      onMouseDown={isResultPhase ? undefined : onMouseDown}
      onMouseMove={isResultPhase ? undefined : onMouseMove}
      onMouseUp={isResultPhase ? undefined : onMouseUp}
      onTouchStart={isResultPhase ? undefined : onMouseDown}
      onTouchMove={isResultPhase ? undefined : onMouseMove}
      onTouchEnd={isResultPhase ? undefined : onMouseUp}
    >
      {/* Light semi-transparent overlay - very subtle */}
      <div
        className={`absolute inset-0 transition-colors duration-200 ${
          isResultPhase ? 'bg-black/15' : 'bg-black/[0.03]'
        }`}
        onClick={isResultPhase ? (e) => e.stopPropagation() : undefined}
      />

      {/* Selection rectangle - only during selecting/selected phases */}
      {(phase === OcrPhase.SELECTING || phase === OcrPhase.SELECTED || phase === OcrPhase.RECOGNIZING) && hasSelection && (
        <>
          {/* Selected area - light dashed border */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${selectionRect.left}px`,
              top: `${selectionRect.top}px`,
              width: `${selectionRect.width}px`,
              height: `${selectionRect.height}px`,
            }}
          >
            {/* Main border - soft dashed blue */}
            <div
              className="absolute inset-0 border border-dashed border-blue-400/70 rounded-sm"
              style={{
                boxShadow: '0 0 0 1px rgba(59,130,246,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)',
              }}
            />

            {/* Corner handles - subtle white dots with blue border */}
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-white border border-blue-500 rounded-full shadow-sm" />
            <div className="absolute -right-1 -top-1 w-2 h-2 bg-white border border-blue-500 rounded-full shadow-sm" />
            <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-white border border-blue-500 rounded-full shadow-sm" />
            <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-white border border-blue-500 rounded-full shadow-sm" />

            {/* Size label - floating above selection, not blocking content */}
            <div
              className="absolute bg-slate-800/90 backdrop-blur-sm text-text px-2 py-0.5 rounded text-[10px] font-mono pointer-events-none whitespace-nowrap shadow-sm border border-white/10"
              style={{
                left: '50%',
                top: '-24px',
                transform: 'translateX(-50%)',
              }}
            >
              {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
            </div>

            {/* Recognizing status - small badge at bottom-right of selection */}
            {phase === OcrPhase.RECOGNIZING && (
              <div
                className="absolute flex items-center gap-1 bg-blue-600 text-text px-2 py-1 rounded text-sm shadow-lg"
                style={{
                  right: '0',
                  bottom: '0',
                  transform: 'translateY(100%)',
                  marginTop: '4px',
                }}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{t('ocr.recognizing')}</span>
              </div>
            )}
          </div>

          {/* Mask - darken unselected area */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <mask id="selection-mask">
                <rect width="100%" height="100%" fill="white" />
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
              fill="rgba(0, 0, 0, 0.1)"
              mask="url(#selection-mask)"
            />
          </svg>
        </>
      )}

      {/* Result mini panel - lightweight, smart positioning */}
      {showResult && (
        <ResultCard
          recognizedText={recognizedText}
          recognitionError={recognitionError}
          autoCopied={autoCopied}
          hasSelection={hasSelection}
          selectionRect={selectionRect}
          onCopyText={onCopyText}
          onResetTask={onResetTask}
          onCancel={onCancel}
          onClose={() => {
            setShowResult(false);
            onCancel(); // Exit OCR mode after closing result card
          }}
        />
      )}

      {/* Top toolbar - minimal, natural English */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-text rounded-lg shadow-lg px-3 py-2">
        {(phase === OcrPhase.IDLE || phase === OcrPhase.SELECTING || phase === OcrPhase.SELECTED) && (
          <span className="text-sm font-medium">
            {phase === OcrPhase.IDLE ? t('ocr.dragHint') : t('ocr.releaseHint')}
          </span>
        )}
        {(phase === OcrPhase.IDLE || phase === OcrPhase.SELECTING || phase === OcrPhase.SELECTED) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="text-slate-400 hover:text-text text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            {t('ocr.exit')}
          </button>
        )}
        {phase === OcrPhase.RECOGNIZING && (
          <span className="text-sm font-medium text-blue-300">{t('ocr.reading')}</span>
        )}
        {phase === OcrPhase.SUCCESS && (
          <span className="text-sm font-medium text-green-400">{t('ocr.success')}</span>
        )}
        {phase === OcrPhase.FAILED && (
          <span className="text-sm font-medium text-amber-400">{t('ocr.error')}</span>
        )}
      </div>
    </div>
  );
}

// Result Card Component - Smart positioning, handles long text and error states
interface ResultCardProps {
  recognizedText?: string | null
  recognitionError: string | null
  autoCopied: boolean
  hasSelection: boolean
  selectionRect: { left: number; top: number; width: number; height: number } | null
  onCopyText?: () => Promise<boolean>
  onResetTask?: () => void
  onCancel: () => void
  onClose: () => void
}

function ResultCard({
  recognizedText,
  recognitionError,
  autoCopied,
  hasSelection,
  selectionRect,
  onCopyText,
  onResetTask,
  onCancel,
  onClose,
}: ResultCardProps) {
  const { t } = useTranslation('common');
  const [showFullText, setShowFullText] = useState(false);
  const isError = !!recognitionError;
  const text = recognizedText || '';
  const isLongText = text.length > 200 || text.split('\n').length > 6;

  // Calculate smart position
  const getPosition = () => {
    if (!hasSelection || !selectionRect) {
      return { left: '50%', top: '20%', transform: 'translateX(-50%)' };
    }

    const padding = 12;
    const cardWidth = 320;
    const cardHeight = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: show to the right of selection
    let left = selectionRect.left + selectionRect.width + padding;
    let top = selectionRect.top;

    // If not enough space on right, show on left
    if (left + cardWidth > viewportWidth - padding) {
      left = selectionRect.left - cardWidth - padding;
    }

    // If not enough space on left either, show below
    if (left < padding) {
      left = selectionRect.left;
      top = selectionRect.top + selectionRect.height + padding;

      // If not enough space below, show above
      if (top + cardHeight > viewportHeight - padding) {
        top = selectionRect.top - cardHeight - padding;
      }
    }

    // Ensure within viewport
    left = Math.max(padding, Math.min(left, viewportWidth - cardWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - cardHeight - padding));

    return { left: `${left}px`, top: `${top}px`, transform: 'none' };
  };

  const position = getPosition();

  return (
    <>
      {/* Main result card */}
      <div
        className="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-3 cursor-default w-[320px] z-50"
        style={position}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {isError ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">{t('ocr.error')}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700">{t('ocr.success')}</span>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label={t('ocr.close')}
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        {isError ? (
          <div className="text-sm text-slate-600 mb-3">
            {recognitionError}
          </div>
        ) : (
          <>
            {/* Text preview - scrollable if medium length */}
            <div className="bg-slate-50 rounded px-2.5 py-2 mb-3 border border-slate-100">
              <p className={`text-sm text-slate-800 whitespace-pre-wrap wrap-break-word leading-relaxed ${isLongText ? 'max-h-[120px] overflow-y-auto pr-1' : ''}`}>
                {text}
              </p>
              {isLongText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullText(true);
                  }}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  {t('ocr.viewFullText')}
                </button>
              )}
            </div>

            {/* Copied hint */}
            {autoCopied && (
              <div className="mb-3 text-sm text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>{t('ocr.copied')}</span>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isError && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await onCopyText?.();
                onCancel(); // Exit OCR mode after copy
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-text px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{t('ocr.copy')}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResetTask?.();
            }}
            className={`${isError ? 'flex-1' : ''} px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium transition-colors border border-slate-200`}
          >
            {t('ocr.reselect')}
          </button>
          {isError && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded text-sm font-medium transition-colors"
            >
              {t('ocr.close')}
            </button>
          )}
        </div>

        {/* Privacy note */}
        <div className="mt-2 text-[10px] text-slate-400 text-center">
          {t('ocr.privacyNote')}
        </div>
      </div>

      {/* Full text modal for very long text */}
      {showFullText && !isError && (
        <div
          className="absolute inset-0 z-[300] flex items-center justify-center bg-black/30"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullText(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-medium text-slate-800">{t('ocr.recognizedText')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullText(false);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="text-sm text-slate-800 whitespace-pre-wrap break-words font-mono bg-slate-50 p-3 rounded">
                {text}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await onCopyText?.();
                  setShowFullText(false);
                  onCancel();
                }}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-text px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                {t('ocr.copy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
