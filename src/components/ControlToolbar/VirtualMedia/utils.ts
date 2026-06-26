
// @no-export
export const CDROM_EXTENSIONS = new Set(['iso', 'cue', 'mds', 'nrg']);
export const DISK_EXTENSIONS = new Set([
  'img',
  'qcow',
  'qcow2',
  'vhd',
  'vhdx',
  'vmdk',
  'raw',
  'dd',
  'dmg',
]);

// Return type definition
export type MountType = 'CDROM' | 'Disk' | undefined;

export const inferMountAsByUrlSuffix = (rawUrl: string): MountType => {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return 'CDROM';
  let pathname = trimmed.toLowerCase();
  try {
    pathname = new URL(trimmed).pathname.toLowerCase();
  } catch {
  }

  const suffix = pathname.split('.').pop();
  if (!suffix) return undefined;

  if (CDROM_EXTENSIONS.has(suffix)) {
    return 'CDROM';
  }

  if (DISK_EXTENSIONS.has(suffix)) {
    return 'Disk';
  }

  return 'CDROM';
};

