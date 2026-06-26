/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-05 21:59:17
 * @FilePath: /git-arkkvm-app-frontend/src/components/ControlToolbar/SelectMountAs.tsx
 * @Description:
 */
/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-04-17 14:42:49
 */
import { type ReactNode } from 'react';
import { Label } from '../../ui/label';
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
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-2">
        <Label>Mount as</Label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm ">
            <input
              type="radio"
              className="accent-[var(--btn-primary-bg)]"
              checked={value === 'CDROM'}
              onChange={() => onChange('CDROM')}
              disabled={disabled}
            />
            CD/DVD
          </label>
          <label className="inline-flex items-center gap-2 text-sm ">
            <input
              type="radio"
              className="accent-[var(--btn-primary-bg)]"
              checked={value === 'Disk'}
              onChange={() => onChange('Disk')}
              disabled={disabled}
            />
            Disk
          </label>
        </div>
      </div>
      {rightSlot && (
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
