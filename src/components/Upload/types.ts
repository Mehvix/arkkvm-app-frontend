/**
 * Upload component type definitions.
 */
import React from 'react'

/**
 * Upload state machine.
 * - `idle`: No upload in progress
 * - `uploading`: File transfer active
 * - `success`: Upload completed
 * - `error`: Upload failed
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * Information emitted when an upload starts.
 */
export interface UploadStartInfo {
  alreadyUploadedBytes: number
  dataChannel: string | RTCDataChannel | null
  filename: string
  size: number
}

/**
 * Information emitted on upload progress updates.
 */
export interface UploadProgressInfo {
  name: string
  uploadedBytes: number
  totalBytes: number
  speedBps: number // bytes per second
  progress: number // 0-100
}

/**
 * Information emitted when an upload is paused.
 */
export interface UploadPauseInfo {
  name: string
  transferredBytes: number
  totalBytes: number
}

/**
 * Real-time upload detail for UI display.
 */
export interface UploadDetail {
  name: string
  dataChannelLabel: string
  totalBytes: number
  transferredBytes: number
  progress: number
  speedBps: number
  totalFormatted: string
  transferredFormatted: string
  progressFormatted: string
  speedFormatted: string
}

export const INITIAL_UPLOAD_DETAIL: UploadDetail = {
  name: '',
  dataChannelLabel: '',
  totalBytes: 0,
  transferredBytes: 0,
  progress: 0,
  speedBps: 0,
  totalFormatted: '0 B',
  transferredFormatted: '0 B',
  progressFormatted: '0%',
  speedFormatted: '0 B/s',
}

/**
 * Storage space information.
 */
export interface StorageSpaceInfo {
  total: number // bytes
  used: number // bytes
}

/**
 * Props for the UploadDropZone component.
 */
export interface UploadDropZoneProps {
  label?: string
  isDragging?: boolean
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onFileSelected?: (f: File) => void
  onSuccess?: (file?: File) => void
  onError?: (info?: { name?: string; error?: string }) => void
  onStart?: (info: UploadStartInfo) => void
  // External progress and speed notification (triggered on each upload progress/rate change)
  onProgress?: (info: UploadProgressInfo) => void
  step?: 'overview' | 'upload' | 'resume' // Upload step: overview - user browsing/selecting files, upload - file transferring, resume - continue from breakpoint
  formatsText?: React.ReactNode
  startMethod?: string
  httpUploadUrl?: string
  idleText?: string // default: "Click or drag file to upload"
  draggingText?: string // default: "Drop file to upload"
  accept?: string // default: .iso,.img,application/octet-stream
  disabled?: boolean
  className?: string
  showProgress?: boolean
  path?: string
  // Filename to display/use when resuming an upload (replaces prior uploadFileName usage)
  resumeFileName?: string
  // Initial resume values: size (already uploaded bytes) and totalBytes (file size)
  size?: number
  totalBytes?: number
  // Optional right side slot for the resume header line
  rightSlot?: React.ReactNode
  // Whether to render the idle upload drop zone (for list-only usages)
  showUploader?: boolean
  // Build extra params for the start RPC based on the selected file
  startParams?: (file: File) => any | Promise<any>
  // Notify parent when internal uploadState changes
  onStateChange?: (state: UploadState) => void
  onUploadSpeed?: (any: any) => void
  /** Callback when paused, returns current transfer state */
  onPause?: (info: UploadPauseInfo) => void
  /** Custom upload trigger element (e.g., Button). If provided, replaces default upload box */
  customUploadTrigger?: React.ReactNode
  /** Custom className for uploader container (when using customUploadTrigger) */
  uploaderContainerClassName?: string
  /** Maximum file size in bytes. If exceeded, upload will be rejected with a toast message */
  maxFileSize?: number
  // Undeclared but used props
  showInputAlways?: boolean
  inputProps?: any
  lowWaterMark?: number
  highWaterMark?: number
}
