import { useDesktopRtc } from '@/hooks/useDesktopRtc';
import { cn } from '@/utils';
import { getDeviceSnapshot } from '@/utils/deviceSnapshot';
import { useEffect, useRef, useState } from 'react';

interface DeviceCardPreviewProps {
  online: boolean;
  deviceId?: string;
  serverUrl?: string;
  rtcConfig?: RTCConfiguration;
  className?: string;
}

function OfflinePlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-20 text-[var(--text-secondary)]"
      >
        <rect
          x="2"
          y="4"
          width="28"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 28h12M16 22v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] text-[var(--text-secondary)] opacity-40 select-none">
        Offline
      </span>
    </div>
  );
}

function LivePreview({
  serverUrl,
  rtcConfig,
  snapshot,
}: {
  serverUrl: string;
  rtcConfig?: RTCConfiguration;
  snapshot: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useDesktopRtc({
    serverUrl,
    autoConnect: true,
    captureAudio: false,
    shouldReconnect: false,
    viewOnly: true,
    rtcConfig,
    videoRef,
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const check = () => {
      if (v.videoWidth > 0 && !v.paused && v.readyState >= 3) setVideoReady(true);
    };
    const onPlaying = () => { if (v.videoWidth > 0) setVideoReady(true); };
    v.addEventListener('playing', onPlaying);
    v.addEventListener('timeupdate', check);
    check();
    return () => {
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('timeupdate', check);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {snapshot && !videoReady && (
        <img
          src={snapshot}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      )}
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 w-full h-full object-contain transition-opacity duration-500',
          videoReady ? 'opacity-100' : 'opacity-0'
        )}
        muted
        autoPlay
        playsInline
        disablePictureInPicture
        controls={false}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}

export default function DeviceCardPreview({
  online,
  deviceId,
  serverUrl,
  rtcConfig,
  className,
}: DeviceCardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const snapshot = deviceId ? getDeviceSnapshot(deviceId) : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden rounded-[2px] bg-[var(--bg-button-color)]',
        className
      )}
    >
      {online && serverUrl && visible ? (
        <LivePreview serverUrl={serverUrl} rtcConfig={rtcConfig} snapshot={snapshot} />
      ) : online && snapshot ? (
        <img
          src={snapshot}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-60"
          draggable={false}
        />
      ) : (
        <OfflinePlaceholder />
      )}
    </div>
  );
}
