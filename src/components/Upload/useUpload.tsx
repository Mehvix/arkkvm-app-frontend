/**
 * Core upload hook — encapsulates all upload state, refs, and handlers.
 *
 * Supports two transport modes:
 * - **WebRTC DataChannel** (default): backpressure-controlled chunked transfer
 * - **HTTP POST** (device target with httpUploadUrl): XHR-based upload
 */
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useAppStore, useRTCStore } from '@/stores';
import { env } from '@/utils/env';
import { createLogger } from '@/utils/logger';
import { calculateTransferStats } from '@/utils/transfer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    CHUNK_SIZE,
    CHUNKS_PER_TICK,
    DEFAULT_HIGH_WATER_MARK,
    DEFAULT_LOW_WATER_MARK,
    FINALIZE_TIMEOUT,
} from './constants';
import type {
    UploadDetail,
    UploadDropZoneProps,
    UploadState
} from './types';
import { INITIAL_UPLOAD_DETAIL } from './types';
import {
    acquireUploadLock,
    dequeueNextFile,
    pausedFiles,
    releaseUploadLock,
    uploadQueue,
} from './uploadLock';

const logger = createLogger('Upload');

// ─── Type alias for the transfer snapshot (from @/utils/transfer) ────────
type TransferSnapshot = Parameters<typeof calculateTransferStats>[1]

/**
 * Return value of the useUpload hook.
 */
export interface UseUploadReturn {
  /** Current upload state */
  uploadState: UploadState
  /** Real-time upload detail for progress display */
  currentUploadDetail: UploadDetail
  /** Current file name being uploaded */
  fileName: string | null
  /** Whether the component is in dragging state */
  dragging: boolean
  /** Ref for the hidden file input */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Ref for file picker guard */
  pickingRef: React.MutableRefObject<boolean>
  /** Ref to the active WebRTC DataChannel (null when idle) */
  rtcDataChannelRef: React.RefObject<RTCDataChannel | null>
  /** Pause the current upload (closes DataChannel, emits onPause) */
  pauseUpload: () => void
  /** Cancel the current upload (closes channel, releases lock, resets state) */
  cancelUpload: () => void
  /** Start uploading a file */
  handleUploadStart: (file: File) => void
  /** Handle drag over */
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  /** Handle drag enter */
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  /** Handle drag leave */
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  /** Handle drop */
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  /** Handle file selected from input */
  handleFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Core upload hook.
 */
export function useUpload(props: UploadDropZoneProps): UseUploadReturn {
  const {
    isDragging,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onFileSelected,
    onSuccess,
    onError,
    onStart,
    onProgress,
    startMethod = 'startStorageFileUpload',
    httpUploadUrl = '',
    disabled = false,
    resumeFileName,
    size: _initSize,
    totalBytes: _initTotalBytes,
    onStateChange,
    startParams,
    onPause,
    lowWaterMark = DEFAULT_LOW_WATER_MARK,
    highWaterMark = DEFAULT_HIGH_WATER_MARK,
    maxFileSize,
    beforeUpload,
    accept,
  } = props;

  // ── File type validation helper ─────────────────────────────
  const isFileAccepted = useCallback(
    (file: File): boolean => {
      if (!accept || accept === '*') return true;
      const tokens = accept.split(',').map(t => t.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return tokens.some(token => {
        if (token.startsWith('.')) {
          return fileName.endsWith(token);
        }
        if (token.includes('/')) {
          if (token.endsWith('/*')) {
            return fileType.startsWith(token.replace('/*', '/'));
          }
          return fileType === token;
        }
        return false;
      });
    },
    [accept]
  );

  // ── RTC connection ─────────────────────────────────────────
  const peerConnection = useRTCStore(s => s.peerConnection);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  useEffect(() => {
    pcRef.current = peerConnection ?? null;
  }, [peerConnection]);

  // ── Upload state ───────────────────────────────────────────
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const [currentUploadDetail, setCurrentUploadDetail] =
    useState<UploadDetail>(INITIAL_UPLOAD_DETAIL);

  // ── Refs ───────────────────────────────────────────────────
  const rtcDataChannelRef = useRef<RTCDataChannel | null>(null);
  const prev = useRef(null);
  const uploadChannelLabelRef = useRef<string>('');
  const pickingRef = useRef(false);
  const startingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadStartRef = useRef<(file: File) => void>(null as any);
  const pendingFilesRef = useRef<File[]>([]);
  const currentUploadedRef = useRef(0);
  const speedTimerRef = useRef<number | undefined>(undefined);

  // ── Latest-ref for external callbacks (prevent stale closures) ──
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // ── Store actions ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registerUpload = useAppStore((s: any) => s.registerUpload);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unregisterUpload = useAppStore((s: any) => s.unregisterUpload);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setUploadController = useAppStore((s: any) => s.setUploadController);
  const removeUploadController = useAppStore(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.removeUploadController
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUploadController = useAppStore((s: any) => s.getUploadController);

  // ── JSON-RPC ───────────────────────────────────────────────
  const [, , sendAsync] = useJsonRpc(undefined, {
    showUnhandledErrorToast: true,
  });

  // ── Helpers ────────────────────────────────────────────────
  const stopSpeedMeter = useCallback(() => {
    if (speedTimerRef.current) {
      clearInterval(speedTimerRef.current);
      speedTimerRef.current = undefined;
    }
  }, []);


  const runPreUploadGuard = useCallback(
    async (file: File) => {
      if (beforeUpload) {
        try {
          const beforeUploadResult = await Promise.resolve(beforeUpload(file));
          return beforeUploadResult;
        } catch (error: unknown) {
          logger.warn('beforeUpload threw error', error);
          toast.error(error instanceof Error ? error.message : 'Upload blocked by beforeUpload');
          return false;
        }
      }



      return true;
    },
    [beforeUpload]
  );

  // ── Effects ────────────────────────────────────────────────

  // Reset picking guard when window regains focus (user cancels picker)
  useEffect(() => {
    const onFocus = () => {
      pickingRef.current = false;
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // If resuming and a controller with an open channel exists, attach listeners to update progress
  useEffect(() => {
    const candidates = [
      resumeFileName,
      resumeFileName ? `${resumeFileName}.incomplete` : undefined,
      fileName || undefined,
    ].filter(Boolean) as string[];
    if (!candidates.length || !getUploadController) return;
    const ctrl = candidates.map(k => getUploadController(k)).find(c => !!c);
    const ch: RTCDataChannel | undefined | null = ctrl?.channel;
    if (!ch || ch.readyState !== 'open') return;
    setUploadState('uploading');

    const onMsg = (e: MessageEvent) => {
      try {
        const { AlreadyUploadedBytes } = JSON.parse(e.data) as {
          AlreadyUploadedBytes: number
          Size: number
        };
        const safeUploaded = Math.max(
          currentUploadedRef.current || 0,
          AlreadyUploadedBytes || 0
        );

        currentUploadedRef.current = safeUploaded;
      } catch {}
    };
    ch.addEventListener('message', onMsg);
    rtcDataChannelRef.current = ch;

    return () => {
      ch.removeEventListener('message', onMsg);
      stopSpeedMeter();
    };
  }, [resumeFileName, getUploadController]);

  // Notify parent of state changes (skip initial mount)
  const onStateChangeRef = useRef<typeof onStateChange>();
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);
  const prevStateRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!onStateChangeRef.current) {
      prevStateRef.current = uploadState;
      return;
    }
    const prev = prevStateRef.current;
    prevStateRef.current = uploadState;
    if (prev !== undefined && prev !== uploadState) {
      onStateChangeRef.current?.(uploadState);
    }
  }, [uploadState]);

  // ── HTTP Upload Handler ────────────────────────────────────
  const handleUploadHttp = useCallback(
    async (
      file: File,
      alreadyUploadedBytes: number = 0,
      dataChannel: RTCDataChannel | null = null
    ) => {
      // Extract uploadId from dataChannel (can be string or object with label property)
      const uploadId = dataChannel
        ? (typeof dataChannel === 'string' ? dataChannel : dataChannel?.label || 'http')
        : 'http';
      const uploadUrl = `${env.apiBaseUrl}${httpUploadUrl}?uploadId=${encodeURIComponent(uploadId)}`;

      logger.info('HTTP upload URL', { uploadUrl, uploadId, dataChannel });

      return new Promise<void>(resolve => {
        try {
          setUploadState('uploading');
          const xhr = new XMLHttpRequest();

          // Register controller for HTTP upload
          setUploadController?.(file.name, {
            pause: () => {
              logger.info('Pause: aborting HTTP upload', {
                file: file.name,
                uploadedBytes: alreadyUploadedBytes,
              });

              // Abort XHR
              try {
                if (xhr.readyState !== XMLHttpRequest.UNSENT && xhr.readyState !== XMLHttpRequest.DONE) {
                  xhr.abort();
                }
              } catch {}

              // Release lock and process queue
              releaseUploadLock();
              stopSpeedMeter();

              try {
                removeUploadController?.(file.name);
              } catch {}

              setUploadState('idle');
              onPause?.({
                name: file.name,
                transferredBytes: alreadyUploadedBytes,
                totalBytes: file.size,
              });

              // Process next queued file
              const nextFile = dequeueNextFile();
              if (nextFile) {
                setTimeout(() => {
                  nextFile.onReady(
                    nextFile.file,
                    nextFile.channelLabel,
                    nextFile.alreadyUploadedBytes,
                    nextFile.dataChannel
                  );
                }, 100);
              }
            },
            resume: () => logger.warn('HTTP upload resume not supported'),
            cancel: () => {
              try {
                if (xhr.readyState !== XMLHttpRequest.UNSENT && xhr.readyState !== XMLHttpRequest.DONE) {
                  xhr.abort();
                }
              } catch {}
            },
            getState: () => {
              const isActive = xhr.readyState >= XMLHttpRequest.OPENED && xhr.readyState < XMLHttpRequest.DONE;
              return { readyState: isActive ? 'open' : 'closed' };
            },
          });

          xhr.open('POST', uploadUrl, true);
          const csrfToken = sessionStorage.getItem('csrfToken') ?? '';
          if (csrfToken) {
            xhr.setRequestHeader('X-CSRF-Token', csrfToken);
          }

          currentUploadedRef.current = alreadyUploadedBytes;

          xhr.upload.onprogress = event => {
            // Add alreadyUploadedBytes to show correct total progress
            const current: TransferSnapshot = {
              transferredBytes: alreadyUploadedBytes + event.loaded,
              totalBytes: file.size,
              timestampMs: event.timeStamp,
              direction: 'upload',
            };

            const stats = calculateTransferStats(prev.current, current);

            onProgressRef.current?.({ name: file.name, ...stats });
            setCurrentUploadDetail(prev => ({
              ...prev,
              ...stats,
            }));

            prev.current = current;
          };

          xhr.onload = () => {
            const responseCsrfToken = xhr.getResponseHeader('X-CSRF-Token') ||
              xhr.getResponseHeader('x-csrf-token') ||
              xhr.getResponseHeader('X-CSRF-Token');
            if (responseCsrfToken) {
              sessionStorage.setItem('csrfToken', responseCsrfToken);
            }
            if (xhr.status === 200) {
              setUploadState('success');
              onSuccessRef.current?.(file);

              try {
                unregisterUpload?.(file.name);
              } catch {}
              try {
                removeUploadController?.(file.name);
              } catch {}

              stopSpeedMeter();
              releaseUploadLock();

              const nextFile = dequeueNextFile();
              if (nextFile) {
                setTimeout(() => nextFile.onReady(nextFile.file, nextFile.channelLabel, nextFile.alreadyUploadedBytes, nextFile.dataChannel), 100);
              }

              resolve();
            } else {
              logger.error('HTTP upload failed', {
                status: xhr.status,
                statusText: xhr.statusText,
              });

              toast.error(`Upload failed: ${xhr.status} ${xhr.statusText}`);

              // Immediately cleanup for failed uploads (404, etc.) - don't set error state
              stopSpeedMeter();
              releaseUploadLock();

              try {
                removeUploadController?.(file.name);
              } catch {}

              // Immediately remove from UI for failed uploads
              try {
                unregisterUpload?.(file.name);
              } catch {}

              onErrorRef.current?.({ name: file.name, error: `${xhr.status} ${xhr.statusText}` });

              const nextFail = dequeueNextFile();
              if (nextFail) {
                setTimeout(() => nextFail.onReady(nextFail.file, nextFail.channelLabel, nextFail.alreadyUploadedBytes, nextFail.dataChannel), 100);
              }

              resolve();
            }
          };

          xhr.onerror = () => {
            logger.error('HTTP upload XHR error', {
              status: xhr.statusText,
              file: file.name,
            });

            toast.error(`Upload failed: ${xhr.statusText}`);

            // Immediately cleanup for failed uploads - don't set error state
            stopSpeedMeter();
            releaseUploadLock();

            try {
              removeUploadController?.(file.name);
            } catch {}

            // Immediately remove from UI for failed uploads
            try {
              unregisterUpload?.(file.name);
            } catch {}

            onErrorRef.current?.({ name: file.name, error: xhr.statusText });

            const nextXhrErr = dequeueNextFile();
            if (nextXhrErr) {
              setTimeout(() => nextXhrErr.onReady(nextXhrErr.file, nextXhrErr.channelLabel, nextXhrErr.alreadyUploadedBytes, nextXhrErr.dataChannel), 100);
            }

            resolve();
          };

          // Continue sending from already uploaded offset
          const blob = file.slice(alreadyUploadedBytes);
          xhr.send(blob);

        } catch (e: unknown) {
          toast.error('Upload failed');

          // Immediately cleanup for failed uploads - don't set error state
          stopSpeedMeter();
          releaseUploadLock();

          try {
            removeUploadController?.(file.name);
          } catch {}

          // Immediately remove from UI for failed uploads
          try {
            unregisterUpload?.(file.name);
          } catch {}

          onErrorRef.current?.({ name: file.name, error: e instanceof Error ? e.message : 'Unknown error' });

          const nextCatchErr = dequeueNextFile();
          if (nextCatchErr) {
            setTimeout(() => nextCatchErr.onReady(nextCatchErr.file, nextCatchErr.channelLabel, nextCatchErr.alreadyUploadedBytes, nextCatchErr.dataChannel), 100);
          }

          resolve();
        }
      });
    },
    [sendAsync, stopSpeedMeter]
  );

  // ── WebRTC Upload Handler ──────────────────────────────────
  const handleUploadWebRTC = useCallback(
    async (
      file: File,
      alreadyUploadedBytes: number = 0,
      dataChannelLabel: string | null = null
    ) => {
      // Clear pause marker for this file (avoid stale marker blocking re-upload of same filename)
      pausedFiles.delete(file.name);

      const pc = pcRef.current;
      logger.info('Creating upload DataChannel', {
        label: dataChannelLabel || 'upload',
        file: file.name,
        size: file.size,
        alreadyUploadedBytes,
        pcState: pc?.connectionState,
        pcIceState: pc?.iceConnectionState,
      });
      const rtcDataChannel = pc?.createDataChannel(dataChannelLabel || 'upload');
      if (!rtcDataChannel) {
        logger.error('Failed to create data channel for file upload');
        toast.error('Failed to create data channel for file upload');
        return;
      }
      rtcDataChannel.binaryType = 'arraybuffer';
      rtcDataChannelRef.current = rtcDataChannel;
      uploadChannelLabelRef.current = dataChannelLabel || rtcDataChannel.label;

      // user controlled pause flag
      const userPauseRef = { current: false } as { current: boolean };
      rtcDataChannel.bufferedAmountLowThreshold = lowWaterMark;

      // Refs shared across handlers
      const sentOffsetRef = { current: alreadyUploadedBytes } as {
        current: number
      };
      const lastAckBytesRef = { current: alreadyUploadedBytes } as {
        current: number
      };

      // ── Finish helpers ─────────────────────────────────────
      const finishedRef = { current: false } as { current: boolean };
      let finalizeTimer: number | undefined;
      const clearFinalizeTimer = () => {
        if (finalizeTimer) {
          clearTimeout(finalizeTimer);
          finalizeTimer = undefined;
        }
      };

      const finishSuccess = () => {
        const finishIfDrained = () => {
          if (rtcDataChannel.readyState === 'closed') return;
          if (rtcDataChannel.bufferedAmount === 0) {
            try {
              rtcDataChannel.close();
            } catch {}
            finishedRef.current = true;
            releaseUploadLock();
            setUploadState('success');
            onSuccessRef.current?.(file);
            try {
              unregisterUpload?.(file.name);
            } catch {}
            // Process next queued file
            const nextFile = dequeueNextFile();
            if (nextFile) setTimeout(() => nextFile.onReady(nextFile.file, nextFile.channelLabel, nextFile.alreadyUploadedBytes, nextFile.dataChannel), 100);
            return;
          }
          requestAnimationFrame(finishIfDrained);
        };
        finishIfDrained();
      };

      // Hoisted to outer scope so onmessage can access them
      let waitingForAck = false;
      let sendNextChunkFn: (() => void) | null = null;

      // ── onopen: start chunked send loop ────────────────────
      rtcDataChannel.onopen = () => {

        logger.info('Upload channel opened', {
          label: rtcDataChannel.label,
          id: rtcDataChannel.id,
          protocol: rtcDataChannel.protocol,
          readyState: rtcDataChannel.readyState,
          binaryType: rtcDataChannel.binaryType,
          bufferedAmountLowThreshold: rtcDataChannel.bufferedAmountLowThreshold,
        });
        setUploadState('uploading');

        uploadChannelLabelRef.current = dataChannelLabel || rtcDataChannel.label;
        // Register upload & expose controller
        try {
          registerUpload?.(file.name, {
            filename: file.name,
            channelLabel: dataChannelLabel || rtcDataChannel.label,
            startedAt: Date.now(),
            size: file.size,
          });
          setUploadController?.(file.name, {
            pause: () => {
              logger.info('Pause: closing DataChannel to stop upload', {
                file: file.name,
                sentBytes: sentOffsetRef.current,
                channelState: rtcDataChannel.readyState,
              });
              pausedFiles.add(file.name);
              userPauseRef.current = true;

              // 1) Mark as finished to prevent duplicate onclose handling
              finishedRef.current = true;

              // 2) Clear finalize timer
              clearFinalizeTimer();

              // 3) Stop send-loop reference
              sendNextChunkFn = null;

              // 4) Close DataChannel and detach listeners to prevent leaks
              try {
                rtcDataChannel.onmessage = null;
                rtcDataChannel.onbufferedamountlow = null;
                rtcDataChannel.onerror = null;
                rtcDataChannel.onclose = null;
                rtcDataChannel.close();
              } catch {}

              // 5) Clean refs
              rtcDataChannelRef.current = null;

              // 6) Stop speed meter
              try { stopSpeedMeter(); } catch {}

              // 7) Release lock
              releaseUploadLock();

              // 8) Remove controller from store (release channel reference)
              try { removeUploadController?.(file.name); } catch {}

              // 9) Notify parent layer
              setUploadState('idle');
              onPause?.({
                name: file.name,
                transferredBytes: sentOffsetRef.current,
                totalBytes: file.size,
              });

              // 10) Dequeue next waiting file (lock already released)
              const nextPaused = dequeueNextFile();
              if (nextPaused) setTimeout(() => nextPaused.onReady(nextPaused.file, nextPaused.channelLabel, nextPaused.alreadyUploadedBytes, nextPaused.dataChannel), 100);
            },
            resume: () => {
              logger.warn('Resume not supported after channel close');
            },
            getState: () => ({
              paused: pausedFiles.has(file.name),
              buffered: rtcDataChannel.bufferedAmount,
              readyState: rtcDataChannel.readyState,
            }),
            channel: rtcDataChannel,
          });
        } catch {}

        // ── Send state ───────────────────────────────────────
        let offset = alreadyUploadedBytes;
        currentUploadedRef.current = offset;

        // ── Chunked send loop ────────────────────────────────
        const sendNextChunk = () => {
          // All bytes sent
          if (offset >= file.size) {
            sentOffsetRef.current = offset;
            logger.info('All bytes sent, waiting for device to close channel', {
              file: file.name,
              sentBytes: offset,
              fileSize: file.size,
              finishedRef: finishedRef.current,
              hasFinalizeTimer: !!finalizeTimer,
            });

            // if (!finalizeTimer) {
            //      console.log('upload success', FINALIZE_TIMEOUT)
            //   finalizeTimer = window.setTimeout(() => {
            //     if (!finishedRef.current) {
            //       logger.info('Finalize timeout, treating as success', {
            //         file: file.name,
            //         sentBytes: sentOffsetRef.current,
            //         ackedBytes: lastAckBytesRef.current,
            //       })
            //       finishSuccess()
            //     }
            //   }, FINALIZE_TIMEOUT)
            // }
            return;
          }

          // User paused
          if (pausedFiles.has(file.name) || userPauseRef.current) {
            logger.warn('[Upload] sendNextChunk blocked by pause', {
              file: file.name,
              pausedFilesHas: pausedFiles.has(file.name),
              userPauseRef: userPauseRef.current,
              offset,
              fileSize: file.size,
            });
            return;
          }

          // Channel closed
          if (rtcDataChannel.readyState !== 'open') return;

          // Batch send
          let chunksThisTick = 0;
          const sendBatch = () => {
            const end = Math.min(offset + CHUNK_SIZE, file.size);
            file.slice(offset, end).arrayBuffer().then(buffer => {
              if (rtcDataChannel.readyState !== 'open') return;

              try {
                rtcDataChannel.send(buffer);
              } catch {
                logger.warn('send() buffer full, will retry after drain', {
                  bufferedAmount: rtcDataChannel.bufferedAmount,
                  readyState: rtcDataChannel.readyState,
                  offset,
                });
                const retryCurrentChunk = () => {
                  if (rtcDataChannel.readyState !== 'open') return;
                  if (pausedFiles.has(file.name) || userPauseRef.current) return;
                  try {
                    rtcDataChannel.send(buffer);
                  } catch {
                    setTimeout(retryCurrentChunk, 50);  
                    return;
                  }
                  offset = end;
                  sentOffsetRef.current = offset;
                  currentUploadedRef.current = offset;
                  logger.info('[Upload] Retry succeeded, continuing', {
                    file: file.name,
                    offset,
                    fileSize: file.size,
                    done: offset >= file.size,
                  });
                  setTimeout(sendNextChunk, 0);
                };
                setTimeout(retryCurrentChunk, 50);
                return;
              }
              offset = end;
              sentOffsetRef.current = offset;
              currentUploadedRef.current = offset;

              if (offset >= file.size || pausedFiles.has(file.name) || userPauseRef.current) {
                sendNextChunk();
                return;
              }

              chunksThisTick++;
              if (chunksThisTick < CHUNKS_PER_TICK) {
                sendBatch();
              } else {
                setTimeout(sendNextChunk, 0);
              }
            });
          };
          sendBatch();
        };

        sendNextChunkFn = sendNextChunk;
        sendNextChunk();
      };

      // ── onmessage: device ACK ──────────────────────────────
      rtcDataChannel.onmessage = e => {
        try {
          const { AlreadyUploadedBytes: transferredBytes, Size: totalBytes } =
            JSON.parse(e.data) as { AlreadyUploadedBytes: number; Size: number };

          const current: TransferSnapshot = {
            transferredBytes,
            totalBytes,
            timestampMs: e.timeStamp || performance.now(),
            direction: 'upload',
          };
          const stats = calculateTransferStats(prev.current, current);
          setCurrentUploadDetail(prev => ({ ...prev, ...stats }));
          prev.current = current;
          onProgressRef.current?.({ name: file.name, ...stats });

          currentUploadedRef.current = transferredBytes;
          lastAckBytesRef.current = transferredBytes;

          if (transferredBytes >= totalBytes) {
            logger.info('[Upload] Finishing from ACK message', {
              file: file.name,
              transferredBytes,
              totalBytes,
              sentBytes: sentOffsetRef.current,
              fileSize: file.size,
            });
            if(finalizeTimer) clearTimeout(finalizeTimer);

            finalizeTimer = window.setTimeout(() => {
                if (!finishedRef.current) {

                  finishSuccess();
                }
              }, FINALIZE_TIMEOUT);
          }

          if (waitingForAck) {
            waitingForAck = false;
            if (!userPauseRef.current) sendNextChunkFn?.();
          }
        } catch {}
      };

      // ── onclose ────────────────────────────────────────────
      rtcDataChannel.onclose = () => {
        const totalSize = file.size;
        const sentBytes = sentOffsetRef.current;
        const ackedBytes = lastAckBytesRef.current;
        const buffered = rtcDataChannel.bufferedAmount;

        logger.warn('Upload channel closed', {
          file: file.name,
          totalSize,
          sentBytes,
          ackedBytes,
          buffered,
          finished: finishedRef.current,
        });

        clearFinalizeTimer();
        stopSpeedMeter();

        if (finishedRef.current) return;

        const locallyDone = sentBytes >= totalSize && totalSize > 0;
        const remotelyDone = ackedBytes >= totalSize && totalSize > 0;

        if (locallyDone || remotelyDone) {
          logger.info('[Upload] Finishing from onclose', {
            file: file.name,
            locallyDone,
            remotelyDone,
            sentBytes,
            ackedBytes,
            totalSize,
            fileSize: file.size,
          });

          // If device closes channel early (remotelyDone but !locallyDone),
          // delay success state by 500ms to leave time for final disk write
          const delayMs = remotelyDone && !locallyDone ? 500 : 0;


          setTimeout(() => {
            releaseUploadLock();
            setUploadState('success');
            onSuccessRef.current?.(file);
            try {
              removeUploadController?.(file.name);
            } catch {}
            const nextOk = dequeueNextFile();
            if (nextOk) setTimeout(() => nextOk.onReady(nextOk.file, nextOk.channelLabel, nextOk.alreadyUploadedBytes, nextOk.dataChannel), 100);
          }, delayMs);
          return;
        }

        logger.error('Upload channel closed unexpectedly', {
          file: file.name,
          totalSize,
          sentBytes,
          ackedBytes,
          buffered,
          progress: totalSize > 0 ? `${((ackedBytes / totalSize) * 100).toFixed(1)}%` : '0%',
        });
        releaseUploadLock();
        toast.error('Upload channel closed unexpectedly');
        setUploadState('error');
        try {
          unregisterUpload?.(file.name);
        } catch {}
        try {
          removeUploadController?.(file.name);
        } catch {}
        const nextClose = dequeueNextFile();
        if (nextClose) setTimeout(() => nextClose.onReady(nextClose.file, nextClose.channelLabel, nextClose.alreadyUploadedBytes, nextClose.dataChannel), 100);
      };

      // ── onerror ────────────────────────────────────────────
      rtcDataChannel.onerror = (event: Event) => {
        const rtcErr = (event as RTCErrorEvent)?.error;
        logger.error('RTC channel error', {
          file: file.name,
          errorDetail: rtcErr?.errorDetail,
          message: rtcErr?.message || String(event),
          sentBytes: sentOffsetRef.current,
          ackedBytes: lastAckBytesRef.current,
          channelState: rtcDataChannel.readyState,
        });
        toast.error(`Upload failed: ${rtcErr?.message || String(event)}`);
        releaseUploadLock();
        setUploadState('error');
        stopSpeedMeter();
        onErrorRef.current?.({ name: file.name, error: rtcErr?.message || String(event) });
        try {
          unregisterUpload?.(file.name);
        } catch {}
        try {
          removeUploadController?.(file.name);
        } catch {}
        const nextErr = dequeueNextFile();
        if (nextErr) setTimeout(() => nextErr.onReady(nextErr.file, nextErr.channelLabel, nextErr.alreadyUploadedBytes, nextErr.dataChannel), 100);
      };
    },
    [
      sendAsync,
      setUploadController,
      removeUploadController,
      lowWaterMark,
      highWaterMark,
    ]
  );

  // ── Start upload directly (skip RPC, used by queued items) ──
  const startUploadDirect = useCallback(
    async (file: File, channelLabel: string, alreadyUploadedBytes: number, dataChannel: string | RTCDataChannel | null) => {
      try {
        if (!acquireUploadLock()) {
          // Edge case: lock was acquired by another upload first; requeue
          uploadQueue.push({
            file, channelLabel, alreadyUploadedBytes, dataChannel,
            onReady: (f, cl, ab, dc) => startUploadDirectRef.current?.(f, cl, ab, dc),
          });
          return;
        }

        uploadChannelLabelRef.current = channelLabel;
        try {
          registerUpload?.(file.name, {
            filename: file.name,
            channelLabel,
            startedAt: Date.now(),
          });
        } catch {}

        if (env.target === 'device' && httpUploadUrl) {
          await handleUploadHttp(file, alreadyUploadedBytes, dataChannel);
        } else {
          await handleUploadWebRTC(file, alreadyUploadedBytes, channelLabel);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg || 'Upload start failed');
        onErrorRef.current?.({ name: file.name, error: errMsg || 'Upload start failed' });
        releaseUploadLock();
        const next = dequeueNextFile();
        if (next) setTimeout(() => next.onReady(next.file, next.channelLabel, next.alreadyUploadedBytes, next.dataChannel), 100);
      }
    },
    [sendAsync]
  );

  const startUploadDirectRef = useRef(startUploadDirect);
  startUploadDirectRef.current = startUploadDirect;

  // ── Upload Start Orchestrator ──────────────────────────────
  // First call RPC to obtain dataChannel.
  // Register/enqueue only when channel info is valid; otherwise reject directly.
  const handleUploadStart = useCallback(
    async (file: File) => {
      // Check if file already exists in upload task list
      const existingController = getUploadController?.(file.name);
      if (existingController) {
        toast.warning(`File "${file.name}" is already being uploaded`);
        return;
      }

      // Clear pause marker for this file (avoid stale marker blocking same-name re-upload)
      pausedFiles.delete(file.name);

      if (startingRef.current) {
        pendingFilesRef.current.push(file);

        return;
      }
      startingRef.current = true;

      const passedPreUploadGuard = await runPreUploadGuard(file);
      if (!passedPreUploadGuard) {
        startingRef.current = false;
        return;
      }

      // Check file size limit
      if (maxFileSize && file.size > maxFileSize) {
        const formatSize = (bytes: number) => {
          if (bytes < 1000) return `${bytes} B`;
          if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(2)} KB`;
          if (bytes < 1000 * 1000 * 1000) return `${(bytes / (1000 * 1000)).toFixed(2)} MB`;
          return `${(bytes / (1000 * 1000 * 1000)).toFixed(2)} GB`;
        };
        toast.error(
          `File size (${formatSize(file.size)}) exceeds the maximum allowed size of ${formatSize(maxFileSize)}`
        );
        startingRef.current = false;
        return;
      }


      try {
        // 1) Call RPC first to validate and obtain channel name
        const baseParams: Record<string, unknown> = { filename: file.name, size: file.size };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let extra: any = null;

        if (typeof startParams === 'function') {
          try {
            extra = await Promise.resolve(startParams(file));
          } catch (error) {
            logger.warn('startParams threw error', error);
          }
        }

        let params = extra || { ...baseParams };
        logger.info('Starting upload RPC', { method: startMethod, filename: file.name, size: file.size });

        const resr = await sendAsync(
          {
            method: startMethod,
            params,
          },
          { resultOnly: true, showUnhandledErrorToast: true, timeout: 120000 }
        );
        const { alreadyUploadedBytes: uploadedBytes, dataChannel = null, success, error } = resr||{};
        const alreadyUploadedBytes = uploadedBytes ?? 0;
        if(success===false&&error) return;

        // 2) No channel and not in HTTP mode -> reject
        const isHttpMode = env.target === 'device' && !!httpUploadUrl;
        if (!dataChannel && !isHttpMode) {
          logger.warn('No dataChannel returned from RPC, rejecting', { file: file.name });
          startingRef.current = false;
          return;
        }

        const channelLabel = dataChannel
          ? (typeof dataChannel === 'string'
              ? dataChannel
              : dataChannel?.label || 'upload')
          : '';

        // 3) Notify UI to create task row
        setFileName(file.name);
        onStart?.({
          alreadyUploadedBytes,
          dataChannel,
          filename: file.name,
          size: file.size,
        });

        // 4) Try to acquire lock:
        //    if another upload is in progress, enqueue and reuse RPC result later

        if (!acquireUploadLock()) {
          uploadQueue.push({
            file, channelLabel, alreadyUploadedBytes, dataChannel,
            onReady: (f, cl, ab, dc) => startUploadDirectRef.current?.(f, cl, ab, dc),
          });
          toast.info(`${file.name} queued, will start after current upload`);
          // Release startingRef so pending files can continue RPC initialization
          startingRef.current = false;
          const nextQueued = pendingFilesRef.current.shift();
          if (nextQueued) {
            setTimeout(() => handleUploadStartRef.current?.(nextQueued), 50);
          }
          return;
        }

        // 5) No active task -> start upload immediately
        uploadChannelLabelRef.current = channelLabel;
        try {
          registerUpload?.(file.name, {
            filename: file.name,
            channelLabel,
            startedAt: Date.now(),
          });
        } catch {}

        // 6) Initialization complete: release startingRef and process pending queue
        //    so later files can run RPC and enqueue immediately
        startingRef.current = false;
        const nextPending = pendingFilesRef.current.shift();
        if (nextPending) {
          setTimeout(() => handleUploadStartRef.current?.(nextPending), 50);
        }

        if (env.target === 'device' && httpUploadUrl) {
          await handleUploadHttp(file, alreadyUploadedBytes, dataChannel);
        } else {
          await handleUploadWebRTC(file, alreadyUploadedBytes, channelLabel);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg || 'Upload start failed');
        onErrorRef.current?.({ name: file.name, error: errMsg || 'Upload start failed' });
        // Ensure lock is released on exception to avoid deadlock
        releaseUploadLock();
        const nextErr = dequeueNextFile();
        if (nextErr) setTimeout(() => nextErr.onReady(nextErr.file, nextErr.channelLabel, nextErr.alreadyUploadedBytes, nextErr.dataChannel), 100);
      } finally {
        // Fallback: always release startingRef (catch path or unexpected exception)
        if (startingRef.current) {
          startingRef.current = false;
          const fallbackPending = pendingFilesRef.current.shift();
          if (fallbackPending) {
            setTimeout(() => handleUploadStartRef.current?.(fallbackPending), 50);
          }
        }
      }
    },
    [
      beforeUpload,
      maxFileSize,
      sendAsync,
      startMethod,
      onStart,
      startParams,
      runPreUploadGuard,
    ]
  );

  // Keep a stable ref so completion handlers inside closures can call the latest version
  handleUploadStartRef.current = handleUploadStart;

  // ── Drag & Drop Handlers ───────────────────────────────────
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof isDragging !== 'boolean') setInternalDragging(true);
    onDragOver?.(e);
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof isDragging !== 'boolean') setInternalDragging(true);
    onDragEnter?.(e);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof isDragging !== 'boolean') setInternalDragging(false);
    onDragLeave?.(e);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof isDragging !== 'boolean') setInternalDragging(false);
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!isFileAccepted(file)) {
          toast.error(`Unsupported file type: ${file.name}. Accepted: ${accept}`);
          continue;
        }
        if (onFileSelected) {
          onFileSelected(file);
        } else {
          handleUploadStart(file);
        }
      }
    }
    onDrop?.(e);
  };

  const dragging =
    typeof isDragging === 'boolean' ? isDragging : internalDragging;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!isFileAccepted(file)) {
          toast.error(`Unsupported file type: ${file.name}. Accepted: ${accept}`);
          continue;
        }
        if (onFileSelected) {
          onFileSelected(file);
        } else {
          handleUploadStart(file);
        }
      }
      e.currentTarget.value = '';
    }
    pickingRef.current = false;
  };

  // ── External Control Methods ─────────────────────────────
  const pauseUpload = useCallback(() => {
    if (!fileName) return;
    const ctrl = getUploadController?.(fileName) || getUploadController?.(`${fileName}.incomplete`);
    if (ctrl?.pause) {
      ctrl.pause();
    } else {
      logger.warn('No upload controller found for pause', { fileName });
    }
  }, [fileName, getUploadController]);

  const cancelUpload = useCallback(() => {
    const ch = rtcDataChannelRef.current;
    if (ch) {
      try {
        ch.onmessage = null;
        ch.onbufferedamountlow = null;
        ch.onerror = null;
        ch.onclose = null;
        if (ch.readyState === 'open') ch.close();
      } catch {}
    }
    rtcDataChannelRef.current = null;
    releaseUploadLock();
    stopSpeedMeter();
    setUploadState('idle');
    if (fileName) {
      try { unregisterUpload?.(fileName); } catch {}
      try { removeUploadController?.(fileName); } catch {}
    }
  }, [fileName, stopSpeedMeter, unregisterUpload, removeUploadController]);

  return {
    uploadState,
    currentUploadDetail,
    fileName,
    dragging,
    inputRef,
    pickingRef,
    rtcDataChannelRef,
    pauseUpload,
    cancelUpload,
    handleUploadStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileSelected,
  };
}
