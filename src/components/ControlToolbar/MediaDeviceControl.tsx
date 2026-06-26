/**
 * @Purpose: Media device control component - microphone and camera control
 * @Author: zhanglei
 * @Date: 2025-10-07 21:49:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-11 17:35:04
 */

import {
    IconCamOff,
    IconCamOn,
    IconMicOff,
    IconMicOn,
    IconVolOff,
    IconVolOn,
} from '@/assets/icons';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { cn } from '@/lib/utils';
import { useRTCStore } from '@/stores';
import {
    useActiveDeviceSettings,
    useSettingsActions,
} from '@/stores/devicesStore';
import { env } from '@/utils/env';
import { createLogger } from '@/utils/logger';
import { memo, useCallback, useEffect, useState } from 'react';

const logger = createLogger('MediaDeviceControl');

interface MediaDeviceControlProps {
  className?: string
  buttonClassName?: string
  variant?: 'sidebar' | 'button'
  isCollapsed?: boolean
}

const MediaDeviceControl: React.FC<MediaDeviceControlProps> = ({
  className,
  variant = 'button',
  isCollapsed = false,
}) => {
  const peerConnection = useRTCStore(s => s.peerConnection);

  // Media device state management
  const [audioTransceiver, setAudioTransceiver] =
    useState<RTCRtpTransceiver | null>(null);
  const [videoTransceiver, setVideoTransceiver] =
    useState<RTCRtpTransceiver | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const microphoneEmulation = useActiveDeviceSettings(
    state => state.microphoneEmulation
  );
  const audioPlayback = useActiveDeviceSettings(v => v.audioPlayback);
  const cameraEmulation = useActiveDeviceSettings(v => v.cameraEmulation);
  const usbDeviceConfig = useActiveDeviceSettings(
      state => state.usbDeviceConfig
    );
  const [, isChannelReady, sendAsync] = useJsonRpc();
  const { setDeviceSetting } = useSettingsActions();

  // TODO: once backend exposes audioPlaybackEnabled,
  // read it from useActiveDeviceSettings.
  // It controls whether the playback button should be shown (device capability).
  // audioPlayback controls current stream state (user action), while showAudioPlaybackUI controls UI visibility.
  const audioPlaybackEnabled = useActiveDeviceSettings(
    v => v.showAudioPlaybackUI
  );

  // Auto-stop audio stream when microphone permission is disabled
  useEffect(() => {
    if (!microphoneEmulation && audioTrack && audioTransceiver) {
      logger.info('Microphone permission disabled, stopping audio stream');
      try {
        audioTrack.stop();
        audioTransceiver.sender.replaceTrack(null).catch(e => {
          logger.warn('Failed to replace audio track:', e);
        });
        setAudioTrack(null);
      } catch (error) {
        logger.error('Error stopping audio stream:', error);
      }
    }
  }, [microphoneEmulation, audioTrack, audioTransceiver]);

  // Get reserved audio and video send transceivers
  useEffect(() => {
    if (!peerConnection || !isChannelReady) return;
    // Guard: only run on a live connection, never on a closed/failed PC
    const state = peerConnection.signalingState;
    if (state === 'closed') return;

    const transceivers = peerConnection.getTransceivers();
    const sendOnlyTransceivers = transceivers.filter(
      t => t.direction === 'sendonly'
    );

    // mid may be null before SDP negotiation completes.
    // Prefer matching by sender.track.kind; fall back to receiver.track.kind.
    const findSendTransceiver = (kind: 'audio' | 'video') =>
      sendOnlyTransceivers.find(
        t =>
          t.sender?.track?.kind === kind ||
          t.receiver?.track?.kind === kind
      );

    // Find audio send channel
    let audioSendTransceiver = findSendTransceiver('audio');

    // If no reserved audio send channel found, create one dynamically
    if (!audioSendTransceiver) {
      logger.warn('No reserved audio send transceiver found, creating dynamically');
      try {
        audioSendTransceiver = peerConnection.addTransceiver('audio', {
          direction: 'sendonly',
        });
        logger.info('Audio send transceiver created successfully');
      } catch (error) {
        logger.error('Failed to create audio send transceiver', error);
      }
    }

    if (audioSendTransceiver) {
      setAudioTransceiver(audioSendTransceiver);

      // Check if there's already an active audio track in the sender
      const existingTrack = audioSendTransceiver.sender?.track;
      if (existingTrack && existingTrack.readyState === 'live') {
        logger.info('Found existing active audio track, restoring state');
        setAudioTrack(existingTrack);
      }
    }

    // Find video send channel
    let videoSendTransceiver = findSendTransceiver('video');

    // If no reserved video send channel found, create one dynamically
    if (!videoSendTransceiver) {
      logger.warn('No reserved video send transceiver found, creating dynamically');
      try {
        videoSendTransceiver = peerConnection.addTransceiver('video', {
          direction: 'sendonly',
        });
        logger.info('Video send transceiver created successfully');
      } catch (error) {
        logger.error('Failed to create video send transceiver', error);
      }
    }

    if (videoSendTransceiver) {
      setVideoTransceiver(videoSendTransceiver);
    }
  }, [peerConnection, isChannelReady]);
  useEffect(() => {
    if (isChannelReady) {
      // handleValClick(false)
    }
  }, [isChannelReady, sendAsync]);
  // Microphone control function
  const handleMicClick = useCallback(async () => {
    if (isProcessingAudio || !audioTransceiver) return;

    // Environment check
    if (
      !env.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !peerConnection ||
      peerConnection.connectionState === 'closed' ||
      peerConnection.connectionState === 'failed'
    ) {
      return;
    }

    setIsProcessingAudio(true);

    try {
      if (audioTrack) {
        // Stop audio streaming
        try {
          audioTrack.stop();
        } catch {
          // Ignore stop errors
        }
        await audioTransceiver.sender.replaceTrack(null);
        setAudioTrack(null);
        // Update global state: user manually stopped microphone
        setDeviceSetting('isMicrophoneStreamActive', false);
      } else {
        // Start audio streaming
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 8000,
            channelCount: 1,
            volume: 1.0,
          },
          video: false,
        });

        const track = stream.getAudioTracks()[0];
        if (track) {
          // Fix transceiver direction
          if (
            audioTransceiver.direction !== 'sendonly' &&
            audioTransceiver.direction !== 'sendrecv'
          ) {
            try {
              audioTransceiver.direction = 'sendonly';
            } catch {
              // Ignore fix errors
            }
          }

          await audioTransceiver.sender.replaceTrack(track);
          setAudioTrack(track);
          // Update global state: user manually started microphone
          setDeviceSetting('isMicrophoneStreamActive', true);
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    } catch (error) {
      logger.error('Error toggling microphone', error);
      // Cleanup state
      if (audioTrack) {
        try {
          audioTrack.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
      setAudioTrack(null);
      setDeviceSetting('isMicrophoneStreamActive', false);
    } finally {
      setIsProcessingAudio(false);
    }
  }, [
    peerConnection,
    audioTrack,
    audioTransceiver,
    isProcessingAudio,
    setDeviceSetting,
  ]);

  // Camera control function
  const handleCameraClick = useCallback(async () => {
    if (isProcessingVideo || !videoTransceiver) return;

    // Environment check
    if (
      !env.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !peerConnection ||
      peerConnection.connectionState === 'closed' ||
      peerConnection.connectionState === 'failed'
    ) {
      return;
    }

    setIsProcessingVideo(true);

    try {
      if (videoTrack) {
        // Stop video streaming
        try {
          videoTrack.stop();
        } catch {
          // Ignore stop errors
        }
        await videoTransceiver.sender.replaceTrack(null);
        setVideoTrack(null);
      } else {
        // Start video streaming
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        const track = stream.getVideoTracks()[0];
        if (track) {
          // Fix transceiver direction
          if (
            videoTransceiver.direction !== 'sendonly' &&
            videoTransceiver.direction !== 'sendrecv'
          ) {
            try {
              videoTransceiver.direction = 'sendonly';
            } catch {
              // Ignore fix errors
            }
          }

          await videoTransceiver.sender.replaceTrack(track);
          setVideoTrack(track);
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    } catch (error) {
      logger.error('Error toggling camera', error);
      // Cleanup state
      if (videoTrack) {
        try {
          videoTrack.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
      setVideoTrack(null);
    } finally {
      setIsProcessingVideo(false);
    }
  }, [peerConnection, videoTrack, videoTransceiver, isProcessingVideo]);
  const handleValClick = useCallback(async () => {
    if (!isChannelReady) {
      logger.warn('RPC channel not ready');
      return;
    }

    try {
      const newState = !audioPlayback;

      // 1) Notify backend to stop/start audio playback stream
      const resp = await sendAsync({
        method: 'setAudioPlayback',
        params: { enabled: newState },
      });
      if (resp?.success) {
        logger.info('Audio playback toggled via RPC:', newState);

        // 2) Update local state immediately (do not wait for backend push)
        setDeviceSetting('audioPlayback', newState);

        // 3) Also control audio track on frontend side (double-safety)
        // If peerConnection exists, directly toggle received audio track
        if (peerConnection) {
          const receivers = peerConnection.getReceivers();
          receivers.forEach(receiver => {
            if (receiver.track && receiver.track.kind === 'audio') {
              receiver.track.enabled = newState;
              logger.info('Audio track enabled state:', newState);
            }
          });
        }
      } else {
        logger.error('Failed to toggle audio playback:', resp);
      }
    } catch (error) {
      logger.error('Error toggling audio playback:', error);
    }
  }, [
    isChannelReady,
    sendAsync,
    audioPlayback,
    peerConnection,
    setDeviceSetting,
  ]);

  // Sidebar mode: show icon + text, style consistent with other menu items
  if (variant === 'sidebar') {
    return (
      <>
        {microphoneEmulation || cameraEmulation || audioPlaybackEnabled ? (
          <div className={cn('flex flex-col items-center', className)}>
            {audioPlaybackEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="w-10 p-0 border-none bg-transparent align-center"
                    onClick={handleValClick}
                    disabled={!isChannelReady}
                  >
                    {audioPlayback ? (
                      <IconVolOn className="size-4 text-text align-center" />
                    ) : (
                      <IconVolOff className="size-4 text-(--text-secondary) align-center" />
                    )}
                    {/* <span
                      className={cn(
                        'text-sm ml-[var(--spacing-xs)] whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150 ease-out',
                        isCollapsed
                          ? 'opacity-0 max-w-0'
                          : 'opacity-100 max-w-[160px]'
                      )}
                    >
                      {audioPlayback ? 'Audio Playback On' : 'Audio Playback Off'}
                    </span> */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  {audioPlayback ? 'Audio Playback On' : 'Audio Playback Off'}
                </TooltipContent>
              </Tooltip>
            )}
            {/* Microphone */}
            {microphoneEmulation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      className="w-10 p-0 border-none bg-transparent"
                      onClick={handleMicClick}
                      disabled={
                        !isChannelReady ||
                        isProcessingAudio ||
                        !env.isSecureContext||!usbDeviceConfig?.microphone
                      }
                    >
                      {audioTrack ? (
                        <IconMicOn className="size-4 text-text" />
                      ) : (
                        <IconMicOff className="size-4 text-(--text-secondary)" />
                      )}
                      {/* <span
                      className={cn(
                        'text-sm ml-[var(--spacing-xs)] whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150 ease-out',
                        isCollapsed
                          ? 'opacity-0 max-w-0'
                          : 'opacity-100 max-w-[160px]'
                      )}
                    >
                      {audioTrack ? 'Microphone On' : 'Microphone Off'}
                    </span> */}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  {!env.isSecureContext
                    ? 'This feature requires HTTPS. Please switch to HTTPS mode'
                    : audioTrack
                      ? 'Microphone On'
                      : 'Microphone Off'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Camera */}
            {cameraEmulation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer flex items-center justify-start w-full min-w-0"
                    onClick={handleCameraClick}
                    disabled={
                      !isChannelReady ||
                      isProcessingVideo ||
                      !env.isSecureContext
                    }
                  >
                    {videoTrack ? (
                      <IconCamOn className="size-4 text-text" />
                    ) : (
                      <IconCamOff className="size-4 text-(--text-secondary)" />
                    )}
                    <span
                      className={cn(
                        'text-sm ml-[var(--spacing-xs)] whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150 ease-out',
                        isCollapsed
                          ? 'opacity-0 max-w-0'
                          : 'opacity-100 max-w-[160px]'
                      )}
                    >
                      {videoTrack ? 'Camera On' : 'Camera Off'}
                    </span>
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="start">
                    {videoTrack ? 'Camera On' : 'Camera Off'}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        ) : (
          <></>
        )}
      </>
    );
  }

  // Button mode: show button style
  return (
    <>
      <div className={cn('flex flex-col', className)}>
        {/* Microphone button */}
        {audioPlaybackEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleValClick}
                disabled={!isChannelReady}
                className="px-[6px]"
              >
                <span className="inline-flex items-center justify-center">
                  {audioPlayback ? (
                    <IconVolOn className="size-4 text-text align-center" />
                  ) : (
                    <IconVolOff className="size-4 text-(--text-secondary) align-center" />
                  )}
                </span>

                <span>Vol</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {audioPlayback ? 'Audio Playback On' : 'Audio Playback Off'}
            </TooltipContent>
          </Tooltip>
        )}
        {microphoneEmulation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="default"
                  className="px-[6px]"
                  onClick={handleMicClick}
                  disabled={
                    !isChannelReady || isProcessingAudio || !env.isSecureContext||!usbDeviceConfig?.microphone
                  }
                >
                  <span className="inline-flex items-center justify-center">
                    {audioTrack ? <IconMicOn /> : <IconMicOff />}
                  </span>

                  <span>Mic</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                {!env.isSecureContext
                  ? 'This feature requires HTTPS. Please switch to HTTPS mode'
                  : `${audioTrack ? 'Stop microphone streaming' : 'Start microphone streaming'}`}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Camera button */}
        {/* {cameraEmulation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className={cn('size-8', buttonClassName)}
                size="xs"
                onClick={handleCameraClick}
                disabled={
                  !isChannelReady || isProcessingVideo || !env.isSecureContext
                }
              >
                {videoTrack ? <IconCamOn /> : <IconCamOff />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                {!env.isSecureContext
                  ? 'This feature requires HTTPS. Please switch to HTTPS mode'
                  : `${videoTrack ? 'Stop camera streaming' : 'Start camera streaming'}`}
              </p>
            </TooltipContent>
          </Tooltip>
        )} */}
      </div>
    </>
  );
};

export default memo(MediaDeviceControl);
