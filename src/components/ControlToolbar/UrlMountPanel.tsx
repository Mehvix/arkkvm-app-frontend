import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import PopularImagesList, { PopularImageItem } from './PopularImagesList'
import SelectMountAs from './SelectMountAs'

export type MountAs = 'CDROM' | 'Disk'

export default function UrlMountPanel({
  items,
  defaultMountAs = 'CDROM',
  defaultUrl = '',
  onBack,
  onSubmitMount,
  onSelect,
  submitting = false,
}: {
  items: PopularImageItem[]
  defaultMountAs?: MountAs
  defaultUrl?: string
  onBack: () => void
  onSubmitMount: (payload: { url: string; mountAs: MountAs }) => void
  onSelect?: (url: string) => void
  submitting?: boolean
}) {
  const [mountAs, setMountAs] = useState<MountAs>(defaultMountAs)
  const [url, setUrl] = useState<string>(defaultUrl)

  const isValidUrl = useMemo(() => {
    try {
      const u = new URL(url)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, [url])

  return (
    <div className="space-y-4">
      {/* Image URL */}
      <div className="flex items-end gap-2">
        <div className="space-y-2 flex-1">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            placeholder="https://example.com/image.iso"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <Button
          className="shrink-0"
          variant="primary"
          onClick={() => onSubmitMount({ url: url.trim(), mountAs })}
          disabled={!isValidUrl || submitting}
        >
          Mount URL
        </Button>
      </div>

      {/* Mount as */}
      <SelectMountAs value={mountAs} onChange={setMountAs}></SelectMountAs>
      {/* Popular images */}
      <div className="pt-2">
        <div className="text-sm font-medium mb-2">Popular images</div>
        <PopularImagesList
          items={items}
          onSelectImage={u => {
            setUrl(u)
            onSelect?.(u)
          }}
        />
      </div>
    </div>
  )
}
