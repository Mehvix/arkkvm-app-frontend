/**
 * RemoteScreen Component
 *
 * A comprehensive KVM remote desktop viewer component that handles:
 * - WebRTC video/audio streaming
 * - Mouse and keyboard input modes (absolute/relative)
 * - OCR text recognition overlay
 * - HDMI signal state monitoring
 * - Connection state management
 *
 * @author zhanglei
 */

import {
  useDesktopRtc,
  type DataChannels,
  type ViewerStatus,
} from '@/hooks/useDesktopRtc';
import { useOcrCapture } from '@/hooks/useOcrCapture';
import { cn } from '@/utils';
import { env } from '@/utils/env';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';
import ConnectionIssuePanel from './ConnectionIssuePanel';
import { OcrSelectionOverlay } from './OcrSelectionOverlay';
import { VideoAreaOverlay } from './VideoAreaOverlay';

// ============================================================================
// Types & Interfaces
// ============================================================================

type MouseInputMode = 'absolute' | 'relative'
type CursorStyle = 'dot' | 'arrow'
type HdmiErrorState = 'no_signal' | 'no_lock' | 'out_of_range' | 'hdmi_disconnected' | 'hdmi_no_signal'

interface VideoEnhancement {
  saturation: number
  brightness: number
  contrast: number
}

interface RemoteScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  // Video & Display
  serverUrl?: string
  rtcConfig?: RTCConfiguration
  enhancement?: VideoEnhancement

  // HDMI State
  hdmiState?: string

  // Input Control
  mouseInputMode?: MouseInputMode
  cursorStyle?: CursorStyle
  isCursorHidden?: boolean

  // OCR Features
  ocrEnabled?: boolean
  onTextRecognized?: (text: string) => void
  onOcrCancel?: () => void

  // WebRTC Callbacks
  onPeerConnection?: (pc: RTCPeerConnection) => void
  onDataChannels?: (channels: DataChannels) => void
  onPeerConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onViewerStatusChange?: (status: ViewerStatus) => void
  onVideoSizeChange?: (size: { width: number; height: number }) => void
}

export interface RemoteScreenHandle {
  disconnect?: () => void
  reconnect?: () => void
  videoElement?: HTMLVideoElement | null
  startOcrCapture?: () => void
  cancelOcrCapture?: () => void
}

// ============================================================================
// Constants
// ============================================================================

const HDMI_ERROR_STATES: readonly HdmiErrorState[] = [
  'no_signal',
  'no_lock',
  'out_of_range',
  'hdmi_disconnected',
  'hdmi_no_signal',
] as const;

const DISCONNECTED_WEBRTC_STATES = ['disconnected', 'failed', 'closed'] as const;

const DOT_CURSOR_SVG = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Ccircle cx=\'6\' cy=\'6\' r=\'4\' fill=\'rgba(59, 130, 246, 0.8)\' stroke=\'white\' stroke-width=\'1.5\'/%3E%3C/svg%3E") 6 6, auto';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps HDMI state to i18n translation key
 */
const getHdmiStateKey = (hdmiState: string): string => {
  if (hdmiState === 'no_signal' || hdmiState === 'hdmi_no_signal') {
    return 'noSignal';
  }
  if (hdmiState === 'no_lock') {
    return 'noLock';
  }
  if (hdmiState === 'hdmi_disconnected') {
    return 'disconnected';
  }
  if (hdmiState === 'out_of_range') {
    return 'outOfRange';
  }
  return 'noSignal';
};

/**
 * Checks if HDMI state is an error state
 */
const isHdmiErrorState = (hdmiState?: string): hdmiState is HdmiErrorState => {
  return hdmiState ? HDMI_ERROR_STATES.includes(hdmiState as HdmiErrorState) : false;
};

// ============================================================================
// Component
// ============================================================================
export const RemoteScreen = forwardRef<RemoteScreenHandle, RemoteScreenProps>(
  (
    {
      className,
      isCursorHidden = false,
      mouseInputMode = 'absolute',
      cursorStyle = 'dot',
      enhancement = { saturation: 1, brightness: 1, contrast: 1,hueRotate:0 },
      serverUrl = env.signalingUrl as string,
      rtcConfig,
      hdmiState,
      ocrEnabled = false,
      onPeerConnectionStateChange,
      onViewerStatusChange,
      onPeerConnection,
      onDataChannels,
      onVideoSizeChange,
      onTextRecognized,
      onOcrCancel,
    },
    ref
  ) => {
    const { t } = useTranslation('messages');
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastVideoSizeRef = useRef<{ width: number; height: number } | null>(
      null
    );
    const [hasVideoContent, setHasVideoContent] = useState(false);
    const [videoAspectRatio, setVideoAspectRatio] = useState<string>('1920/1080');

    // ========================================================================
    // OCR Functionality
    // ========================================================================
    // Always initialize hooks unconditionally (React Hooks rules)
    const {
      isSelecting: isOcrSelecting,
      selection: ocrSelection,
      isRecognizing: isOcrRecognizing,
      recognizedText: ocrRecognizedText,
      copyRecognizedText: copyOcrRecognizedText,
      resetOcrTask,
      startSelection: startOcrSelection,
      updateSelection: updateOcrSelection,
      endSelection: endOcrSelection,
      cancelSelection: cancelOcrSelection,
    } = useOcrCapture({
      videoRef,
      language: 'eng+chi_sim',
      onTextRecognized,
    });

    /**
     * Handle OCR cancel action
     * Cancels the current selection and triggers parent callback
     */
    const handleOcrCancel = useCallback(() => {
      cancelOcrSelection();
      onOcrCancel?.();
    }, [cancelOcrSelection, onOcrCancel]);

    const handleOcrCopy = useCallback(async () => {
      await copyOcrRecognizedText();
    }, [copyOcrRecognizedText]);

    // ========================================================================
    // WebRTC Connection
    // ========================================================================

    const {
      connectionState,
      viewerStatus,
      connectionStatusMessage,
      unmute,
      disconnect,
      reconnect,
    } = useDesktopRtc({
      serverUrl,
      autoConnect: true,
      captureAudio: true,
      rtcConfig,
      audioRef,
      videoRef,
      onPeerConnection,
      onDataChannels,
      onPeerConnectionStateChange,
    });

    useEffect(() => {
      onViewerStatusChange?.(viewerStatus);
    }, [viewerStatus, onViewerStatusChange]);
    // console.log('ConnectionStateConnectionState',connectionState)

    // ========================================================================
    // Video Content State Management
    // ========================================================================

    /**
     * Monitor video content loading state
     * Only show border when video has actual content
     * Calculate aspect ratio based on actual video resolution
     */
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateAspectRatioFromVideo = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width && height) {
          setVideoAspectRatio(`${width}/${height}`);
        }
      };

      const handleLoadedData = () => {
        setHasVideoContent(true);
      };

      const handleEmptied = () => {
        setHasVideoContent(false);
      };

      const handleLoadedMetadata = () => {
        updateAspectRatioFromVideo();
      };

      const handleVideoResize = () => {
        updateAspectRatioFromVideo();
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('emptied', handleEmptied);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('resize', handleVideoResize);

      // Check if video already has content
      if (video.readyState >= 2) {
        setHasVideoContent(true);
      }

      // Check if video metadata has been loaded
      if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
        updateAspectRatioFromVideo();
      }

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('emptied', handleEmptied);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('resize', handleVideoResize);
      };
    }, []);

    // ========================================================================
    // Mobile Video Playback Setup
    // ========================================================================

    /**
     * iOS/Android: Force inline playback and gesture unlock
     * Prevents fullscreen controls and ensures video displays correctly
     */
    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      try {
        v.setAttribute('playsinline', 'true');
        v.setAttribute('webkit-playsinline', 'true');
        // Force disable controls
        v.setAttribute('controls', 'false');
        v.controls = false;
        // Mobile-specific attributes
        v.setAttribute('disablePictureInPicture', 'true');
        v.setAttribute(
          'controlsList',
          'nodownload nofullscreen noremoteplayback'
        );
        // Prevent default touch behavior
        v.style.webkitTouchCallout = 'none';
        v.style.webkitUserSelect = 'none';
        // Maintain interactivity on mobile, support simulated mouse events
        v.style.touchAction = 'none';
        // Force disable all possible control attributes
        v.setAttribute('x-webkit-airplay', 'deny');
        v.setAttribute('webkit-playsinline', 'true');
        v.removeAttribute('controls');
        // Remove any possible control-related events
        v.oncontextmenu = () => false;
        v.ondragstart = () => false;
        v.onselectstart = () => false;
      } catch {}

      const tryPlay = () => {
        v.play().catch(() => {});
      };

      const onLoaded = () => tryPlay();
      const onVisibility = () => {
        if (!document.hidden) tryPlay();
      };
      const touchUnlock = () => {
        tryPlay();
        document.removeEventListener('touchend', touchUnlock as EventListener);
      };

      // Prevent mobile playback controls from appearing
      const preventControls = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Add mobile event listeners
      v.addEventListener('webkitfullscreenchange', preventControls);
      v.addEventListener('fullscreenchange', preventControls);
      v.addEventListener('webkitbeginfullscreen', preventControls);
      v.addEventListener('webkitendfullscreen', preventControls);

      v.addEventListener('loadedmetadata', onLoaded);
      document.addEventListener('visibilitychange', onVisibility);
      document.addEventListener(
        'touchend',
        touchUnlock as EventListener,
        { once: true }
      );

      return () => {
        try {
          v.removeEventListener('loadedmetadata', onLoaded);
        } catch {}
        try {
          document.removeEventListener('visibilitychange', onVisibility);
        } catch {}
        try {
          document.removeEventListener('touchend', touchUnlock as EventListener);
        } catch {}
        try {
          v.removeEventListener('webkitfullscreenchange', preventControls);
          v.removeEventListener('fullscreenchange', preventControls);
          v.removeEventListener('webkitbeginfullscreen', preventControls);
          v.removeEventListener('webkitendfullscreen', preventControls);
        } catch {}
      };
    }, [videoRef]);

    // ========================================================================
    // Event Handlers
    // ========================================================================

    /**
     * Enable audio playback on user interaction
     */
    const handleEnableSound = useCallback(
      (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        unmute();
      },
      [unmute]
    );

    // ========================================================================
    // Video Styling
    // ========================================================================

    /**
     * Compute video element styles including cursor and filters
     */
    const videoStyle = useMemo(() => {
      const { saturation, brightness, contrast,hueRotate } = enhancement;
      const isDefault = saturation === 1 && brightness === 1 && contrast === 1;

      const cursor = isCursorHidden
        ? 'none'
        : cursorStyle === 'arrow'
          ? 'auto'
          : DOT_CURSOR_SVG;

      return {
        cursor,
        ...(isDefault
          ? {}
          : {
              filter: `saturate(${saturation}) brightness(${brightness}) contrast(${contrast}) hue-rotate(${hueRotate}deg)`,
            }),
      };
    }, [enhancement, isCursorHidden, cursorStyle]);

    // ========================================================================
    // Imperative Handle (Ref API)
    // ========================================================================

    useImperativeHandle(ref, () => ({
      videoElement: videoRef.current,
      disconnect,
      reconnect,
      startOcrCapture: () => {
        // OCR mode auto-handles selection via overlay
      },
      cancelOcrCapture: cancelOcrSelection,
    }));

    // ========================================================================
    // Video Size Monitoring
    // ========================================================================

    /**
     * Monitor video element size changes and notify parent
     */
    useEffect(() => {
      const el = videoRef.current;
      if (!el) return;

      const updateSize = () => {
        const rect = el.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        const last = lastVideoSizeRef.current;
        if (last && last.width === w && last.height === h) {
          return;
        }
        lastVideoSizeRef.current = { width: w, height: h };
        onVideoSizeChange?.({ width: w, height: h });
      };

      const ro = new ResizeObserver(() => {
        requestAnimationFrame(updateSize);
      });

      ro.observe(el);

      const parent = el.parentElement;
      if (parent) {

        ro.observe(parent);
      }

      const grandParent = parent?.parentElement;
      if (grandParent) {

        ro.observe(grandParent);
      }

      return () => {

        ro.disconnect();
      };
    }, [onVideoSizeChange]);

    // ========================================================================
    // Keyboard Shortcuts
    // ========================================================================

    /**
     * ESC key to cancel OCR mode
     */
    useEffect(() => {
      if (!ocrEnabled) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          handleOcrCancel();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ocrEnabled, handleOcrCancel]);

    return useMemo(
      () => (
        <div className={cn('w-full h-full p-[4px]', className)} ref={containerRef}>
            {(DISCONNECTED_WEBRTC_STATES as readonly string[]).includes(String(connectionState.webrtc)) && !connectionStatusMessage ? (
              <ConnectionIssuePanel
                title={t(`webrtcConnection.${connectionState.webrtc}.title`)}
                items={t(`webrtcConnection.${connectionState.webrtc}.items`, {
                  returnObjects: true,
                })}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {(
                  (connectionStatusMessage &&
                    (connectionState.webrtc !== 'connected' || !hasVideoContent) &&
                    !isHdmiErrorState(hdmiState)) ||
                  (connectionState.ws === 'error' && connectionState.webrtc === 'new')
                ) ? (
                 <VideoAreaOverlay aspectRatio={videoAspectRatio}>
                    <div className="flex items-center flex-col gap-3">
                      <svg
                        className="animate-spin"
                        width={32}
                        height={32}
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <circle
                          cx="16" cy="16" r="12"
                          stroke="#3b82f6"
                          strokeOpacity="0.3"
                          strokeWidth="3"
                        />
                        <path
                          d="M16 4a12 12 0 0 1 12 12"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-sm font-[400] text-white">
                        {connectionStatusMessage}
                      </div>
                    </div>
                  </VideoAreaOverlay>
                ) : null}

                {/* HDMI Error State Panel - Only show after WebRTC connection established */}
                {connectionState.webrtc === 'connected' && isHdmiErrorState(hdmiState) && (() => {
                  const stateKey = getHdmiStateKey(hdmiState);
                  const items = t(`hdmiSignal.${stateKey}.items`, { returnObjects: true });

                  return (
                    <VideoAreaOverlay aspectRatio={videoAspectRatio}>
                      <ConnectionIssuePanel
                        title={t(`hdmiSignal.${stateKey}.title`)}
                        items={Array.isArray(items) ? items : undefined}
                      />
                    </VideoAreaOverlay>
                  );
                })()}

                <audio
                  ref={audioRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
                <video
                  ref={videoRef}
                  className={cn(
                    'inset-0 w-auto h-auto m-auto block max-w-full max-h-full object-contain outline-none focus:outline-none focus:ring-0 focus-visible:outline-none',
                    hasVideoContent && !isHdmiErrorState(hdmiState) && 'border border-[var(--border-color)]',
                    ocrEnabled && 'pointer-events-none'
                  )}
                    muted
                    autoPlay
                    controls={false}
                    playsInline
                    disablePictureInPicture
                    onClick={handleEnableSound}
                    style={{
                      cursor: videoStyle.cursor,
                      aspectRatio: videoAspectRatio,
                      ...(mouseInputMode === 'absolute' ? videoStyle : {}),
                    }}
                    onKeyDown={e => e.preventDefault()}
                    onContextMenu={e => e.preventDefault()}
                  />

                  {ocrEnabled && (
                    <OcrSelectionOverlay
                      isActive={ocrEnabled}
                      isSelecting={isOcrSelecting}
                      selection={ocrSelection}
                      isRecognizing={isOcrRecognizing}
                      recognizedText={ocrRecognizedText}
                      onCopyText={handleOcrCopy}
                      onResetTask={resetOcrTask}
                      onMouseDown={startOcrSelection}
                      onMouseMove={updateOcrSelection}
                      onMouseUp={endOcrSelection}
                      onCancel={handleOcrCancel}
                    />
                  )}
              </div>
            )}
        </div>
      ),
      [
        className,
        containerRef,
        connectionState.webrtc,
        connectionStatusMessage,
        hasVideoContent,
        hdmiState,
        audioRef,
        videoRef,
        videoStyle,
        mouseInputMode,
        handleEnableSound,
        ocrEnabled,
        isOcrSelecting,
        ocrSelection,
        isOcrRecognizing,
        ocrRecognizedText,
        handleOcrCopy,
        resetOcrTask,
        startOcrSelection,
        updateOcrSelection,
        endOcrSelection,
        handleOcrCancel,
        t,
      ]
    );
  }
);
