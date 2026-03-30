import { IconCd } from '@/assets/icons'
import { type JsonRpcHandle } from '@/hooks/useJsonRpc'
import { useLoadingMap } from '@/hooks/useLoading'
import { useAppStore } from '@/stores'
import { env } from '@/utils'
import { humanSize } from '@/utils/format'
import { mergeUploadLists } from '@/utils/transfer'
import { Plus } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Dialog } from '../Dialog'
import TransferList from '../TransferList'
import { Button } from '../ui/button'
import { useConfirmDialog } from '../ui/confirm-dialog'
import { LoadingOverlay } from '../ui/LoadingOverlay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import UploadDropZone from '../Upload'
import {
  pausedFiles,
  releaseUploadLock,
  removeFromQueue,
} from '../Upload/uploadLock'
import SelectMountAs from './SelectMountAs'
import StorageFileItem from './StorageFileItem'

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

const normalizeSpace = (raw: any): StorageSpaceInfo | null => {
  if (!raw) return null
  const toNum = (v: any) => {
    if (v == null) return undefined
    if (typeof v === 'number') return v
    const n = Number(String(v).replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  // New rule: if bytesUsed and bytesFree are provided, derive total/used from them
  const bytesUsed = toNum(raw.bytesUsed)
  const bytesFree = toNum(raw.bytesFree)
  const hasBytesUF = bytesUsed != null && bytesFree != null

  const total = hasBytesUF
    ? (bytesUsed as number) + (bytesFree as number)
    : (toNum(raw.total) ??
      toNum(raw.totalBytes) ??
      toNum(raw.capacity) ??
      toNum(raw.size))
  const used = hasBytesUF
    ? (bytesUsed as number)
    : (toNum(raw.used) ??
      toNum(raw.usedBytes) ??
      (total != null && (toNum(raw.free) ?? toNum(raw.freeBytes)) != null
        ? (total as number) - (toNum(raw.free) ?? toNum(raw.freeBytes))!
        : undefined))
  if (total != null && used != null) {
    return {
      total: Math.max(0, total),
      used: Math.max(0, Math.min(total, used)),
    }
  }
  return null
}
type Row = {
  accessed: number
  created: number
  is_dir: boolean
  modified: number
  name: string
  size: number
}

const StorageMountDialog: React.FC<StorageMountDialogProps> = ({
  open,
  onOpenChange,
  onBack,
  onMounted,
  rpc,
}: StorageMountDialogProps) => {
  const { t } = useTranslation('virtualMedia')
  const [storageTab, setStorageTab] = useState<'Available' | 'Uploading'>(
    'Available'
  )
  const [incompleteFiles, setIncompleteFiles] = useState<StorageFileItem[]>([])
  const getUploadController = useAppStore((s: any) => s.getUploadController)
  const unregisterUpload = useAppStore((s: any) => s.unregisterUpload)
  const removeUploadController = useAppStore(
    (s: any) => s.removeUploadController
  )

  const [send, isReady, sendAsync] = rpc
  // --- Upload session persistence (restore progress after refresh) ---
  const getBaseName = useCallback(
    (name: string) => name.replace(/\.incomplete$/, ''),
    []
  )

  const { is, start, stop, wrap } = useLoadingMap([
    'loadList',
    'mount',
    'upload',
    'listStorageFiles',
    'getStorageSpace',
  ])
  const [files, setFiles] = useState<StorageFileItem[]>([])
  const [space, setSpace] = useState<StorageSpaceInfo | null>(null)
  const [selected, setSelected] = useState<StorageFileItem | null>(null)
  const [mountAs, setMountAs] = useState<StorageMountAs>('CDROM')
  const uploadMap = useAppStore(s => s.fileTransferList.byId)
  const uploadingList = Object.values(uploadMap).filter(
    it => it.source === 'storage'
  )

  const { confirm } = useConfirmDialog()
  const usedPct = useMemo(() => {
    if (!space) return 0
    return space.total ? +((space.used / space.total) * 100).toFixed(1) : 0
  }, [space])
  const fetchStorageSpace = useCallback(async () => {
    if (!isReady) return
    const rawSpace = await wrap(
      'getStorageSpace',
      sendAsync({ method: 'getStorageSpace' }, { resultOnly: true })
    )

    setSpace(normalizeSpace(rawSpace))
  }, [sendAsync, isReady])
  const listStorageFilesAsync = useCallback(async () => {
    if (!isReady) return
    const list = await wrap(
      'listStorageFiles',
      sendAsync({ method: 'listStorageFiles' }, { resultOnly: true })
    )

    const normalFiles: StorageFileItem[] = []
    const incomplete: StorageFileItem[] = []
    ;(list?.files || []).forEach((it: any) => {
      const fname = String(it.filename ?? it.name ?? '')
      const newFname = getBaseName(fname)
      it.filename = newFname
      if (/\.incomplete$/.test(fname)) {
        incomplete.push(it)
      } else {
        normalFiles.push(it)
      }
    })
    setIncompleteFiles(incomplete)

    setFiles(normalFiles)
    setSelected(normalFiles?.[0] || null)

    const mergedUploadList = mergeUploadLists(incomplete, uploadingList)

    try {
      const persistPayload = mergedUploadList.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,

        source: item.source,
        direction: item.direction,
        path: item.path,
        name: item.name,
        totalBytes: item.totalBytes,
        transferredBytes: item.transferredBytes,
        progress: item.progress,
      }))
      localStorage.setItem('transfer:list', JSON.stringify(persistPayload))

      useAppStore.getState().fileTransferList.hydrate()
    } catch (e) {}
  }, [sendAsync, isReady, wrap, uploadingList])
  const load = useCallback(async () => {
    setStorageTab('Available')
    await Promise.all([listStorageFilesAsync(), fetchStorageSpace()])
  }, [listStorageFilesAsync, fetchStorageSpace, setStorageTab])
  useEffect(() => {
    if (isReady) {
      // syncGetFileTransferState(true)
      useAppStore.getState().fileTransferList.hydrate()
      useAppStore.getState().fileTransferList.updateProgress()
      load()
      return
    } else {
      const { fileTransferList, fileDownloadList } = useAppStore.getState()

      Object.values(fileTransferList.byId).forEach(upload => {
        if (upload.state === 'running') {
          fileTransferList.setState(upload.id, 'paused')
        }
      })

      Object.values(fileDownloadList.byId).forEach(download => {
        if (download.state === 'running') {
          fileDownloadList.setState(download.id, 'paused')
        }
      })
    }
  }, [isReady])

  const handleMount = useCallback(async () => {
    if (!selected) return
    start('mount')
    const doMount = async () =>
      sendAsync(
        {
          method: 'mountWithStorage',
          params: { filename: selected.filename, mode: mountAs },
        },
        { resultOnly: true, showUnhandledErrorToast: true }
      )
    try {
      await doMount()
      onMounted?.({ filename: selected.filename, mountAs })
      onOpenChange(false)
    } catch (err: any) {
      const code = err?.code ?? err?.data?.code
      const msg = String(err?.message || err?.data || '')
      const alreadyMounted =
        code === -32603 && /already mounted/i.test(msg || '')
      if (alreadyMounted) {
        try {
          // auto unmount then retry
          await sendAsync({ method: 'unmountImage' }, { resultOnly: true })
          await doMount()
          onMounted?.({ filename: selected.filename, mountAs })
          onOpenChange(false)
        } catch (e) {
          toast.error('Mount failed after unmount')
        } finally {
          stop('mount')
        }
        return
      }
      toast.error('Mount failed')
    } finally {
      stop('mount')
    }
  }, [selected, mountAs, sendAsync, start, stop, onMounted, onOpenChange])

  const handleDeleteFile = useCallback(
    (file: { filename?: string }) => {
      let rawFileName = String(file.filename ?? '')
      if (file?.direction === 'upload') {
        rawFileName = `${rawFileName}.incomplete`
      }
      const displayName = rawFileName.replace(/\.incomplete$/, '')

      confirm({
        title: t('storageDialog.deleteFile'),
        content: t('storageDialog.deleteFileDesc', { displayName }),
        type: 'error',
        confirmText: t('storageDialog.delete'),
        cancelText: t('storageDialog.cancel'),
        onConfirm: () => {
          try {
            const baseName = displayName
            const ctrls = [
              getUploadController?.(rawFileName),
              baseName ? getUploadController?.(baseName) : undefined,
            ].filter(Boolean) as any[]

            ctrls.forEach(ctrl => {
              try {
                ctrl.channel?.close()
              } catch {}
            })

            unregisterUpload?.(rawFileName)
            if (baseName && baseName !== rawFileName) {
              unregisterUpload?.(baseName)
            }
            removeUploadController?.(rawFileName)
            if (baseName && baseName !== rawFileName) {
              removeUploadController?.(baseName)
            }
          } catch {}

          releaseUploadLock()
          pausedFiles.delete(displayName)
          pausedFiles.delete(rawFileName)
          removeFromQueue(displayName)
          removeFromQueue(rawFileName)

          send({
            method: 'deleteStorageFile',
            params: {
              filename: rawFileName,
            },
            onResponse(resp) {
              toast.success(t('storageDialog.fileDeleted'))
              load()
            },
          })
        },
      })
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
  )

  const createUploadRow = useAppStore((s: any) => s.fileTransferList?.createRow)
  const removeRow = useAppStore((s: any) => s.fileTransferList?.removeRow)
  const updateProgress = useAppStore(
    (s: any) => s.fileTransferList?.updateProgress
  )
  const setUploadRowState = useAppStore(
    (s: any) => s.fileTransferList?.setState
  )

  const uploadRowIdRef = useRef<Record<string, string>>({})

  const handleDeleteUploadingRow = useCallback(
    (id: string) => {
      const row = uploadingList.find(it => it.id === id)
      if (!row) return
      const rawFileName = `${row.name}.incomplete`
      const displayName = row.name

      confirm({
        title: t('storageDialog.deleteFile'),
        content: t('storageDialog.deleteFileDesc', { displayName }),
        type: 'error',
        confirmText: t('storageDialog.delete'),
        cancelText: t('storageDialog.cancel'),
        onConfirm: () => {
          try {
            const ctrls = [
              getUploadController?.(rawFileName),
              getUploadController?.(displayName),
            ].filter(Boolean) as any[]
            ctrls.forEach(ctrl => {
              try {
                ctrl.channel?.close()
              } catch {}
            })
            unregisterUpload?.(rawFileName)
            unregisterUpload?.(displayName)
            removeUploadController?.(rawFileName)
            removeUploadController?.(displayName)
          } catch {}

          releaseUploadLock()
          pausedFiles.delete(displayName)
          pausedFiles.delete(rawFileName)
          removeFromQueue(displayName)
          removeFromQueue(rawFileName)

          send({
            method: 'deleteStorageFile',
            params: { filename: rawFileName },
            onResponse() {
              toast.success(t('storageDialog.fileDeleted'))
              load()
            },
          })

          try {
            removeRow?.(id)
          } catch {}
        },
      })
    },
    [
      uploadingList,
      confirm,
      t,
      send,
      load,
      removeRow,
      getUploadController,
      unregisterUpload,
      removeUploadController,
    ]
  )

  const onContinueUpload = useCallback(
    (fileName: string, index: number) => {
      const file = files[index]
      if (!file) return

      try {
        const rawName = String(file.filename ?? '')
        const baseName = getBaseName(rawName)
        const displayName = file.showFileName || baseName || rawName
        const candidates = [displayName, rawName, baseName].filter(Boolean)
        const ctrl = candidates
          .map(k => getUploadController?.(k))
          .find(Boolean) as any
        if (ctrl && typeof ctrl.resume === 'function') {
          ctrl.resume()
          setFiles(prev => {
            const next = [...prev]
            const item = next[index]
            if (item) {
              item.state = 'uploading'
              item.showUploader = true
            }
            return next
          })
          return
        }
      } catch {}

      file.showUploader = true
      setFiles([...files])
    },
    [files, getUploadController]
  )

  const onStateChange = useCallback(
    (state: string, index: number) => {
      const file = files[index]
      if (!file) return
      if (state === 'success') {
        file.state = 'idle'
        file.showUploader = false
      } else {
        file.state = state
        setFiles([...files])
      }
    },
    [files]
  )

  const onSelectImage = useCallback((file: StorageFileItem) => {
    setSelected(file)
    const ext = file.filename?.toLowerCase()
    if (ext?.endsWith('.iso')) {
      setMountAs('CDROM')
    } else if (ext?.endsWith('.img')) {
      setMountAs('Disk')
    }
  }, [])
  const onSuccessUpload = useCallback(
    file => {
      start('listStorageFiles')
      setTimeout(() => {
        load()
        removeRow(file?.name)
      }, 2000)

      // getCompletedList(currentPath)
      // getFtFileSystemInfo()

      //name
    },
    [load]
  )
  const onStartUpload = useCallback(
    (payload: { filename: string; size: number; dataChannel: any }) => {
      const { filename, size, dataChannel } = payload || ({} as any)
      if (!filename || !size || !createUploadRow) return

      const label =
        typeof dataChannel === 'string'
          ? dataChannel
          : dataChannel?.label || 'upload'

      // const id = createUploadRow({

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
      })

      setUploadRowState?.(id, 'running')
      setStorageTab('Uploading')
      uploadRowIdRef.current[filename] = id
    },
    [createUploadRow]
  )
  const onProgressUpload = useCallback(
    (data: any) => {
      //id: string, offset: number, speedBps?: number

      const { name } = data
      if (!name) return
      updateProgress(name, data)
    },
    [updateProgress]
  )
  const handlePauseUpload = useCallback(
    (row: any) => {
      const ctrl =
        getUploadController?.(row.name) || getUploadController?.(row.id)
      if (ctrl?.pause) {
        ctrl.pause()
      }
      setUploadRowState?.(row.id, 'paused')
    },
    [getUploadController, setUploadRowState]
  )

  const onError = useCallback(
    data => {
      toast.error(t('storageDialog.uploadFailed'))
    },
    [t]
  )

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
                files.map((file, index) => (
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
                      <Button size="sm" className="btn-primary">
                        <Plus className="size-[16px] mr-0" />
                        Upload Image
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
                  <Button size="sm" onClick={onBack}>
                    {t('storageDialog.back')}
                  </Button>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>{t('storageDialog.availableStorage')}</div>
                <div>{t('storageDialog.usedPct', { pct: usedPct })}</div>
              </div>
              <div className="h-2 bg-white/10 rounded">
                <div
                  className="h-full bg-[var(--btn-primary-bg)] rounded"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              {space ? (
                <div className="flex items-center justify-between text-xs ">
                  <div>
                    {t('storageDialog.usedText', {
                      used: humanSize(space.used),
                    })}
                  </div>
                  <div>
                    {t('storageDialog.freeText', {
                      free: humanSize(Math.max(space.total - space.used, 0)),
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Uploading">
          {}
          <TransferList
            list={uploadingList}
            onPause={env.target !== 'device' ? handlePauseUpload : undefined}
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
  )
}

export default memo(StorageMountDialog)
