/**
 * Upload progress display sub-component.
 *
 * Shows current progress percentage, speed, and a progress bar.
 * Only rendered when an upload is actively transferring or resuming.
 */
import React from 'react'
import type { UploadDetail } from './types'

interface UploadProgressProps {
  step?: 'overview' | 'upload' | 'resume'
  uploadState: string
  fileName: string | null
  resumeFileName?: string
  currentUploadDetail: UploadDetail
  rightSlot?: React.ReactNode
}

function UploadProgress({
  step,
  uploadState,
  fileName,
  resumeFileName,
  currentUploadDetail,
  rightSlot,
}: UploadProgressProps) {
  return (
    <div className="space-y-4  p-3">
      {step === 'resume' && (
        <div className="text-sm font-semibold truncate mb-2 flex items-center justify-between gap-3 ">
          <span className="truncate">
            Resume upload: {fileName || resumeFileName || '...'}
          </span>
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      )}
      {step === 'resume' || uploadState === 'uploading' ? (
        <>
          <div className="text-xs  mb-2">
            {`${currentUploadDetail.progressFormatted || ''} • ${currentUploadDetail.speedFormatted}`}
          </div>
          <div className="h-2 bg-white/10 rounded">
            <div
              className="h-full bg-[var(--btn-primary-bg)] rounded"
              style={{
                width: `${currentUploadDetail.progress}%`,
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default React.memo(UploadProgress)
