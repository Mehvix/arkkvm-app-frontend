import { IconCd, IconURL } from '@/assets/icons';
import { type JsonRpcHandle } from '@/hooks/useJsonRpc';
import { useLoadingMap } from '@/hooks/useLoading';
import { humanSize } from '@/utils/format';
import { createLogger } from '@/utils/logger';

import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SiArchlinux,
    SiDebian,
    SiFedora,
    SiOpensuse
} from 'react-icons/si';
import { Dialog } from '../../Dialog';
import EmptyState from '../../EmptyState';
import { Button } from '../../ui/button';
import ActionPanel from '../ActionPanel';
import type { PopularImageItem } from './PopularImagesList';
import SelectVirtualMediaCard from './SelectVirtualMediaCard';
import StorageMountDialog from './StorageMountDialog';
import UrlMountPanel, { type MountAs } from './UrlMountPanel';

const logger = createLogger('VirtualMedia');

interface VirtualMediaProps {
  onWake?: (device: WakeOnLANDevice) => void
  onClose?: () => void
  onDialogStateChange?: (isOpen: boolean) => void
  rpc: JsonRpcHandle
  closeInternalDialogsRef?: React.RefObject<(() => void) | null>
}

const popularImages: PopularImageItem[] = [
  // {
  //   name: 'Ubuntu 24.04 LTS',
  //   url: 'https://releases.ubuntu.com/24.04.3/ubuntu-24.04.3-desktop-amd64.iso',
  //   icon: SiUbuntu,
  // },
  {
    name: 'debian-13.4.0-amd64-DVD-1',
    url: 'https://cdimage.debian.org/debian-cd/current/amd64/iso-dvd/debian-13.4.0-amd64-DVD-1.iso',
    icon: SiDebian,
  },
  {
    name: 'Debian 12 Bookworm (old-stable)',
    url: 'https://cdimage.debian.org/mirror/cdimage/archive/12.11.0/amd64/iso-cd/debian-12.11.0-amd64-netinst.iso',
    icon: SiDebian,
  },
  {
    name: 'Fedora 41',
    url: 'https://download.fedoraproject.org/pub/fedora/linux/releases/41/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-41-1.4.iso',
    icon: SiFedora,
  },
  {
    name: 'openSUSE Leap 15.6',
    url: 'https://download.opensuse.org/distribution/leap/15.6/iso/openSUSE-Leap-15.6-NET-x86_64-Media.iso',
    icon: SiOpensuse,
  },
  {
    name: 'openSUSE Tumbleweed',
    url: 'https://download.opensuse.org/tumbleweed/iso/openSUSE-Tumbleweed-NET-x86_64-Current.iso',
    icon: SiOpensuse,
  },
  {
    name: 'Arch Linux',
    url: 'https://geo.mirror.pkgbuild.com/iso/latest/archlinux-x86_64.iso',
    icon: SiArchlinux,
  },
  {
    name: 'netboot.xyz',
    url: 'https://boot.netboot.xyz/ipxe/netboot.xyz.iso',
    icon: Globe,
    description: 'Boot and install various operating systems over network',
  },
];

const sourceOptions = [
  {
    value: 'url',
    titleKey: 'virtualMedia:sourceDialog.urlMount.label',
    descriptionKey: 'virtualMedia:sourceDialog.urlMount.description',
    badgeTextKey: 'virtualMedia:sourceDialog.urlMount.badge',
    badgeVariant: 'warning' as const,
    disabled: false,
    icon: (
      <div className="grid h-8 w-8 place-items-center rounded-[4px] border border-brand-primary text-brand-primary">
        🔗
      </div>
    ),
  },
  {
    value: 'storage',
    titleKey: 'virtualMedia:sourceDialog.storageMount.label',
    descriptionKey: 'virtualMedia:sourceDialog.storageMount.description',
    disabled: false,
    icon: (
      <div className="grid h-8 w-8 place-items-center rounded-[4px] border border-brand-primary text-brand-primary">
        🖥️
      </div>
    ),
  },
] as const;

type VMState = {
  source: 'URL' | 'Storage' | ''
  mode: 'CDROM' | 'Disk' | ''
  url?: string
  filename?: string
  size?: number | string
}

const initVirtualMediaState: VMState = {
  source: '',
  mode: '',
  url: '',
  filename: '',
  size: 0,
};

const VirtualMedia: React.FC<VirtualMediaProps> = ({
  onDialogStateChange,
  rpc,
  closeInternalDialogsRef,
}) => {
  const { t } = useTranslation('virtualMedia');
  const [send, isConnected, sendAsync] = rpc;
  const {
    is: isLoading,
    start: startLoading,
    stop: stopLoading,
    wrap,
  } = useLoadingMap(['syncState', 'mountUrl', 'unmount']);
  const [selectMediaOpen, setSelectMediaOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);

  const closeInternalDialogs = useCallback(() => {
    setSelectMediaOpen(false);
    setUrlDialogOpen(false);
    setStorageDialogOpen(false);
  }, []);

  useEffect(() => {
    if (closeInternalDialogsRef) {
      (closeInternalDialogsRef as React.MutableRefObject<(() => void) | null>).current = closeInternalDialogs;
    }
  }, [closeInternalDialogsRef, closeInternalDialogs]);

  useEffect(() => {
    if (isConnected) return;
    const timer = window.setTimeout(() => {
      closeInternalDialogs();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isConnected, closeInternalDialogs]);

  const [value, setValue] = useState('storage');
  const [virtualMediaState, setVirtualMediaState] = useState<VMState>(
    initVirtualMediaState
  );
  const syncingRef = useRef(false);
  const lastSyncAtRef = useRef(0);
  const prevConnectedRef = useRef<boolean | null>(null);

  const onDialogStateChangeRef = useRef(onDialogStateChange);
  onDialogStateChangeRef.current = onDialogStateChange;

  useEffect(() => {
    const isDialogOpen = selectMediaOpen || urlDialogOpen || storageDialogOpen;
    onDialogStateChangeRef.current?.(isDialogOpen);
  }, [selectMediaOpen, urlDialogOpen, storageDialogOpen]);

  const handleAddNewMedia = () => {
    setSelectMediaOpen(true);
  };

  const syncGetVirtualMediaState = useCallback(async () => {
    if (!isConnected) return;
    if (syncingRef.current) return;
    const now = Date.now();
    if (now - lastSyncAtRef.current < 1000) return; // throttle 1s
    lastSyncAtRef.current = now;
    syncingRef.current = true;
    const result = await wrap(
      'syncState',
      sendAsync(
        {
          method: 'getVirtualMediaState',
        },
        {
          resultOnly: true,
        }
      )
    );
    const next = result || initVirtualMediaState;
    setVirtualMediaState(prev => {
      const same = JSON.stringify(prev) === JSON.stringify(next);
      return same ? prev : next;
    });

    syncingRef.current = false;
  }, [sendAsync, isConnected, wrap]);

  // Select media
  const handleSelectMedia = useCallback(
    ({ url, mountAs }: { url: string; mountAs: MountAs }) => {
      setUrlDialogOpen(false);

      startLoading('mountUrl');
      send({
        method: 'mountWithHTTP',
        params: {
          url,
          mode: mountAs,
        },
        onResponse() {
          syncGetVirtualMediaState();

          stopLoading('mountUrl');
        },
        onError() {
          stopLoading('mountUrl');
        },
      });

      // TODO: wire real mount action here
    },
    [send, startLoading, stopLoading, syncGetVirtualMediaState]
  );

  // Unmount media
  const handleUnmountMedia = useCallback(() => {
    startLoading('unmount');
    send({
      method: 'unmountImage',
      errorMessage: { prefix: 'Failed to unmount image:' },
      successMessage: { prefix: 'Unmounted successfully' },
      onResponse() {
        syncGetVirtualMediaState();
        stopLoading('unmount');
      },
      onError() {
        stopLoading('unmount');
      },
    });
  }, [send, startLoading, stopLoading, syncGetVirtualMediaState]);

  useEffect(() => {
    // Only run when connection becomes ready or pathname actually changes
    const becameConnected = isConnected && prevConnectedRef.current !== true;
    prevConnectedRef.current = isConnected;
    if (becameConnected) {
      syncGetVirtualMediaState();
      return;
    }
    // Pathname change
    syncGetVirtualMediaState();
  }, []);

  return (
    <>
      {!selectMediaOpen && !urlDialogOpen && !storageDialogOpen && (
        <ActionPanel
          title={t('title')}
          subtitle={t('description')}
          footer={
            <>
              {Boolean(virtualMediaState.url) ||
              Boolean(virtualMediaState.filename) ? (
                <Button
                  size="sm"
                  variant="primary"
                  className="btn-primary"
                  onClick={handleUnmountMedia}
                  disabled={isLoading('unmount')}
                >
                  {t('unmountButton')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  className="btn-primary"
                  disabled={isLoading('mountUrl')}
                  loading={isLoading('mountUrl')}
                  onClick={handleAddNewMedia}
                >
                  {t('uploadButton')}
                </Button>
              )}
            </>
          }
        >
          {virtualMediaState.source === 'HTTP' && virtualMediaState.url ? (
            <EmptyState
              icon={<IconURL className="size-[28px]" />}
              title={t('virtualMedia:streamingFromUrl', 'Streaming from URL')}
              description={
                <span className="break-all text-sm">{virtualMediaState.url}</span>
              }
            />
          ) : virtualMediaState.source === 'Storage' &&
            virtualMediaState.filename ? (
            <EmptyState
              icon={<IconURL className="size-[28px]" />}
              title={t('virtualMedia:mountedFromStorage', 'Mounted from Storage')}
              description={
                <span className="block">
                  <span className="break-all text-sm font-medium block">
                    {virtualMediaState.filename}
                  </span>
                  <span className="text-sm text-gray-500 block mt-1">
                    {virtualMediaState.mode || 'CDROM'}
                    {virtualMediaState.size &&
                      ` • ${humanSize(Number(virtualMediaState.size))}`}
                  </span>
                </span>
              }
            />
          ) : (
            <EmptyState
              icon={<IconCd className="size-[32]" />}
              title={t('virtualMedia:noMedia')}
              description={t('virtualMedia:addFilePrompt')}
            />
          )}
        </ActionPanel>
      )}
      {/* Dialog 1: Source selection */}
      <Dialog
        title={t('virtualMedia:sourceDialog.title')}
        description={t('virtualMedia:sourceDialog.description')}
        className="z-[200]"
        contentClassName="z-[200]"
        width="500px"
        open={selectMediaOpen}
        onCancel={() => setSelectMediaOpen(false)}
        onConfirm={() => {
          if (value === 'url') {
            setSelectMediaOpen(false);
            setUrlDialogOpen(true);
          }
          if (value === 'storage') {
            setSelectMediaOpen(false);
            setStorageDialogOpen(true);
          }
          // TODO: storage flow -> open another dialog when ready
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sourceOptions.map(opt => (
            <SelectVirtualMediaCard
              className="flex-1"
              key={opt.value}
              name="mountType"
              value={opt.value}
              checked={value === opt.value}
              onChange={v => setValue(v as typeof value)}
              icon={opt.icon}
              badgeText={opt.badgeTextKey ? t(opt.badgeTextKey) : undefined}
              badgeVariant={opt.badgeVariant}
              title={opt.titleKey ? t(opt.titleKey) : ''}
              description={opt.descriptionKey ? t(opt.descriptionKey) : ''}
              disabled={opt.disabled}
            />
          ))}
        </div>
      </Dialog>

      {/* Dialog 2: URL mount (no footer buttons) */}
      <Dialog
        confirmText={t('mountUrlButton')}
        cancelText={t('backButton')}
        title={t('urlDialogTitle')}
        description={t('urlDialogDesc')}
        contentClassName="z-[200]"
        width="600px"
        open={urlDialogOpen}
        footerSlot={
          <div className="flex items-center justify-end gap-2 pb-[var(--spacing-base)]">
            <Button
              onClick={() => {
                setUrlDialogOpen(false);
                setSelectMediaOpen(true);
              }}
            >
              {t('backButton')}
            </Button>
          </div>
        }
      >
        <UrlMountPanel
          items={popularImages}
          defaultMountAs={'CDROM' as MountAs}
          onBack={() => {
            setUrlDialogOpen(false);
            setSelectMediaOpen(true);
          }}
          onSubmitMount={handleSelectMedia}
          submitting={isLoading('mountUrl')}
          onSelect={url => {
            logger.info('URL selected', { url });
          }}
        />
      </Dialog>

      {/* Dialog 3: Storage mount */}
      <StorageMountDialog
        open={storageDialogOpen}
        onOpenChange={setStorageDialogOpen}
        onBack={() => {
          setStorageDialogOpen(false);
          setSelectMediaOpen(true);
        }}
        onMounted={() => {
          // refresh when mounted via storage
          syncGetVirtualMediaState();
        }}
        rpc={rpc}
      />
    </>
  );
};

export default VirtualMedia;
