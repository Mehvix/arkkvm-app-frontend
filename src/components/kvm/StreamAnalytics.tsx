/**
 * @Purpose: Stream Metrics Analytics Component
 * @Description: Real-time WebRTC stream quality monitoring
 * @version: 1.0
 * @Author: zhanglei
 * @Date: 2025-11-27 19:37:40
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-12 04:09:51
 */
import { IconToBottomOne } from '@/assets/icons'
import MultiLineChart from '@/components/MultiLineChart'
import type { JsonRpcHandle } from '@/hooks/useJsonRpc'
import { useAppStore } from '@/stores'
import { toFixedNumber, toNumber } from '@/utils/common'
import { createLogger } from '@/utils/logger'
import { BarChart3, ChevronDown, ChevronUp, List } from 'lucide-react'
import { memo, ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

const logger = createLogger('StreamAnalytics')
const STATS_INTERVAL_MS = 1000
const MAX_POINTS = 120
const pushKeepLast = <T,>(arr: T[], v: T, max = MAX_POINTS) => {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice()
  next.push(v)
  return next
}

type StatusType = 'good' | 'warn' | 'limited' | 'stable' | 'low-latency' | 'bad'

/**
 * MetricCard Props
 */
interface MetricCardProps {
  icon?: string
  title: string
  status: StatusType
  statusText: string
  metrics?: Array<{
    label: string
    value: string
  }>
  children?: ReactNode
  className?: string
}

/**
 * Status configuration mapping
 */
const STATUS_CONFIG: Record<
  StatusType,
  { dotColor: string; bgColor: string; textColor: string }
> = {
  good: {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
  },
  warn: {
    dotColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
  },
  limited: {
    dotColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
  },
  stable: {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
  },
  'low-latency': {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
  },
  bad: {
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
  },
}
type InboundVideo = {
  bytesReceived: number
  packetsReceived: number
  packetsLost: number
  packetsDiscarded: number
  jitter: number
  jitterBufferDelay: number
  jitterBufferEmittedCount: number
  framesPerSecond: number
  framesReceived?: number
  framesDecoded?: number
  framesDropped?: number
  [key: string]: number
}
type InboundAudio = {
  bytesReceived: number
  packetsReceived: number
  packetsLost: number
  packetsDiscarded: number
  jitter: number
  jitterBufferDelay: number
  jitterBufferEmittedCount: number
  totalSamplesDuration: number
  removedSamplesForAcceleration: number
  insertedSamplesForDeceleration: number
  [key: string]: number
}
const INBOUND_VIDEO_KEYS = [
  'bytesReceived',
  'packetsReceived',
  'packetsLost',
  'packetsDiscarded',
  'jitter',
  'jitterBufferDelay',
  'jitterBufferEmittedCount',
  'framesPerSecond',
  'framesReceived',
  'framesDecoded',
  'framesDropped',
] as const
const INBOUND_AUDIO_KEYS = [
  'bytesReceived',
  'packetsReceived',
  'packetsLost',
  'packetsDiscarded',
  'jitter',
  'jitterBufferDelay',
  'jitterBufferEmittedCount',
  'totalSamplesDuration',
  'removedSamplesForAcceleration',
  'insertedSamplesForDeceleration',
] as const
// Outbound (sending) media snapshots
interface OutboundVideo {
  bytesSent: number
  packetsSent: number
  framesSent: number
  framesEncoded: number
}
interface OutboundAudio {
  bytesSent: number
  packetsSent: number
}
interface PrevStatsSnapshot {
  timestamp: number
  inboundVideo?: InboundVideo
  inboundAudio?: InboundAudio
  outboundVideo?: OutboundVideo
  outboundAudio?: OutboundAudio
}
const makeInboundVideoSnapshot = (report: any): InboundVideo => {
  const snap: InboundVideo = {
    bytesReceived: 0,
    packetsReceived: 0,
    packetsLost: 0,
    packetsDiscarded: 0,
    jitter: 0,
    jitterBufferDelay: 0,
    jitterBufferEmittedCount: 0,
    framesPerSecond: 0,
    framesReceived: 0,
    framesDecoded: 0,
    framesDropped: 0,
  }
  INBOUND_VIDEO_KEYS.forEach(key => {
    snap[key] = toNumber(report[key])
  })
  return snap
}
const makeInboundAudioSnapshot = (report: any): InboundAudio => {
  const snap: InboundAudio = {
    bytesReceived: 0,
    packetsReceived: 0,
    packetsLost: 0,
    packetsDiscarded: 0,
    jitter: 0,
    jitterBufferDelay: 0,
    jitterBufferEmittedCount: 0,
    totalSamplesDuration: 0,
    removedSamplesForAcceleration: 0,
    insertedSamplesForDeceleration: 0,
  }
  INBOUND_AUDIO_KEYS.forEach(key => {
    snap[key] = toNumber(report[key])
  })
  return snap
}
const makeOutboundVideoSnapshot = (report: any): OutboundVideo => {
  return {
    bytesSent: toNumber(report.bytesSent),
    packetsSent: toNumber(report.packetsSent),
    framesSent: toNumber(report.framesSent),
    framesEncoded: toNumber(report.framesEncoded),
  }
}
const makeOutboundAudioSnapshot = (report: any): OutboundAudio => {
  return {
    bytesSent: toNumber(report.bytesSent),
    packetsSent: toNumber(report.packetsSent),
  }
}
type CalcInboundAudioMetricsArgs = {
  curr: InboundAudio
  prev: InboundAudio
  dtMs: number
  sampleRate?: number
}
//
const calcInboundAudioMetrics = ({
  curr,
  prev,
  dtMs,
  sampleRate = 48000,
}: CalcInboundAudioMetricsArgs) => {
  const dt = dtMs / 1000

  // If there is no previous frame or dt is invalid, return safe defaults
  if (!prev || !Number.isFinite(dt) || dt <= 0) {
    return {
      kbps: 0,
      jitterMs: (curr.jitter ?? 0) * 1000,
      lossRate: 0,
      discardRate: 0,
      healthRate: 0,
      accelMs: 0,
      decelMs: 0,
      jitterBufferDelayMs: 0,
      jitterBufferDelayMsAvg: 0,
    }
  }

  const dBytes = (curr.bytesReceived ?? 0) - (prev.bytesReceived ?? 0)
  const dRecv = (curr.packetsReceived ?? 0) - (prev.packetsReceived ?? 0)
  const dLost = (curr.packetsLost ?? 0) - (prev.packetsLost ?? 0)
  const dDisc = (curr.packetsDiscarded ?? 0) - (prev.packetsDiscarded ?? 0)
  const dPlay =
    (curr.totalSamplesDuration ?? 0) - (prev.totalSamplesDuration ?? 0)
  const dRem =
    (curr.removedSamplesForAcceleration ?? 0) -
    (prev.removedSamplesForAcceleration ?? 0)
  const dIns =
    (curr.insertedSamplesForDeceleration ?? 0) -
    (prev.insertedSamplesForDeceleration ?? 0)

  const kbps = Math.round((dBytes * 8) / dt / 1000)

  const sentEst = dRecv + dLost
  const lossRate = sentEst > 0 ? dLost / sentEst : 0
  const discardRate = dRecv > 0 ? dDisc / dRecv : 0

  const healthRate = dt > 0 ? dPlay / dt : 0

  const accelMs = (dRem / sampleRate) * 1000
  const decelMs = (dIns / sampleRate) * 1000

  // audio jitter buffer lifetime avg delay (sec -> ms)
  const jbDelayMsAvg =
    (curr.jitterBufferDelay ?? 0) >= 0 &&
    (curr.jitterBufferEmittedCount ?? 0) > 0
      ? Math.round(
          ((curr.jitterBufferDelay ?? 0) /
            (curr.jitterBufferEmittedCount ?? 1)) *
            1000
        )
      : 0

  // audio jitter buffer avg delay for this stats interval (sec -> ms)
  const dDelayAudio =
    (curr.jitterBufferDelay ?? 0) - (prev.jitterBufferDelay ?? 0)
  const dCountAudio =
    (curr.jitterBufferEmittedCount ?? 0) - (prev.jitterBufferEmittedCount ?? 0)

  const jbDelayMs =
    dCountAudio > 0 ? Math.round((dDelayAudio / dCountAudio) * 1000) : 0

  return {
    kbps,
    jitterMs: (curr.jitter ?? 0) * 1000,
    lossRate,
    discardRate,
    healthRate,
    accelMs,
    decelMs,
    jitterBufferDelayMs: jbDelayMs,
    jitterBufferDelayMsAvg: jbDelayMsAvg,
  }
}
type CalcInboundVideoMetricsArgs = {
  curr: InboundVideo
  prev: InboundVideo
  dtMs: number
}

export const calcInboundVideoMetrics = ({
  curr,
  prev,
  dtMs,
}: CalcInboundVideoMetricsArgs) => {
  const dt = dtMs / 1000
  const { framesPerSecond, jitterBufferDelay, jitterBufferEmittedCount } = curr
  const fps = toNumber(framesPerSecond)
  const packetsLost = toNumber(curr.packetsLost)
  const jitter = toNumber(curr.jitter)
  const framesDroppedCurr = toNumber((curr as any).framesDropped)
  const framesReceivedCurr = toNumber((curr as any).framesReceived)
  const framesDecodedCurr = toNumber((curr as any).framesDecoded)
  if (!prev || !Number.isFinite(dt) || dt <= 0) {
    return {
      fps,
      kbps: 0,
      mbps: 0,
      jitterMs: jitter * 1000,
      jitterBufferDelayMs: 0,
      jitterBufferDelayMsAvg: 0,
      packetsLost,
      lossRate: 0,
      discardRate: 0,
      framesDroppedInterval: 0,
      framesReceivedInterval: 0,
      framesDecodedInterval: 0,
      packetsDiscardedInterval: 0,
    }
  }

  const dBytes = toNumber(curr.bytesReceived) - toNumber(prev.bytesReceived)
  const dRecv = toNumber(curr.packetsReceived) - toNumber(prev.packetsReceived)
  const dLost = toNumber(curr.packetsLost) - toNumber(prev.packetsLost)
  const dDisc =
    toNumber(curr.packetsDiscarded) - toNumber(prev.packetsDiscarded)
  const dFramesDropped =
    framesDroppedCurr - toNumber((prev as any).framesDropped)
  const dFramesReceived =
    framesReceivedCurr - toNumber((prev as any).framesReceived)
  const dFramesDecoded =
    framesDecodedCurr - toNumber((prev as any).framesDecoded)

  const kbps = Math.round((dBytes * 8) / dt / 1000)
  const mbps = toFixedNumber(kbps / 1000)

  const sentEst = dRecv + dLost
  const lossRate = sentEst > 0 ? dLost / sentEst : 0
  const discardRate = dRecv > 0 ? dDisc / dRecv : 0

  const jitterMs = jitter > 0 ? Math.round(jitter * 1000) : 0

  const jbDelayMsAvg =
    (jitterBufferDelay ?? 0) >= 0 && (jitterBufferEmittedCount ?? 0) > 0
      ? Math.round(
          ((jitterBufferDelay ?? 0) / (jitterBufferEmittedCount ?? 1)) * 1000
        )
      : 0

  const dDelay = (curr.jitterBufferDelay ?? 0) - (prev.jitterBufferDelay ?? 0)
  const dCount =
    (curr.jitterBufferEmittedCount ?? 0) - (prev.jitterBufferEmittedCount ?? 0)

  const jbDelayMs = dCount > 0 ? Math.round((dDelay / dCount) * 1000) : 0

  const framesDroppedInterval = dFramesDropped > 0 ? dFramesDropped : 0
  const framesReceivedInterval = dFramesReceived > 0 ? dFramesReceived : 0
  const framesDecodedInterval = dFramesDecoded > 0 ? dFramesDecoded : 0
  const packetsDiscardedInterval = dDisc > 0 ? dDisc : 0

  return {
    fps,
    kbps,
    mbps,
    jitterMs,
    jitterBufferDelayMs: jbDelayMs,
    jitterBufferDelayMsAvg: jbDelayMsAvg,
    packetsLost,
    lossRate,
    discardRate,
    framesDroppedInterval,
    framesReceivedInterval,
    framesDecodedInterval,
    packetsDiscardedInterval,
  }
}
/**
 * MetricCard - compact summary metrics card
 */
const MetricCard = memo<MetricCardProps>(
  ({ icon, title, status, statusText, metrics, children, className = '' }) => {
    const config = STATUS_CONFIG[status]

    return (
      <div
        className={`
        relative overflow-hidden
        rounded-xl border border-[var(--border-color)]
        bg-[var(--secondary-bg-color)]
        p-3
        ${className}
      `}
      >
        {/* Background glow effect */}
        <div className="pointer-events-none absolute inset-0" />

        {/* Card header */}
        <div className="relative z-10 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Icon */}
            {icon && (
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-[var(--bg-button-color)] text-[11px] text-[var(--inactive-text-color)]">
                {icon}
              </div>
            )}
            {/* Title */}
            <span className="text-[13px] font-medium text-[var(--text-color)]">
              {title}
            </span>
          </div>

          {/* Status indicator */}
          <div
            className={`
            inline-flex items-center gap-1.5
            rounded-full border border-[var(--border-color)]
            px-2 py-0.5
            text-[11px]
            backdrop-blur-xl
            ${config.bgColor}
          `}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${config.dotColor} shadow-[0_0_8px_currentColor]`}
            />
            <span className={config.textColor}>{statusText}</span>
          </div>
        </div>

        {/* Metric data */}
        {metrics && metrics.length > 0 && (
          <div className="relative z-10 flex flex-col gap-1 text-[12px] text-[var(--inactive-text-color)]">
            {metrics.map((metric, index) => (
              <div key={index}>
                <span className="font-medium text-[var(--text-color)]">
                  {metric.label}
                </span>
                <span className="mx-1.5">·</span>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom content */}
        {children && <div className="relative z-10 mt-2">{children}</div>}
      </div>
    )
  }
)

MetricCard.displayName = 'MetricCard'

/**
 * DetailedMetricCard component props
 */
interface DetailedMetricCardProps {
  /** Card icon */
  icon?: string
  /** Card title */
  title: string
  /** Status type */
  status: StatusType
  /** Status text label */
  statusText: string
  /** Detailed metric data (key-value pairs) */
  details: Array<{
    key: string
    value: string | number
  }>
  /** Optional custom className */
  className?: string
}

/**
 * DetailedMetricCard - detailed key/value metrics card
 * Used to display richer metric details in a structured list
 */
const DetailedMetricCard = memo<DetailedMetricCardProps>(
  ({ icon, title, status, statusText, details, className = '' }) => {
    const config = STATUS_CONFIG[status]

    return (
      <div
        className={`
        relative overflow-hidden
        rounded-xl border border-[var(--border-color)]
        bg-[var(--secondary-bg-color)]
        p-3
        ${className}
      `}
      >
        {/* Card header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[13px] opacity-80">{icon}</span>}
            <span className="text-[13px] font-medium text-[var(--text-color)]">
              {title}
            </span>
          </div>

          {/* Status indicator */}
          <div
            className={`
            inline-flex items-center gap-1.5
            rounded-full border border-[var(--border-color)]
            px-2 py-0.5
            text-[11px]
            backdrop-blur-xl
            ${config.bgColor}
          `}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${config.dotColor} shadow-[0_0_8px_currentColor]`}
            />
            <span className={config.textColor}>{statusText}</span>
          </div>
        </div>

        {/* Detailed metric data */}
        <div className="flex flex-col gap-1 text-[12px]">
          {details.map((detail, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-[var(--inactive-text-color)]"
            >
              <span className="opacity-70">{detail.key}</span>
              <span className="font-medium text-[var(--text-color)]">
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

DetailedMetricCard.displayName = 'DetailedMetricCard'

/**
 * CollapsibleSection component props
 */
interface CollapsibleSectionProps {
  /** Section title */
  title: string
  /** Default expanded state */
  defaultExpanded?: boolean
  /** Nested content */
  children: ReactNode
  /** Optional custom className */
  className?: string
}

/**
 * CollapsibleSection - generic collapsible container
 */
const CollapsibleSection = memo<CollapsibleSectionProps>(
  ({ title, defaultExpanded = false, children, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
      <div className={`${className}`}>
        {/* Header bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] px-3 py-2.5 text-left transition-all hover:brightness-110"
        >
          <h3 className="text-[15px] font-medium">{title}</h3>
          <div className="flex items-center gap-2 text-[12px] text-[var(--inactive-text-color)]">
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Collapsible content */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {children}
        </div>
      </div>
    )
  }
)

CollapsibleSection.displayName = 'CollapsibleSection'

/**
 * StreamAnalytics - streaming analytics panel
 */
interface StreamAnalyticsProps {
  rpc: JsonRpcHandle
  peerConnection: RTCPeerConnection | null
  peerState: string
  closeIcon?: React.ReactNode
}
const StreamAnalytics = memo<StreamAnalyticsProps>(
  ({ rpc, peerConnection, peerState, closeIcon }) => {
    const { t } = useTranslation('messages')
    // View mode: 'list' or 'chart'
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')
    const toggleMain = useAppStore(s => s.ui.toggleMain)

    // Previous stats snapshot used for delta-based calculations
    const prevStatsRef = useRef<PrevStatsSnapshot | null>(null)

    // History used for charts (keep up to MAX_POINTS samples)
    const [chartHistory, setChartHistory] = useState<{
      timestamp: number[]
      inboundVideoFps: number[]
      inboundVideoBitrate: number[]
      inboundVideoJitter: number[]
      inboundVideoJitterBuffer: number[]
      inboundVideoJitterBufferAvg: number[]
      inboundVideoPacketsLost: number[]
      inboundVideoFramesDroppedInterval: number[]
      inboundVideoFramesReceivedInterval: number[]
      inboundVideoFramesDecodedInterval: number[]
      inboundVideoPacketsDiscardedInterval: number[]
      inboundAudioBitrate: number[]
      inboundAudioJitter: number[]
      inboundAudioJitterBuffer: number[]
      inboundAudioJitterBufferAvg: number[]
      networkRtt: number[]
    }>({
      timestamp: [],
      inboundVideoFps: [],
      inboundVideoBitrate: [],
      inboundVideoJitter: [],
      inboundVideoJitterBuffer: [],
      inboundVideoJitterBufferAvg: [],
      inboundVideoPacketsLost: [],
      inboundVideoFramesDroppedInterval: [],
      inboundVideoFramesReceivedInterval: [],
      inboundVideoFramesDecodedInterval: [],
      inboundVideoPacketsDiscardedInterval: [],
      inboundAudioBitrate: [],
      inboundAudioJitter: [],
      inboundAudioJitterBuffer: [],
      inboundAudioJitterBufferAvg: [],
      networkRtt: [],
    })

    // Aggregated stats state (derived from calcInbound*Metrics outputs)
    const [stats, setStats] = useState<{
      inbound: {
        video: InboundVideoStats
        audio: InboundAudioStats
      }
      outbound: {
        video: { fps: number; mbps: number; bitrate: number }
        audio: {
          mbps: number
          bitrate: number
          muted: boolean
          codec: string
          clockRate: number
          channels: number
        }
      }
      codec: {
        inboundAudio: string
        outboundAudio: string
      }
      network: {
        rtt: number
      }
      dataChannel: {
        disk: { bytesReceived: number; bytesSent: number }
      }
    }>({
      inbound: {
        video: {
          fps: 0,
          kbps: 0,
          mbps: 0,
          jitterMs: 0,
          jitterBufferDelayMs: 0,
          jitterBufferDelayMsAvg: 0,
          packetsLost: 0,
          lossRate: 0,
          discardRate: 0,
          framesDroppedInterval: 0,
          framesReceivedInterval: 0,
          framesDecodedInterval: 0,
          packetsDiscardedInterval: 0,
        },
        audio: {
          kbps: 0,
          jitterMs: 0,
          lossRate: 0,
          discardRate: 0,
          healthRate: 0,
          accelMs: 0,
          decelMs: 0,
          jitterBufferDelayMs: 0,
          jitterBufferDelayMsAvg: 0,
        },
      },
      outbound: {
        video: { fps: 0, mbps: 0, bitrate: 0 },
        audio: {
          mbps: 0,
          bitrate: 0,
          muted: true,
          codec: '',
          clockRate: 0,
          channels: 0,
        },
      },
      codec: {
        inboundAudio: '',
        outboundAudio: '',
      },
      network: {
        rtt: 0,
      },
      dataChannel: {
        disk: { bytesReceived: 0, bytesSent: 0 },
      },
    })

    useEffect(() => {
      if (peerState !== 'connected' || !peerConnection) return

      let timeoutId: number | undefined

      const getStatsAsync = async () => {
        const rtcStats = await peerConnection.getStats()

        let successfulLocalCandidateId: string | null = null
        let successfulRemoteCandidateId: string | null = null

        const now = Date.now()
        const prev = prevStatsRef.current
        const prevTimestamp = prev?.timestamp ?? 0
        // Use functional setState to avoid capturing stale stats
        setStats(prevStats => {
          const newStats = { ...prevStats }

          // Snapshot of cumulative values for this stats interval
          const currentValues: PrevStatsSnapshot = {
            timestamp: now,
          }

          rtcStats.forEach((report: any) => {
            const { kind } = report
            const type = report.type

            if (type === 'inbound-rtp') {
              if (kind === 'video') {
                newStats.inbound.video = calcInboundVideoMetrics({
                  curr: report,
                  prev: prev?.inboundVideo,
                  dtMs: prevTimestamp ? now - prevTimestamp : 0,
                })
                currentValues.inboundVideo = makeInboundVideoSnapshot(report)
              } else if (kind === 'audio') {
                newStats.inbound.audio = calcInboundAudioMetrics({
                  curr: report,
                  prev: prev?.inboundAudio,
                  dtMs: prevTimestamp ? now - prevTimestamp : 0,
                })

                currentValues.inboundAudio = makeInboundAudioSnapshot(report)

                // Resolve codec info for inbound audio
                if (report.codecId) {
                  const codecReport = rtcStats.get(report.codecId) as any
                  if (codecReport) {
                    const name = (codecReport.mimeType || '').replace(
                      'audio/',
                      ''
                    )
                    const cr = codecReport.clockRate || 0
                    const ch = codecReport.channels || 1
                    newStats.codec.inboundAudio = `${name}/${cr}/${ch}ch`
                  }
                }
              }
            } else if (type === 'outbound-rtp') {
              const kind = report.kind
              const prev = prevStatsRef.current
              const now = Date.now()
              const prevTimestamp = prev?.timestamp ?? now
              const dtMs = now - prevTimestamp
              const dtSec = dtMs / 1000

              if (kind === 'video') {
                const curr = makeOutboundVideoSnapshot(report)
                const prevOut = prev?.outboundVideo

                if (prevOut && dtSec > 0) {
                  const deltaBytes = curr.bytesSent - prevOut.bytesSent
                  const bitrate = Math.round((deltaBytes * 8) / dtSec) // bps
                  const deltaFrames = curr.framesSent - prevOut.framesSent
                  const fps = Math.round(deltaFrames / dtSec)

                  newStats.outbound.video.bitrate = bitrate
                  newStats.outbound.video.mbps = bitrate / 1_000_000
                  newStats.outbound.video.fps = fps
                }

                currentValues.outboundVideo = curr
              } else if (kind === 'audio') {
                const curr = makeOutboundAudioSnapshot(report)
                const prevOut = prev?.outboundAudio

                if (prevOut && dtSec > 0) {
                  const deltaBytes = curr.bytesSent - prevOut.bytesSent
                  const bitrate = Math.round((deltaBytes * 8) / dtSec) // bps
                  const kbps = Math.round(bitrate / 1000)

                  newStats.outbound.audio.bitrate = kbps
                  newStats.outbound.audio.mbps = bitrate / 1_000_000
                  newStats.outbound.audio.muted = kbps === 0
                }

                // Resolve codec info for outbound audio
                if (report.codecId) {
                  const codecReport = rtcStats.get(report.codecId) as any
                  if (codecReport) {
                    const name = (codecReport.mimeType || '').replace(
                      'audio/',
                      ''
                    )
                    const cr = codecReport.clockRate || 0
                    const ch = codecReport.channels || 1
                    newStats.codec.outboundAudio = `${name}/${cr}/${ch}ch`
                    newStats.outbound.audio.codec = name
                    newStats.outbound.audio.clockRate = cr
                    newStats.outbound.audio.channels = ch
                  }
                }

                currentValues.outboundAudio = curr
              }
            } else if (type === 'candidate-pair') {
            } else if (type === 'transport') {
            } else if (type === 'peer-connection') {
            }

            if (report.type === 'candidate-pair' && report.nominated) {
              if (report.state === 'succeeded') {
                successfulLocalCandidateId = report.localCandidateId
                successfulRemoteCandidateId = report.remoteCandidateId
                newStats.network.rtt = report.currentRoundTripTime
                  ? Math.round(report.currentRoundTripTime * 1000)
                  : 0
              }
            } else if (
              report.type === 'data-channel' &&
              report.label === 'disk'
            ) {
              newStats.dataChannel.disk.bytesReceived =
                report.bytesReceived || 0
              newStats.dataChannel.disk.bytesSent = report.bytesSent || 0
            }
          })

          // Update prevStatsRef for the next delta computation
          prevStatsRef.current = currentValues

          // Update chart history
          const chartNow = Math.floor(Date.now() / 1000) // timestamp (seconds)
          setChartHistory(prev => {
            return {
              timestamp: pushKeepLast(prev.timestamp, chartNow),

              inboundVideoFps: pushKeepLast(
                prev.inboundVideoFps,
                newStats.inbound.video.fps
              ),
              inboundVideoBitrate: pushKeepLast(
                prev.inboundVideoBitrate,
                newStats.inbound.video.mbps
              ),
              inboundVideoJitter: pushKeepLast(
                prev.inboundVideoJitter,
                newStats.inbound.video.jitterMs
              ),
              inboundVideoJitterBuffer: pushKeepLast(
                prev.inboundVideoJitterBuffer,
                newStats.inbound.video.jitterBufferDelayMs
              ),
              inboundVideoJitterBufferAvg: pushKeepLast(
                prev.inboundVideoJitterBufferAvg,
                newStats.inbound.video.jitterBufferDelayMsAvg
              ),
              inboundVideoPacketsLost: pushKeepLast(
                prev.inboundVideoPacketsLost,
                newStats.inbound.video.packetsLost
              ),

              inboundVideoFramesDroppedInterval: pushKeepLast(
                prev.inboundVideoFramesDroppedInterval,
                (newStats.inbound.video as any).framesDroppedInterval ?? 0
              ),
              inboundVideoFramesReceivedInterval: pushKeepLast(
                prev.inboundVideoFramesReceivedInterval,
                (newStats.inbound.video as any).framesReceivedInterval ?? 0
              ),
              inboundVideoFramesDecodedInterval: pushKeepLast(
                prev.inboundVideoFramesDecodedInterval,
                (newStats.inbound.video as any).framesDecodedInterval ?? 0
              ),
              inboundVideoPacketsDiscardedInterval: pushKeepLast(
                prev.inboundVideoPacketsDiscardedInterval,
                (newStats.inbound.video as any).packetsDiscardedInterval ?? 0
              ),

              inboundAudioBitrate: pushKeepLast(
                prev.inboundAudioBitrate,
                newStats.inbound.audio.kbps
              ),
              inboundAudioJitter: pushKeepLast(
                prev.inboundAudioJitter,
                newStats.inbound.audio.jitterMs
              ),
              inboundAudioJitterBuffer: pushKeepLast(
                prev.inboundAudioJitterBuffer,
                newStats.inbound.audio.jitterBufferDelayMs
              ),
              inboundAudioJitterBufferAvg: pushKeepLast(
                prev.inboundAudioJitterBufferAvg,
                newStats.inbound.audio.jitterBufferDelayMsAvg
              ),
              networkRtt: pushKeepLast(prev.networkRtt, newStats.network.rtt),
            }
          })

          return newStats
        })

        // Schedule next stats polling after current run completes
        timeoutId = window.setTimeout(getStatsAsync, STATS_INTERVAL_MS)
      }

      // Kick off first polling run
      getStatsAsync()

      return () => {
        if (timeoutId !== undefined) {
          logger.debug('Cleanup stats polling')
          window.clearTimeout(timeoutId)
        }
      }
    }, [peerState, peerConnection])

    return (
      <div className="h-full w-full  px-3 py-4 flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <Button
            className="border-none bg-transparent float-right"
            onClick={() => toggleMain('streamAnalytics')}
          >
            {closeIcon ? (
              <>{closeIcon}</>
            ) : (
              <IconToBottomOne className="cursor-pointer mb-[15px]" />
            )}
          </Button>
          <div className="mb-1.5 flex items-start justify-between gap-2 clear-both">
            <h2 className="text-[18px] font-semibold leading-tight tracking-wide">
              {t('streamAnalytics.header.title')}
            </h2>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-[var(--inactive-text-color)] hover:text-[var(--text-color)]'
                  }`}
                  title={t('streamAnalytics.header.listTitle')}
                >
                  <List size={14} />
                  <span>{t('streamAnalytics.header.list')}</span>
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    viewMode === 'chart'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-[var(--inactive-text-color)] hover:text-[var(--text-color)]'
                  }`}
                  title={t('streamAnalytics.header.chartTitle')}
                >
                  <BarChart3 size={14} />
                  <span>{t('streamAnalytics.header.chart')}</span>
                </button>
              </div>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--inactive-text-color)]">
            {t('streamAnalytics.header.desc')}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Chart view */}
          {viewMode === 'chart' && (
            <div className="flex flex-col gap-4">
              {/* Video Source Metrics Chart */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  📹 Video Source Metrics
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    fps: chartHistory.inboundVideoFps[i],
                    bitrate: chartHistory.inboundVideoBitrate[i],
                  }))}
                  lines={[
                    { dataKey: 'fps', name: 'FPS', color: '#06b6d4' },
                    {
                      dataKey: 'bitrate',
                      name: 'Bitrate (Mbps)',
                      color: '#14b8a6',
                    },
                  ]}
                  height={200}
                />
              </div>

              {/* Latency & Jitter Chart - pure network-side timing metrics */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  🌐 Latency & Jitter
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    rtt: chartHistory.networkRtt[i],
                    videoJitter: chartHistory.inboundVideoJitter[i],
                    audioJitter: chartHistory.inboundAudioJitter[i],
                  }))}
                  lines={[
                    { dataKey: 'rtt', name: 'RTT (ms)', color: '#ec4899' },
                    {
                      dataKey: 'videoJitter',
                      name: 'Video Jitter (ms)',
                      color: '#f59e0b',
                    },
                    {
                      dataKey: 'audioJitter',
                      name: 'Audio Jitter (ms)',
                      color: '#22c55e',
                    },
                  ]}
                  unit=" ms"
                  height={200}
                />
              </div>

              {/* Media Buffer Delay Chart - playback-side buffering latency (video + audio) */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  🎬 Media Buffer Delay
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    jitterBufferRealtime:
                      chartHistory.inboundVideoJitterBuffer[i],
                    jitterBufferAvg:
                      chartHistory.inboundVideoJitterBufferAvg[i],
                    audioJitterBufferRealtime:
                      chartHistory.inboundAudioJitterBuffer[i],
                    audioJitterBufferAvg:
                      chartHistory.inboundAudioJitterBufferAvg[i],
                  }))}
                  lines={[
                    {
                      dataKey: 'jitterBufferRealtime',
                      name: 'Video (rt)',
                      color: '#6366f1', // indigo
                    },
                    {
                      dataKey: 'jitterBufferAvg',
                      name: 'Video (avg)',
                      color: '#22d3ee', // cyan
                    },
                    {
                      dataKey: 'audioJitterBufferRealtime',
                      name: 'Audio (rt)',
                      color: '#f97316', // orange
                    },
                    {
                      dataKey: 'audioJitterBufferAvg',
                      name: 'Audio (avg)',
                      color: '#fb7185', // rose
                    },
                  ]}
                  unit=" ms"
                  height={200}
                />
              </div>

              {/* Audio Bitrate Chart */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  🔊 Audio Bitrate
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    audioBitrate: chartHistory.inboundAudioBitrate[i],
                  }))}
                  lines={[
                    {
                      dataKey: 'audioBitrate',
                      name: 'Audio Bitrate (kbps)',
                      color: '#22d3ee',
                    },
                  ]}
                  unit=" kbps"
                  height={180}
                />
              </div>

              {/* Video Render Health Chart */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  🎞️ Video Render Health
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    framesDroppedInterval:
                      chartHistory.inboundVideoFramesDroppedInterval[i],
                    framesReceivedInterval:
                      chartHistory.inboundVideoFramesReceivedInterval[i],
                    framesDecodedInterval:
                      chartHistory.inboundVideoFramesDecodedInterval[i],
                    packetsDiscardedInterval:
                      chartHistory.inboundVideoPacketsDiscardedInterval[i],
                  }))}
                  lines={[
                    {
                      dataKey: 'framesDecodedInterval',
                      name: 'Frames Decoded',
                      color: '#22c55e',
                    },
                    {
                      dataKey: 'framesDroppedInterval',
                      name: 'Frames Dropped',
                      color: '#f97316',
                    },
                    {
                      dataKey: 'packetsDiscardedInterval',
                      name: 'Packets Discarded',
                      color: '#ef4444',
                    },
                  ]}
                  unit={` / ${toFixedNumber(STATS_INTERVAL_MS / 1000)}s`}
                  height={180}
                />
              </div>

              {/* Packets Lost Chart */}
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg-color)] p-4">
                <h3 className="mb-3 text-[14px] font-medium text-[var(--text-color)]">
                  📉 Packets Lost
                </h3>
                <MultiLineChart
                  data={chartHistory.timestamp.map((time, i) => ({
                    date: time,
                    packetsLost: chartHistory.inboundVideoPacketsLost[i],
                  }))}
                  lines={[
                    {
                      dataKey: 'packetsLost',
                      name: 'Packets Lost',
                      color: '#fb7185',
                    },
                  ]}
                  unit=" packets"
                  height={180}
                />
              </div>
            </div>
          )}

          {/* Metric cards - stacked vertical layout */}
          {viewMode === 'list' && (
            <>
              <div className="flex flex-col gap-3">
                {/* Inbound Media */}
                <MetricCard
                  icon="IN"
                  title={t('streamAnalytics.sections.inboundMedia')}
                  status={
                    stats.inbound.video.fps >= 24
                      ? 'good'
                      : stats.inbound.video.fps >= 15
                        ? 'stable'
                        : stats.inbound.video.fps > 0
                          ? 'limited'
                          : 'bad'
                  }
                  statusText={
                    stats.inbound.video.fps >= 24
                      ? t('streamAnalytics.status.good')
                      : stats.inbound.video.fps >= 15
                        ? t('streamAnalytics.status.stable')
                        : stats.inbound.video.fps > 0
                          ? t('streamAnalytics.status.poor')
                          : t('streamAnalytics.status.noSignal')
                  }
                  metrics={[
                    {
                      label: t('streamAnalytics.labels.video'),
                      value: `${stats.inbound.video.fps} FPS · ${stats.inbound.video.mbps} Mbps`,
                    },
                    {
                      label: t('streamAnalytics.labels.audio'),
                      value: `${stats.inbound.audio.kbps} kbps · loss ${stats.inbound.audio.lossRate.toFixed(1)}%`,
                    },
                  ]}
                />

                {/* Outbound Media */}
                <MetricCard
                  icon="OUT"
                  title={t('streamAnalytics.sections.outboundMedia')}
                  status={stats.outbound.audio.muted ? 'limited' : 'good'}
                  statusText={
                    stats.outbound.audio.muted
                      ? t('streamAnalytics.status.limited')
                      : t('streamAnalytics.status.active')
                  }
                  metrics={[
                    {
                      label: t('streamAnalytics.labels.video'),
                      value: `${stats.outbound.video.fps} FPS · ${stats.outbound.video.mbps.toFixed(2)} Mbps`,
                    },
                    {
                      label: 'Audio',
                      value: `${stats.outbound.audio.bitrate} kbps${stats.outbound.audio.muted ? ' · muted' : ''}`,
                    },
                  ]}
                />

                {/* HID Control */}
                {/* <MetricCard
                  icon="⌨"
                  title={t('streamAnalytics.sections.hidControl')}
                  status={
                    peerState !== 'connected'
                      ? 'limited'
                      : stats.network.rtt < 50
                        ? 'low-latency'
                        : 'stable'
                  }
                  statusText={
                    peerState !== 'connected'
                      ? t('streamAnalytics.status.disconnected')
                      : stats.network.rtt < 50
                        ? t('streamAnalytics.status.lowLatency')
                        : t('streamAnalytics.status.normal')
                  }
                  metrics={[
                    {
                      label: t('streamAnalytics.labels.latency'),
                      value: `${stats.network.rtt} ms`,
                    },
                    {
                      label: t('streamAnalytics.labels.dropped'),
                      value: '0 events',
                    },
                  ]}
                /> */}

                {/* USB & RPC */}
                {/* <MetricCard
                  icon="⧉"
                  title={t('streamAnalytics.sections.usbRpc')}
                  status={peerState !== 'connected' ? 'limited' : 'stable'}
                  statusText={
                    peerState !== 'connected'
                      ? t('streamAnalytics.status.disconnected')
                      : t('streamAnalytics.status.stable')
                  }
                  metrics={[
                    {
                      label: t('streamAnalytics.labels.usb'),
                      value: `${(stats.dataChannel.disk.bytesReceived / 1024 / 1024).toFixed(1)} MB/s`,
                    },
                    {
                      label: t('streamAnalytics.labels.rpcRtt'),
                      value: `${stats.network.rtt} ms`,
                    },
                  ]}
                /> */}
              </div>

              {/* Detailed control panels - collapsible section */}
              {/* <CollapsibleSection
                title={t('streamAnalytics.sections.controlPanels')}
                defaultExpanded={false}
                className="mt-6"
              >
                <div className="flex flex-col gap-3">

                  <DetailedMetricCard
                    icon="⌨"
                    title={t('streamAnalytics.sections.hidControl')}
                    status={
                      peerState !== 'connected'
                        ? 'limited'
                        : stats.network.rtt < 50
                          ? 'good'
                          : 'stable'
                    }
                    statusText={
                      peerState !== 'connected'
                        ? t('streamAnalytics.status.disconnected')
                        : stats.network.rtt < 50
                          ? t('streamAnalytics.status.active')
                          : t('streamAnalytics.status.normal')
                    }
                    details={[
                      {
                        key: t('streamAnalytics.details.latency', 'Latency'),
                        value: `${stats.network.rtt} ms`,
                      },
                      {
                        key: t('streamAnalytics.labels.eventsPerMin'),
                        value: '—',
                      },
                      {
                        key: t('streamAnalytics.labels.droppedEvents'),
                        value: '0',
                      },
                    ]}
                  />


                  <DetailedMetricCard
                    icon="⧉"
                    title={t('streamAnalytics.sections.usbOverIp')}
                    status={peerState !== 'connected' ? 'limited' : 'good'}
                    statusText={
                      peerState !== 'connected'
                        ? t('streamAnalytics.status.disconnected')
                        : t('streamAnalytics.status.connected')
                    }
                    details={[
                      {
                        key: t('streamAnalytics.details.throughput'),
                        value: `${(stats.dataChannel.disk.bytesReceived / 1024 / 1024).toFixed(1)} MB/s`,
                      },
                      {
                        key: t('streamAnalytics.details.queueDelay'),
                        value: `${stats.network.rtt} ms`,
                      },
                      {
                        key: t('streamAnalytics.details.errors'),
                        value: '0',
                      },
                    ]}
                  />


                  <DetailedMetricCard
                    icon="☰"
                    title={t('streamAnalytics.sections.rpcChannel')}
                    status={peerState !== 'connected' ? 'limited' : 'stable'}
                    statusText={
                      peerState !== 'connected'
                        ? t('streamAnalytics.status.disconnected')
                        : t('streamAnalytics.status.stable')
                    }
                    details={[
                      {
                        key: t('streamAnalytics.details.rtt'),
                        value: `${stats.network.rtt} ms`,
                      },
                      {
                        key: t('streamAnalytics.details.messagesPerSec'),
                        value: '—',
                      },
                      {
                        key: t('streamAnalytics.details.errors'),
                        value: '0',
                      },
                    ]}
                  />
                </div>
              </CollapsibleSection> */}

              {/* Detailed media stream analysis - collapsible section */}
              <CollapsibleSection
                title={t('streamAnalytics.sections.mediaDetails')}
                defaultExpanded={false}
                className="mt-4"
              >
                <div className="flex flex-col gap-3">
                  {/* Inbound Video Details */}
                  <DetailedMetricCard
                    icon="📥"
                    title={t('streamAnalytics.sections.inboundVideo')}
                    status={
                      stats.inbound.video.fps >= 24
                        ? 'good'
                        : stats.inbound.video.fps >= 15
                          ? 'stable'
                          : stats.inbound.video.fps > 0
                            ? 'limited'
                            : 'bad'
                    }
                    statusText={
                      stats.inbound.video.fps >= 24
                        ? t('streamAnalytics.status.goodQuality')
                        : stats.inbound.video.fps >= 15
                          ? t('streamAnalytics.status.stable')
                          : stats.inbound.video.fps > 0
                            ? t('streamAnalytics.status.poor')
                            : t('streamAnalytics.status.noSignal')
                    }
                    details={[
                      {
                        key: t('streamAnalytics.details.fps'),
                        value: `${stats.inbound.video.fps} fps`,
                      },
                      {
                        key: t('streamAnalytics.details.bitrate'),
                        value: `${stats.inbound.video.mbps.toFixed(2)} Mbps`,
                      },
                      {
                        key: t('streamAnalytics.details.jitterRealtime'),
                        value: `${stats.inbound.video.jitterBufferDelayMs ?? 0} ms`,
                      },
                      {
                        key: t('streamAnalytics.details.jitterAvg'),
                        value: `${stats.inbound.video.jitterBufferDelayMsAvg ?? 0} ms`,
                      },
                      {
                        key: t('streamAnalytics.details.packetsLost'),
                        value: `${stats.inbound.video.packetsLost} packets`,
                      },
                      {
                        key: t('streamAnalytics.details.framesDroppedInterval'),
                        value: `${(stats.inbound.video as any).framesDroppedInterval ?? 0}`,
                      },
                      {
                        key: t(
                          'streamAnalytics.details.packetsDiscardedInterval'
                        ),
                        value: `${(stats.inbound.video as any).packetsDiscardedInterval ?? 0}`,
                      },
                    ]}
                  />

                  {/* Inbound Audio Details */}
                  <DetailedMetricCard
                    icon="🔊"
                    title={t('streamAnalytics.sections.inboundAudio')}
                    status={stats.inbound.audio.kbps > 0 ? 'good' : 'limited'}
                    statusText={
                      stats.inbound.audio.kbps > 0
                        ? t('streamAnalytics.status.receiving')
                        : t('streamAnalytics.status.noAudio')
                    }
                    details={[
                      {
                        key: 'Codec',
                        value: stats.codec.inboundAudio || '—',
                      },
                      {
                        key: t('streamAnalytics.details.bitrate'),
                        value: `${stats.inbound.audio.kbps} kbps`,
                      },
                      {
                        key: t('streamAnalytics.labels.packetLoss'),
                        value: `${stats.inbound.audio.lossRate.toFixed(1)}%`,
                      },
                    ]}
                  />

                  {/* Outbound Video Details */}
                  <DetailedMetricCard
                    icon="📤"
                    title={t('streamAnalytics.sections.outboundVideo')}
                    status={stats.outbound.video.fps > 0 ? 'good' : 'limited'}
                    statusText={
                      stats.outbound.video.fps > 0
                        ? t('streamAnalytics.status.sending')
                        : t('streamAnalytics.status.inactive')
                    }
                    details={[
                      {
                        key: t('streamAnalytics.details.fps'),
                        value: `${stats.outbound.video.fps} fps`,
                      },
                      {
                        key: t('streamAnalytics.details.bitrate'),
                        value: `${stats.outbound.video.mbps.toFixed(2)} Mbps`,
                      },
                    ]}
                  />

                  {/* Outbound Audio Details */}
                  <DetailedMetricCard
                    icon="🎤"
                    title={t('streamAnalytics.sections.outboundAudio')}
                    status={stats.outbound.audio.muted ? 'limited' : 'good'}
                    statusText={
                      stats.outbound.audio.muted
                        ? t('streamAnalytics.status.muted')
                        : t('streamAnalytics.status.active')
                    }
                    details={[
                      {
                        key: 'Codec',
                        value: stats.codec.outboundAudio || '—',
                      },
                      {
                        key: t('streamAnalytics.details.bitrate'),
                        value: `${stats.outbound.audio.bitrate} kbps`,
                      },
                      {
                        key: t('streamAnalytics.labels.status'),
                        value: stats.outbound.audio.muted
                          ? t('streamAnalytics.status.muted')
                          : t('streamAnalytics.status.active'),
                      },
                    ]}
                  />
                </div>
              </CollapsibleSection>
            </>
          )}
        </div>
      </div>
    )
  }
)

StreamAnalytics.displayName = 'StreamAnalytics'

export default StreamAnalytics
export { CollapsibleSection, DetailedMetricCard, MetricCard }
export type {
  CollapsibleSectionProps,
  DetailedMetricCardProps,
  MetricCardProps,
  StatusType,
}
