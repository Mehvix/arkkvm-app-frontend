/**
 * Microphone debug panel - used for troubleshooting microphone no sound issues
 */

import { Button } from '@/components/ui/button'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useRTCStore } from '@/stores'
import { useActiveDeviceSettings } from '@/stores/devicesStore'
import { env } from '@/utils/env'
import { createLogger } from '@/utils/logger'
import { useCallback, useState } from 'react'

const logger = createLogger('MicrophoneDebugPanel')

interface DebugInfo {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export const MicrophoneDebugPanel: React.FC = () => {
  const peerConnection = useRTCStore(s => s.peerConnection)
  const microphoneEmulation = useActiveDeviceSettings(
    state => state.microphoneEmulation
  )
  const [send, isChannelReady, sendAsync] = useJsonRpc()

  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  const addDebugLog = useCallback(
    (message: string, type: DebugInfo['type'] = 'info') => {
      const log: DebugInfo = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      }
      setDebugLogs(prev => [...prev.slice(-19), log]) // Keep last 20 entries
      logger.debug('Debug log', { timestamp: log.timestamp, message, type })
    },
    []
  )

  const clearLogs = () => setDebugLogs([])

  // 1. Check basic environment
  const checkEnvironment = useCallback(async () => {
    addDebugLog('Starting basic environment check...', 'info')

    // Check secure context
    if (!env.isSecureContext) {
      addDebugLog('❌ Insecure context (HTTPS required)', 'error')
    } else {
      addDebugLog('✅ Secure context OK', 'success')
    }

    // Check getUserMedia support
    if (!navigator.mediaDevices?.getUserMedia) {
      addDebugLog('❌ Browser does not support getUserMedia', 'error')
    } else {
      addDebugLog('✅ getUserMedia support OK', 'success')
    }

    // Check permissions
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({
          name: 'microphone',
        })
        addDebugLog(
          `Permission status: ${permission.state}`,
          permission.state === 'granted' ? 'success' : 'warning'
        )
      }
    } catch (e) {
      addDebugLog('Cannot check permission status', 'warning')
    }

    // Check device configuration
    addDebugLog(
      `Device microphone emulation: ${microphoneEmulation ? '✅ Enabled' : '❌ Disabled'}`,
      microphoneEmulation ? 'success' : 'error'
    )

    // Check WebRTC connection
    addDebugLog(
      `WebRTC connection: ${peerConnection ? '✅ Established' : '❌ Not established'}`,
      peerConnection ? 'success' : 'error'
    )

    if (peerConnection) {
      addDebugLog(
        `Connection state: ${peerConnection.connectionState}`,
        peerConnection.connectionState === 'connected' ? 'success' : 'warning'
      )
    }

    // Check JSON-RPC channel
    addDebugLog(
      `JSON-RPC channel: ${isChannelReady ? '✅ Ready' : '❌ Not ready'}`,
      isChannelReady ? 'success' : 'error'
    )
  }, [microphoneEmulation, peerConnection, isChannelReady, addDebugLog])

  // 2. Check audio Transceiver
  const checkAudioTransceiver = useCallback(() => {
    addDebugLog('Checking audio Transceiver...', 'info')

    if (!peerConnection) {
      addDebugLog('❌ PeerConnection does not exist', 'error')
      return
    }

    const transceivers = peerConnection.getTransceivers()
    addDebugLog(`Total ${transceivers.length} transceivers`, 'info')

    transceivers.forEach((t, index) => {
      const kind = t.receiver.track?.kind || 'unknown'
      addDebugLog(
        `Transceiver ${index}: ${kind} ${t.direction} (mid: ${t.mid})`,
        'info'
      )
    })

    // Find audio send channel
    const sendOnlyTransceivers = transceivers.filter(
      t => t.direction === 'sendonly'
    )
    const audioSendTransceiver = sendOnlyTransceivers[0] // First sendonly should be audio

    if (audioSendTransceiver) {
      addDebugLog('✅ Found audio send channel', 'success')
      addDebugLog(
        `Sender track: ${audioSendTransceiver.sender.track?.id || 'null'}`,
        'info'
      )
      addDebugLog(
        `Sender state: ${audioSendTransceiver.sender.track?.readyState || 'null'}`,
        'info'
      )
    } else {
      addDebugLog('❌ Audio send channel not found', 'error')
    }
  }, [peerConnection, addDebugLog])

  // 3. Test audio stream acquisition
  const testAudioStream = useCallback(async () => {
    addDebugLog('Testing audio stream acquisition...', 'info')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
          volume: 1.0,
        },
        video: false,
      })

      const track = stream.getAudioTracks()[0]
      if (track) {
        addDebugLog('✅ Audio stream acquired successfully', 'success')
        addDebugLog(`Track ID: ${track.id}`, 'info')
        addDebugLog(`Track state: ${track.readyState}`, 'info')
        addDebugLog(`Track label: ${track.label}`, 'info')

        const settings = track.getSettings()
        addDebugLog(
          `Sample rate: ${settings.sampleRate}Hz, Channels: ${settings.channelCount}`,
          'info'
        )

        // Cleanup
        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop())
          addDebugLog('Test audio stream cleaned up', 'info')
        }, 2000)
      } else {
        addDebugLog('❌ Cannot get audio track', 'error')
      }
    } catch (error) {
      addDebugLog(`❌ Audio stream acquisition failed: ${error}`, 'error')
      if (error instanceof Error && error.name === 'NotAllowedError') {
        addDebugLog(
          'Please check browser microphone permission settings',
          'warning'
        )
      }
    }
  }, [addDebugLog])

  // 4. Check device status
  const checkDeviceStatus = useCallback(async () => {
    addDebugLog('Checking device status...', 'info')

    try {
      const result = await sendAsync(
        { method: 'getMicrophoneEmulation' },
        { resultOnly: true }
      )
      addDebugLog(
        `Device microphone emulation: ${result ? '✅ Enabled' : '❌ Disabled'}`,
        result ? 'success' : 'error'
      )
    } catch (error) {
      addDebugLog(`❌ Cannot get device status: ${error}`, 'error')
    }
  }, [sendAsync, addDebugLog])

  // 5. Full diagnosis
  const runFullDiagnosis = useCallback(async () => {
    setIsDebugging(true)
    clearLogs()
    addDebugLog('🔍 Starting full diagnosis...', 'info')

    await checkEnvironment()
    await new Promise(resolve => setTimeout(resolve, 500))

    checkAudioTransceiver()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testAudioStream()
    await new Promise(resolve => setTimeout(resolve, 500))

    await checkDeviceStatus()

    addDebugLog('🏁 Diagnosis completed', 'success')
    setIsDebugging(false)
  }, [
    checkEnvironment,
    checkAudioTransceiver,
    testAudioStream,
    checkDeviceStatus,
    addDebugLog,
  ])

  const getLogColor = (type: DebugInfo['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">🎤 Microphone Debug Panel</h3>
        <Button size="sm" variant="outline" onClick={() => setDebugLogs([])}>
          Clear
        </Button>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <Button size="sm" onClick={runFullDiagnosis} disabled={isDebugging}>
          {isDebugging ? 'Diagnosing...' : 'Full Diagnosis'}
        </Button>
        <Button size="sm" variant="outline" onClick={checkEnvironment}>
          Check Env
        </Button>
        <Button size="sm" variant="outline" onClick={checkAudioTransceiver}>
          Check Channel
        </Button>
        <Button size="sm" variant="outline" onClick={testAudioStream}>
          Test Audio
        </Button>
        <Button size="sm" variant="outline" onClick={checkDeviceStatus}>
          Device Status
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-2 rounded text-sm font-mono">
        {debugLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            Click button to start debugging
          </div>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} className={`mb-1 ${getLogColor(log.type)}`}>
              <span className="text-gray-400">[{log.timestamp}]</span>{' '}
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
