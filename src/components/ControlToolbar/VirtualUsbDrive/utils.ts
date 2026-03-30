import { IconFolder } from '@/assets/icons'
import { ReactComponent as IconFileDoc } from '@/assets/icons/File-doc.svg'
import { ReactComponent as IconFilePdf } from '@/assets/icons/File-pdf-one.svg'
import { ReactComponent as IconFilePpt } from '@/assets/icons/File-ppt.svg'
import { ReactComponent as IconFileTxt } from '@/assets/icons/File-txt-one.svg'
import { ReactComponent as IconFileZip } from '@/assets/icons/File-zip.svg'
import { ReactComponent as IconFile } from '@/assets/icons/File.svg'
import React from 'react'

// util: file ext and icon mapping
export const extOf = (name?: string) => {
  if (!name) return ''
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toLowerCase() : ''
}

export const EXT_ICON_MAP: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  pdf: IconFilePdf,
  doc: IconFileDoc,
  docx: IconFileDoc,
  ppt: IconFilePpt,
  pptx: IconFilePpt,
  txt: IconFileTxt,
  zip: IconFileZip,
  rar: IconFileZip,
  '7z': IconFileZip,
  iso: IconFile,
  img: IconFile,
  png: IconFile,
  jpg: IconFile,
  jpeg: IconFile,
  gif: IconFile,
  webp: IconFile,
  svg: IconFile,
  md: IconFileTxt,
  json: IconFileTxt,
  log: IconFileTxt,
}

export const getFileIcon = (name: string, isDir?: boolean) => {
  if (isDir) return IconFolder
  const ext = extOf(name)
  return EXT_ICON_MAP[ext] ?? IconFile
}

export const joinPath = (name: string, base?: string) =>
  `${(base || '').replace(/\/+$/, '')}/${name.replace(/^\/+/, '')}`.replace(
    /\/+/g,
    '/'
  )

// Format seconds or milliseconds timestamp to local string
export function formatTime(ts?: number): string {
  if (ts === undefined || ts === null) return '-'
  const n = Number(ts)
  if (!Number.isFinite(n)) return String(ts)
  const ms = n < 1e12 ? n * 1000 : n // treat small numbers as seconds
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ts)
  }
}

export const commandClass = `p-4  rounded-md bg-[var(--bg-secondary)]`

export function filterTasksByFtcache<
  T extends { name: string; path?: string; source?: string },
>(
  deviceFiles: { name: string }[] | null | undefined,
  tasks: T[] | null | undefined,
  currentPath = '/',
  ftcacheSuffix = '.ftcache',
  source = 'virtual-usb'
): T[] {
  const ftcacheBaseNames = new Set(
    (deviceFiles ?? [])
      .map(x => x?.name)
      .filter(
        (name): name is string =>
          typeof name === 'string' && name.endsWith(ftcacheSuffix)
      )
      .map(name => name.slice(0, -ftcacheSuffix.length))
  )

  return (tasks ?? []).filter(item => {
    if (!item || typeof item.path !== 'string') return false

    if (item.source !== source) return true

    if (item.path !== currentPath) return true

    return ftcacheBaseNames.has(item.name)
  })
}
