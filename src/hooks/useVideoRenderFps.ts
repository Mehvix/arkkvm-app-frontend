import { useEffect, useRef, useState } from 'react';

type RVFCHandle = number;
type RVFCMetadata = {
  presentedFrames?: number;
  expectedDisplayTime?: number;
  mediaTime?: number;
  presentationTime?: number;
  processingDuration?: number;
  captureTime?: number;
  receiveTime?: number;
  rtpTimestamp?: number;
};

export function useVideoRenderFps(
  videoRef: React.RefObject<HTMLVideoElement>,
  deps?: unknown[] // Optional dependency array to rebind listeners when video context changes.
) {
  const [fps, setFps] = useState<number | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const rvfcHandleRef = useRef<RVFCHandle | null>(null);

  const framesRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      setFps(null);
      return;
    }

    let stopped = false;

    // Reset counters.
    framesRef.current = 0;
    lastTsRef.current = null;
    lastEmitRef.current = null;

    // RVFC (Chromium / newer Safari)
    type VideoWithRVFC = HTMLVideoElement & {
      requestVideoFrameCallback: (cb: (now: number, meta: RVFCMetadata) => void) => number;
      cancelVideoFrameCallback: (handle: number) => void;
    };
    const hasRVFC = typeof (video as VideoWithRVFC).requestVideoFrameCallback === 'function';

    const stop = () => {
      stopped = true;
      if (rvfcHandleRef.current != null && typeof (video as VideoWithRVFC).cancelVideoFrameCallback === 'function') {
        (video as VideoWithRVFC).cancelVideoFrameCallback(rvfcHandleRef.current);
        rvfcHandleRef.current = null;
      }
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    // --- Path A: requestVideoFrameCallback ---
    if (hasRVFC) {
      const onFrame = (_now: number, _meta: RVFCMetadata) => {
        if (stopped) return;

        const t = performance.now();
        framesRef.current += 1;

        if (lastEmitRef.current == null) lastEmitRef.current = t;

        const dt = t - lastEmitRef.current;
        if (dt >= 1000) {
          const computed = (framesRef.current * 1000) / dt;
          setFps(computed);

          framesRef.current = 0;
          lastEmitRef.current = t;
        }

        rvfcHandleRef.current = (video as VideoWithRVFC).requestVideoFrameCallback(onFrame);
      };

      rvfcHandleRef.current = (video as VideoWithRVFC).requestVideoFrameCallback(onFrame);

      // requestVideoFrameCallback only fires when playback starts; keep an extra safety fallback.
      const onEnded = () => setFps(0);
      video.addEventListener('ended', onEnded);

      return () => {
        video.removeEventListener('ended', onEnded);
        stop();
      };
    }

    // --- Path B: fallback (requestAnimationFrame) ---
    // Note: this is render-loop frequency, not true decoded video FPS. Used as fallback only.
    const tick = () => {
      if (stopped) return;
      const t = performance.now();

      if (lastTsRef.current == null) lastTsRef.current = t;
      framesRef.current += 1;

      const dt = t - lastTsRef.current;
      if (dt >= 1000) {
        const computed = (framesRef.current * 1000) / dt;
        setFps(computed);

        framesRef.current = 0;
        lastTsRef.current = t;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => stop();
  }, [videoRef, ...(deps || [])]); // Rebind listeners when deps change.

  return fps;
}
