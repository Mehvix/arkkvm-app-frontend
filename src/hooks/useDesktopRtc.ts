import { env } from '@/utils'
import { createLogger } from '@/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

const logger = createLogger('useDesktopRtc')

function byteLenOfString(str: string) {
  return new TextEncoder().encode(str).length // UTF-8 byte count
}
// WebSocket connection state
export type WebSocketConnectionState =
  | 'connecting' // WebSocket is connecting
  | 'connected' // WebSocket connection established
  | 'disconnected' // WebSocket disconnected normally
  | 'error' // WebSocket connection error
  | 'reconnecting' // WebSocket is reconnecting
  | 'closed' // WebSocket closed

// WebRTC connection state
export type WebRTCConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'
export const PeerConnectionStateMessage: Record<WebRTCConnectionState, string> =
  {
    new: 'Initializing peer connection...',
    connecting: 'Establishing peer connection...',
    connected: 'Peer connection established, waiting for media...',
    disconnected: 'Peer connection lost, preparing to reconnect...',
    failed: 'Peer connection failed, preparing to reconnect...',
    closed: 'Peer connection closed',
  }
export const IceConnectionStateMessage: Record<WebRTCConnectionState, string> =
  {
    new: 'Initializing ICE connection...',
    checking: 'Establishing ICE connection...',
    connected: 'ICE connection established, waiting for media...',
    completed: 'ICE connection completed',
    disconnected: 'ICE connection lost, preparing to reconnect...',
    failed: 'ICE connection failed, preparing to reconnect...',
    closed: 'ICE connection closed',
  }
export const NegotiationStatusMessage = {
  creatingLocalOffer: 'Creating local SDP offer...',
  waitingRemoteAnswer: 'Local SDP sent, waiting for remote answer...',
} as const

// Log prefix for console filtering
const LOG_PREFIX = '[WebRTC]'
const getLogTime = () => {
  const now = new Date()
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${now.toTimeString().split(' ')[0]}.${ms}`
}
const log = (...args: any[]) =>
  addLog(`${LOG_PREFIX} ${args.join(' ')}`, 'info')
const logError = (...args: any[]) =>
  addLog(`${LOG_PREFIX} ${args.join(' ')}`, 'error')
const logWarn = (...args: any[]) =>
  addLog(`${LOG_PREFIX} ${args.join(' ')}`, 'warning')

export const ConnectionStatusText = {
  remoteAnswerApplied: 'Remote answer applied, waiting for media streams...',
  wsWaitingDeviceInfo: 'WebSocket connected, waiting for device information...',
  wsDisconnected: 'WebSocket disconnected',
  wsError: 'WebSocket connection error',
  deviceInfoReceived:
    'Device information received, preparing WebRTC connection...',
  creatingPeerConnection: 'Creating peer connection...',
  iceGatheringComplete:
    'ICE candidate gathering completed, waiting for connection...',
  iceGathering: 'Gathering ICE candidates...',
  idle: '',
} as const

// Combined connection state
export type ConnectionState = {
  ws: WebSocketConnectionState
  webrtc: WebRTCConnectionState
}

// Export data channel types for upper layer declaration
export interface DataChannels {
  rpc: RTCDataChannel
  terminal: RTCDataChannel
  serial: RTCDataChannel
  disk: RTCDataChannel
  input: RTCDataChannel
}

// Log entry structure
export interface LogEntry {
  message: string
  timestamp: number
  type: 'info' | 'error' | 'warning' | 'success'
}

// Hook configuration options
export interface UseDesktopRtcOptions {
  // WebSocket address
  serverUrl: string

  // WebSocket request headers
  headers?: Record<string, string>

  // Auto connect on component mount
  autoConnect?: boolean

  // Auto reconnect on disconnect
  shouldReconnect?: boolean

  // Max reconnect attempts (0 for infinite)
  reconnectAttempts?: number

  // Reconnect interval (milliseconds)
  reconnectInterval?: number

  // Reconnect interval exponential backoff factor
  reconnectBackoffFactor?: number

  // Max reconnect interval (milliseconds)
  maxReconnectDelay?: number

  // Additional STUN/TURN servers
  iceServers?: RTCIceServer[]

  // Max log entries to keep
  maxLogEntries?: number

  // Whether to output logs to console
  shareToConsole?: boolean

  // WebRTC configuration
  rtcConfig?: RTCConfiguration

  // Whether to capture audio
  captureAudio?: boolean
  onMessage?: (data: any) => void
  // Callback when RTCPeerConnection is created
  onPeerConnection?: (pc: RTCPeerConnection) => void
  // Callback when data channels are created
  onDataChannels?: (channels: DataChannels) => void
  // Callback when RTCPeerConnectionState changes
  onPeerConnectionStateChange?: (
    state: WebRTCConnectionState | RTCPeerConnectionState
  ) => void

  // Optional: External video element Ref for precise binding (multi-instance scenario)
  videoRef?: React.RefObject<HTMLVideoElement>

  // Callback notification on connection lost
  onConnectionLost?: (type: 'websocket' | 'webrtc', reason?: string) => void
}

// Hook return type
export interface UseDesktopRtcResult {
  // Current connection state
  connectionState: ConnectionState
  // Ref bound to video element
  videoRef: React.RefObject<HTMLVideoElement>
  audioRef?: React.RefObject<HTMLAudioElement>
  // webrtc
  peerConnection: RTCPeerConnection | null

  // Manual disconnect method
  disconnect: () => void
  // Manually re-initiate WebRTC connection (when WebSocket is still available)
  reconnect: () => void
  // Manually unmute and try to play (to satisfy browser gesture policy)
  unmute: () => void
  // WebAudio: Set gain (1.0 for original volume)
  boostAudio: (gain: number) => void
  // WebAudio: Resume audio context after gesture
  resumeAudio: () => Promise<void>
  connectionStatusMessage: string
  peerConnectionState: RTCPeerConnectionState
  // Get current peer id related info (ufrag, pwd, state, etc.)
  getPeerId: () => {
    localUfrag: string | null
    localPwd: string | null
    remoteUfrag: string | null
    remotePwd: string | null
    state: RTCPeerConnectionState
    signalingState: RTCSignalingState
  } | null
}
function addLog(message: string, type: LogEntry['type'] = 'info') {
  // Log to console in development environment for debugging
  if (import.meta.env.DEV) {
    const logMethod =
      type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info'
    logger[logMethod](`[WebRTC Audio] ${message}`)
  }
}
export const useDesktopRtc = ({
  serverUrl,
  autoConnect = true,
  shouldReconnect = true,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  reconnectBackoffFactor = 1.5,
  maxReconnectDelay = 30000,
  iceServers = [], //{ urls: 'stun:stun.l.google.com:19302' }
  maxLogEntries = 100,
  shareToConsole = true,
  rtcConfig = {},
  captureAudio = true,

  onMessage,
  onPeerConnection,
  onDataChannels,
  onPeerConnectionStateChange,
  videoRef: externalVideoRef,
  audioRef: externalAudioRef,
  onConnectionLost,
}: UseDesktopRtcOptions): UseDesktopRtcResult => {
  // Unified stable stream carrying all remote tracks
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  // Save references to current four data channels for state checking or recovery
  const dataChannelsRef = useRef<DataChannels | null>(null)
  // WebAudio pipeline
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioGainRef = useRef<GainNode | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const unmutedRef = useRef(false)
  const touchUnlockHandlerRef = useRef<((event: TouchEvent) => void) | null>(
    null
  )

  const [peerConnectionState, setPeerConnectionState] =
    useState<RTCPeerConnectionState>('new')
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const manualCloseRef = useRef<boolean>(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    ws: 'disconnected',
    webrtc: 'new',
  })
  const [connectionStatusMessage, setConnectionStatusMessage] =
    useState<string>('') // Connection status message (user-facing text handled below)
  const isCreatingOffer = useRef(false) // Whether creating offer
  const offerSentTime = useRef<number>(0) // Record offer send time
  const answerTimeoutRef = useRef<number | null>(null) // Answer timeout timer
  const videoTransformWorkerRef = useRef<Worker | null>(null)
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const internalAudioRef = useRef<HTMLAudioElement>(null)
  const videoRef = externalVideoRef ?? internalVideoRef
  const audioRef = externalAudioRef ?? internalAudioRef

  // Create data channels (RPC / terminal / serial / disk)
  const createDataChannels = useCallback(
    (pc: RTCPeerConnection): DataChannels => {
      // Create RPC data channel
      const rpcDataChannel = pc.createDataChannel('rpc', { ordered: true })

      // Create disk data channel
      const diskDataChannel = pc.createDataChannel('disk', { ordered: true })

      // Maintain local channels reference
      const channels: DataChannels = {
        rpc: rpcDataChannel,
        terminal: pc.createDataChannel('terminal', { ordered: true }),
        serial: pc.createDataChannel('serial', { ordered: true }),
        disk: diskDataChannel,
        input: pc.createDataChannel('input', { ordered: true }),
        inputUnstable: pc.createDataChannel('input_unstable', {
          ordered: true,
          maxRetransmits: 0,
        }),
      }
      channels.inputUnstable.binaryType = 'arraybuffer'

      const bind = (ch: RTCDataChannel, label: keyof DataChannels) => {
        ch.onopen = () => {
          addLog(`${label} channel open`, 'success')

          // Expose all channels to upper layer when RPC opens
          if (label === 'rpc' && ch.readyState === 'open') {
            try {
              onDataChannels?.(channels)
            } catch {}
          }
        }

        ch.onclose = () => {
          addLog(`${label} channel closed`, 'warning')
        }

        ch.onerror = e => {
          addLog(
            `${label} channel error: ${
              (e as any)?.message || (e as any)?.toString?.() || 'unknown'
            }`,
            'error'
          )
        }
      }

      bind(channels.rpc, 'rpc')
      bind(channels.terminal, 'terminal')
      bind(channels.serial, 'serial')
      bind(channels.disk, 'disk')
      bind(channels.input, 'input')
      bind(channels.inputUnstable, 'inputUnstable')

      // Save data channel references for later use
      dataChannelsRef.current = channels

      return channels
    },
    [addLog, onDataChannels]
  )

  // WebAudio: Create/connect audio pipeline
  const ensureAudioPipeline = useCallback((stream: MediaStream | null) => {
    if (!stream) return
    try {
      let ctx = audioCtxRef.current
      if (!ctx) {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext
        ctx = new AudioCtx()
        audioCtxRef.current = ctx
      }

      // Disconnect old pipeline
      try {
        audioSourceRef.current?.disconnect()
      } catch {}
      try {
        audioGainRef.current?.disconnect()
      } catch {}

      const source = audioCtxRef.current!.createMediaStreamSource(stream)
      const gain = audioCtxRef.current!.createGain()
      gain.gain.value = audioGainRef.current?.gain.value ?? 1
      source.connect(gain).connect(audioCtxRef.current!.destination)
      audioSourceRef.current = source
      audioGainRef.current = gain
    } catch {}
  }, [])

  const resumeAudio = useCallback(async () => {
    const ctx = audioCtxRef.current
    if (ctx && ctx.state !== 'running') {
      try {
        await ctx.resume()
      } catch {}
    }
  }, [])

  // Bind remote stream to local media elements (video + audio)
  const bindRemoteStream = useCallback(
    (stream: MediaStream) => {
      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()
      addLog(
        `Binding remote stream - Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`,
        'info'
      )

      // Check audio track status
      audioTracks.forEach((track, index) => {
        addLog(
          `Audio track ${index}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`,
          'info'
        )
      })

      // Bind to video element
      const v = videoRef.current
      if (v && v.srcObject !== stream) {
        v.srcObject = stream
        v.setAttribute('playsinline', 'true')
        // @ts-ignore
        v.setAttribute('webkit-playsinline', 'true')
        // Initial state set to muted, waiting for user interaction to unlock
        v.muted = true

        // 🚀 Low latency optimization: reduce browser internal buffering
        // @ts-ignore - Experimental properties supported by some browsers
        if ('playsInline' in v) v.playsInline = true
        if ('latencyHint' in v) v.latencyHint = 0
        v.setAttribute('playsinline', 'true')
        v.setAttribute('webkit-playsinline', 'true')
        v.style.transform = 'translateZ(0)'
        // @ts-ignore
        if ('disablePictureInPicture' in v) v.disablePictureInPicture = true

        v.onloadedmetadata = () => {
          addLog(
            `Video metadata loaded - videoWidth: ${v.videoWidth}, videoHeight: ${v.videoHeight}`,
            'info'
          )
          v.play().catch(err => {
            addLog(`Video play failed: ${err.message}`, 'error')
          })
        }
      }

      // Bind to audio element
      // const a = audioRef.current
      // if (a && a.srcObject !== stream) {
      //   a.srcObject = stream
      //   a.onloadedmetadata = () => {
      //     a.play().catch(() => {})
      //   }
      // }

      // Initialize WebAudio pipeline for more stable audio playback
      // if (captureAudio) {
      //   ensureAudioPipeline(stream)
      // }

      // User interaction to unlock audio (supports desktop and mobile)
      if (!touchUnlockHandlerRef.current) {
        const handler = () => {
          const vEl = videoRef.current
          const aEl = audioRef.current
          unmutedRef.current = true

          addLog(
            'User interaction detected, attempting to unmute audio...',
            'info'
          )

          if (vEl) {
            const stream = vEl.srcObject as MediaStream
            if (stream) {
              const audioTracks = stream.getAudioTracks()
              addLog(
                `Unmuting - Audio tracks count: ${audioTracks.length}`,
                'info'
              )
              audioTracks.forEach((track, index) => {
                // Enable audio track
                if (!track.enabled) {
                  track.enabled = true
                  addLog(`Enabled audio track ${index}`, 'info')
                }
                // Unmute audio track (critical fix)
                if (track.muted) {
                  // @ts-ignore - muted property may not be writable in some browsers, but we try to set it
                  track.muted = false
                  addLog(`Unmuted audio track ${index}`, 'success')
                }
                addLog(
                  `Audio track ${index} after unmute: enabled=${track.enabled}, muted=${track.muted}`,
                  'info'
                )
              })
            }

            vEl.muted = false
            vEl.volume = 1
            addLog(
              `Video element unmuted - muted: ${vEl.muted}, volume: ${vEl.volume}`,
              'info'
            )
            vEl.play().catch(err => {
              addLog(`Video play after unmute failed: ${err.message}`, 'error')
            })
          }

          void resumeAudio()
          addLog('Audio unlock completed', 'success')
        }
        touchUnlockHandlerRef.current = handler

        // Listen to multiple user interaction events to unlock audio
        document.addEventListener('click', handler, {
          once: true,
          passive: true,
        })
        document.addEventListener('touchend', handler, {
          once: true,
          passive: true,
        })
        document.addEventListener('keydown', handler, {
          once: true,
          passive: true,
        })

        addLog(
          'Audio unlock handlers registered, waiting for user interaction...',
          'info'
        )
      }
    },
    [videoRef, audioRef, captureAudio, ensureAudioPipeline, resumeAudio]
  )

  // WebRTC: Apply remote SDP
  const applyRemoteDescription = useCallback(async (sdp: string) => {
    const pc = peerConnectionRef.current
    if (!pc) {
      addLog(
        'No peer connection when trying to apply remote description',
        'error'
      )
      return
    }

    try {
      const offerJson = JSON.parse(atob(sdp))
      // log('[WebRTC]ice backend answer returned, offerJson)', offerJson.sdp)

      await pc.setRemoteDescription(new RTCSessionDescription(offerJson))

      // Clear answer timeout timer
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
        answerTimeoutRef.current = null
      }

      // Calculate response time
      const responseTime = offerSentTime.current
        ? Date.now() - offerSentTime.current
        : 0
      log(`⏱️ Answer received in ${responseTime}ms`)

      log('📊 Peer connection state:', {
        signalingState: pc.signalingState,
        iceConnectionState: pc.iceConnectionState,
        connectionState: pc.connectionState,
        iceGatheringState: pc.iceGatheringState,
      })

      // Remote answer applied, waiting for media streams
      setConnectionStatusMessage(ConnectionStatusText.remoteAnswerApplied)
    } catch (error) {
      logError('❌ Failed to set remote description:', error)
      addLog(`Failed to set remote description: ${error}`)
    }
  }, [])

  // WebSocket
  const {
    sendMessage: wsSendMessage,
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(serverUrl, {
    heartbeat: true,
    retryOnError: true,
    // WebSocket reconnection also uses externally passed parameters
    reconnectAttempts: reconnectAttempts,
    reconnectInterval: reconnectInterval,
    shouldReconnect: () => !manualCloseRef.current,
    onReconnectStop: () => {},
    onOpen: () => {
      manualCloseRef.current = false
      setConnectionState(prev => ({ ...prev, ws: 'connected' }))
      setConnectionStatusMessage(ConnectionStatusText.wsWaitingDeviceInfo)
    },
    onClose: () => {
      setConnectionState(prev => ({ ...prev, ws: 'disconnected' }))
    },
    onError: () => {
      setConnectionState(prev => ({ ...prev, ws: 'error' }))
    },
    onMessage: async event => {
      const eventData = event.data

      if (eventData === 'pong') return
      let message
      if (typeof eventData === 'string') {
        message = JSON.parse(eventData)
      } else {
        message = eventData
      }
      const { type, data } = message || {}
      if (type === 'device-metadata') {
        const { deviceVersion } = data || {}

        if (deviceVersion) {
          setConnectionState(prev => ({ ...prev, webrtc: 'connecting' }))
          setConnectionStatusMessage(ConnectionStatusText.deviceInfoReceived)
          setTimeout(() => {
            startWebRTC()
          }, 1000)
        }
      } else if (type === 'answer') {
        log('[WebRTC][%d] Received answer from server', Date.now())
        const pc = peerConnectionRef.current
        if (!pc) {
          logError(
            '[WebRTC][%d] No PeerConnection when answer received!',
            Date.now()
          )
          return
        }
        log('[WebRTC][%d] State before applying answer:', Date.now(), {
          signalingState: pc.signalingState,
          iceConnectionState: pc.iceConnectionState,
          connectionState: pc.connectionState,
        })
        applyRemoteDescription(message?.sd || data)
      } else if (type === 'new-ice-candidate' || type === 'ice') {
        const candidate = message.candidate || message.data
        if (candidate && peerConnectionRef.current) {
          log('[WebRTC][%d] Remote ICE candidate received:', Date.now(), {
            type: candidate.type,
            protocol: candidate.protocol,
            address: candidate.address || candidate.ip,
            port: candidate.port,
            message,
          })
          addLog(
            `remote ICE candidate:${new Date().getTime()},type:${candidate.type}`
          )
          // peerConnectionRef.current?.addIceCandidate(
          //   new RTCIceCandidate(candidate)
          // )
          peerConnectionRef.current?.addIceCandidate(candidate).catch(err => {
            logError(
              '[WebRTC][%d] Failed to add ICE candidate:',
              Date.now(),
              err
            )
            addLog(`Failed to add ICE candidate: ${err.message}`)
          })
        }
      }
    },
  })
  // Send WebRTC signal
  const sendWebRTCSignal = (type: string, data: any) => {
    const ws = getWebSocket()
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = { type, data }
      const messageStr = JSON.stringify(message)
      if (type === 'offer') {
        const sdJson = JSON.parse(atob(data.sd))
      } else {
      }

      ws.send(messageStr)
    } else {
      logError(
        '[WebRTC][%d] Cannot send signal: WebSocket not open',
        Date.now(),
        {
          type,
          wsState: ws?.readyState,
        }
      )
    }
  }
  // WebRTC disconnect: thoroughly clean up PeerConnection, media tracks and local media elements
  const stopWebRTCReconnectionAndCleanup = useCallback(() => {
    // 1. Detach media elements first (stop decoding/rendering immediately)
    const v = videoRef.current
    if (v) {
      v.srcObject = null
    }

    const a = audioRef.current
    if (a) {
      a.srcObject = null
    }

    // 2. Close all DataChannels (clear handlers + close)
    const dcs = dataChannelsRef.current
    if (dcs) {
      try {
        // DataChannels is an object with channel properties
        const channels = Object.values(dcs).filter(
          (ch): ch is RTCDataChannel => ch instanceof RTCDataChannel
        )
        channels.forEach(dc => {
          try {
            dc.onopen = null
            dc.onclose = null
            dc.onmessage = null
            dc.onerror = null
            if (dc.readyState !== 'closed') {
              dc.close()
            }
          } catch {}
        })
      } catch (e) {}
    }
    dataChannelsRef.current = null

    // 3. Clear all PeerConnection event handlers (prevent memory leaks)
    const pc = peerConnectionRef.current
    if (pc) {
      try {
        pc.ontrack = null
        pc.onicecandidate = null
        pc.ondatachannel = null
        pc.onconnectionstatechange = null
        pc.oniceconnectionstatechange = null
        pc.onsignalingstatechange = null
        pc.onnegotiationneeded = null
      } catch (e) {}

      // 4. Stop all sender tracks (local media: mic/camera/screen)
      try {
        pc.getSenders().forEach(sender => {
          try {
            sender.track?.stop()
          } catch {}
        })
      } catch (e) {}

      // 5. Stop all receiver tracks (remote media)
      try {
        pc.getReceivers().forEach(receiver => {
          try {
            receiver.track?.stop()
          } catch {}
        })
      } catch (e) {}

      // 6. Close PeerConnection
      try {
        pc.close()
      } catch (e) {}

      peerConnectionRef.current = null
    }

    // 7. Stop and clear remote stream reference
    const remoteStream = remoteStreamRef.current
    if (remoteStream) {
      try {
        remoteStream.getTracks().forEach(track => {
          try {
            track.stop()
          } catch {}
        })
      } catch (e) {}
      remoteStreamRef.current = null
    }

    // 8. Clear negotiation state and flags
    isCreatingOffer.current = false

    // 9. Update connection state
    setPeerConnectionState('closed')
    onPeerConnectionStateChange?.('closed')
    setConnectionState({ ws: 'closed', webrtc: 'closed' })
    setConnectionStatusMessage('')
  }, [videoRef, audioRef])
  // WebSocket disconnect
  const stopWebSocketReconnectionAndCleanup = useCallback(() => {
    manualCloseRef.current = true
    stopWebRTCReconnectionAndCleanup()
    // Actively close underlying WebSocket to prevent subsequent reconnection
    try {
      const ws = getWebSocket()
      if (
        ws &&
        (ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING)
      ) {
        ws.close(1000, 'client disconnect')
      }
    } catch {}
  }, [])
  const setupTransceiversAndCodecs = useCallback(
    (pc: RTCPeerConnection) => {
      try {
        const audioSendTrans = pc.addTransceiver('audio', {
          direction: 'sendonly',
        })

        try {
          const sendCaps = (RTCRtpSender as any).getCapabilities?.('audio')

          if (sendCaps?.codecs && (audioSendTrans as any).setCodecPreferences) {
            const pcmaCodecs = sendCaps.codecs.filter((c: any) =>
              /PCMA/i.test(c.mimeType)
            )
            const otherCodecs = sendCaps.codecs.filter(
              (c: any) => !/PCMA/i.test(c.mimeType)
            )

            const orderedSendCodecs = [...pcmaCodecs, ...otherCodecs]
            ;(audioSendTrans as any).setCodecPreferences(orderedSendCodecs)
            addLog(
              `Audio SEND codec: PCMA preferred, total ${orderedSendCodecs.length} codecs (compatible)`,
              'info'
            )
          } else {
            console.warn(
              `[WebRTC DEBUG] setCodecPreferences not available on send transceiver or no codecs`
            )
          }
        } catch (e) {
          addLog(
            `Failed to set audio send codec preferences: ${e instanceof Error ? e.message : String(e)}`,
            'warning'
          )
        }

        try {
          const audioSender = audioSendTrans.sender
          const audioParams = audioSender.getParameters() || {}
          audioParams.encodings = audioParams.encodings ?? [{}]

          audioParams.encodings[0].maxBitrate = 96_000
          audioParams.encodings[0].priority = 'high'

          void audioSender.setParameters(audioParams)
          addLog(
            'Audio encoding: maxBitrate=96kbps, priority=high (compatible)',
            'info'
          )
        } catch (e) {
          addLog('Audio encoding parameters not supported', 'warning')
        }

        const videoSendTrans = pc.addTransceiver('video', {
          direction: 'sendonly',
        })

        // Optionally limit outbound video bitrate (example: 800 kbps)
        try {
          const sender = videoSendTrans.sender
          const params = sender.getParameters() || {}
          params.encodings = params.encodings ?? [{}]
          // maxBitrate is in bits per second
          params.encodings[0].maxBitrate = 800_000
          params.encodings[0].bit
          void sender.setParameters(params)
        } catch (e) {
          // Silently ignore if the browser does not support setParameters
        }

        const vTrans = pc.addTransceiver('video', { direction: 'recvonly' })

        const aTrans = pc.addTransceiver('audio', { direction: 'recvonly' })

        const acaps = (RTCRtpReceiver as any).getCapabilities?.('audio')

        if (acaps?.codecs && (aTrans as any)?.setCodecPreferences) {
          const pcmaCodecs = acaps.codecs.filter((c: any) =>
            /PCMA/i.test(c.mimeType)
          )
          const otherCodecs = acaps.codecs.filter(
            (c: any) => !/PCMA/i.test(c.mimeType)
          )
          const sortedCodecs = [...pcmaCodecs, ...otherCodecs]

          if (sortedCodecs.length > 0) {
            ;(aTrans as any).setCodecPreferences(sortedCodecs)
            addLog(
              `Audio RECV codec: PCMA preferred, total ${sortedCodecs.length} codecs (compatible mode)`,
              'info'
            )
          } else {
            addLog(
              'No supported audio codecs found, falling back to defaults',
              'warning'
            )
          }
        } else {
          addLog(
            'Browser does not support setting audio codec preferences',
            'warning'
          )
        }
        //
        const caps = (RTCRtpReceiver as any).getCapabilities?.('video')
        const codecs: RTCRtpCodecCapability[] | undefined = caps?.codecs
        if (Array.isArray(codecs) && (vTrans as any).setCodecPreferences) {
          const h264 = codecs.filter(c => /H264/i.test(c.mimeType))
          const others = codecs.filter(c => !/H264/i.test(c.mimeType))
          const ordered = h264.concat(others)
          try {
            ;(vTrans as any).setCodecPreferences(ordered)
            addLog('Video codec preferences set (H.264 preferred)', 'info')
          } catch (e) {
            addLog(
              `Failed to set video codec preferences: ${e instanceof Error ? e.message : String(e)}`,
              'warning'
            )
          }
        }
      } catch (e) {}
    },
    [peerConnectionRef]
  )
  // WebRTC
  const startWebRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close()
      } catch (e) {}
      peerConnectionRef.current = null
    }

    let pc: RTCPeerConnection
    try {
      let validIceServers
      if (Array.isArray(iceServers) && iceServers.length > 0) {
        validIceServers = iceServers.map(server => ({
          ...server,
          urls: Array.isArray(server.urls) ? server.urls : [server.urls],
        }))
      }
      // Creating peer connection...
      setConnectionStatusMessage(ConnectionStatusText.creatingPeerConnection)
      const configuration = {
        ...(env.target === 'cloud' ? { iceServers: validIceServers } : {}),
        ...rtcConfig,
      }
      if (configuration.iceServers?.length === 0) {
        delete configuration.iceServers
      }
      pc = new RTCPeerConnection(configuration)
      setPeerConnectionState(pc.connectionState)
      onPeerConnection?.(pc)
    } catch (e) {
      stopWebRTCReconnectionAndCleanup()
      return
    }

    peerConnectionRef.current = pc
    setupTransceiversAndCodecs(pc)

    try {
      const AnyWindow = window as any
      const ScriptTransform = AnyWindow.RTCRtpScriptTransform

      if (ScriptTransform) {
        if (videoTransformWorkerRef.current) {
          try {
            videoTransformWorkerRef.current.terminate()
          } catch {}
          videoTransformWorkerRef.current = null
        }
        const worker = new Worker(
          new URL('../webrtc/videoTransform.worker.ts', import.meta.url),
          { type: 'module' as any }
        )
        videoTransformWorkerRef.current = worker

        pc.getReceivers().forEach(receiver => {
          try {
            if (receiver.track?.kind !== 'video') return

            if (!('transform' in receiver)) return
            ;(receiver as any).transform = new ScriptTransform(worker, {
              kind: 'video',
            })
          } catch {}
        })
      }
    } catch {}

    createDataChannels(pc)

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      setPeerConnectionState(state)
      onPeerConnectionStateChange?.(state)
      addLog(`onconnectionstatechange:${new Date().getTime()}`)
    }
    pc.onsignalingstatechange = () => {
      const state = pc.signalingState
      addLog(`onsignalingstatechange:${new Date().getTime()}`)
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (!state) {
        return
      }
      log('[WebRTC][%d] ICE connection state: %s', Date.now(), state)
      setConnectionState(prev => ({ ...prev, webrtc: state }))
      if (IceConnectionStateMessage[state]) {
        setConnectionStatusMessage(IceConnectionStateMessage[state])
      }
      addLog(`oniceconnectionstatechange:${new Date().getTime()},type:${state}`)

      if (state === 'failed' || state === 'disconnected') {
        logWarn(
          '[WebRTC][%d] ICE connection failed/disconnected, checking candidates...',
          Date.now()
        )
        const transceivers = pc.getTransceivers()
        addLog(`Transceivers count: ${transceivers.length}`, 'info')
        pc.getStats().then(stats => {
          const candidates = { local: [], remote: [] }
          stats.forEach(report => {
            if (report.type === 'local-candidate') {
              candidates.local.push(report)
            } else if (report.type === 'remote-candidate') {
              candidates.remote.push(report)
            }
          })
          log('ICE Candidates:', candidates)
          if (candidates.local.length === 0) {
            logError('⚠️ No local ICE candidates gathered!')
          }
          if (candidates.remote.length === 0) {
            logError('⚠️ No remote ICE candidates received!')
          }
        })
      }
    }

    pc.onnegotiationneeded = async () => {
      try {
        isCreatingOffer.current = true
        log('🔷 Negotiation needed, creating offer...')
        setConnectionStatusMessage(NegotiationStatusMessage.creatingLocalOffer)

        const offer = await pc.createOffer()
        log('✅ Offer created:', {
          type: offer.type,
          sdpLength: offer.sdp?.length || 0,
        })

        await pc.setLocalDescription(offer)
        log('✅ Local description set (offer)')
        log('📤 Sending offer to server via WebSocket...')

        const sd = btoa(JSON.stringify(pc.localDescription))
        log('📋 Offer details:', {
          type: pc.localDescription?.type,
          sdpLength: pc.localDescription?.sdp?.length || 0,
          sdpPreview: pc.localDescription?.sdp?.substring(0, 100) + '...',
          encodedLength: sd.length,
        })
        log('📦 Message format:', {
          type: 'offer',
          dataKeys: Object.keys({ sd }),
          sdPreview: sd.substring(0, 50) + '...',
        })

        sendWebRTCSignal('offer', { sd })
        offerSentTime.current = Date.now()
        log('✅ Offer sent to server')
        setConnectionStatusMessage(NegotiationStatusMessage.waitingRemoteAnswer)

        if (answerTimeoutRef.current) {
          clearTimeout(answerTimeoutRef.current)
        }
        answerTimeoutRef.current = window.setTimeout(() => {
          logError(
            '❌ Answer timeout: No response from server after 10 seconds'
          )
          logError('🔍 Possible causes:')
          logError('  1. Server not receiving offer')
          logError('  2. Server WebRTC not initialized')
          logError('  3. Server processing error')
          logError('  4. WebSocket connection issue')
          log('📊 Current state:', {
            signalingState: pc.signalingState,
            iceConnectionState: pc.iceConnectionState,
            connectionState: pc.connectionState,
            iceGatheringState: pc.iceGatheringState,
          })
        }, 10000)
      } catch (e) {
        stopWebRTCReconnectionAndCleanup()
      } finally {
        isCreatingOffer.current = false
      }
    }

    pc.onicecandidate = event => {
      const candidate = event.candidate
      const ws = getWebSocket()
      const wsReadyState = ws?.readyState

      if (candidate) {
        addLog(
          `onicecandidate:${new Date().getTime()},type:${candidate.type},protocol:${candidate.protocol},address:${candidate.address || candidate.ip}`
        )
        log('🔵 Local ICE candidate:', {
          type: candidate.type,
          protocol: candidate.protocol,
          address: candidate.address || candidate.ip,
          port: candidate.port,
        })
      } else {
        addLog(`onicecandidate: gathering complete`)
        log('✅ ICE gathering complete')
      }

      if (!candidate || wsReadyState !== WebSocket.OPEN) {
        return
      }

      const candidateInit = candidate.toJSON()
      log('📤 Sending ICE candidate (JSON):', candidateInit)
      sendWebRTCSignal('new-ice-candidate', candidateInit)
    }

    pc.onicegatheringstatechange = () => {
      const iceGatheringState = pc.iceGatheringState
      const mesObj: Record<string, string> = {
        complete: ConnectionStatusText.iceGatheringComplete,
        gathering: ConnectionStatusText.iceGathering,
      }
      if (mesObj[iceGatheringState]) {
        setConnectionStatusMessage(mesObj[iceGatheringState])
      }
      addLog(`onicegatheringstatechange:${new Date().getTime()}`)
    }

    pc.ontrack = event => {
      addLog(
        `PC ontrack event - Track kind: ${event.track.kind}, transceivers: ${pc.getTransceivers().length}`,
        'info'
      )
      const receiver = event.receiver
      receiver.playoutDelayHint = 0
      if (receiver.track.kind === 'video') {
        addLog('Set video playoutDelayHint = 0', 'info')
      } else if (receiver.track.kind === 'audio') {
        addLog(
          `Audio track received - enabled: ${event.track.enabled}, muted: ${event.track.muted}, readyState: ${event.track.readyState}`,
          'info'
        )
      }
      const stream = event.streams[0] ?? new MediaStream([event.track])
      // Reset connection status when media track is received
      setConnectionStatusMessage(ConnectionStatusText.idle)
      if (stream) {
        bindRemoteStream(stream)
      } else {
        addLog(
          '⚠️ No streams in ontrack event, will create MediaStream manually'
        )
      }
    }
  }, [
    iceServers,
    rtcConfig,
    env,
    setConnectionStatusMessage,
    stopWebRTCReconnectionAndCleanup,
    setupTransceiversAndCodecs,
    createDataChannels,
    setConnectionState,
    getWebSocket,
    sendWebRTCSignal,
    bindRemoteStream,
    onPeerConnection,
    onPeerConnectionStateChange,
  ])

  const reconnect = useCallback(() => {
    manualCloseRef.current = false

    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const state = connectionState.webrtc
    if (state === 'connected') return

    try {
      stopWebRTCReconnectionAndCleanup()
    } catch {}
    startWebRTC()
  }, [
    connectionState.webrtc,
    getWebSocket,
    startWebRTC,
    stopWebRTCReconnectionAndCleanup,
  ])

  useEffect(() => {
    if (!shouldReconnect) return

    const state = connectionState.webrtc

    if (state === 'connected' || state === 'new') {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      reconnectAttemptsRef.current = 0
      return
    }

    if (state === 'failed' || state === 'disconnected') {
      if (
        reconnectAttempts &&
        reconnectAttempts > 0 &&
        reconnectAttemptsRef.current >= reconnectAttempts
      ) {
        return
      }

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
      }

      const attempt = reconnectAttemptsRef.current
      const baseInterval = reconnectInterval ?? 3000
      const factor = reconnectBackoffFactor ?? 1.5
      const maxDelay = maxReconnectDelay ?? 30000
      const delay = Math.min(baseInterval * Math.pow(factor, attempt), maxDelay)

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null
        reconnectAttemptsRef.current += 1
        startWebRTC()
      }, delay)
    }

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [
    connectionState.webrtc,
    shouldReconnect,
    reconnectAttempts,
    reconnectInterval,
    reconnectBackoffFactor,
    maxReconnectDelay,
    startWebRTC,
  ])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const ws = getWebSocket()
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'client-closing' }))
        } catch {}

        try {
          ws.close(1000, 'page unload')
        } catch {}
      }

      try {
        peerConnectionRef.current?.close()
      } catch {}
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [getWebSocket])

  useEffect(() => {
    return () => {
      stopWebRTCReconnectionAndCleanup()

      try {
        audioCtxRef.current?.close()
      } catch {}
      if (touchUnlockHandlerRef.current) {
        document.removeEventListener('touchend', touchUnlockHandlerRef.current)
        touchUnlockHandlerRef.current = null
      }

      if (videoTransformWorkerRef.current) {
        try {
          videoTransformWorkerRef.current.terminate()
        } catch {}
        videoTransformWorkerRef.current = null
      }
    }
  }, [stopWebRTCReconnectionAndCleanup])

  const getPeerId = useCallback(() => {
    const pc = peerConnectionRef.current
    if (!pc) return null

    return {
      localUfrag:
        pc.localDescription?.sdp.match(/a=ice-ufrag:(.+)/)?.[1] || null,

      localPwd: pc.localDescription?.sdp.match(/a=ice-pwd:(.+)/)?.[1] || null,

      remoteUfrag:
        pc.remoteDescription?.sdp.match(/a=ice-ufrag:(.+)/)?.[1] || null,

      remotePwd: pc.remoteDescription?.sdp.match(/a=ice-pwd:(.+)/)?.[1] || null,

      state: pc.connectionState,

      signalingState: pc.signalingState,
    }
  }, [])

  return {
    connectionState,
    connectionStatusMessage,
    videoRef,
    unmute: () => {
      const v = videoRef.current
      const a = audioRef.current
      unmutedRef.current = true
      if (v) {
        v.muted = false
        v.volume = 1
        v.play().catch(() => {})
      }
      if (a) {
        a.muted = false
        a.volume = 1
        a.play().catch(() => {})
      }
      void resumeAudio()
    },
    boostAudio: (gain: number) => {
      if (!audioGainRef.current) return
      audioGainRef.current.gain.value = Math.max(0, gain)
    },
    resumeAudio,
    reconnect,
    disconnect: stopWebSocketReconnectionAndCleanup,
    peerConnection: peerConnectionRef.current,
    peerConnectionState,
    getPeerId,
  }
}
