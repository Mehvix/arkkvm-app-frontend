import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import PopularImagesList, {
  type PopularImageItem,
  type PresetViewMode,
} from './PopularImagesList';
import SelectMountAs from './SelectMountAs';

export type MountAs = 'CDROM' | 'Disk'

const CDROM_EXTENSIONS = new Set(['iso', 'cue', 'mds', 'nrg']);
const DISK_EXTENSIONS = new Set([
  'img',
  'qcow',
  'qcow2',
  'vhd',
  'vhdx',
  'vmdk',
  'raw',
  'dd',
  'dmg',
]);

export default function UrlMountPanel({
  items,
  defaultMountAs = 'CDROM',
  defaultUrl = '',
  onSubmitMount,
  onSelect,
  submitting = false,
  onAddImage,
  onEditImage,
  onDeleteImage,
  presetViewMode,
  onPresetViewModeChange,
}: {
  items: PopularImageItem[]
  defaultMountAs?: MountAs
  defaultUrl?: string
  onBack: () => void
  onSubmitMount: (payload: { url: string; mountAs: MountAs }) => void
  onSelect?: (url: string) => void
  submitting?: boolean
  onAddImage?: (item: PopularImageItem) => void
  onEditImage?: (oldItem: PopularImageItem, newItem: PopularImageItem) => void
  onDeleteImage?: (item: PopularImageItem) => void
  presetViewMode: PresetViewMode
  onPresetViewModeChange: (mode: PresetViewMode) => void
}) {
  const { t } = useTranslation('virtualMedia');
  const [mountAs, setMountAs] = useState<MountAs>(defaultMountAs);
  const [url, setUrl] = useState<string>(defaultUrl);

  const inferMountAsByUrlSuffix = useCallback((rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return 'CDROM';

    try {
      const pathname = new URL(trimmed).pathname.toLowerCase();
      const suffix = pathname.split('.').pop();
      if (!suffix) return;

      if (CDROM_EXTENSIONS.has(suffix)) {
        setMountAs('CDROM');
        return;
      }

      if (DISK_EXTENSIONS.has(suffix)) {
        setMountAs('Disk');
      }
    } catch {
      // ignore invalid URL; validation is handled by isValidUrl
    }
  }, []);

  const isValidUrl = useMemo(() => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }, [url]);

  return (
    <div className="space-y-4">
      {presetViewMode === 'list' && (
        <>
          {/* Image URL */}
          <div className="flex items-end gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="imageUrl">{t('urlMount.imageUrlLabel')}</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.iso"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={e => inferMountAsByUrlSuffix(e.target.value)}
              />
            </div>

            <Button
              className="shrink-0"
              variant="primary"
              onClick={() => onSubmitMount({ url: url.trim(), mountAs })}
              disabled={!isValidUrl || submitting}
            >
              {t('urlMount.mountUrlButton')}
            </Button>
          </div>

          {/* Mount as */}
          <SelectMountAs value={mountAs} onChange={setMountAs} />
        </>
      )}
      {/* Popular images */}
      <div className="pt-2">
        <PopularImagesList
          items={items}
          viewMode={presetViewMode}
          onViewModeChange={onPresetViewModeChange}
          title={t('urlMount.popularImages')}
          selectedUrl={url}
          onSelectImage={u => {
            setUrl(u);
            onSelect?.(u);
            inferMountAsByUrlSuffix(u);
          }}
          onMountImage={({ url, mountAs }) => onSubmitMount({ url: url.trim(), mountAs })}
          onAddImage={onAddImage}
          onEditImage={onEditImage}
          onDeleteImage={onDeleteImage}
        />
      </div>
    </div>
  );
}
