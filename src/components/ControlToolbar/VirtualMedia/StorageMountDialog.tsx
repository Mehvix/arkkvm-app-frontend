import { IconCd } from '@/assets/icons';
import { type JsonRpcHandle } from '@/hooks/useJsonRpc';
import { useLoadingMap } from '@/hooks/useLoading';
import { useAppStore } from '@/stores';
import { env } from '@/utils';
import { humanSize } from '@/utils/format';
import { mergeUploadLists } from '@/utils/transfer';
import { Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog } from '../../Dialog';
import StorageUsage from '../../StorageUsage';
import TransferList from '../../TransferList';
import { Button } from '../../ui/button';
import { useConfirmDialog } from '../../ui/confirm-dialog';
import { LoadingOverlay } from '../../ui/LoadingOverlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import UploadDropZone from '../../Upload';
import { pausedFiles, releaseUploadLock, removeFromQueue } from '../../Upload/uploadLock';
import SelectMountAs from './SelectMountAs';
import StorageFileItem from './StorageFileItem';
import { inferMountAsByUrlSuffix } from './utils';

export type StorageMountAs = 'CDROM' | 'Disk'

interface StorageFileItem {
  filename: string
  size: number
  modifiedAt?: number
  incomplete?: boolean
  state?: string
  showFileName?: string
  showUploader?: boolean
  showPause?: boolean
  totalBytes?: number
}

interface StorageSpaceInfo {
  total: number // bytes
  used: number // bytes
}

interface StorageMountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onMounted?: (payload: { filename: string; mountAs: StorageMountAs }) => void
  rpc?: JsonRpcHandle
}

const normalizeSpace = (raw: unknown): StorageSpaceInfo | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const toNum = (v: unknown) => {
    if (v == null) return undefined;
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  };
  // New rule: if bytesUsed and bytesFree are provided, derive total/used from them
  const bytesUsed = toNum(r.bytesUsed);
  const bytesFree = toNum(r.bytesFree);
  const hasBytesUF = bytesUsed != null && bytesFree != null;

  const total = hasBytesUF
    ? (bytesUsed as number) + (bytesFree as number)
    : (toNum(r.total) ??
      toNum(r.totalBytes) ??
      toNum(r.capacity) ??
      toNum(r.size));
  const used = hasBytesUF
    ? (bytesUsed as number)
    : (toNum(r.used) ??
      toNum(r.usedBytes) ??
      (total != null && (toNum(r.free) ?? toNum(r.freeBytes)) != null
        ? (total as number) - (toNum(r.free) ?? toNum(r.freeBytes))!
        : undefined));
  if (total != null && used != null) {
    return {
      total: Math.max(0, total),
      used: Math.max(0, Math.min(total, used)),
    };
  }
  return null;
};

const StorageMountDialog: React.FC<StorageMountDialogProps> = ({
  open,
  onOpenChange,
  onBack,
  onMounted,
  rpc,
}: StorageMountDialogProps) => {
  const { t } = useTranslation('virtualMedia');
  const [storageTab, setStorageTab] = useState<'Available' | 'Uploading'>(
    'Available'
  );
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUploadController = useAppStore((s: any) => s.getUploadController as ((name: string) => { pause?: () => void; cancel?: () => void; resume?: () => void; channel?: { close: () => void } } | undefined) | undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unregisterUpload = useAppStore((s: any) => s.unregisterUpload as ((name: string) => void) | undefined);
  const removeUploadController = useAppStore(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.removeUploadController as ((name: string) => void) | undefined
  );

  const uploadDropZoneRef = useRef<UploadDropZoneRef>(null);

  const [send, isReady, sendAsync] = rpc;
  // --- Upload session persistence (restore progress after refresh) ---
  const getBaseName = useCallback(
    (name: string) => name.replace(/\.incomplete$/, ''),
    []
  );

  const { is, start, stop, wrap } = useLoadingMap([
    'loadList',
    'mount',
    'upload',
    'listStorageFiles',
    'getStorageSpace',
  ]);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [space, setSpace] = useState<StorageSpaceInfo | null>(null);
  const [selected, setSelected] = useState<StorageFileItem | null>(null);
  const [mountAs, setMountAs] = useState<StorageMountAs>('CDROM');
  const uploadMap = useAppStore(s => s.fileTransferList.byId);
  const uploadingList = Object.values(uploadMap).filter(
    it => it.source === 'storage'
  );

  const { confirm } = useConfirmDialog();

  const fetchStorageSpace = useCallback(async () => {
    if (!isReady) return;
    const rawSpace = await wrap(
      'getStorageSpace',
      sendAsync({ method: 'getStorageSpace' }, { resultOnly: true })
    );

    setSpace(normalizeSpace(rawSpace));
  }, [sendAsync, isReady]);
  const listStorageFilesAsync = useCallback(async () => {
    if (!isReady) return;
    const list = await wrap(
      'listStorageFiles',
      sendAsync({ method: 'listStorageFiles' }, { resultOnly: true })
    );
    const normalFiles: StorageFileItem[] = [];
    const incomplete: StorageFileItem[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(list?.files || []).forEach((it: any) => {
      const fname = String(it.filename ?? it.name ?? '');
      const newFname = getBaseName(fname);
      it.filename = newFname;
      if (/\.incomplete$/.test(fname)) {
        incomplete.push(it);
      } else {
        normalFiles.push(it);
      }
    });
    setIncompleteFiles(incomplete);

    setFiles(normalFiles);
    setSelected(normalFiles?.[0] || null);

    // Merge device-reported .incomplete files with current upload list
    // to build a unified upload-task view
    const mergedUploadList = mergeUploadLists(incomplete, uploadingList);
    // Persist merged result to local storage
    // (using the same key as fileTransferListSlice)
    try {
      const persistPayload = mergedUploadList.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        // Persist only core fields required for storage;
        // runtime-only fields are initialized by hydrate
        source: item.source,
        direction: item.direction,
        path: item.path,
        name: item.name,
        totalBytes: item.totalBytes,
        transferredBytes: item.transferredBytes,
        progress: item.progress,
      }));
      localStorage.setItem('transfer:list', JSON.stringify(persistPayload));
      // Re-hydrate upload list after overwrite to keep UI in sync
      useAppStore.getState().fileTransferList.hydrate();
    } catch {
      // Silent fallback on persistence failure
    }
  }, [sendAsync, isReady, wrap, uploadingList]);
  const load = useCallback(async () => {
    setStorageTab('Available');
    await Promise.all([listStorageFilesAsync(), fetchStorageSpace()]);
  }, [listStorageFilesAsync, fetchStorageSpace,setStorageTab]);
  useEffect(() => {
    if (isReady) {
      // syncGetFileTransferState(true)
      useAppStore.getState().fileTransferList.hydrate();
      useAppStore.getState().fileTransferList.updateProgress();
      load();
      return;
    } else {
      // On disconnect, convert all running tasks to paused
      const { fileTransferList, fileDownloadList } = useAppStore.getState();

      // Handle upload tasks
      Object.values(fileTransferList.byId).forEach(upload => {
        if (upload.state === 'running') {
          fileTransferList.setState(upload.id, 'paused');
        }
      });

      // Handle download tasks
      Object.values(fileDownloadList.byId).forEach(download => {
        if (download.state === 'running') {
          fileDownloadList.setState(download.id, 'paused');
        }
      });
    }
  }, [isReady]);

  const handleMount = useCallback(async () => {
    if (!selected) return;
    start('mount');
    const doMount = async () =>
      sendAsync(
        {
          method: 'mountWithStorage',
          params: { filename: selected.filename, mode: mountAs },
        },
        { resultOnly: true, showUnhandledErrorToast: true }
      );
    try {
      await doMount();
      onMounted?.({ filename: selected.filename, mountAs });
      onOpenChange(false);
    } catch (err: unknown) {
      const errObj = err as { code?: number; message?: string; data?: unknown };
      const code = errObj?.code ?? (errObj?.data as { code?: number } | undefined)?.code;
      const msg = String(errObj?.message || errObj?.data || '');
      const alreadyMounted =
        code === -32603 && /already mounted/i.test(msg || '');
      if (alreadyMounted) {
        try {
          // auto unmount then retry
          await sendAsync({ method: 'unmountImage' }, { resultOnly: true });
          await doMount();
          onMounted?.({ filename: selected.filename, mountAs });
          onOpenChange(false);
        } catch {
          toast.error('Mount failed after unmount');
        } finally {
          stop('mount');
        }
        return;
      }
      toast.error('Mount failed');
    } finally {
      stop('mount');
    }
  }, [selected, mountAs, sendAsync, start, stop, onMounted, onOpenChange]);

  // Unified delete handler shared by available-image list and upload list
  const handleDeleteFile = useCallback(
    (file: { filename?: string }) => {
      let rawFileName = String(file.filename ?? '');
      if (file?.direction === 'upload') {
        rawFileName = `${rawFileName}.incomplete`;
      }
      const displayName = rawFileName.replace(/\.incomplete$/, '');

      confirm({
        title: t('storageDialog.deleteFile'),
        content: t('storageDialog.deleteFileDesc', { displayName }),
        type: 'error',
        confirmText: t('storageDialog.delete'),
        cancelText: t('storageDialog.cancel'),
        onConfirm: () => {
          // Cleanup local upload session and its DataChannel
          try {
            const baseName = displayName;
            const ctrls = [
              getUploadController?.(rawFileName),
              baseName ? getUploadController?.(baseName) : undefined,
            ].filter((c): c is NonNullable<ReturnType<NonNullable<typeof getUploadController>>> => c != null);

            ctrls.forEach(c => {
              try {
                c?.channel?.close();
              } catch {}
            });

            unregisterUpload?.(rawFileName);
            if (baseName && baseName !== rawFileName) {
              unregisterUpload?.(baseName);
            }
            removeUploadController?.(rawFileName);
            if (baseName && baseName !== rawFileName) {
              removeUploadController?.(baseName);
            }
          } catch {}

          // Release upload lock, clear pause markers, and remove queued items
          releaseUploadLock();
          pausedFiles.delete(displayName);
          pausedFiles.delete(rawFileName);
          removeFromQueue(displayName);
          removeFromQueue(rawFileName);

          send({
            method: 'deleteStorageFile',
            params: {
              filename: rawFileName,
            },
            onResponse() {
              toast.success(t('storageDialog.fileDeleted'));
              load();
            },
          });
        },
      });
    },
    [
      send,
      load,
      confirm,
      getUploadController,
      unregisterUpload,
      removeUploadController,
      t,
    ]
  );

  // Bridge storage uploads with global upload list (fileTransferListSlice)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createUploadRow = useAppStore((s: any) => s.fileTransferList?.createRow);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeRow = useAppStore((s: any) => s.fileTransferList?.removeRow);
  const updateProgress = useAppStore(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.fileTransferList?.updateProgress
  );
  const setUploadRowState = useAppStore(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.fileTransferList?.setState
  );
  // Map filename -> uploadRowId for progress updates
  const uploadRowIdRef = useRef<Record<string, string>>({});

  // Reuse handleDeleteFile for upload-list deletion actions
  const handleDeleteUploadingRow = useCallback(
    (id: string) => {
      const row = uploadingList.find(it => it.id === id);
      if (!row) return;
      const rawFileName = `${row.name}.incomplete`;
      const displayName = row.name;

      confirm({
        title: t('storageDialog.deleteFile'),
        content: t('storageDialog.deleteFileDesc', { displayName }),
        type: 'error',
        confirmText: t('storageDialog.delete'),
        cancelText: t('storageDialog.cancel'),
        onConfirm: () => {
          // First pause the upload (this will release lock and process queue)
          const ctrl = getUploadController?.(rawFileName) || getUploadController?.(displayName);
          if (ctrl?.pause) {
            ctrl.pause();
          }

          // Then cleanup upload controllers and DataChannel
          try {
            const ctrls = [
              getUploadController?.(rawFileName),
              getUploadController?.(displayName),
            ].filter(Boolean);
            ctrls.forEach(c => {
              // Call cancel method if exists (will abort XHR and close DataChannel)
              try { c?.cancel?.(); } catch {}
              // Fallback: manually close channel
              try { c?.channel?.close(); } catch {}
            });
            unregisterUpload?.(rawFileName);
            unregisterUpload?.(displayName);
            removeUploadController?.(rawFileName);
            removeUploadController?.(displayName);
          } catch {}

          // Clear pause markers and remove queued items
          pausedFiles.delete(displayName);
          pausedFiles.delete(rawFileName);
          removeFromQueue(displayName);
          removeFromQueue(rawFileName);

          // Delete file on device side
          send({
            method: 'deleteStorageFile',
            params: { filename: rawFileName },
            onResponse() {
              toast.success(t('storageDialog.fileDeleted'));
              // Just refresh the list without switching tabs
              listStorageFilesAsync();
              fetchStorageSpace();
            },
          });

          // Remove this row from upload task list
          try { removeRow?.(id); } catch {}
        },
      });
    },
    [uploadingList, confirm, t, send, load, removeRow, getUploadController, unregisterUpload, removeUploadController]
  );

  const onContinueUpload = useCallback(
    (fileName: string, index: number) => {
      const file = files[index];
      if (!file) return;
      // Prefer direct resume via upload controller
      // (avoid forcing user to reselect file)
      try {
        const rawName = String(file.filename ?? '');
        const baseName = getBaseName(rawName);
        const displayName = file.showFileName || baseName || rawName;
        const candidates = [displayName, rawName, baseName].filter(Boolean);
        const ctrl = candidates
          .map(k => getUploadController?.(k))
          .find(Boolean);
        if (ctrl && typeof ctrl.resume === 'function') {
          ctrl.resume();
          setFiles(prev => {
            const next = [...prev];
            const item = next[index];
            if (item) {
              item.state = 'uploading';
              item.showUploader = true;
            }
            return next;
          });
          return;
        }
      } catch {}

      // Fallback when controller is missing: show uploader
      // and let user reselect file with same name
      file.showUploader = true;
      setFiles([...files]);
    },
    [files, getUploadController]
  );

  const onStateChange = useCallback(
    (state: string, index: number) => {
      const file = files[index];
      if (!file) return;
      if (state === 'success') {
        file.state = 'idle';
        file.showUploader = false;
      } else {
        file.state = state;
        setFiles([...files]);
      }
    },
    [files]
  );

  const onSelectImage = useCallback((file: StorageFileItem) => {

    setSelected(file);
    const getMountAs = inferMountAsByUrlSuffix(file.filename || 'CDROM');
    setMountAs(getMountAs);
    // const ext = file.filename?.toLowerCase();
    // if (ext?.endsWith('.iso')) {
    //   setMountAs('CDROM');
    // } else if (ext?.endsWith('.img')) {
    //   setMountAs('Disk');
    // }
  }, []);
  const onSuccessUpload = useCallback(
    file => {
      start('listStorageFiles');
      setTimeout(() => {
        load();
        removeRow(file?.name);
      }, 2000);



      // getCompletedList(currentPath)
      // getFtFileSystemInfo()

      //name
    },
    [load]
  );
  const onStartUpload = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: { filename: string; size: number; dataChannel: any }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { filename, size, dataChannel } = payload || ({} as any);
      if (!filename || !size || !createUploadRow) return;

      const label =
        typeof dataChannel === 'string'
          ? dataChannel
          : dataChannel?.label || 'upload';

      // const id = createUploadRow({
      //   // Current Mount Storage uploads are image files under root path.
      //   // Path support can be extended in future.
      //   path: '/',
      //   name: filename,
      //   fileSize: size,
      //   dataChannel: label,
      //   lastModified: Date.now(),
      //   initialOffset: 0,
      //   initialState: 'running',
      //   source: 'storage',
      //   deviceId: 'current-device',
      // })
      const id = createUploadRow({
        path: '/',
        name: filename,
        totalBytes: size,
        dataChannel: label,
        source: 'storage',
        direction: 'upload',
      });
      // Don't set state here - let useUpload manage it via registerUpload
      // (will be 'waiting' if queued, 'uploading' if started immediately)
      setStorageTab('Uploading');
      uploadRowIdRef.current[filename] = id;
    },
    [createUploadRow]
  );
  const onProgressUpload = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      //id: string, offset: number, speedBps?: number

      const { name } = data;
      if (!name) return;
      updateProgress(name, data);
    },
    [updateProgress]
  );
  const handlePauseUpload = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => {
      const ctrl = getUploadController?.(row.name) || getUploadController?.(row.id);
      if (ctrl?.pause) {
        ctrl.pause();
      }
      setUploadRowState?.(row.id, 'paused');
    },
    [getUploadController, setUploadRowState]
  );

  const onError = useCallback(
    (data: { name: string; error: string }) => {
      const { name } = data || {};

      // Find and remove the failed upload task from UI
      const uploadId = uploadRowIdRef.current[name];
      if (uploadId && removeRow) {
        try {
          removeRow(uploadId);
          delete uploadRowIdRef.current[name];
        } catch (e) {
          logger.error('Failed to remove upload row on error', e);
        }
      }

      toast.error(t('storageDialog.uploadFailed'));
    },
    [t, removeRow]
  );

  return (
    <Dialog
      title={
        storageTab === 'Available'
          ? t('storageDialog.titleAvailable')
          : t('storageDialog.titleUploading')
      }
      description={
        storageTab === 'Available'
          ? t('storageDialog.descAvailable')
          : t('storageDialog.descUploading')
      }
      contentClassName="z-[200] pb-0"
      width="720px"
      open={open}
      onCancel={() => onOpenChange(false)}
      preventOutsideClose
      footerSlot={<></>}
    >
      <Tabs
        value={storageTab}
        onValueChange={v => setStorageTab(v as 'Available' | 'Uploading')}
        className="w-full"
        size="sm"
      >
        <TabsList
          className="m-auto h-[32px] bg-[var(--bg-secondary)]"
          size="sm"
        >
          <TabsTrigger value="Available" className="h-[28px]">
            {t('storageDialog.tabAvailable')}
          </TabsTrigger>
          <TabsTrigger value="Uploading" className="h-[28px]">
            {t('storageDialog.tabUploading')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Available">
          <LoadingOverlay
            visible={is('listStorageFiles')}
            text={t('storageDialog.loadingFiles')}
            className="absolute inset-0 z-10 pointer-events-none"
            layout="col"
          />

          <div className="space-y-4">
            <div className="min-h-[236px] max-h-[350px] overflow-y-auto rounded-md border border-[var(--border-color)]">
              {files.length ? (
                files.map((file, _index) => (
                  <StorageFileItem
                    key={file.filename}
                    file={file}
                    selected={selected?.filename === file.filename}
                    onSelect={onSelectImage}
                    onContinueUpload={onContinueUpload}
                    onDelete={handleDeleteFile}
                    incomplete={file.incomplete}
                  />
                ))
              ) : (
                <div className="p-4 min-h-[236px] max-h-[350px] text-sm flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <IconCd className="size-8 opacity-80" />
                    <span className="text-[var(--text-secondary)]">
                      {t('storageDialog.noFiles')}
                    </span>
                    <p className="text-[var(--text-color)]">
                      {t('storageDialog.noFilesDesc')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mount as */}
            <SelectMountAs
              value={mountAs}
              onChange={setMountAs}
              rightSlot={
                <div className="flex items-center justify-end gap-2">
                  <UploadDropZone
                    showProgress={false}
                    startMethod="startStorageFileUpload"
                    httpUploadUrl={
                      env.target === 'device' ? '/storage/upload' : ''
                    }
                    step="overview"
                    className="mb-0 border-dashed"
                    resumeFileName=""
                    customUploadTrigger={
                      <Button
                        size="sm"

                        className="btn-primary"
                      >
                         <Plus className="size-[16px] mr-0" />Upload Image
                      </Button>
                    }
                    formatsText={
                      <>
                        <span className="font-medium">
                          {t('storageDialog.formatsTypes')}
                        </span>
                      </>
                    }
                    idleText={
                      <div className="flex flex-col items-center ">
                        <Button className="rounded-[50%] w-[40px] h-[40px] mb-[10px] ">
                          <Plus className="size-5 opacity-60" />
                        </Button>

                        <span>{t('storageDialog.idleText')}</span>
                      </div>
                    }
                    draggingText={t('storageDialog.draggingText')}
                    onSuccess={onSuccessUpload}
                    onStart={onStartUpload}
                    onProgress={onProgressUpload}
                    onStateChange={onStateChange}
                    rpc={rpc}
                  >
                    <Button className="w-full">
                      {/*  onClick={() => setStorageTab('Uploading')} */}
                      {t('storageDialog.uploadNewImage')}
                    </Button>
                  </UploadDropZone>
                  <Button   size="sm"  onClick={onBack}>{t('storageDialog.back')}</Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={is('mount')}
                    disabled={!selected || selected.incomplete}
                    onClick={handleMount}
                  >
                    {t('storageDialog.mountFile')}
                  </Button>
                </div>
              }
            ></SelectMountAs>
            {/* Storage usage */}


          </div>
           <StorageUsage
                total={space?.total || 0}
                used={space?.used || 0}
                free={space ? Math.max(space.total - space.used, 0) : 0}
                loading={is('ftFileSystemInfo')}
                title={t('storageDialog.availableStorage')}
                rightText={(pct) => t('storageDialog.usedPct', { pct })}
                usedText={(used) => t('storageDialog.usedText', { used: humanSize(used) })}
                freeText={(free) => t('storageDialog.freeText', { free: humanSize(free) })}
                mountKey={storageTab}
                className="mt-2"
              />
        </TabsContent>

        <TabsContent value="Uploading">
          {/* <DataTable
            columns={uploadingColumns}
            list={uploadingList}
            rowKey="id"
            className="text-sm mt-[var(--spacing-base)] [&_table]:table-fixed [&_table]:w-full"
            scroll={{ x: 'max-content' }}
            emptyProps={{
              icon: <IconCd className="size-8 opacity-80" />,
              title: t('storageDialog.noCurrentUploads'),
              description: t('storageDialog.noCurrentUploadsDesc'),
              className: 'py-14', // Optional: custom height/spacing
            }}
          /> */}
          {/*   onPause={env.target !== 'device' ? handlePauseUpload : undefined} */}
          <TransferList
            list={uploadingList}
          onPause={handlePauseUpload}
            onRemove={handleDeleteUploadingRow}
            // showActions={false}
            emptyProps={{
              icon: <IconCd className="size-8 opacity-80" />,
              title: t('storageDialog.noCurrentUploads'),
              description: t('storageDialog.noCurrentUploadsDesc'),
              className: 'pt-14',
            }}
          />
          <div className="flex items-center justify-end gap-2  py-[var(--spacing-base)]">
            <Button onClick={onBack}>{t('storageDialog.back')}</Button>
          </div>
          <UploadDropZone
            ref={uploadDropZoneRef}
            showProgress={false}
            startMethod="startStorageFileUpload"
            httpUploadUrl={env.target === 'device' ? '/storage/upload' : ''}
            step="overview"
            className="mb-0 m-0 border-dashed"
            resumeFileName=""
            formatsText={
              <>
                <span className="font-medium">
                  {t('storageDialog.formatsTypes')}
                </span>
              </>
            }
            idleText={
              <div className="flex flex-col items-center ">
                <Button className="rounded-[50%] w-[40px] h-[40px] mb-[10px] ">
                  <Plus className="size-5 opacity-60" />
                </Button>

                <span>{t('storageDialog.idleText')}</span>
              </div>
            }
            draggingText={t('storageDialog.draggingText')}
            onSuccess={onSuccessUpload}
            onStart={onStartUpload}
            onProgress={onProgressUpload}
            onStateChange={onStateChange}
            onError={onError}
            rpc={rpc}
          >
            <Button className="w-full">
              {/*  onClick={() => setStorageTab('Uploading')} */}
              {t('storageDialog.uploadNewImage')}
            </Button>
          </UploadDropZone>
        </TabsContent>
      </Tabs>
    </Dialog>
  );
};

export default memo(StorageMountDialog);
