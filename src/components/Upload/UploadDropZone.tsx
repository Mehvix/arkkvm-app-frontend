/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 20:52:14
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-04-09 17:24:35
 */
/**
 * UploadDropZone — main upload component.
 *
 * Orchestrates the upload hook with progress display and drop zone UI.
 * Supports both WebRTC DataChannel and HTTP upload transports.
 */
import { forwardRef, memo, useImperativeHandle } from 'react';

import type { UploadDropZoneProps } from './types';
import UploadProgress from './UploadProgress';
import UploadZone from './UploadZone';
import { useUpload } from './useUpload';

export interface UploadDropZoneRef {
  cancelUpload: (fileName?: string) => void;
  /** Resume a persisted upload task by id. */
  resumeUpload: (taskId: string) => Promise<void>;
  /** Open the native file picker (fallback when FSA resume is unavailable). */
  openFilePicker: () => void;
}

function UploadDropZoneBase(props: UploadDropZoneProps, ref: React.Ref<UploadDropZoneRef>) {
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
    beforeUpload,
  } = props;

  const {
    uploadState,
    currentUploadDetail,
    fileName,
    dragging,
    inputRef,
    pickingRef,
    cancelUpload,
    handleUploadStart,
    resumeUpload,
    openFilePicker,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileSelected,
  } = useUpload({ ...props, accept, beforeUpload });

  useImperativeHandle(ref, () => ({
    cancelUpload: () => cancelUpload(),
    resumeUpload: (taskId: string) => resumeUpload(taskId),
    openFilePicker: () => openFilePicker(),
  }));

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

      {(['idle', 'failed'].includes(uploadState) && showUploader) ||
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
          onFilePicked={handleUploadStart}
        />
      ) : null}
    </>
  );
}

const UploadDropZone = memo(forwardRef(UploadDropZoneBase));
export default UploadDropZone;
