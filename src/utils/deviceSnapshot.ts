const SNAPSHOT_PREFIX = 'device_snapshot_';
const SNAPSHOT_QUALITY = 0.5;
const SNAPSHOT_MAX_WIDTH = 640;

export function captureDeviceSnapshot(deviceId: string, video: HTMLVideoElement): void {
  if (!deviceId || !video || video.videoWidth === 0 || video.readyState < 2) return;

  try {
    const scale = Math.min(1, SNAPSHOT_MAX_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', SNAPSHOT_QUALITY);
    sessionStorage.setItem(`${SNAPSHOT_PREFIX}${deviceId}`, dataUrl);
  } catch {
    // canvas may be tainted or video not ready — silently ignore
  }
}

export function getDeviceSnapshot(deviceId: string): string | null {
  return sessionStorage.getItem(`${SNAPSHOT_PREFIX}${deviceId}`);
}

export function clearDeviceSnapshot(deviceId: string): void {
  sessionStorage.removeItem(`${SNAPSHOT_PREFIX}${deviceId}`);
}
