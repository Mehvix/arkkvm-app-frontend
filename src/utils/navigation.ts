import { VERSION_INFO } from './version'
import { env } from './env'

export function getVersionedPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  const isCloudProduction = env.target === 'cloud' && !env.isDev

  if (isCloudProduction) {
    const version = VERSION_INFO.version
    return `/${version}${normalizedPath}`
  }

  return normalizedPath
}

export function navigateWithVersion(path: string): void {
  const versionedPath = getVersionedPath(path)
  window.location.href = versionedPath
}

export function replaceWithVersion(path: string): void {
  const versionedPath = getVersionedPath(path)
  window.location.replace(versionedPath)
}
