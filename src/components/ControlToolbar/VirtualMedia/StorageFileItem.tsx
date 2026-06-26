/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-04-02 11:48:56
 */
import { humanSize } from '@/utils/format';
import { memo } from 'react';
import { Button } from '../../ui/button';

export interface StorageFile {
  filename: string
  size: number
  incomplete?: boolean
  state?: string
}

export interface StorageFileItemProps {
  file: StorageFile
  selected?: boolean
  onSelect?: (file: StorageFile) => void
  onContinueUpload?: (filename: string) => void
  onDelete?: (file: StorageFile) => void
}

const StorageFileItem = memo(function StorageFileItem({
  file,
  selected = false,
  onSelect,
  onContinueUpload,
  onDelete,
}: StorageFileItemProps) {
  const baseName = (file.filename || '').replace(/\.incomplete$/, '');
  const rowClass = [
    'group flex items-center justify-between p-3 rounded cursor-pointer ring-1 ring-transparent transition-colors duration-200 ease-out hover:bg-[var(--btn-primary-bg)]/20 hover:ring-[var(--btn-primary-bg)]',
    selected && !file.incomplete
      ? 'bg-[var(--btn-primary-bg)]/20 ring-1 ring-[var(--btn-primary-bg)]'
      : selected
        ? 'bg-white/5'
        : '',
    file.incomplete ? 'cursor-pointer' : 'cursor-default',
  ]
    .filter(Boolean)
    .join(' ');

  const handleRowClick = () => {
    if (onSelect) onSelect(file);
  };

  return (
    <div className={rowClass} onClick={handleRowClick}>
      <div className="min-w-0">
        <div className="font-medium truncate max-w-[420px]">{baseName}</div>
        <div className="text-sm ">{humanSize(file.size)}</div>
      </div>
      <div className="flex items-center gap-2">

        <Button
          className="opacity-0 translate-x-1 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-x-0 group-focus-within:scale-100 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto will-change-[opacity,transform]"
          variant="primary"
          status="danger"
          size="mini"
          onClick={e => {
            e.stopPropagation();
            if (onDelete) onDelete(file);
          }}
        >
          Delete
        </Button>

        {file.incomplete ? (
          <Button
            size="mini"
            onClick={e => {
              e.stopPropagation();
              if (onContinueUpload) onContinueUpload(file.filename);
            }}
          >
            Continue uploading
          </Button>
        ) : null}

        {!file.incomplete ? (
          <Button
            className="w-[60px]"
            variant="default"
            size="mini"
            onClick={e => {
              e.stopPropagation();
              if (onSelect) onSelect(file);
            }}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        ) : null}
      </div>
    </div>
  );
});

export default StorageFileItem;
