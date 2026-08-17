/**
 * IndexedDB persistence for resumable uploads.
 *
 * Stores upload task metadata together with the FileSystemFileHandle so that,
 * after a page refresh, the user can continue an unfinished upload without
 * reselecting the same file in the browser picker.
 *
 * Notes:
 * - FileSystemFileHandle is stored directly (structured-cloneable) in Chromium.
 * - If the browser / context does not support the API, operations degrade to
 *   no-ops and the caller should fall back to the standard <input> flow.
 */

import type { TransferDirection, TransferSource } from '@/stores/slices/fileTransferListSlice';

/** Supported persisted upload statuses. */
export type PersistedUploadStatus =
  | 'uploading'
  | 'paused'
  | 'interrupted'
  | 'permission-required'
  | 'completed'
  | 'failed';

/** Native File System Access picker accept entry. */
export interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string | string[]>;
}

/** Options passed to showOpenFilePicker. */
export interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}

/** Minimal FileSystemFileHandle shape used by this module. */
export interface PersistedFileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  queryPermission(
    descriptor?: { mode?: 'read' | 'readwrite' }
  ): Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission(
    descriptor?: { mode?: 'read' | 'readwrite' }
  ): Promise<'granted' | 'denied' | 'prompt'>;
}

/** Persisted upload task stored in IndexedDB. */
export interface PersistedUploadTask {
  taskId: string;
  uploadId?: string;
  deviceId?: string;
  fileHandle?: PersistedFileSystemFileHandle;
  fileName: string;
  fileSize: number;
  lastModified: number;
  fingerprint?: string;
  uploadedBytes: number;
  chunkSize: number;
  status: PersistedUploadStatus;
  createdAt: number;
  updatedAt: number;
  source?: TransferSource;
  direction?: TransferDirection;
  path?: string;
}

/** Resume error codes with user-facing meaning. */
export type UploadResumeErrorCode =
  | 'permission-denied'
  | 'file-missing'
  | 'file-changed'
  | 'device-task-missing'
  | 'offset-invalid'
  | 'network-error'
  | 'not-supported'
  | 'unknown';

export class UploadResumeError extends Error {
  code: UploadResumeErrorCode;

  constructor(code: UploadResumeErrorCode, message?: string) {
    super(message || code);
    this.name = 'UploadResumeError';
    this.code = code;
  }
}

const DB_NAME = 'arkkvm-uploads';
const DB_VERSION = 1;
const STORE_NAME = 'uploadTasks';

/** Returns true when File System Access API can be used. */
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.isSecureContext === true &&
    'showOpenFilePicker' in window &&
    'indexedDB' in window
  );
}

/** Returns true when IndexedDB is available in this environment. */
function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
      }
    };
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onabort = () => db.close();
      })
  );
}

/** Persist (create or update) an upload task. */
export async function saveUploadTask(task: PersistedUploadTask): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    await withStore('readwrite', store => store.put(task));
  } catch {
    // Silent degradation: the upload can still proceed in-memory.
  }
}

/** Retrieve a single persisted upload task by id. */
export async function getUploadTask(
  taskId: string
): Promise<PersistedUploadTask | undefined> {
  if (!isIndexedDbAvailable()) return undefined;
  try {
    const result = await withStore('readonly', store => store.get(taskId));
    return result ? (result as PersistedUploadTask) : undefined;
  } catch {
    return undefined;
  }
}

/** Retrieve all persisted upload tasks. */
export async function getAllUploadTasks(): Promise<PersistedUploadTask[]> {
  if (!isIndexedDbAvailable()) return [];
  try {
    const result = await withStore('readonly', store => store.getAll());
    return Array.isArray(result) ? (result as PersistedUploadTask[]) : [];
  } catch {
    return [];
  }
}

/** Delete a persisted upload task. */
export async function deleteUploadTask(taskId: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    await withStore('readwrite', store => store.delete(taskId));
  } catch {
    // Best-effort cleanup.
  }
}

/** Apply a partial update to an existing persisted task. */
export async function updateUploadTask(
  taskId: string,
  patch: Partial<PersistedUploadTask>
): Promise<void> {
  const existing = await getUploadTask(taskId);
  if (!existing) return;
  await saveUploadTask({ ...existing, ...patch, updatedAt: Date.now() });
}

/** Remove completed tasks to avoid cluttering the database. */
export async function clearCompletedUploadTasks(): Promise<void> {
  const all = await getAllUploadTasks();
  await Promise.all(
    all
      .filter(t => t.status === 'completed')
      .map(t => deleteUploadTask(t.taskId))
  );
}

/**
 * Request read permission for a persisted file handle.
 * Must be called within a user gesture (e.g. a click handler).
 */
export async function ensureFileReadPermission(
  handle: PersistedFileSystemFileHandle
): Promise<boolean> {
  let perm = await handle.queryPermission({ mode: 'read' });
  if (perm === 'prompt') {
    perm = await handle.requestPermission({ mode: 'read' });
  }
  return perm === 'granted';
}

/**
 * Restore the original File object from a persisted handle.
 * Throws UploadResumeError when permission is missing or the file is gone.
 */
export async function restoreFileFromHandle(
  task: PersistedUploadTask
): Promise<File> {
  if (!task.fileHandle) {
    throw new UploadResumeError('file-missing', 'No persisted file handle');
  }
  const granted = await ensureFileReadPermission(task.fileHandle);
  if (!granted) {
    throw new UploadResumeError(
      'permission-denied',
      'File read permission was not granted'
    );
  }
  try {
    return await task.fileHandle.getFile();
  } catch (e) {
    throw new UploadResumeError(
      'file-missing',
      e instanceof Error ? e.message : 'Original file is no longer accessible'
    );
  }
}

/**
 * Validate that the selected/reopened file matches the persisted task.
 * Does not compute expensive hashes unless the project already has fingerprint logic.
 */
export function validateFileForResume(
  task: PersistedUploadTask,
  file: File
): { valid: true } | { valid: false; reason: UploadResumeErrorCode; message: string } {
  if (file.name !== task.fileName) {
    return {
      valid: false,
      reason: 'file-changed',
      message: 'Selected file name does not match the original upload',
    };
  }
  if (file.size !== task.fileSize) {
    return {
      valid: false,
      reason: 'file-changed',
      message: 'File size has changed since the upload started',
    };
  }
  if (file.lastModified !== task.lastModified) {
    return {
      valid: false,
      reason: 'file-changed',
      message: 'File has been modified since the upload started',
    };
  }
  return { valid: true };
}

/** Build a stable task id from source/path/name. */
export function buildUploadTaskId(
  source: TransferSource | undefined,
  path: string | undefined,
  name: string
): string {
  const safeSource = source ?? 'storage';
  const safePath = path ?? '/';
  return `${safeSource}:${safePath}:${name}`;
}
