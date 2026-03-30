/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 20:52:14
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-11 03:38:52
 */
/**
 * UploadDropZone — main upload component.
 *
 * Orchestrates the upload hook with progress display and drop zone UI.
 * Supports both WebRTC DataChannel and HTTP upload transports.
 */
import { memo } from 'react'

import type { UploadDropZoneProps } from './types'
import UploadProgress from './UploadProgress'
import UploadZone from './UploadZone'
import { useUpload } from './useUpload'

function UploadDropZoneBase(props: UploadDropZoneProps) {
  const {
    label = '',
    formatsText = 'Supported formats: ISO, IMG',
    idleText = 'Click or drag file to upload',
    draggingText = 'Drop file to upload',
    accept = '.iso,.img,application/octet-stream',
    disabled = false,
    className = '',
    resumeFileName,
    size: initSize,
    totalBytes: initTotalBytes,
    rightSlot,
    showUploader = true,
    showInputAlways = true,
    showProgress = true,
    step,
    customUploadTrigger,
    uploaderContainerClassName = '',
  } = props

  const {
    uploadState,
    currentUploadDetail,
    fileName,
    dragging,
    inputRef,
    pickingRef,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileSelected,
  } = useUpload({ ...props, accept })

  return (
    <>
      {showProgress ? (
        <UploadProgress
          step={step}
          uploadState={uploadState}
          fileName={fileName}
          resumeFileName={resumeFileName}
          currentUploadDetail={currentUploadDetail}
          rightSlot={rightSlot}
        />
      ) : null}

      {(['idle', 'error'].includes(uploadState) && showUploader) ||
      showInputAlways ? (
        <UploadZone
          label={label}
          disabled={disabled}
          dragging={dragging}
          accept={accept}
          className={className}
          idleText={idleText}
          draggingText={draggingText}
          formatsText={formatsText}
          inputRef={inputRef}
          pickingRef={pickingRef}
          customUploadTrigger={customUploadTrigger}
          uploaderContainerClassName={uploaderContainerClassName}
          initSize={initSize}
          initTotalBytes={initTotalBytes}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelected={handleFileSelected}
        />
      ) : null}
    </>
  )
}

const UploadDropZone = memo(UploadDropZoneBase)
export default UploadDropZone
