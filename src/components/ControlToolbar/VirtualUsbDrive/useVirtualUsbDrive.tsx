import { generateTaskId, useFileDownload } from '@/hooks/useFileDownload'
import { useLoadingMap } from '@/hooks/useLoading'
import { useAppStore } from '@/stores'
import type { DownloadItem } from '@/stores/slices/fileTransferDownloadSlice'
import type { TransferRow } from '@/stores/slices/fileTransferListSlice'
import { createLogger } from '@/utils/logger'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useConfirmDialog } from '../../ui/confirm-dialog'
import { Input } from '../../ui/input'
import { removeFromQueue } from '../../Upload/uploadLock'
import type {
  DeleteResult,
  Row,
  StorageInfo,
  VirtualUsbDriveProps,
  VMState,
} from './types'
import { filterTasksByFtcache, joinPath } from './utils'

const logger = createLogger('VirtualUsbDrive')

export function useVirtualUsbDrive({ rpc }: VirtualUsbDriveProps) {
  // Prefer external rpc; fallback to local creation if not provided (backward compatibility)
  const [send, isConnected, sendAsync] = rpc
  const getFileNameByKey = useAppStore((s: any) => s.getFileNameByKey)
  const uploadMap = useAppStore(s => s.fileTransferList.byId)
  const uploads = Object.values(uploadMap).filter(
    item => item.source === 'virtual-usb'
  )
  const { createRow, setSpeed, updateProgress, removeRow, setState } =
    useAppStore.getState().fileTransferList
  const getUploadController = useAppStore((s: any) => s.getUploadController)

  // Upload operation callbacks
  const handlePauseUpload = useCallback(
    (row: TransferRow) => {
      logger.warn('handlePauseUpload called', {
        rowId: row.id,
        rowName: row.name,
      })
      const controller = getUploadController?.(row.id)
      logger.warn('controller lookup', {
        found: !!controller,
        hasPause: !!controller?.pause,
        controllerState: controller?.getState?.(),
      })
      if (controller?.pause) {
        controller.pause()
        logger.warn('pause() called, new state:', controller.getState?.())

        setState(row.id, 'paused')
      } else {
        logger.error('No controller found for', row.id)

        setState(row.id, 'paused')
      }
    },
    [getUploadController, setState]
  )

  const removeUploadController = useAppStore(
    (s: any) => s.removeUploadController
  )

  const handleRemoveUpload = useCallback(
    (id: string) => {
      const fileName = getFileNameByKey?.(id) || id
      removeFromQueue(fileName)

      const controller = getUploadController?.(id)
      if (controller) {
        const ch = controller.channel as RTCDataChannel | undefined
        if (ch) {
          try {
            ch.onmessage = null
            ch.onbufferedamountlow = null
            ch.onerror = null
            ch.onclose = null
            if (ch.readyState === 'open' || ch.readyState === 'connecting') {
              ch.close()
            }
          } catch {}
        }
        try {
          removeUploadController?.(id)
        } catch {}
      }
      removeRow(id)
    },
    [removeRow, getUploadController, removeUploadController, getFileNameByKey]
  )

  const [selectedCompletedRowKeys, setSelectedCompletedRowKeys] = useState<
    React.Key[]
  >([])
  const {
    is: isLoading,
    start: startLoading,
    stop: stopLoading,
    wrap,
  } = useLoadingMap([
    'getFileTransferState',
    'ftDelFile',
    'ftDelDir',
    'mountWithFileImg',
    'ftCreateDir',
    'ftListFile',
    'ftFileSystemInfo',
  ])
  const [fileTransferState, setFileTransferState] = useState<VMState>('None')
  const [currentPath, setCurrentPath] = useState<string>('/')
  const currentPathRef = useRef(currentPath)
  currentPathRef.current = currentPath
  const [listType, setListType] = useState<'completed' | 'transfer'>(
    'completed'
  )
  const [completedList, setCompletedList] = useState<Row[]>([])
  const showCompletedList = useMemo(() => {
    if (fileTransferState === 'Kvm') return completedList
    return []
  }, [fileTransferState, completedList])
  const [transferType, setTransferType] = useState<'upload' | 'download'>(
    'upload'
  )
  const [transferList, setTransferList] = useState<Row[]>()
  const [createDirName, setCreateDirName] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    setDownloadFileList,
    updateProgress: updateProgressDownload,
    removeRow: removeDownloadRow,
  } = useAppStore.getState().fileDownloadList
  const [downloadFile] = useFileDownload({
    onProgress: task => {
      logger.debug('Download progress', {
        name: task.name,
        progress: task.progress,
      })
      if (task.progress === 100) {
        removeDownloadRow(task.id)
      } else {
        updateProgressDownload(task.id, task)
      }
    },
    onComplete: task => {
      logger.info('Download completed', { name: task.name, path: task.path })
      const id = `${task.name}-${task.path}`
      removeDownloadRow(id)
    },
  })
  const downloadsMap = useAppStore(s => s.fileDownloadList.byId)
  const downloads = Object.values(downloadsMap)

  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    free_space: 0,
    total_space: 0,
    used_space: 0,
  })

  const { confirm } = useConfirmDialog()
  const isDownload = useMemo(() => {
    const targets = completedList.filter((item, i) =>
      selectedCompletedRowKeys.includes(i)
    )
    const isDir = targets.some(item => item.is_dir)
    return targets.length > 0 && !isDir
  }, [completedList, selectedCompletedRowKeys])

  // Check if there are active upload or download tasks (excluding paused state)
  const hasActiveTransfers = useMemo(() => {
    // Check upload tasks - only check running tasks, exclude paused state
    const hasActiveUploads = uploads.some(upload => upload.state === 'running')

    // Check download tasks - only check running tasks, exclude paused state
    const hasActiveDownloads = downloads.some(
      download => download.state === 'running'
    )

    return hasActiveUploads || hasActiveDownloads
  }, [uploads, downloads])

  // --- breadcrumb helpers ---
  const truncateBytes = useCallback((input: string, maxBytes = 10) => {
    const enc = new TextEncoder()
    let out = ''
    let bytes = 0
    for (const ch of input) {
      const size = enc.encode(ch).length
      if (bytes + size > maxBytes) {
        return out + '...'
      }
      out += ch
      bytes += size
    }
    return out || '/'
  }, [])

  // --- RPC operations ---
  const getFtFileSystemInfo = useCallback(async () => {
    if (!isConnected) return
    startLoading('ftFileSystemInfo')
    try {
      const ftFileSystemInfo = await sendAsync(
        {
          method: 'ftFileSystemInfo',
        },
        {
          resultOnly: true,
        }
      )
      setStorageInfo(ftFileSystemInfo as StorageInfo)
    } finally {
      stopLoading('ftFileSystemInfo')
    }
  }, [sendAsync, isConnected, wrap, startLoading, stopLoading])

  const getCompletedList = useCallback(
    async (path = '/') => {
      startLoading('ftListFile')
      try {
        const result = await sendAsync(
          {
            method: 'ftListFile',
            params: {
              path: joinPath(path),
            },
          },
          {
            resultOnly: true,
          }
        )

        if (Array.isArray(result)) {
          setSelectedCompletedRowKeys([])
          setCurrentPath(path)
          setCompletedList(result || [])

          const {
            fileTransferList,
            controllers,
            removeUploadController: rmCtrl,
          } = useAppStore.getState()
          const currentUploads = Object.values(fileTransferList.byId).filter(
            (item: TransferRow) => item.source === 'virtual-usb'
          )
          const validTasks = filterTasksByFtcache(result, currentUploads, path)
          const validIds = new Set(validTasks.map(t => t.id))

          currentUploads.forEach((task: TransferRow) => {
            if (
              task.path === path &&
              task.state === 'paused' &&
              !validIds.has(task.id)
            ) {
              const ctrl = (controllers as any)?.[task.id]
              if (ctrl) {
                const ch = ctrl.channel as RTCDataChannel | undefined
                if (ch) {
                  try {
                    ch.onmessage = null
                    ch.onbufferedamountlow = null
                    ch.onerror = null
                    ch.onclose = null
                    if (
                      ch.readyState === 'open' ||
                      ch.readyState === 'connecting'
                    ) {
                      ch.close()
                    }
                  } catch {}
                }
                try {
                  rmCtrl?.(task.id)
                } catch {}
              }
              fileTransferList.removeRow(task.id)
            }
          })
        }
      } finally {
        stopLoading('ftListFile')
      }
    },
    [
      sendAsync,
      wrap,
      setCurrentPath,
      setCompletedList,
      setSelectedCompletedRowKeys,
      startLoading,
      stopLoading,
    ]
  )

  const syncGetFileTransferState = useCallback(
    async (force: boolean = false) => {
      if (!isConnected && !force) return
      const result = await wrap(
        'syncFetFileTransferState',
        sendAsync(
          {
            method: 'getFileTransferState',
          },
          {
            resultOnly: true,
          }
        )
      )

      setFileTransferState(result?.target as VMState)

      if (force) {
        if (result?.target === 'None') {
          handleMountWithFileImg('Kvm')
        } else if (result?.target === 'Kvm') {
          getFtFileSystemInfo()
          getCompletedList()
        }
      }
    },
    [sendAsync, isConnected, currentPath, wrap, getCompletedList]
  )

  // Mount media
  const handleMountWithFileImg = useCallback(
    async (target: 'Kvm' | 'RemoteUsb') => {
      startLoading('mountWithFileImg')

      if (fileTransferState !== 'None') {
        const result = await sendAsync(
          {
            method: 'unmountWithFileImg',
            onResponse: resp => {},
            onError: resp => {},
          },
          {
            resultOnly: true,
          }
        )
      }

      send({
        method: 'mountWithFileImg',
        params: {
          target,
        },
        errorMessage: { prefix: 'Failed to mount image:' },
        successMessage: { prefix: 'Mounted successfully' },
        onResponse(resp) {
          if (target === 'Kvm') {
            getFtFileSystemInfo()
            getCompletedList()
          }
          syncGetFileTransferState()
          stopLoading('mountWithFileImg')
        },
        onError() {
          stopLoading('mountWithFileImg')
        },
      })
    },
    [
      send,
      startLoading,
      stopLoading,
      syncGetFileTransferState,
      fileTransferState,
    ]
  )

  // Delete files/dirs
  const handleDelete = useCallback(async () => {
    const targets = completedList.filter((item, i) =>
      selectedCompletedRowKeys.includes(i)
    )
    const delFiles = targets.filter(item => !item.is_dir)
    const delDir = targets.filter(item => item.is_dir)

    startLoading('ftDelFile')
    startLoading('ftDelDir')
    const tasks = delFiles.map(t =>
      sendAsync({
        method: 'ftDelFile',
        params: { path: joinPath(`${currentPath}/${t.name}`) },
      })
        .then(() => ({ name: t.name, ok: true }) as DeleteResult)
        .catch(err => ({ name: t.name, ok: false, error: err }) as DeleteResult)
    )
    const delDirTasks = delDir.map(t =>
      sendAsync({
        method: 'ftDelDir',
        params: { path: joinPath(`${currentPath}/${t.name}`) },
      })
        .then(() => ({ name: t.name, ok: true }) as DeleteResult)
        .catch(err => ({ name: t.name, ok: false, error: err }) as DeleteResult)
    )

    // Wait for all to settle (both success and failure return)
    const results = await Promise.all([...tasks, ...delDirTasks])
    stopLoading('ftDelFile')
    stopLoading('ftDelDir')
    getCompletedList(currentPath)
    getFtFileSystemInfo()
  }, [
    selectedCompletedRowKeys,
    currentPath,
    sendAsync,
    startLoading,
    stopLoading,
  ])

  // Download selected files
  const handleDownload = useCallback(() => {
    const targets = completedList
      .filter((item, i) => selectedCompletedRowKeys.includes(i))
      .map(item => {
        return { name: item.name, path: currentPath, totalBytes: item.size }
      })

    downloadFile(targets)
    setListType('transfer')
    setTransferType('download')
    // Insert placeholder data in download list first, wait for onDownload/onProgress to update
    const seedItems: DownloadItem[] = targets.map(t => ({
      id: generateTaskId(t.name, t.path),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      path: t.path,
      name: t.name,
      totalBytes: t.totalBytes,
      transferredBytes: 0,
      progress: 0,
      state: 'pending',
      speedBps: 0,
      totalFormatted: '',
      transferredFormatted: '0',
      progressFormatted: '0%',
      speedFormatted: '0B/s',
      dataChannel: null,
      errorMessage: '',
    }))
    setDownloadFileList(seedItems)
  }, [selectedCompletedRowKeys, currentPath, setDownloadFileList])

  // Create directory
  const handleCreateDir = useCallback(() => {
    confirm({
      title: 'Enter directory name',
      content: (
        <Input
          size="lg"
          ref={inputRef}
          autoFocus
          placeholder="Enter directory name"
        />
      ),
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: async () => {
        const createDirName = inputRef.current?.value?.trim() || ''

        startLoading('ftCreateDir')
        send({
          method: 'ftCreateDir',
          params: {
            path: `${currentPath}/${createDirName}`.replace(/\/+/g, '/'),
          },
          onResponse(resp) {
            getCompletedList(currentPath)

            stopLoading('ftCreateDir')
          },
          onError() {
            stopLoading('ftCreateDir')
          },
        })
      },
    })
  }, [inputRef, confirm, currentPath, sendAsync])

  const startParamsFn = (file: File) => {
    return {
      path: currentPath.replace(/\/{2,}/g, '/').replace(/([^:])\/$/, '$1'),
      name: file.name,
      size: file.size,
    }
  }

  // Open file
  const handleOpenFile = useCallback((path: string) => {}, [send])
  const location = useLocation()

  // Connection state effect
  useEffect(() => {
    logger.info('useEffect isConnected', isConnected)
    if (isConnected) {
      syncGetFileTransferState(true)
      useAppStore.getState().fileTransferList.hydrate()
      useAppStore.getState().fileTransferList.updateProgress()

      // Reconcile controller state with task list:
      // If a controller still has an open DataChannel, restore that task to 'running'.
      // If the channel is dead, clean up the stale controller.
      const { fileTransferList, controllers, removeUploadController } =
        useAppStore.getState()
      if (controllers) {
        Object.entries(controllers).forEach(([key, ctrl]: [string, any]) => {
          const channel: RTCDataChannel | null | undefined = ctrl?.channel
          if (channel && channel.readyState === 'open') {
            // Channel is still alive — find matching task and set to running
            const task = Object.values(fileTransferList.byId).find(
              (r: any) => r.name === key || r.id === key
            )
            if (task) {
              fileTransferList.setState(task.id, 'running')
            }
          } else {
            // Channel is dead — clean up stale controller
            removeUploadController?.(key)
          }
        })
      }
      return
    } else {
      // When connection is lost, change all running tasks to paused
      const { fileTransferList, fileDownloadList } = useAppStore.getState()

      // Handle upload tasks
      Object.values(fileTransferList.byId).forEach(upload => {
        if (upload.state === 'running') {
          fileTransferList.setState(upload.id, 'paused')
        }
      })

      // Handle download tasks
      Object.values(fileDownloadList.byId).forEach(download => {
        if (download.state === 'running') {
          fileDownloadList.setState(download.id, 'paused')
        }
      })
    }
  }, [isConnected, sendAsync])

  // Start upload
  const onStartUpload = useCallback(
    (payload: { filename: string; size: number; dataChannel: any }) => {
      const { filename, size, dataChannel } = payload || ({} as any)

      const rowId = createRow({
        path: currentPath || '/',
        name: filename,
        totalBytes: size,
        dataChannel: dataChannel?.label || dataChannel, // WebRTC channel name
        source: 'virtual-usb',
      })
    },
    [createRow, currentPath, uploads, uploadMap]
  )

  // Optional: also handle onProgress to update offset and speed (more complete)
  const onProgressUpload = useCallback(
    (data: any) => {
      //id: string, offset: number, speedBps?: number

      const { name } = data
      if (!name) return

      updateProgress(name, data)
    },
    [updateProgress]
  )
  const onSuccessUpload = useCallback(
    (file: any) => {
      removeRow(file?.name)
      getCompletedList(currentPathRef.current)
      getFtFileSystemInfo()
    },
    [getFtFileSystemInfo, getCompletedList]
  )

  const handleBreadcrumbClick = useCallback((path: string) => {
    getCompletedList(path)
  }, [])

  return {
    // State
    uploads,
    downloads,
    fileTransferState,
    currentPath,
    listType,
    setListType,
    completedList,
    showCompletedList,
    transferType,
    setTransferType,
    storageInfo,
    selectedCompletedRowKeys,
    setSelectedCompletedRowKeys,
    isDownload,
    hasActiveTransfers,
    isLoading,
    inputRef,

    // Callbacks
    handlePauseUpload,
    handleRemoveUpload,
    handleDelete,
    handleDownload,
    handleCreateDir,
    handleMountWithFileImg,
    handleBreadcrumbClick,
    handleOpenFile,
    getCompletedList,
    getFtFileSystemInfo,
    syncGetFileTransferState,
    startParamsFn,
    onStartUpload,
    onProgressUpload,
    onSuccessUpload,
    setState,
    truncateBytes,

    // Refs
    currentPathRef,

    // Logger
    logger,
  }
}

export type UseVirtualUsbDriveReturn = ReturnType<typeof useVirtualUsbDrive>
