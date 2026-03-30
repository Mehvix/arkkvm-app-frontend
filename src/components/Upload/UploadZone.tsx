/**
 * Upload drop zone / custom trigger sub-component.
 *
 * Renders either:
 * - A custom trigger element (e.g., Button) with drag support
 * - A default styled drop zone with idle/dragging hints
 */
import React from 'react'
import { Label } from '../ui/label'

interface UploadZoneProps {
  label?: string
  disabled: boolean
  dragging: boolean
  accept: string
  className: string
  idleText: string
  draggingText: string
  formatsText: React.ReactNode
  inputRef: React.RefObject<HTMLInputElement | null>
  pickingRef: React.MutableRefObject<boolean>
  customUploadTrigger?: React.ReactNode
  uploaderContainerClassName: string
  initSize?: number
  initTotalBytes?: number
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function UploadZone({
  label: labelText,
  disabled,
  dragging,
  accept,
  className,
  idleText,
  draggingText,
  formatsText,
  inputRef,
  pickingRef,
  customUploadTrigger,
  uploaderContainerClassName,
  initSize,
  initTotalBytes,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelected,
}: UploadZoneProps) {
  const openPicker = () => {
    if (disabled) return
    if (pickingRef.current) return
    pickingRef.current = true
    inputRef.current?.click()
  }

  return (
    <div className={disabled ? 'opacity-60' : ''}>
      {labelText ? (
        <Label className="break-all whitespace-pre-wrap word-break-break-all">
          {labelText}
        </Label>
      ) : null}
      {customUploadTrigger ? (
        // Custom upload trigger mode
        <div
          className={uploaderContainerClassName}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            disabled={disabled}
            multiple
            onChange={onFileSelected}
          />
          <div onClick={openPicker}>{customUploadTrigger}</div>
        </div>
      ) : (
        // Default upload box mode
        <div
          className={
            `mt-2 relative rounded-md p-6 text-center overflow-hidden transition-colors border ` +
            `${dragging ? 'border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)]/5' : 'border-[var(--border-color)]'} ` +
            `${disabled ? 'pointer-events-none' : 'cursor-pointer'} ` +
            `${className}`
          }
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          role="button"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={openPicker}
        >
          <input
            ref={inputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            accept={accept}
            disabled={disabled}
            tabIndex={-1}
            multiple
            onChange={onFileSelected}
          />
          <div className="pointer-events-none flex flex-col items-center">
            <div className="text-sm">{dragging ? draggingText : idleText}</div>
            <div className="text-xs  mt-2 text-[var(--text-secondary)]">
              {formatsText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(UploadZone)
