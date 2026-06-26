/**
 * useFileDownload
 *
 * A semantic file download hook, currently based on WebRTC implementation,
 * can be extended to support HTTP downloads in the future.
 *
 * Design Goals:
 * - Avoid exposing transport details (WebRTC/HTTP), callers only care about download lifecycle events
 * - Encapsulate existing useWebRtcFile to avoid direct dependencies everywhere
 */

import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useRTCStore } from '@/stores';
import type { TransferSnapshot } from '@/utils/transfer';
import { calculateTransferStats } from '@/utils/transfer';
import { useCallback, useRef } from 'react';
/** Transfer task state */
export type TransferState = 'pending' | 'running' | 'paused' | 'done' | 'failed'
/** Transfer direction */
export type TransferDirection = 'upload' | 'download'

/** Transfer source */
export type TransferSource = 'virtual-usb' | 'storage'

/**
 * File transfer task - Core fields
 */
export interface TransferItem {
  path: string
  name: string
  totalBytes: number
  transferredBytes: number
  progress: number
}

/**
 * Transfer task - Runtime fields
 */
export interface TransferRuntimeFields {
  state: TransferState
  speedBps: number
  dataChannel?: string
  errorMessage?: string
  // Formatted strings
  totalFormatted?: string
  transferredFormatted?: string
  progressFormatted?: string
  speedFormatted?: string
}

/**
 * Transfer task - Persist metadata
 */
export interface TransferPersistMeta {
  id: string
  createdAt: number
  updatedAt: number
  direction?: TransferDirection
  source?: TransferSource
  deviceId?: string
}

/**
 * Download task complete structure
 * = TransferItem + TransferPersistMeta + TransferRuntimeFields
 */
export type DownloadTask = TransferItem &
  TransferPersistMeta &
  TransferRuntimeFields

/** Download task input (from caller) */
export interface DownloadFileInput {
  name: string
  path: string
  totalBytes?: number
}

/** useFileDownload options */
export interface UseFileDownloadOptions {
  maxConcurrency?: number
  onStart?: (task: DownloadTask) => void
  onProgress?: (task: DownloadTask) => void
  onComplete?: (task: DownloadTask) => void
  onError?: (task: DownloadTask, error?: unknown) => void
}
/** Generate task ID */
export const generateTaskId = (name: string, path: string) =>
  `${path}/${name}`.replace('//', '/');

export function useFileDownload(opts: UseFileDownloadOptions = {}) {
  const peerConnection = useRTCStore(s => s.peerConnection);
  const { onStart, onProgress, onComplete, onError, maxConcurrency = 3 } = opts;

  // RPC
  const [, , sendAsync] = useJsonRpc();

  // Internal state
  const tasksRef = useRef<Map<string, DownloadTask>>(new Map());
  // Concurrency control
  const runningCountRef = useRef(0);
  const pendingQueueRef = useRef<DownloadTask[]>([]);
  // WebRTC channel mapping
  const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  // Receive buffers (stored by dataChannel label)
  const buffersRef = useRef<Map<string, ArrayBuffer[]>>(new Map());
  // Channel metadata mapping (dataChannel label -> task id)
  const channelTaskMapRef = useRef<Map<string, string>>(new Map());
  // Speed calculation snapshots (one per task)
  const snapshotsRef = useRef<Map<string, TransferSnapshot>>(new Map());
  // Whether listener is registered
  const listenerAddedRef = useRef(false);

  // =====================================================
  // Concurrency Queue Processing
  // =====================================================

  const processQueue = useCallback(async () => {
    while (
      runningCountRef.current < maxConcurrency &&
      pendingQueueRef.current.length > 0
    ) {
      const task = pendingQueueRef.current.shift();
      if (!task) break;

      runningCountRef.current++;

      try {
        // Call device to start download
        const res = await sendAsync(
          {
            method: 'startFtFsDownload',
            params: { path: task.path, name: task.name },
          },
          { showUnhandledErrorToast: true }
        );

        if (res.error) {
          // Request failed
          task.state = 'failed';
          task.errorMessage = String(res.error);
          task.updatedAt = Date.now();
          runningCountRef.current--;
          onError?.(task, res.error);
          // Continue processing next task in queue
          processQueue();
        } else if (res.result?.dataChannel) {
          // Request succeeded, waiting for device to create datachannel
          task.state = 'running';
          task.dataChannel = res.result.dataChannel;
          task.updatedAt = Date.now();
          onStart?.(task);
        } else {
          // RPC succeeded but no dataChannel, mark as failed
          task.state = 'failed';
          task.errorMessage = 'No dataChannel returned from device';
          task.updatedAt = Date.now();
          runningCountRef.current--;
          onError?.(task, new Error('No dataChannel'));
          // Continue processing next task in queue
          processQueue();
        }
      } catch (err) {
        task.state = 'failed';
        task.errorMessage = err instanceof Error ? err.message : String(err);
        task.updatedAt = Date.now();
        runningCountRef.current--;
        onError?.(task, err);
        // Continue processing next task in queue
        processQueue();
      }
    }
  }, [maxConcurrency, sendAsync, onStart, onError]);

  // =====================================================
  // WebRTC DataChannel Listener
  // =====================================================
  const updateDownLoadFileProgress = (task: DownloadTask) => {
    // Progress update callback
    onProgress?.(task);

    // Ref useWebRtcFile: actively complete download when progress reaches 100%
    if (task.progress >= 100 && task.state === 'running') {
      const channelLabel = task.dataChannel;
      if (!channelLabel) return;

      // 1. Mark as completed
      task.state = 'done';
      task.progressFormatted = '100%';
      task.updatedAt = Date.now();

      // 2. Save file to local
      const buffers = buffersRef.current.get(channelLabel);
      if (buffers && buffers.length > 0) {
        const blob = new Blob(buffers);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = task.name;
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }

      // 3. Trigger completion callback
      onComplete?.(task);

      // 4. Close channel
      const channel = channelsRef.current.get(channelLabel);
      if (channel && channel.readyState === 'open') {
        try {
          channel.close();
        } catch (err) {
          console.warn('Close channel error:', err);
        }
      }

      // 5. Cleanup resources
      tasksRef.current.delete(task.id);
      buffersRef.current.delete(channelLabel);
      channelTaskMapRef.current.delete(channelLabel);
      channelsRef.current.delete(channelLabel);
      snapshotsRef.current.delete(task.id);

      // 6. Decrement concurrency count, continue queue
      runningCountRef.current--;
      processQueue();
    }
  };
  const handleDataChannel = useCallback(
    (evt: RTCDataChannelEvent) => {
      const channel = evt.channel;
      // Only handle download channels (prefixed with tf_download_)
      if (!channel || !channel.label.startsWith('tf_download_')) return;

      const channelLabel = channel.label;
      channelsRef.current.set(channelLabel, channel);

      channel.onmessage = (msgEvt: MessageEvent) => {
        const data = msgEvt.data;

        if (typeof data === 'string') {
          // JSON message: file metadata
          try {
            const json = JSON.parse(data);
            if (json.type === 'file_finished') {
              // File transfer completion signal
              return;
            }

            // File metadata: { name, path, size }
            const { name, path, size } = json;
            const taskId = generateTaskId(name, path);

            // Establish channel -> task mapping
            channelTaskMapRef.current.set(channelLabel, taskId);

            // Update task's dataChannel and totalBytes
            const task = tasksRef.current.get(taskId);
            if (task) {
              task.dataChannel = channelLabel;
              task.totalBytes = size;
              task.updatedAt = Date.now();
            }
          } catch {}
        } else if (data instanceof ArrayBuffer) {
          // Binary data: file content
          if (!buffersRef.current.has(channelLabel)) {
            buffersRef.current.set(channelLabel, []);
          }
          buffersRef.current.get(channelLabel)!.push(data);

          // Update progress
          const taskId = channelTaskMapRef.current.get(channelLabel);
          if (taskId) {
            const task = tasksRef.current.get(taskId);
            if (task) {
              // Accumulate transferred bytes
              task.transferredBytes += data.byteLength;
              task.updatedAt = Date.now();

              // Use calculateTransferStats to calculate speed and formatted fields
              const prevSnapshot = snapshotsRef.current.get(taskId) || null;
              const currentSnapshot: TransferSnapshot = {
                transferredBytes: task.transferredBytes,
                totalBytes: task.totalBytes,
                timestampMs: performance.now(),
                direction: 'download',
              };

              const stats = calculateTransferStats(
                prevSnapshot,
                currentSnapshot,
                {
                  smoothingAlpha: 0.3,
                  prevSmoothedSpeedBps: task.speedBps,
                }
              );

              // Update task fields
              task.progress = stats.progress;
              task.speedBps = stats.speedBps;
              task.totalFormatted = stats.totalFormatted;
              task.transferredFormatted = stats.transferredFormatted;
              task.progressFormatted = stats.progressFormatted;
              task.speedFormatted = stats.speedFormatted;

              // Save snapshot for next calculation
              snapshotsRef.current.set(taskId, currentSnapshot);
              updateDownLoadFileProgress(task);
            }
          }
        }
      };

      channel.onclose = () => {
        // Channel close event
        // Normal completion is handled in updateDownLoadFileProgress (progress 100%)
        // Only handle abnormal closure here
        const taskId = channelTaskMapRef.current.get(channelLabel);
        if (taskId) {
          const task = tasksRef.current.get(taskId);
          // If task is still running, it's an abnormal closure (not normal completion)
          if (task && task.state === 'running') {
            task.state = 'failed';
            task.errorMessage = 'Channel closed unexpectedly';
            task.updatedAt = Date.now();

            // Cleanup resources
            tasksRef.current.delete(taskId);
            buffersRef.current.delete(channelLabel);
            channelTaskMapRef.current.delete(channelLabel);
            channelsRef.current.delete(channelLabel);
            snapshotsRef.current.delete(taskId);

            onError?.(task, new Error('Channel closed unexpectedly'));

            // Decrement concurrency count, continue queue
            runningCountRef.current--;
            processQueue();
          }
        }
      };

      channel.onerror = () => {
        const taskId = channelTaskMapRef.current.get(channelLabel);
        if (taskId) {
          const task = tasksRef.current.get(taskId);
          if (task) {
            task.state = 'failed';
            task.errorMessage = 'DataChannel error';
            task.updatedAt = Date.now();
            onError?.(task, new Error('DataChannel error'));

            // Cleanup
            runningCountRef.current--;
            processQueue();
          }
        }
      };
    },
    [onProgress, onComplete, onError, processQueue]
  );

  // =====================================================
  // Public API
  // =====================================================

  const downloadFile = useCallback(
    async (fileList: DownloadFileInput[]) => {
      if (!fileList || fileList.length === 0) return;

      // Register datachannel listener (only once)
      if (!listenerAddedRef.current && peerConnection) {
        peerConnection.addEventListener('datachannel', handleDataChannel);
        listenerAddedRef.current = true;
      }

      // Create tasks and add to queue
      for (const file of fileList) {
        const taskId = generateTaskId(file.name, file.path);
        // Avoid duplicate additions
        if (tasksRef.current.has(taskId)) continue;

        const task: DownloadTask = {
          // TransferItem core fields
          path: file.path,
          name: file.name,
          totalBytes: file.totalBytes || 0,
          transferredBytes: 0,
          progress: 0,
          // TransferPersistMeta persist metadata
          id: taskId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          direction: 'download',
          source: 'storage',
          // TransferRuntimeFields runtime fields
          state: 'pending',
          speedBps: 0,
        };

        tasksRef.current.set(taskId, task);
        pendingQueueRef.current.push(task);
      }

      // Start processing queue
      processQueue();
    },
    [peerConnection, handleDataChannel, processQueue]
  );

  /** Cancel down */
  const downloadFileCancel = useCallback(
    (taskId: string) => {
      const task = tasksRef.current.get(taskId);
      if (!task) return;

      // close dataChannel
      if (task.dataChannel) {
        const channel = channelsRef.current.get(task.dataChannel);
        if (channel) {
          try {
            channel.close();
          } catch {}
          channelsRef.current.delete(task.dataChannel);
        }
        buffersRef.current.delete(task.dataChannel);
        channelTaskMapRef.current.delete(task.dataChannel);
      }
      task.state = 'paused';
      task.updatedAt = Date.now();

      if (task.state === 'running') {
        runningCountRef.current--;
        processQueue();
      }
    },
    [processQueue]
  );

  /** Get download list */
  const downloadFileList = useCallback(() => {
    return Array.from(tasksRef.current.values());
  }, []);

  return [downloadFile, downloadFileCancel, downloadFileList] as const;
}
