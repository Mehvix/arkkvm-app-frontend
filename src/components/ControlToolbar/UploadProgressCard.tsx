import { Label } from '../ui/label'
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
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="radio"
            className="accent-[var(--btn-primary-bg)]"
            checked={value === 'CDROM'}
            onChange={() => onChange('CDROM')}
            disabled={disabled}
          />
          CD/DVD
        </label>
        <label className="inline-flex items-center gap-2 text-xs opacity-60">
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
  )
}
