// =====================
// Types
// =====================

export type TransferDirection = 'upload' | 'download'

export type TransferSnapshot = {
  transferredBytes: number

  totalBytes?: number

  timestampMs: number

  direction?: TransferDirection
}

export type TransferStats = {
  totalBytes: number

  transferredBytes: number

  progress: number

  speedBps: number

  totalFormatted: string

  transferredFormatted: string

  progressFormatted: string

  speedFormatted: string

  deltaBytes: number

  deltaSeconds: number

  isComplete: boolean
}

export type CalculateOptions = {
  progressWhenTotalUnknown?: number

  smoothingAlpha?: number

  prevSmoothedSpeedBps?: number
}

// =====================
// Helpers
// =====================
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function roundTo(n: number, digits: number) {
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}

/** bytes -> "KB/MB/GB" */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  const digits = i === 0 ? 0 : v < 10 ? 2 : v < 100 ? 1 : 0
  return `${roundTo(v, digits)} ${units[i]}`
}

/** bytes/sec -> "MB/s" */
export function formatSpeedBps(speedBps: number): string {
  if (!Number.isFinite(speedBps) || speedBps <= 0) return '0 B/s'
  return `${formatBytes(speedBps)}/s`
}

// =====================
// Core
// =====================

export function calculateTransferStats(
  prev: TransferSnapshot | null,
  current: TransferSnapshot,
  options: CalculateOptions = {}
): TransferStats {
  const totalBytes = Math.max(0, current.totalBytes ?? 0)
  const transferredBytes = Math.max(0, current.transferredBytes)

  const prevTs = prev?.timestampMs ?? current.timestampMs
  const deltaMs = current.timestampMs - prevTs
  const deltaSeconds = deltaMs > 0 ? deltaMs / 1000 : 0

  const prevBytes = prev?.transferredBytes ?? transferredBytes
  const deltaBytes = transferredBytes - prevBytes

  let speedBps =
    deltaSeconds > 0 && deltaBytes > 0 ? deltaBytes / deltaSeconds : 0

  const alpha = clamp(options.smoothingAlpha ?? 0, 0, 1)
  if (alpha > 0) {
    const prevSmooth = options.prevSmoothedSpeedBps ?? speedBps
    speedBps = alpha * speedBps + (1 - alpha) * prevSmooth
  }

  let progress: number
  if (totalBytes > 0) {
    progress = clamp((transferredBytes / totalBytes) * 100, 0, 100)
  } else {
    progress = options.progressWhenTotalUnknown ?? 0
  }

  const isComplete = totalBytes > 0 ? transferredBytes >= totalBytes : false

  return {
    totalBytes,
    transferredBytes,
    progress: roundTo(progress, 1),

    speedBps,
    speedFormatted: formatSpeedBps(speedBps),

    totalFormatted: formatBytes(totalBytes),
    transferredFormatted: formatBytes(transferredBytes),
    progressFormatted: `${roundTo(progress, 1)}%`,

    deltaBytes,
    deltaSeconds,
    isComplete,
  }
}
type PendingFile = {
  createdAt: string
  filename: string
  size: number
  totalBytes: number
}

type UploadTask = {
  id: string
  createdAt: number
  updatedAt: number
  source: string
  direction: string
  path: string
  name: string
  totalBytes: number
  transferredBytes: number
  progress: number
  speedBps: number
  state: string
}

type TransferItem = {
  id: string
  createdAt: number
  updatedAt: number
  source: 'storage'
  direction: 'upload'
  path: string
  name: string
  totalBytes: number
  transferredBytes: number
  progress: number
  speedBps: number
  state: string
}

export function mergeUploadLists(
  pendingList: PendingFile[],
  uploadList: UploadTask[]
): TransferItem[] {
  const uploadMap = new Map<string, UploadTask>()

  uploadList.forEach(task => {
    uploadMap.set(task.name, task)
  })

  return pendingList.map(file => {
    const task = uploadMap.get(file.filename)

    if (task) {
      return {
        id: task.id,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        source: 'storage',
        direction: 'upload',
        path: task.path,
        name: task.name,
        totalBytes: task.totalBytes,
        transferredBytes: task.transferredBytes,
        progress: task.progress,
        speedBps: task.speedBps,
        state: task.state,
      }
    }

    return {
      id: file.filename,
      createdAt: new Date(file.createdAt).getTime(),
      updatedAt: Date.now(),
      source: 'storage',
      direction: 'upload',
      path: '/',
      name: file.filename,
      totalBytes: file.totalBytes,
      transferredBytes: 0,
      progress: 0,
      speedBps: 0,
      state: 'paused',
    }
  })
}
