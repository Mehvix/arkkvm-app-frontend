/*
 * @Author: zhanglei
 * @Date: 2026-07-07 18:03:19
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-08 22:53:23
 */
import { buildRequestHeaders, type RequestConfig } from '@/api/request';
import { normalizeUrl } from '@/utils/common';
import { env } from '@/utils/env';

export interface LocalFileHeadResult {
  contentLength: number;
  acceptRanges: string | null;
  contentDisposition: string | null;
  contentType: string | null;
}

export function buildLocalFileDownloadUrl(path: string): string {
  return normalizeUrl(`${env.apiBaseUrl}/local/file?path=${encodeURIComponent(path)}`);
}

export async function triggerLocalFileDownload(path: string, filename = path): Promise<void> {
  const configWithHeaders = buildRequestHeaders({} as RequestConfig);
  const response = await fetch(buildLocalFileDownloadUrl(path), {
    ...configWithHeaders,
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`Failed to download local file: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function headLocalFile(path: string): Promise<LocalFileHeadResult> {
  const configWithHeaders = buildRequestHeaders({} as RequestConfig);
  const response = await fetch(buildLocalFileDownloadUrl(path), {
    ...configWithHeaders,
    method: 'HEAD',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`Failed to query local file: ${response.status}`);
  }

  return {
    contentLength: Number(response.headers.get('Content-Length') ?? 0),
    acceptRanges: response.headers.get('Accept-Ranges'),
    contentDisposition: response.headers.get('Content-Disposition'),
    contentType: response.headers.get('Content-Type'),
  };
}

export async function fetchLocalFileRange(
  path: string,
  start: number,
  end?: number
): Promise<Response> {
  const rangeValue = typeof end === 'number'
    ? `bytes=${start}-${end}`
    : `bytes=${start}-`;

  const configWithHeaders = buildRequestHeaders({} as RequestConfig);
  const headers = new Headers(configWithHeaders.headers);
  headers.set('Range', rangeValue);
  const response = await fetch(buildLocalFileDownloadUrl(path), {
    ...configWithHeaders,
    method: 'GET',
    mode: 'cors',
    headers,
  });

  if (response.status !== 206 && response.status !== 200) {
    throw new Error(`Failed to download local file range: ${response.status}`);
  }

  return response;
}
