/**
 * Upload drop zone / custom trigger sub-component.
 *
 * Renders either:
 * - A custom trigger element (e.g., Button) with drag support
 * - A default styled drop zone with idle/dragging hints
 */
import type {
  FilePickerAcceptType,
  PersistedFileSystemFileHandle,
} from '@/utils/uploadIndexedDb';
import { isFileSystemAccessSupported } from '@/utils/uploadIndexedDb';
import React, { useCallback } from 'react';
import { Label } from '../ui/label';

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
  /** Called when a file is picked via the File System Access API. */
  onFilePicked?: (
    file: File,
    handle?: PersistedFileSystemFileHandle
  ) => void
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
  initSize: _initSize,
  initTotalBytes: _initTotalBytes,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelected,
  onFilePicked,
}: UploadZoneProps) {
  const buildPickerTypes = useCallback((): FilePickerAcceptType[] => {
    if (!accept || accept === '*') return [];
    const types: FilePickerAcceptType[] = [];
    const extensions: string[] = [];
    const mimeTypes: string[] = [];
    accept.split(',').forEach(token => {
      const t = token.trim().toLowerCase();
      if (!t) return;
      if (t.startsWith('.')) {
        extensions.push(t);
      } else if (t.includes('/')) {
        mimeTypes.push(t);
      }
    });
    if (extensions.length) {
      types.push({
        description: 'Allowed files',
        accept: { 'application/octet-stream': extensions },
      });
    }
    mimeTypes.forEach(mime => {
      types.push({ description: 'Allowed files', accept: { [mime]: [] } });
    });
    return types;
  }, [accept]);

  const openPicker = async () => {
    if (disabled) return;
    if (pickingRef.current) return;
    pickingRef.current = true;

    // Prefer the File System Access API when available so we can persist the
    // file handle for resumable uploads. Fall back to the native input.
    if (onFilePicked && isFileSystemAccessSupported()) {
      try {
        const showPicker = (
          window as unknown as {
            showOpenFilePicker?: (
              options?: Record<string, unknown>
            ) => Promise<FileSystemFileHandle[]>;
          }
        ).showOpenFilePicker;
        if (!showPicker) throw new Error('showOpenFilePicker not available');
        const handles = await showPicker({
          multiple: true,
          types: buildPickerTypes(),
        });
        pickingRef.current = false;
        for (const handle of handles) {
          const file = await handle.getFile();
          onFilePicked(
            file,
            handle as unknown as PersistedFileSystemFileHandle
          );
        }
        return;
      } catch (e: unknown) {
        // AbortError means the user cancelled the picker — keep the fallback
        // input closed in that case.
        if (e instanceof DOMException && e.name === 'AbortError') {
          pickingRef.current = false;
          return;
        }
        // For any other error, fall through to the native input picker.
      }
    }
    inputRef.current?.click();
  };

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
          <div onClick={openPicker}>
            {customUploadTrigger}
          </div>
        </div>
      ) : (
        // Default upload box mode
        <div
          className={
            'mt-2 relative rounded-md p-6 text-center overflow-hidden transition-colors border ' +
            `${dragging ? 'border-(--btn-primary-bg) bg-(--btn-primary-bg)/5' : 'border-(--border-color)'} ` +
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

            <div className="text-sm">
              {dragging ? draggingText : idleText}
            </div>
            <div className="text-sm  mt-2 text-(--text-secondary)">{formatsText}</div>

          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(UploadZone);
