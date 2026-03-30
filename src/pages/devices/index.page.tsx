/**
 * KVM Device Control Page
 *
 * Main interface for remote device control via KVM (Keyboard, Video, Mouse).
 * Supports both device-direct and cloud modes.
 *
 * @module pages/devices
 */

// ============================================================================
// External Dependencies
// ============================================================================
import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

// ============================================================================
// Internal Dependencies - API & Services
// ============================================================================
import { request } from '@/api'
import { fetchDeviceSettings } from '@/services/deviceSettings'

// ============================================================================
// Internal Dependencies - Components
// ============================================================================
import {
  AspectRatioContainer,
  Button,
  ConnectionIssuePanel,
  ControlSidebar,
  Dialog,
  DraggablePanel,
  Extension,
  RemoteScreen,
  SessionStatusBar,
  Settings,
  SlidePanel,
  StreamAnalytics,
  SystemUpdateDialog,
  Terminal,
  TopNavbar,
} from '@/components'
import ControlToolbar, {
  type FullScreenData,
} from '@/components/ControlToolbar'
import { DefaultLoadingOverlay } from '@/components/DefaultLoadingOverlay'
import { type RemoteScreenHandle } from '@/components/kvm/RemoteScreen'
import VirtualKeyboard from '@/components/VirtualKeyboard/index.tsx'
import { toHidReport } from '@/components/VirtualKeyboard/utils'
import {
  createInitialModifierState,
  HID_MODIFIERS,
  isModifierKey,
  resolveModifierCode,
} from '@/components/VirtualKeyboard/utils/modifierStateManager'

// ============================================================================
// Internal Dependencies - Hooks
// ============================================================================
import { useInputChannel } from '@/hooks/useInputChannel'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useLongPressEscape } from '@/hooks/useLongPressEscape'
import { useMouseEvents } from '@/hooks/useMouseEvents'

// ============================================================================
// Internal Dependencies - State Management
// ============================================================================
import {
  isAnyUiPanelOpen,
  useAppStore,
  useRTCStore,
  useUiStore,
} from '@/stores'
import { useActiveDeviceSelect, useSettingsStore } from '@/stores/devicesStore'

// ============================================================================
// Internal Dependencies - Utils & Assets
// ============================================================================
import { IconCloud, IconToLeft } from '@/assets/icons'
import { env } from '@/utils/env'

// ============================================================================
// Types
// ============================================================================
import { ReconnectOverlay } from '@/components/update/ReconnectOverlay'
import { useUpdateCheck } from '@/components/update/SystemUpdateDialog'
import type { PageMeta } from '@/types/page-meta'

// ============================================================================
// Page Metadata
// ============================================================================
export const meta: PageMeta = {
  auth: true,
  title: 'device.management',
  path: '/',
  cloudPath: ':v/device/:id',
  target: 'universal',
}

// ============================================================================
// Types & Interfaces
// ============================================================================
type KeyboardDisplayMode = 'docked' | 'floating'
type TransceiverMode = 'recvonly' | 'sendrecv'

interface DeviceConnectionState {
  isChannelReady: boolean
  peerState: string | undefined
  usbState: string | undefined
  hdmiConnectionState: string | undefined
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * KVM Device Control Page Component
 *
 * Provides the main interface for controlling remote devices including:
 * - Real-time video streaming via WebRTC
 * - Keyboard and mouse input forwarding
 * - Virtual keyboard support
 * - Terminal access
 * - Device settings management
 */
const KVMControlPage = () => {
  const { target, signalingUrl } = env
  const [keyboardDisplayMode, setKeyboardDisplayMode] = useState<
    'docked' | 'floating'
  >('docked')
  const { id: deviceId } = useParams()
  const location = useLocation()

  // Get deviceName from URL query parameter
  const deviceNameFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('deviceName')
  }, [location.search])

  const [deviceName, setDeviceName] = useState<string>(
    deviceNameFromQuery || ''
  )

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const pressCountRef = useRef<Map<string, number>>(new Map()) // Per-key release counter
  const doubleClickTimersRef = useRef<Set<NodeJS.Timeout>>(new Set()) // Track double-click timers
  const getVideoStateTimerRef = useRef<NodeJS.Timeout | null>(null) // Video state debounce timer

  const [virtualKeyboardModifierState, setVirtualKeyboardModifierState] =
    useState<ModifierKeysState>(createInitialModifierState())

  // Local state for pressed keys (better performance than global state)
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  const [showSessionConflictDialog, setShowSessionConflictDialog] =
    useState(false)
  const showStatusBar = useAppStore(s => s.showStatusBar)

  const keyboardHeight = useUiStore(s => s.keyboardHeight)
  const visibleVirtualKeyboard = useUiStore(s => s.visible.virtualKeyboard)
  const visibleSettings = useUiStore(s => s.visible.settings)

  // Local helper to manage pressed keys
  const setPressedKey = useCallback(
    (keyCode: string, isPressed: boolean) => {
      if (isPressed) {
        pressedKeysRef.current.add(keyCode)
      } else {
        pressedKeysRef.current.delete(keyCode)
      }
      // Only trigger re-render when virtual keyboard is visible
      if (visibleVirtualKeyboard) {
        forceUpdate()
      }
    },
    [visibleVirtualKeyboard]
  )

  const resetPressedKeys = useCallback(() => {
    pressedKeysRef.current.clear()
    // Only trigger re-render when virtual keyboard is visible
    if (visibleVirtualKeyboard) {
      forceUpdate()
    }
  }, [visibleVirtualKeyboard])

  const csrfToken = sessionStorage.getItem('csrfToken') || ''
  const serverUrl =
    target === 'cloud'
      ? `${signalingUrl}?id=${deviceId}&token=${token}`
      : `${signalingUrl}${csrfToken ? `?csrf-token=${csrfToken}` : ''}`
  const rpcDataChannel = useRTCStore(s => s.rpcDataChannel)
  const isPasteTextOpen = useUiStore(s => s.isPasteTextOpen)
  const keyboardLanguage =
    useAppStore(s => s.keyboardLanguage) || 'en-US-qwerty'
  const oobeAutoUpdate = useAppStore(state => state.auto_update)
  const setOobeAutoUpdate = useAppStore(state => state.setAutoUpdate)
  const toggleMain = useUiStore(s => s.toggleMain)
  const setKeyboardLanguage = useAppStore(s => s.setKeyboardLanguage)
  const videoWidth = useAppStore(s => s.videoWidth)
  const videoHeight = useAppStore(s => s.videoHeight)
  // Use getState() for setters to avoid re-renders on store updates
  const modifierReleaseMode = useAppStore(s => s.modifierReleaseMode)
  const setVideoResolution = useAppStore.getState().setVideoResolution
  const setHdmiConnectionState = useAppStore.getState().setHdmiConnectionState
  const hdmiConnectionState = useAppStore(s => s.hdmiConnectionState)
  const isTerminalVisible = useAppStore(s => s.ui.visible.terminal)
  const setTerminalChannel = useAppStore.getState().rtc.setTerminalChannel
  const setRpcDataChannel = useAppStore.getState().rtc.setRpcDataChannel
  const setSerialChannel = useAppStore.getState().rtc.setSerialChannel
  const setDiskChannel = useAppStore.getState().rtc.setDiskChannel
  const setRtcField = useAppStore.getState().rtc.setRtcField
  const resetHID = useAppStore.getState().resetHID
  const setContainerSize = useAppStore.getState().setContainerSize
  const setMouseMove = useAppStore.getState().setMouseMove
  const setMousePosition = useAppStore.getState().setMousePosition

  const setAtxState = useAppStore.getState().setAtxState
  const clearUploads = useAppStore.getState().clearUploads
  const microphoneEmulation = useActiveDeviceSelect(
    state => state.microphoneEmulation
  )
  const terminalChannel = useRTCStore(s => s.terminalChannel)
  const cameraEmulation = useActiveDeviceSelect(v => v.cameraEmulation)
  const macros = useActiveDeviceSelect(s => s.keyboardMacros?.macros ?? [])
  const usbState = useAppStore(s => s.usbState)
  const setHidUsbState =
    (useAppStore.getState() as any).setHidUsbState ??
    useAppStore.getState().setUsbState
  const peerConnection = useAppStore(s => s.rtc?.peerConnection)
  const peerState = useAppStore(
    s => s.rtc?.peerConnectionState ?? 'disconnected'
  )

  const [transceiverMode, setTransceiverMode] = useState<
    'recvonly' | 'sendrecv'
  >('recvonly')
  const remoteScreenRef = useRef<RemoteScreenHandle>(null)
  const mouseVideoRef = useRef<HTMLVideoElement | null>(null)
  const [keyboardEnabled, setKeyboardEnabled] = useState<boolean>(false)
  const [mouseEnabled, setMouseEnabled] = useState<boolean>(true)
  const [terminalEnabled, setTerminalEnabled] = useState<boolean>(false)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [iceServers, setIceServers] = useState<any>(null)
  const [allowWebSocketConnection, setAllowWebSocketConnection] =
    useState<boolean>(false)
  const [isMdUp, setIsMdUp] = useState<boolean>(true)
  const [ocrEnabled, setOcrEnabled] = useState<boolean>(false)
  const [isRestarting, setIsRestarting] = useState<boolean>(false)
  const [restartCountdown, setRestartCountdown] = useState<number>(0)

  const visibleTerminal = useUiStore(s => s.visible.terminal)
  const visibleConnectionStats = useUiStore(s => s.visible.connectionStats)
  const visibleExtension = useUiStore(s => s.visible.extension)
  const setKeyboardLedState = useAppStore.getState().ui.setKeyboardLedState
  const keyboardLedState = useUiStore(s => s.keyboardLedState)
  const setOtaState = useAppStore.getState().update.setOtaState
  const setModalView = useAppStore.getState().update.setModalView
  const resetOtaState = useAppStore.getState().update.resetOtaState
  const closeOtaDialog = useAppStore.getState().update.closeDialog
  const showReconnectOverlay =
    useAppStore.getState().update.showReconnectOverlay
  const isReconnectOverlayVisible = useAppStore(
    s => s.update.isReconnectOverlayVisible
  )
  const { getUpdateStatus } = useUpdateCheck()

  const prevReconnectOverlayVisibleRef = useRef(isReconnectOverlayVisible)

  useEffect(() => {
    const wasVisible = prevReconnectOverlayVisibleRef.current
    prevReconnectOverlayVisibleRef.current = isReconnectOverlayVisible

    if (wasVisible && !isReconnectOverlayVisible) {
      remoteScreenRef.current?.disconnect?.()
      setTimeout(() => {
        setAllowWebSocketConnection(false)
        setTimeout(() => {
          setAllowWebSocketConnection(true)
        }, 100)
      }, 100)
    }
  }, [isReconnectOverlayVisible])

  // Subscribe only to required fields to prevent unnecessary re-renders
  const scrollThrottling = useAppStore(s => s.scrollThrottling)
  const enhancement = useAppStore(v => v.enhancement)
  const mouseInputMode = useAppStore(s => s.mouseInputMode)
  const hideCursor = useAppStore(s => s.hideCursor)
  const cursorStyle = useAppStore(s => s.cursorStyle)

  const pressedUsagesRef = useRef<Set<number>>(new Set())
  const pressedModsRef = useRef<Set<string>>(new Set())
  const lastMouseInVideoRef = useRef<boolean>(false)

  const jiggler = useActiveDeviceSelect(state => state.jiggler)

  const inputChannel = useInputChannel()
  const {
    sendKeyboardReport,
    sendRelMouseReport,
    sendAbsMouseReport,
    sendWheelReport,
  } = inputChannel

  const setKeysDownState =
    (useAppStore.getState() as any).setHidKeysDownState ??
    useAppStore.getState().setKeysDownState
  const controlLayoutMode = useAppStore(s => s.ui.controlLayoutMode)
  const [send, isChannelReady, sendAsync] = useJsonRpc(
    (request: JsonRpcRequest<MethodName>) => {
      const { method, params } = request
      switch (method) {
        case 'otherSessionConnected': {
          // Another session already connected, disconnect to prevent auto-reconnect
          setShowSessionConflictDialog(true)
          remoteScreenRef.current?.disconnect?.()
          break
        }
        case 'usbState': {
          if (typeof params === 'string') {
            setHidUsbState(params)
          }
          break
        }
        case 'otaState': {
          if (params?.error) {
            resetOtaState()
            setModalView('error')
            return
          }
          const {
            systemDownloadProgress = 0,
            systemVerificationProgress = 0,
            systemUpdateProgress = 0,
            byUser,
          } = params ?? {}
          setOtaState(prev => ({ ...prev, ...params }))
          const determineModalView = (): void => {
            if (systemUpdateProgress === 100) {
              resetOtaState()
              showReconnectOverlay()
            } else if (systemUpdateProgress > 0) {
              setModalView('preparing')
            } else if (systemVerificationProgress > 0) {
              setModalView('verify')
            } else if (systemDownloadProgress > 0 && byUser) {
              setModalView('download')
            }
          }

          determineModalView()
          break
        }
        case 'videoInputState': {
          setVideoResolution(params.width, params.height)

          setHdmiConnectionState(params)
          break
        }
        case 'keyboardLedState': {
          if (params && typeof params === 'object') {
            setKeyboardLedState(params as any)
          }
          break
        }
        case 'keysDownState': {
          break
        }
        case 'atxState': {
          setAtxState(params)
          break
        }
        case 'networkState': {
          break
        }
      }
    }
  )

  // Cache rpc tuple to prevent unnecessary re-renders in child components
  const rpc = useMemo(
    () => [send, isChannelReady, sendAsync] as const,
    [send, isChannelReady, sendAsync]
  )

  useEffect(() => {
    const updateMouseInVideo = (e: MouseEvent) => {
      const videoElement = remoteScreenRef.current?.videoElement
      if (!videoElement) {
        lastMouseInVideoRef.current = false
        return
      }
      const rect = videoElement.getBoundingClientRect()
      lastMouseInVideoRef.current =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    }

    document.addEventListener('mousemove', updateMouseInVideo)
    return () => {
      document.removeEventListener('mousemove', updateMouseInVideo)
    }
  }, [])

  // Expose API for browser extensions
  useEffect(() => {
    // Calculate actual channel ready state: force false when disconnected
    const disconnectedStates = ['closed', 'failed', 'disconnected']
    const actualChannelReady =
      isChannelReady && !disconnectedStates.includes(peerState || '')
    window.__arkkvm_pc__ = peerConnection
    window.__arkkvm_rpc__ = {
      send: call => {
        return send(call)
      },
    }

    window.__arkkvm_state__ = {
      isChannelReady: actualChannelReady,
      peerState: peerState || 'unknown',
      usbState: usbState || 'unknown',
      hdmiConnectionState: hdmiConnectionState || 'unknown',
    }

    return () => {
      delete window.__arkkvm_pc__
      delete window.__arkkvm_rpc__
      delete window.__arkkvm_state__
    }
  }, [send, isChannelReady, peerState, usbState, hdmiConnectionState])

  // Monitor connection state changes and sync HDMI state
  useEffect(() => {
    const disconnectedStates = ['closed', 'failed', 'disconnected']
    if (peerState && disconnectedStates.includes(peerState)) {
      setHdmiConnectionState({ ready: false, error: 'no_signal' } as any)
    }
  }, [peerState, setHdmiConnectionState])

  // Sync RemoteScreen's videoElement to mouseVideoRef for useMouseEvents
  useEffect(() => {
    mouseVideoRef.current = remoteScreenRef.current?.videoElement ?? null
  }, [remoteScreenRef, peerState])
  // Check local device setup status
  const checkLocalDeviceSetup = async () => {
    const { isSetup } = await request.get(`/device/status`)

    if (!isSetup) {
      navigate('/welcome', { replace: true })
      return
    }
    const deviceRes = await request.get(`/device`)
    if (deviceRes.deviceId) {
      // [{ urls: 'stun:stun.l.google.com:19302' }]
      setActiveDevice(deviceRes.deviceId)
      setNestedDeviceSetting(prev => ({
        ...prev,
        authMode: deviceRes.authMode,
      }))
      setIceServers([])
      setAllowWebSocketConnection(true)
    }
  }
  // Fetch device info (device mode)
  const getDevice = async () => {
    const deviceResp = await request.get(`/devices/${deviceId}`)
  }

  // Fetch ICE configuration (cloud mode)
  const getIceConfig = async () => {
    const { data: iceResp } = await request.post('/webrtc/ice_config', {}, {})
    if (iceResp.iceServers) {
      // Use only server-returned ICE config to avoid duplicate STUN servers
      setIceServers([iceResp.iceServers])
      setAllowWebSocketConnection(!!iceResp.iceServers)
    }
  }
  useEffect(() => {
    if (deviceId) {
      getIceConfig()
    } else {
      checkLocalDeviceSetup()
    }
  }, [deviceId])
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsMdUp(!!mq.matches)
    update()
    try {
      mq.addEventListener('change', update)
    } catch {
      mq.addListener(update)
    }
    return () => {
      try {
        mq.removeEventListener('change', update)
      } catch {
        mq.removeListener(update)
      }
    }
  }, [])
  // Translation hook
  const { t } = useTranslation('common')

  // Use fine-grained selectors to prevent unnecessary re-renders
  const activeDeviceId = useSettingsStore(s => s.activeDeviceId)
  const devices = useSettingsStore(s => s.devices)
  // Use getState() for setter functions to avoid re-renders
  const setActiveDevice = useSettingsStore.getState().setActiveDevice
  const setDeviceSettingById = useSettingsStore.getState().setDeviceSettingById
  const setNestedDeviceSettingById =
    useSettingsStore.getState().setNestedDeviceSettingById
  const setNestedDeviceSetting =
    useSettingsStore.getState().setNestedDeviceSetting
  const createDevice = useSettingsStore.getState().createDevice
  const authMode = useActiveDeviceSelect(state => state.authMode)
  const isLoading = false

  // ============================================================================
  // Effects - Data Fetching
  // ============================================================================

  useEffect(() => {
    if (!isChannelReady) {
      return
    }
    ;(async () => {
      await getSettings()
      await getVideoStateAsyn()
      await getBaseInfoAsyn()
    })()
  }, [isChannelReady, sendAsync])
  useEffect(() => {
    if (oobeAutoUpdate && isChannelReady) {
      getUpdateStatus('silent')
      setOobeAutoUpdate(false)
    }
  }, [oobeAutoUpdate, isChannelReady, sendAsync])

  const getBaseInfoAsyn = useCallback(async () => {
    if (!isChannelReady) {
      return
    }
    const [
      cameraEmulation,
      microphoneEmulation,
      fileTransfer,
      systemVersionResult,
      autoUpdate,
      uiSwitchResult,
      audioPlaybackResult,
    ] = await Promise.all([
      sendAsync({ method: 'getCameraEmulation' }, { resultOnly: true }).catch(
        e => e
      ),
      sendAsync(
        { method: 'getMicrophoneEmulation' },
        { resultOnly: true }
      ).catch(e => e),
      sendAsync({ method: 'getFileTransfer' }, { resultOnly: true }),
      sendAsync({ method: 'getCurrentVersion' }, { resultOnly: true }),
      sendAsync({ method: 'getAutoUpdateState' }, { resultOnly: true }),
      sendAsync({ method: 'getUiSwitch' }, { resultOnly: true }),
      sendAsync({ method: 'getAudioPlayback' }, { resultOnly: true }),
    ])

    setNestedDeviceSetting(prev => ({
      ...prev,
      microphoneEmulation,
      cameraEmulation,
      fileTransfer,
      autoUpdate,
      ...(systemVersionResult || {}),
      audioPlayback: audioPlaybackResult,
      showAudioPlaybackUI: uiSwitchResult?.hdmi_audio,
    }))
  }, [sendAsync, isChannelReady])
  const getVideoStateAsyn = useCallback(async () => {
    if (!isChannelReady) {
      return
    }
    // Clear previous timer (debounce)
    if (getVideoStateTimerRef.current) {
      clearTimeout(getVideoStateTimerRef.current)
    }

    // Set new delayed timer
    getVideoStateTimerRef.current = setTimeout(async () => {
      const { result } = await sendAsync({
        method: 'getVideoState',
      })

      if (result) {
        setVideoResolution(result.width, result.height)
        // setHdmiConnectionState(result)
      }
      getVideoStateTimerRef.current = null
    }, 300)
  }, [sendAsync, isChannelReady])

  // Cleanup effect for timers and refs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear video state timer
      if (getVideoStateTimerRef.current) {
        clearTimeout(getVideoStateTimerRef.current)
        getVideoStateTimerRef.current = null
      }
      // Clear all double-click timers
      doubleClickTimersRef.current.forEach(timer => clearTimeout(timer))
      doubleClickTimersRef.current.clear()
      // Clear pressCountRef to free memory
      pressCountRef.current.clear()
    }
  }, [])
  const getSettings = async () => {
    try {
      const resp = await sendAsync({ method: 'getDeviceID' })
      if ('result' in resp && resp.result) {
        const id = String(resp.result)

        setActiveDevice(id)
        // Create default settings if device not initialized
        if (!devices[id]) {
          // createDevice(id);
        }
        // Local-first: sync local autoUpdate to backend to avoid server default override
        try {
          const localAuto = devices[id]?.autoUpdate
          if (typeof localAuto === 'boolean') {
            await sendAsync({
              method: 'setAutoUpdateState',
              params: { enabled: localAuto } as any,
            })
          }
        } catch (e) {}
        // Fetch device settings and write to store
        try {
          const partial = await fetchDeviceSettings(sendAsync as any)
          setNestedDeviceSettingById(id, prev => ({
            ...prev,
            ...partial,
            autoUpdate:
              typeof prev.autoUpdate === 'boolean'
                ? prev.autoUpdate
                : (partial as any).autoUpdate,
            network: { ...prev.network, ...(partial as any).network },
          }))
        } catch (e) {}
      }
    } catch (e) {}
    // Trigger additional queries
    send({ method: 'getVideoState' })
    send({ method: 'getKeyboardLedState' })
  }

  // Fullscreen control
  const onFullScreenClick = async (
    event: MouseEvent<SVGSVGElement>,
    data?: FullScreenData
  ) => {
    const videoElement = remoteScreenRef.current?.videoElement
    if (!videoElement) return

    try {
      await videoElement.requestFullscreen({
        navigationUI: 'show',
      })
      setIsFullScreen(true)
    } catch (error) {
      console.error('Fullscreen request failed:', error)
    }
  }

  // Exit fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullScreen(false)
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error)
    }
  }

  // Listen for fullscreen state changes and keyboard events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // When any popup/panel is open, don't forward keyboard to remote
      const isAnyUiPanelOpenState = isAnyUiPanelOpen()

      if (isAnyUiPanelOpenState) return

      const target = event.target as HTMLElement | null
      if (target) {
        const editableRoot = target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]'
        )
        if (editableRoot) {
          return
        }
      }
      event.preventDefault()
      event.stopPropagation()

      const modifiersForReport = {
        ...virtualKeyboardModifierState,
        ControlLeft: Boolean(
          virtualKeyboardModifierState.ControlLeft || event.ctrlKey
        ),
        ShiftLeft: Boolean(
          virtualKeyboardModifierState.ShiftLeft || event.shiftKey
        ),
        AltLeft: Boolean(virtualKeyboardModifierState.AltLeft || event.altKey),
        MetaLeft: Boolean(
          virtualKeyboardModifierState.MetaLeft || event.metaKey
        ),
        AltRight: Boolean(
          (virtualKeyboardModifierState as any).AltGr ||
          virtualKeyboardModifierState.AltRight
        ),
      }

      const resolvedCode = event.code || resolveModifierCode(event)
      const report = isModifierKey(event)
        ? toHidReport(event as unknown as KeyboardEvent)
        : toHidReport(event as unknown as KeyboardEvent, modifiersForReport)
      // Physical keyboard AltGr typically appears as AltRight, map to virtual keyboard AltGr
      const keyCode = resolvedCode === 'AltRight' ? 'AltGr' : resolvedCode

      setKeysDownState(report)

      pressCountRef.current.set(keyCode, 0) // Reset release counter for this key
      // Periodically clean up pressCountRef to prevent memory growth (keep max 50 entries)
      if (pressCountRef.current.size > 50) {
        const entries = Array.from(pressCountRef.current.entries())
        pressCountRef.current.clear()
        // Keep only the last 20 entries
        entries.slice(-20).forEach(([k, v]) => pressCountRef.current.set(k, v))
      }
      sendKeyboardReport(report)

      setPressedKey(keyCode, true) // Record key press
      if (isModifierKey(keyCode)) {
        setVirtualKeyboardModifierState(data => ({
          ...data,
          [keyCode]: true,
        }))
      }

      if (document.fullscreenElement && event.code === 'Escape') {
        setOcrEnabled(false)
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      } else if (event.code === 'Space' && !isPasteTextOpen) {
        remoteScreenRef?.current?.videoElement?.play()
        // send({ method: 'keyboardReport', params: report })
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const resolvedCode = event.code || resolveModifierCode(event)
      const keyCode = resolvedCode === 'AltRight' ? 'AltGr' : resolvedCode
      // Debounce: prevent multiple release events for the same key
      const releaseCount = pressCountRef.current.get(keyCode) || 0
      if (releaseCount > 2) {
        return
      }
      pressCountRef.current.set(keyCode, releaseCount + 1)

      // Update local UI state
      setPressedKey(keyCode, false)

      if (isModifierKey(keyCode)) {
        setVirtualKeyboardModifierState(evn => ({
          ...evn,
          [keyCode]: false,
        }))
      } else if (modifierReleaseMode === 'auto') {
        setVirtualKeyboardModifierState(s => {
          const hasPhysicalModifier = Object.values(
            virtualKeyboardModifierState
          ).some(value => value === true)
          if (!hasPhysicalModifier) {
            return createInitialModifierState()
          }
          return s
        })
      }

      // Send release report to remote
      setKeysDownState({
        keys: [],
        modifier: 0,
      })

      sendKeyboardReport({
        keys: [0, 0, 0, 0, 0, 0],
        modifier: 0,
      })

      if (document.fullscreenElement && event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    // Clear all pressed keys (called on blur/visibility change)
    const clearAllPressedKeys = () => {
      // Clear local pressed keys state
      resetPressedKeys()

      setVirtualKeyboardModifierState(createInitialModifierState())

      // Send release report to remote
      setKeysDownState({
        keys: [],
        modifier: 0,
      })

      sendKeyboardReport({
        keys: [0, 0, 0, 0, 0, 0],
        modifier: 0,
      })
    }

    // Handle window blur (user switches to another app/window)
    const handleWindowBlur = () => {
      clearAllPressedKeys()
    }

    // Handle visibility change (user switches browser tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAllPressedKeys()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    // Listen at capture phase to ensure interception
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    // Listen for window blur and visibility change to clear stuck keys
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    visibleVirtualKeyboard,
    virtualKeyboardModifierState,
    modifierReleaseMode,
    isTerminalVisible,
    send,
    pressedUsagesRef,
    pressedModsRef,
    isPasteTextOpen,
  ])

  // Long press ESC to exit fullscreen
  useLongPressEscape({
    onLongPress: exitFullscreen,
    delay: 3000, // 3 seconds
    enabled: isFullScreen,
  })

  // Handle virtual keyboard key press
  const handleVirtualKeyDown = useCallback(
    (data: { keyCode: string; label: string; hidReport: any }) => {
      sendKeyboardReport(data.hidReport)
    },
    []
  )

  // Handle virtual keyboard key release
  const handleVirtualKeyUp = useCallback(
    (data: { keyCode: string; label: string; hidReport: any }) => {
      sendKeyboardReport(data.hidReport)
      setPressedKey(data.keyCode, false)

      if (isModifierKey(data.keyCode)) {
        setVirtualKeyboardModifierState(evn => ({
          ...evn,
          [data.keyCode]: false,
        }))
      } else if (modifierReleaseMode === 'auto') {
        setVirtualKeyboardModifierState(s => {
          const hasActiveModifier = Object.values(s).some(
            value => value === true
          )
          if (hasActiveModifier) {
            return createInitialModifierState()
          }
          return s
        })
      }
    },
    [modifierReleaseMode]
  )

  // Handle modifier key state changes (Shift, Ctrl, Alt, etc.)

  const handleModifierKeyChange = useCallback(
    (keyCode: string, isActive: boolean) => {
      if (!isActive) {
        //sendKeyboardReport
        sendKeyboardReport({
          keys: [0, 0, 0, 0, 0, 0],
          modifier: (HID_MODIFIERS as Record<string, number>)[keyCode] || 0,
        })
        sendKeyboardReport({
          keys: [0, 0, 0, 0, 0, 0],
          modifier: 0,
        })
      }
      setVirtualKeyboardModifierState(prev => ({
        ...prev,
        [keyCode]: isActive,
      }))
    },
    []
  )

  // Hide virtual keyboard
  const handleHideKeyboard = useCallback(() => {
    toggleMain('virtualKeyboard')
  }, [])

  // Handle keyboard layout change
  const handleLanguageChange = useCallback((layout: string) => {
    setKeyboardLanguage(layout)
  }, [])

  // Memoize VirtualKeyboard props to prevent unnecessary re-renders
  const keyboardStyle = useMemo(
    () => ({ height: `${keyboardHeight}px` }),
    [keyboardHeight]
  )

  const keyboardLeftSlotDocked = useMemo(
    () => (
      <Button size="sm" onClick={() => setKeyboardDisplayMode('floating')}>
        Float
      </Button>
    ),
    []
  )

  const keyboardLeftSlotFloating = useMemo(
    () => (
      <Button size="sm" onClick={() => setKeyboardDisplayMode('docked')}>
        Docked
      </Button>
    ),
    []
  )

  // OCR text recognition complete callback
  const handleTextRecognized = useCallback((text: string) => {
    // Text has been automatically copied to clipboard

    // Auto close OCR mode after recognition
    setOcrEnabled(false)
  }, [])

  // OCR button click handler - toggle OCR mode
  const handleOcrClick = useCallback(() => {
    setOcrEnabled(prev => !prev)
  }, [])

  // OCR cancel handler - close OCR mode
  const handleOcrCancel = useCallback(() => {
    setOcrEnabled(false)
  }, [])

  // Store latest state in ref to avoid callback recreation
  const stateRef = useRef({
    isChannelReady,
    peerState,
    usbState,
    hdmiConnectionState,
  })
  useEffect(() => {
    stateRef.current = {
      isChannelReady,
      peerState,
      usbState,
      hdmiConnectionState,
    }
  }, [isChannelReady, peerState, usbState, hdmiConnectionState])

  // Mouse events (disabled in OCR mode to avoid conflicts)
  const handleAbsMove = useCallback(
    (x: number, y: number, buttons: number) => {
      const { isChannelReady, peerState, usbState, hdmiConnectionState } =
        stateRef.current
      if (
        !isChannelReady ||
        peerState !== 'connected' ||
        usbState !== 'configured' ||
        hdmiConnectionState !== 'ready'
      )
        return

      sendAbsMouseReport({ x, y, buttons })
    },
    [sendAbsMouseReport]
  )

  const handleRelMove = useCallback(
    ({ dx, dy, buttons, y, x }: any) => {
      const { isChannelReady, peerState, usbState, hdmiConnectionState } =
        stateRef.current
      if (
        !isChannelReady ||
        peerState !== 'connected' ||
        usbState !== 'configured' ||
        hdmiConnectionState !== 'ready'
      )
        return

      const sdx = Number.isFinite(dx) ? Math.round(dx) : 0
      const sdy = Number.isFinite(dy) ? Math.round(dy) : 0
      setMouseMove({ x, y, buttons })
      sendRelMouseReport({ dx: sdx, dy: sdy, buttons })
    },
    [setMouseMove, sendRelMouseReport]
  )

  const handleWheel = useCallback(
    (data: any) => {
      const { isChannelReady, peerState, usbState, hdmiConnectionState } =
        stateRef.current
      if (
        !isChannelReady ||
        peerState !== 'connected' ||
        usbState !== 'configured' ||
        hdmiConnectionState !== 'ready'
      )
        return
      const { wheelY } = data
      sendWheelReport({ wheelY: ~~wheelY })
    },
    [sendWheelReport]
  )

  const handleDoubleClick = useCallback(
    (button: number, x?: number, y?: number) => {
      const { isChannelReady, peerState, usbState, hdmiConnectionState } =
        stateRef.current
      if (
        !isChannelReady ||
        peerState !== 'connected' ||
        usbState !== 'configured' ||
        hdmiConnectionState !== 'ready'
      )
        return

      // Helper to create tracked timeout
      const createTrackedTimeout = (fn: () => void, delay: number) => {
        const timer = setTimeout(() => {
          doubleClickTimersRef.current.delete(timer)
          fn()
        }, delay)
        doubleClickTimersRef.current.add(timer)
        return timer
      }

      try {
        const fallbackPos =
          typeof x === 'number' && typeof y === 'number'
            ? { x, y }
            : { x: 16383, y: 16383 }
        const currentPos = fallbackPos

        // First click
        sendAbsMouseReport({ x: currentPos.x, y: currentPos.y, buttons: 1 })
        createTrackedTimeout(() => {
          sendAbsMouseReport({ x: currentPos.x, y: currentPos.y, buttons: 0 })
          createTrackedTimeout(() => {
            sendAbsMouseReport({ x: currentPos.x, y: currentPos.y, buttons: 1 })
            createTrackedTimeout(() => {
              sendAbsMouseReport({
                x: currentPos.x,
                y: currentPos.y,
                buttons: 0,
              })
            }, 50)
          }, 50)
        }, 50)
      } catch (error) {
        console.error('Double click error:', error)
      }
    },
    [sendAbsMouseReport]
  )

  useMouseEvents({
    videoRef: mouseVideoRef,
    videoWidth,
    videoHeight,
    enabled:
      mouseEnabled &&
      (isChannelReady || peerState === 'connected') &&
      !ocrEnabled,
    mode: mouseInputMode,
    scrollThrottling,
    jiggler,
    onAbsMove: handleAbsMove,
    onRelMove: handleRelMove,
    onWheel: handleWheel,
    onDoubleClick: handleDoubleClick,
  })

  return (
    <div
      data-arkkvm-app="true"
      className="text-[var(--text-color)] h-screen flex flex-col overflow-hidden"
    >
      {/* Top Navigation Bar - USB & Device Connection Status */}
      <TopNavbar
        brandLogoType="icon"
        links={[
          { title: 'Cloud Devices', href: '/devices/list', Icon: IconCloud },
        ]}
        deviceName={deviceName || 'ArkKVM Device'}
        usbState={usbState}
        peerState={peerState}
        showLoggedIn={env.target === 'cloud' || authMode === 'password'}
        showDeviceStatus={true}
        onFullScreenClick={onFullScreenClick}
        onReconnect={(countdown?: number) => {
          if (typeof countdown === 'number') {
            setIsRestarting(true)
            setRestartCountdown(countdown)
            const timer = setInterval(() => {
              setRestartCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer)

                  setAllowWebSocketConnection(false)
                  remoteScreenRef.current?.disconnect?.()

                  setTimeout(() => {
                    setAllowWebSocketConnection(true)
                    setIsRestarting(false)
                  }, 200)
                  return 0
                }
                return prev - 1
              })
            }, 1000)
          } else {
            setAllowWebSocketConnection(false)
            remoteScreenRef.current?.disconnect?.()
            setTimeout(() => {
              setAllowWebSocketConnection(true)
              setIsRestarting(false)
            }, 200)
          }
        }}
      ></TopNavbar>

      {/* Control Toolbar - Horizontal Layout */}
      <AnimatePresence initial={false}>
        {controlLayoutMode === 'horizontal' && (
          <motion.div
            key="top-controls"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ControlToolbar
              onKeyboardLayoutClick={() => setKeyboardEnabled(!keyboardEnabled)}
              keyboardEnabled={false}
              inputEventsEnabled={true}
              terminalEnabled={terminalEnabled}
              onOcrClick={handleOcrClick}
              ocrEnabled={ocrEnabled}
              rpc={rpc}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        className="flex-grow overflow-hidden relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Loading State Overlay */}
        <DefaultLoadingOverlay
          loading={isLoading}
          text={t('rtc.peer.connecting')}
          className="absolute inset-0 z-10 pointer-events-none"
          blur={false}
          layout="col"
        />
        <div className="flex h-full w-full min-h-0 items-stretch flex-row">
          <AnimatePresence initial={false}>
            {controlLayoutMode === 'vertical' && (
              <motion.div
                key="left-sidebar"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ControlSidebar
                  rpc={rpc}
                  className="shrink-0"
                  activeKey={
                    visibleTerminal
                      ? 'terminal'
                      : visibleSettings
                        ? 'settings'
                        : visibleConnectionStats
                          ? 'connectionStats'
                          : visibleExtension
                            ? 'extension'
                            : visibleVirtualKeyboard
                              ? 'virtualKeyboard'
                              : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
          {controlLayoutMode === 'vertical' && (
            <>
              <SlidePanel
                open={true}
                side="left"
                width={visibleConnectionStats ? 450 : 0}
                duration={300}
                position="inline"
                contentClassName="h-full shrink-0"
              >
                {visibleConnectionStats && (
                  <StreamAnalytics
                    rpc={rpc}
                    peerConnection={peerConnection}
                    peerState={peerState}
                    closeIcon={<IconToLeft />}
                  />
                )}
              </SlidePanel>
              <SlidePanel
                open={true}
                side="left"
                width={visibleSettings ? 700 : 0}
                duration={300}
                position="inline"
                contentClassName="h-full shrink-0"
              >
                <Settings
                  className="h-full shrink-0 w-[700px] pl-[32px]"
                  rpc={rpc}
                  closeIcon={<IconToLeft />}
                />
              </SlidePanel>
            </>
          )}

          {}
          {isRestarting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <h2 className="text-xl font-semibold text-white">
                  {t('restart.title', { defaultValue: 'Device Restarting' })}
                </h2>
                <p className="text-gray-300">
                  {t('restart.desc', {
                    defaultValue: 'Reconnecting in {{seconds}} seconds...',
                    seconds: restartCountdown,
                  })}
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  onClick={() => {
                    setAllowWebSocketConnection(false)
                    remoteScreenRef.current?.disconnect?.()
                    setTimeout(() => {
                      setAllowWebSocketConnection(true)
                      setIsRestarting(false)
                    }, 200)
                  }}
                >
                  {t('reconnect', { defaultValue: 'Reconnect Now' })}
                </button>
              </div>
            </div>
          )}

          {serverUrl && allowWebSocketConnection && iceServers ? (
            <div className="flex-1 min-w-0 h-full relative overflow-hidden">
              <div
                className="w-full overflow-hidden transition-[height] duration-300 ease-in-out"
                style={{
                  height: `calc(100% - ${
                    (keyboardDisplayMode === 'docked' && visibleVirtualKeyboard
                      ? keyboardHeight
                      : 0) + (visibleTerminal ? 344 : 0)
                  }px)`,
                }}
              >
                <AspectRatioContainer
                  fillParent={false}
                  className="w-full h-full overflow-hidden"
                >
                  <RemoteScreen
                    className="w-full  flex items-center justify-center"
                    ref={remoteScreenRef}
                    isCursorHidden={hideCursor}
                    cursorStyle={cursorStyle}
                    serverUrl={serverUrl}
                    hdmiState={hdmiConnectionState}
                    ocrEnabled={ocrEnabled}
                    onTextRecognized={handleTextRecognized}
                    onOcrCancel={handleOcrCancel}
                    mouseInputMode={mouseInputMode}
                    enhancement={enhancement}
                    rtcConfig={{
                      iceServers,

                      // iceCandidatePoolSize: 10,

                      // bundlePolicy: 'max-bundle',

                      // rtcpMuxPolicy: 'require',
                    }}
                    captureAudio={true}
                    onPeerConnection={pc => {
                      clearUploads()
                      setRtcField('peerConnection', pc)
                    }}
                    onDataChannels={channels => {
                      setTerminalChannel(channels.terminal)
                      setRpcDataChannel(channels.rpc)
                      setSerialChannel(channels.serial)
                      setDiskChannel(channels.disk)
                      setRtcField('inputChannel', channels.input)
                    }}
                    onPeerConnectionStateChange={state => {
                      setRtcField('peerConnectionState', state)

                      if (
                        ['disconnected', 'failed', 'closed'].includes(state)
                      ) {
                        // setHidUsbState('disconnected')
                        resetHID()

                        resetOtaState()
                        closeOtaDialog()
                      } else if (state === 'connected') {
                        getVideoStateAsyn()
                      }
                    }}
                    onVideoSizeChange={size => {
                      const { width, height } = size
                      setContainerSize(width, height)
                    }}
                  />
                </AspectRatioContainer>
              </div>

              {/* Bottom panels - absolutely positioned, stacked from bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 transition-[height] duration-300 ease-in-out overflow-hidden"
                style={{
                  height: `${
                    (keyboardDisplayMode === 'docked' && visibleVirtualKeyboard
                      ? keyboardHeight
                      : 0) + (visibleTerminal ? 344 : 0)
                  }px`,
                }}
              >
                {/* Docked Virtual Keyboard */}
                {visibleVirtualKeyboard && (
                  <VirtualKeyboard
                    className="shrink-0 bg-[var(--bg-secondary)]"
                    style={keyboardStyle}
                    onKeyDown={handleVirtualKeyDown}
                    onKeyUp={handleVirtualKeyUp}
                    onModifierKeyChange={handleModifierKeyChange}
                    onHide={handleHideKeyboard}
                    onLanguageChange={handleLanguageChange}
                    simulateEvents={false}
                    leftSlot={keyboardLeftSlotDocked}
                    defaultLanguage={keyboardLanguage}
                    {...virtualKeyboardModifierState}
                    CapsLock={keyboardLedState?.caps_lock}
                    modifierReleaseMode={modifierReleaseMode}
                  />
                )}

                {/* Terminal */}
                {visibleTerminal && (
                  <Terminal
                    title="Web Terminal"
                    dataChannel={terminalChannel}
                    type="terminal"
                    rpc={rpc}
                  />
                )}
              </div>

              {/* Floating Virtual Keyboard */}
              {keyboardDisplayMode === 'floating' && visibleVirtualKeyboard && (
                <DraggablePanel
                  title=""
                  isOpen={true}
                  onClose={() => setKeyboardDisplayMode('docked')}
                  defaultPosition={{ x: 100, y: 100 }}
                  showHeader={false}
                  width="auto"
                >
                  <VirtualKeyboard
                    className="w-[1000px] pb-[0] bg-[var(--bg-secondary)]"
                    draggable={true}
                    onKeyDown={handleVirtualKeyDown}
                    onKeyUp={handleVirtualKeyUp}
                    onModifierKeyChange={handleModifierKeyChange}
                    onHide={handleHideKeyboard}
                    onLanguageChange={handleLanguageChange}
                    simulateEvents={false}
                    leftSlot={keyboardLeftSlotFloating}
                    defaultLanguage={keyboardLanguage}
                    {...virtualKeyboardModifierState}
                    CapsLock={keyboardLedState?.caps_lock}
                    modifierReleaseMode={modifierReleaseMode}
                  />
                </DraggablePanel>
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full flex items-center justify-center">
              <ConnectionIssuePanel
                title={t('messages:connectionTimeout.title')}
                subtitle={t('messages:connectionTimeout.subtitle')}
                items={t('messages:connectionTimeout.items', {
                  returnObjects: true,
                })}
              />
            </div>
          )}

          <SlidePanel
            open={true}
            side="right"
            width={visibleExtension ? 400 : 0}
            duration={300}
            position="inline"
            contentClassName="h-full shrink-0"
          >
            <Extension rpc={rpc} />
          </SlidePanel>
          {}

          {controlLayoutMode !== 'vertical' && (
            <>
              {' '}
              <SlidePanel
                open={true}
                side="right"
                width={visibleConnectionStats ? 450 : 0}
                duration={300}
                position="inline"
                contentClassName="h-full shrink-0"
              >
                {visibleConnectionStats && (
                  <StreamAnalytics
                    rpc={rpc}
                    peerConnection={peerConnection}
                    peerState={peerState}
                  />
                )}
              </SlidePanel>
              <SlidePanel
                open={true}
                side="right"
                width={visibleSettings ? 700 : 0}
                duration={300}
                position="inline"
                contentClassName="h-full shrink-0"
              >
                <Settings
                  className="h-full shrink-0 w-[700px] pl-[32px]"
                  rpc={rpc}
                />
              </SlidePanel>
            </>
          )}
        </div>
      </motion.div>
      {showStatusBar && (
        <SessionStatusBar videoRef={mouseVideoRef} peerState={peerState} />
      )}

      {/* Session Conflict Dialog */}
      <Dialog
        open={showSessionConflictDialog}
        onOpenChange={setShowSessionConflictDialog}
        title={t('session.active.title')}
        description={t('session.active.desc')}
        confirmText={t('session.active.use_here')}
        showCancel={false}
        width="500px"
        onConfirm={() => {
          setShowSessionConflictDialog(false)
          // Disconnect and reconnect after user confirmation
          remoteScreenRef.current?.disconnect?.()
          setTimeout(() => {
            // Re-enable connection and trigger reconnect
            setAllowWebSocketConnection(false)
            setTimeout(() => {
              setAllowWebSocketConnection(true)
            }, 100)
          }, 100)
        }}
      />
      {/*  */}
      <SystemUpdateDialog />
      {}
      <ReconnectOverlay />
    </div>
  )
}

export default KVMControlPage
