
export type TransferDirection = 'upload' | 'download'
export type TransferSnapshot = {
  transferredBytes: number
  totalBytes?: number
  timestampMs: number
  direction?: TransferDirection
}

export type TransferStats = {
  /** Total file size in bytes. */
  totalBytes: number

  /** Transferred bytes. */
  transferredBytes: number

  /** Progress percentage (0-100). */
  progress: number

  /** Transfer speed in bytes per second. */
  speedBps: number

  /** Formatted total size. */
  totalFormatted: string

  /** Formatted transferred size. */
  transferredFormatted: string

  /** Formatted progress. */
  progressFormatted: string

  /** Formatted transfer speed. */
  speedFormatted: string

  /** Byte delta since the previous update. */
  deltaBytes: number

  /** Time delta since the previous update, in seconds. */
  deltaSeconds: number

  /** Whether the transfer is complete. */
  isComplete: boolean
}
export type CalculateOptions = {
  /** Default value for progress when totalBytes is unavailable (default: 0). */
  progressWhenTotalUnknown?: number

  /** Speed smoothing factor (EMA): 0 = no smoothing; 0.2 to 0.3 is commonly used. */
  smoothingAlpha?: number

  /** Previous smoothed speed in bytes per second. */
  prevSmoothedSpeedBps?: number
}
// =====================
// Helpers
// =====================
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(n: number, digits: number) {
  const p = Math.pow(10, digits);
  return Math.round(n * p) / p;
}

/** bytes -> "KB/MB/GB" */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const digits = i === 0 ? 0 : v < 10 ? 2 : v < 100 ? 1 : 0;
  return `${roundTo(v, digits)} ${units[i]}`;
}

/** bytes/sec -> "MB/s" */
export function formatSpeedBps(speedBps: number): string {
  if (!Number.isFinite(speedBps) || speedBps <= 0) return '0 B/s';
  return `${formatBytes(speedBps)}/s`;
}

/**
 * Generic transfer stats:
 * - HTTP upload: prev = { loaded, timeStamp, total }, current = { loaded, timeStamp, total }
 * - WebRTC upload/download: prev = { bytesDone, timestampMs, totalBytes }, current = ...
 */

/**
 * Calculates transfer statistics.
 * @param prev Previous snapshot. Pass `null` for the first call.
 * @param current Current snapshot.
 * @param options Optional settings, such as smoothing factor.
 * @returns Calculated transfer statistics.
 */
export function calculateTransferStats(
  prev: TransferSnapshot | null,
  current: TransferSnapshot,
  options: CalculateOptions = {}
): TransferStats {
  const totalBytes = Math.max(0, current.totalBytes ?? 0);
  const transferredBytes = Math.max(0, current.transferredBytes);

  // Time delta (seconds)
  const prevTs = prev?.timestampMs ?? current.timestampMs;
  const deltaMs = current.timestampMs - prevTs;
  const deltaSeconds = deltaMs > 0 ? deltaMs / 1000 : 0;

  // Byte delta
  const prevBytes = prev?.transferredBytes ?? transferredBytes;
  const deltaBytes = transferredBytes - prevBytes;

  // Instant speed (bytes/sec)
  let speedBps =
    deltaSeconds > 0 && deltaBytes > 0 ? deltaBytes / deltaSeconds : 0;

  //  Optional: smooth speed with EMA
  const alpha = clamp(options.smoothingAlpha ?? 0, 0, 1);
  if (alpha > 0) {
    const prevSmooth = options.prevSmoothedSpeedBps ?? speedBps;
    speedBps = alpha * speedBps + (1 - alpha) * prevSmooth;
  }
  let progress: number;
  if (totalBytes > 0) {
    progress = clamp((transferredBytes / totalBytes) * 100, 0, 100);
  } else {
    progress = options.progressWhenTotalUnknown ?? 0;
  }

  const isComplete = totalBytes > 0 ? transferredBytes >= totalBytes : false;

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
  };
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

/**
 * Merges pending file metadata with active upload tasks.
 * Combines initial file states with real-time transfer data.
 *
 * @param pendingList List of files awaiting or just starting upload
 * @param uploadList List of currently active upload tasks
 * @returns Unified list of transfer items
 */
export function mergeUploadLists(
  pendingList: PendingFile[],
  uploadList: UploadTask[]
): TransferItem[] {
  const uploadMap = new Map<string, UploadTask>();

  uploadList.forEach(task => {
    uploadMap.set(task.name, task);
  });
  return pendingList.map(file => {
    const task = uploadMap.get(file.filename);
    if (task?.state==='running') {
      // ✅ Active task: Use real-time data from the upload task
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
      };
    }

    // ⚠️ Initial state: File is not yet in the active upload queue.
    // Device list returns `size` (already-transferred bytes) and
    // `totalBytes` (full file size) for .incomplete files. Derive
    // transferredBytes/progress from `size` when available so paused
    // tasks show their real progress instead of 0%.

    const transferredBytes = Number(file.size) > 0 ? Number(file.size) : 0;
    const totalBytes = Number(file.totalBytes) > 0 ? Number(file.totalBytes) : 0;
    const progress = totalBytes
      ? Math.min(100, +((transferredBytes / totalBytes) * 100).toFixed(2))
      : 0;
    return {
      id: file.filename,
      createdAt: new Date(file.createdAt).getTime(),
      updatedAt: Date.now(),
      source: 'storage',
      direction: 'upload',
      path: '/',
      name: file.filename,
      totalBytes,
      transferredBytes,
      progress,
      speedBps: 0,
      state: 'paused',
    };
  });
}
