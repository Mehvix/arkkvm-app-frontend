/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-05 22:01:16
 * @FilePath: /git-arkkvm-app-frontend/src/components/ControlToolbar/VirtualMedia/UploadProgressCard.tsx
 * @Description:
 */
import { Label } from '../../ui/label';
interface UploadProgressCardProps {
  onChange: (as: StorageMountAs) => void
  value: StorageMountAs
  disabled?: boolean
}
export default function UploadProgressCard({
  onChange,
  value,
  disabled,
}: UploadProgressCardProps): JSX.Element {
  return (
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
        <label className="inline-flex items-center gap-2 text-sm opacity-60">
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
  );
}
