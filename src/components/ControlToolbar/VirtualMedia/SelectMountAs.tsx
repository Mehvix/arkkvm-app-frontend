/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-04-17 14:42:49
 */
import { type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '../../ui/label';
import type { StorageMountAs } from './StorageMountDialog';
interface SelectMountAsProps {
  onChange: (as: StorageMountAs) => void
  value: StorageMountAs
  disabled?: boolean
  rightSlot?: ReactNode
}
export default function SelectMountAs({
  onChange,
  value,
  disabled,
  rightSlot,
}: SelectMountAsProps): JSX.Element {
  const { t } = useTranslation('virtualMedia');
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-2">
        <Label>{t('urlMount.mountAs')}</Label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm ">
            <input
              type="radio"
              className="accent-(--btn-primary-bg)"
              checked={value === 'CDROM'}
              onChange={() => onChange('CDROM')}
              disabled={disabled}
            />
            {t('urlMount.cdDvd')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm ">
            <input
              type="radio"
              className="accent-(--btn-primary-bg)"
              checked={value === 'Disk'}
              onChange={() => onChange('Disk')}
              disabled={disabled}
            />
            {t('urlMount.disk')}
          </label>
        </div>
      </div>
      {rightSlot && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
