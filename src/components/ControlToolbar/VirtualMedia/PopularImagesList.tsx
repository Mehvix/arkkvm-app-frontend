/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-14 17:26:41
 * @FilePath: /git-arkkvm-app-frontend/src/components/ControlToolbar/VirtualMedia/PopularImagesList.tsx
 * @Description:
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Copy, Globe, HelpCircle, Monitor, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  SiAlpinelinux,
  SiArchlinux,
  SiCentos,
  SiDebian,
  SiFedora,
  SiFreebsd,
  SiKalilinux,
  SiLinuxmint,
  SiOpensuse,
  SiRockylinux,
  SiUbuntu,
} from 'react-icons/si';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { IconCDDVD, IconDisk } from '@/assets/icons';
import { useConfirmDialog } from '../../ui/confirm-dialog';
import EmptyState from '../../EmptyState';

export type PresetViewMode = 'list' | 'create' | 'edit'

type VirtualMediaImageValidationError =
  | 'nameRequired'
  | 'urlRequired'
  | 'urlInvalid'
  | 'urlUnsupportedFormat'
  | 'nameDuplicate'
  | 'urlDuplicate'
  | 'maxItemsLimit'

type VirtualMediaImageValidationErrors = {
  name?: Extract<VirtualMediaImageValidationError, 'nameRequired' | 'nameDuplicate' | 'maxItemsLimit'>
  url?: Extract<
    VirtualMediaImageValidationError,
    'urlRequired' | 'urlInvalid' | 'urlUnsupportedFormat' | 'urlDuplicate'
  >
}

export const MAX_ITEMS = 20;

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  'iso',
  'cue',
  'mds',
  'nrg',
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

export type PopularImageItem = {
  name: string
  url: string
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  iconKey?: string
  description?: string
  descriptionKey?: string
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, '').toLowerCase();
}

function validateVirtualMediaImageUrl(
  value: string
): VirtualMediaImageValidationErrors['url'] {
  const trimmed = value.trim();
  if (!trimmed) return 'urlRequired';

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'urlInvalid';

    const extension = url.pathname.toLowerCase().split('.').pop();
    if (!extension || !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      return 'urlUnsupportedFormat';
    }
  } catch {
    return 'urlInvalid';
  }

  return undefined;
}

function validateVirtualMediaImageForm(
  form: Pick<PopularImageItem, 'name' | 'url'>,
  currentList: PopularImageItem[]
): VirtualMediaImageValidationErrors {
  const normalizedName = normalizeName(form.name);
  const normalizedUrl = normalizeUrl(form.url);
  const errors: VirtualMediaImageValidationErrors = {};

  if (!normalizedName) {
    errors.name = 'nameRequired';
  } else if (currentList.some(item => normalizeName(item.name) === normalizedName)) {
    errors.name = 'nameDuplicate';
  }

  errors.url = validateVirtualMediaImageUrl(form.url);
  if (normalizedUrl) {
    if (
      !errors.url &&
      currentList.some(item => normalizeUrl(item.url) === normalizedUrl)
    ) {
      errors.url = 'urlDuplicate';
    }
  }

  return errors;
}

type PresetIcon = {
  key: string
  label: string
  Component: React.ComponentType<{ className?: string }>
}

const PRESET_ICONS: PresetIcon[] = [
  { key: 'debian',    label: 'Debian',      Component: SiDebian },
  { key: 'ubuntu',    label: 'Ubuntu',      Component: SiUbuntu },
  { key: 'fedora',    label: 'Fedora',      Component: SiFedora },
  { key: 'opensuse',  label: 'openSUSE',    Component: SiOpensuse },
  { key: 'arch',      label: 'Arch Linux',  Component: SiArchlinux },
  { key: 'centos',    label: 'CentOS',      Component: SiCentos },
  { key: 'alpine',    label: 'Alpine',      Component: SiAlpinelinux },
  { key: 'rocky',     label: 'Rocky',       Component: SiRockylinux },
  { key: 'kali',      label: 'Kali',        Component: SiKalilinux },
  { key: 'mint',      label: 'Mint',        Component: SiLinuxmint },
  { key: 'freebsd',   label: 'FreeBSD',     Component: SiFreebsd },
  { key: 'windows',   label: 'Windows',     Component: Monitor as React.ComponentType<{ className?: string }> },
  { key: 'globe',     label: 'Globe',       Component: Globe as React.ComponentType<{ className?: string }> },
  { key: 'generic',   label: 'Generic',     Component: HelpCircle as React.ComponentType<{ className?: string }> },
];

export function getPresetIconComponent(key: string | undefined): React.ComponentType<{ className?: string }> | undefined {
  return PRESET_ICONS.find(p => p.key === key)?.Component;
}

export function getPresetIconKey(component: unknown): string | undefined {
  return PRESET_ICONS.find(p => p.Component === component)?.key;
}

export default function PopularImagesList({
  items,
  onSelectImage,
  selectedUrl,
  onEditImage,
  onDeleteImage,
  onMountImage,
  onAddImage,
  viewMode,
  onViewModeChange,
  title,
  className = '',
}: {
  items: PopularImageItem[]
  onSelectImage: (url: string) => void
  selectedUrl?: string
  onEditImage?: (oldItem: PopularImageItem, newItem: PopularImageItem) => void
  onDeleteImage?: (item: PopularImageItem) => void
  onMountImage?: (payload: { url: string; mountAs: 'CDROM' | 'Disk' }) => void
  onAddImage?: (item: PopularImageItem) => void
  viewMode: PresetViewMode
  onViewModeChange: (mode: PresetViewMode) => void
  title?: string
  className?: string
}) {
  const { t } = useTranslation('virtualMedia');
  const { confirm } = useConfirmDialog();
  const [editingItem, setEditingItem] = useState<PopularImageItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIconKey, setEditIconKey] = useState<string>('generic');
  const [editUrlError, setEditUrlError] =
    useState<VirtualMediaImageValidationErrors['url']>();
  const [editNameError, setEditNameError] =
    useState<VirtualMediaImageValidationErrors['name']>();
  const [addName, setAddName] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addIconKey, setAddIconKey] = useState<string>('generic');
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);
  const [addValidationErrors, setAddValidationErrors] =
    useState<VirtualMediaImageValidationErrors>({});

  const renderIcon = (icon: PopularImageItem['icon'], iconKey?: string) => {
    const resolvedIcon = icon ?? getPresetIconComponent(iconKey);
    if (!resolvedIcon) return <span>🖼️</span>;

    if (React.isValidElement(resolvedIcon)) return resolvedIcon;

    if (
      typeof resolvedIcon === 'function' ||
      (typeof resolvedIcon === 'object' &&
        resolvedIcon !== null &&
        '$$typeof' in (resolvedIcon as unknown as Record<string, unknown>) &&
        'render' in (resolvedIcon as unknown as Record<string, unknown>))
    ) {
      return React.createElement(resolvedIcon as React.ComponentType<{ className?: string }>, {
        className: 'size-5',
      });
    }

    return <>{resolvedIcon as React.ReactNode}</>;
  };

  const openEdit = (e: React.MouseEvent, item: PopularImageItem) => {
    e.stopPropagation();
    setEditName(item.name);
    setEditUrl(item.url);
    const resolvedKey =
      item.iconKey ??
      getPresetIconKey(item.icon) ??
      'generic';
    setEditIconKey(resolvedKey);
    setEditUrlError(undefined);
    setEditNameError(undefined);
    setEditingItem(item);
    onViewModeChange('edit');
  };

  const handleDelete = (e: React.MouseEvent, item: PopularImageItem) => {
    e.stopPropagation();
    confirm({
      title: t('urlMount.deleteConfirmTitle'),
      content: t('urlMount.deleteConfirmDesc', { name: item.name }),
      type: 'error',
      confirmText: t('urlMount.deleteConfirmButton'),
      cancelText: t('urlMount.cancelButton'),
      onConfirm: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onDeleteImage?.(item);
      },
    });
  };


  const handleEditConfirm = () => {
    if (!editingItem) return;

    // Validate both name and url, excluding current item from duplicate checks
    const otherItems = items.filter(item => item.name !== editingItem.name);
    const formErrors = validateVirtualMediaImageForm(
      { name: editName, url: editUrl },
      otherItems
    );
    setEditNameError(formErrors.name);
    setEditUrlError(formErrors.url);

    if (formErrors.name || formErrors.url) {
      return;
    }

    const IconComp = getPresetIconComponent(editIconKey);
    onEditImage?.(editingItem, {
      ...editingItem,
      name: editName,
      url: editUrl,
      iconKey: editIconKey,
      icon: IconComp,
    });
    setEditingItem(null);
    onViewModeChange('list');
  };

  useEffect(() => {
    if (viewMode !== 'create') return;
    setAddName('');
    setAddUrl('');
    setAddIconKey('generic');
    setAddValidationErrors({});
  }, [viewMode]);

  const validateNameOnBlur = (name: string, isEdit: boolean) => {
    if (isEdit) {
      // Validate name (check for duplicates excluding current item)
      const nameErrors = validateVirtualMediaImageForm(
        { name, url: '' },
        items.filter(item => item.name !== editingItem?.name)
      );
      setEditNameError(nameErrors.name);
    } else {
      // Check maximum items limit and validate name for add form
      const errors = validateVirtualMediaImageForm({ name, url: '' }, items);

      if (items.length >= MAX_ITEMS) {
        setAddValidationErrors({ name: 'maxItemsLimit' });
      } else if (errors.name) {
        setAddValidationErrors({ name: errors.name });
      } else {
        setAddValidationErrors(current => ({ ...current, name: undefined }));
      }
    }
  };

  const handleAddConfirm = () => {
    const errors = validateVirtualMediaImageForm({ name: addName, url: addUrl }, items);

    // Check maximum items limit
    if (items.length >= MAX_ITEMS) {
      setAddValidationErrors({ ...errors, name: errors.name || 'maxItemsLimit' });
      return;
    }

    if (errors.name || errors.url) {
      setAddValidationErrors(errors);
      return;
    }

    const IconComp = getPresetIconComponent(addIconKey);
    onAddImage?.({
      name: addName.trim(),
      url: addUrl.trim(),
      iconKey: addIconKey,
      icon: IconComp,
    });
    onViewModeChange('list');
  };

  const isEditing = viewMode === 'edit';
  const formName = isEditing ? editName : addName;
  const formUrl = isEditing ? editUrl : addUrl;
  const formIconKey = isEditing ? editIconKey : addIconKey;
  const setFormName = isEditing ? setEditName : setAddName;
  const setFormUrl = isEditing ? setEditUrl : setAddUrl;
  const setFormIconKey = isEditing ? setEditIconKey : setAddIconKey;
  const addNameError = addValidationErrors.name
    ? t(`urlMount.validation.${addValidationErrors.name}`)
    : null;
  const addUrlError = addValidationErrors.url
    ? t(`urlMount.validation.${addValidationErrors.url}`)
    : null;
  const formUrlError = isEditing
    ? editUrlError
      ? t(`urlMount.validation.${editUrlError}`)
      : null
    : addUrlError;
  const closeForm = () => {
    setEditingItem(null);
    onViewModeChange('list');
  };

  if (viewMode !== 'list') {
    return (
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-base font-semibold">
            {t(isEditing ? 'urlMount.editDialogTitle' : 'urlMount.addDialogTitle')}
          </h3>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {t(isEditing ? 'urlMount.editDialogDesc' : 'urlMount.addDialogDesc')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('urlMount.editIconLabel')}</label>
              <div>
                <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="mini"
                      className="h-12 w-12 p-0 border border-(--border-color) bg-transparent hover:bg-(--bg-secondary)"
                      data-kvm-ignore="true"
                    >
                      {(() => {
                        const preset = PRESET_ICONS.find(p => p.key === formIconKey);
                        if (!preset) return null;
                        const IconComponent = preset.Component;
                        return <IconComponent className="size-4 shrink-0" />;
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2 z-220">
                    <div className="grid grid-cols-4 gap-1">
                      {PRESET_ICONS.map(preset => {
                        const IconComponent = preset.Component;
                        const isSelected = preset.key === formIconKey;
                        return (
                          <Button
                            key={preset.key}
                            variant="ghost"
                            size="mini"
                            className={cn(
                              'h-9 w-9 p-0',
                              isSelected && 'bg-(--bg-secondary) text-(--btn-primary-bg)'
                            )}
                            onClick={() => {
                              setFormIconKey(preset.key);
                              setIconPopoverOpen(false);
                            }}
                            title={preset.label}
                          >
                            <IconComponent className="size-4 shrink-0" />
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="relative space-y-1.5 flex-1 pb-[20px]">
                <label className="text-sm font-medium">{t('urlMount.editNameLabel')}</label>
                <Input
                  value={formName}
                  aria-invalid={Boolean(isEditing ? editNameError : addNameError)}
                  onChange={e => {
                    setFormName(e.target.value);
                    if (isEditing) {
                      setEditNameError(undefined);
                    } else {
                      setAddValidationErrors(current => ({ ...current, name: undefined }));
                    }
                  }}
                  onBlur={() => validateNameOnBlur(formName, isEditing)}
                />
                {isEditing && editNameError && (
                  <p className="absolute left-0  bottom-0 w-full truncate text-sm leading-4 text-red-500">{t(`virtualMedia:errors.${editNameError}`)}</p>
                )}
                {!isEditing && addNameError && (
                  <p className="absolute left-0  bottom-0 w-full truncate text-sm leading-4 text-red-500">{addNameError}</p>
                )}
              </div>
              <div className="relative space-y-1.5 pb-[20px]">
                <label className="text-sm font-medium">{t('urlMount.imageUrlLabel')}</label>
                <Input
                  value={formUrl}
                  aria-invalid={Boolean(formUrlError)}
                  onChange={e => {
                    setFormUrl(e.target.value);
                    if (isEditing) {
                      setEditUrlError(undefined);
                    } else {
                      setAddValidationErrors(current => ({ ...current, url: undefined }));
                    }
                  }}
                  placeholder="https://example.com/image.iso"
                />
                {formUrlError && (
                  <p className="absolute left-0  bottom-0 w-full truncate text-sm leading-4 text-red-500">{formUrlError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={closeForm}>{t('urlMount.cancelButton')}</Button>
          <Button variant="primary" onClick={isEditing ? handleEditConfirm : handleAddConfirm}>
            {t('urlMount.editConfirmButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {title && (
        <div className="mb-2">
          <span className="text-sm font-medium">{title}</span>
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          size="sm"
          title={t('urlMount.emptyTitle')}
          description={t('urlMount.emptyDescription')}
          className="mt-0!"
        />
      ) : (
        <div
          className={
            'overflow-hidden rounded-[8px] border border-(--border-color) divide-y divide-(--border-color) ' +
            className
          }
        >
          {items.map(img => {
            const isSelected = selectedUrl === img.url;
            return (
            <div
              key={img.url}
              className={[
                'group flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                isSelected
                  ? 'bg-(--btn-primary-bg)/15 ring-1 ring-inset ring-(--btn-primary-bg)/40'
                  : 'hover:bg-(--bg-secondary)',
              ].join(' ')}
              onClick={() => onSelectImage(img.url)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* icon */}
                <div className="shrink-0 grid place-items-center size-8 rounded-[6px] border border-(--border-color) bg-surface-800">
                  {renderIcon(img.icon, img.iconKey)}
                </div>

                {/* text */}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{img.name}</div>
                  <div className="text-xs text-(--text-secondary) truncate">{img.url}</div>
                  {(img.descriptionKey ? t(img.descriptionKey) : img.description) ? (
                    <div className="text-xs text-(--text-secondary) truncate">
                      {img.descriptionKey ? t(img.descriptionKey) : img.description}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* more actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="mini"
                    className="h-7 w-7 shrink-0 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-210">
                  <DropdownMenuItem onClick={e => openEdit(e, img)}>
                    <Pencil className="size-4" />
                    {t('urlMount.editButton')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={e => handleDelete(e, img)}
                  >
                    <Trash2 className="size-4" />
                    {t('urlMount.deleteButton')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={e => {
                    e.stopPropagation();
                    if (window.isSecureContext && navigator.clipboard?.writeText) {
                      void navigator.clipboard.writeText(img.url);
                    } else {
                      // Defer to next task so Radix DropdownMenu fully closes and
                      // releases its focus trap before we attempt execCommand.
                      const urlToCopy = img.url;
                      setTimeout(() => {
                        const input = document.createElement('input');
                        input.setAttribute('readonly', '');
                        input.value = urlToCopy;
                        input.style.cssText =
                          'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
                        document.body.appendChild(input);
                        input.focus({ preventScroll: true });
                        input.select();
                        input.setSelectionRange(0, urlToCopy.length);
                        document.execCommand('copy');
                        document.body.removeChild(input);
                      }, 0);
                    }
                  }}>
                    <Copy className="size-4" />
                    {t('urlMount.copyButton')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onMountImage?.({ url: img.url, mountAs: 'CDROM' });
                    }}
                  >
                    <IconCDDVD className="size-4" />
                    {t('urlMount.mountAsCdDvd')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onMountImage?.({ url: img.url, mountAs: 'Disk' });
                    }}
                  >
                    <IconDisk className="size-4" />
                    {t('urlMount.mountAsDisk')}
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            );
          })}
        </div>
      )}

    </>
  );
}
