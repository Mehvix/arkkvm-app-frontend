/**
 * @Purpose: Stream Metrics Analytics Component
 * @Description: Real-time WebRTC stream quality monitoring
 * @version: 1.0
 * @Author: zhanglei
 * @Date: 2025-11-27 19:37:40
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-12 04:09:51
 */
import { IconToBottomOne } from '@/assets/icons';
import type { JsonRpcHandle } from '@/hooks/useJsonRpc';
import { COLOR_SEMANTIC, SingleMetricChart } from './MetricChartCard';
import { useAppStore } from '@/stores';
import { toFixedNumber, toNumber } from '@/utils/common';
import { createLogger } from '@/utils/logger';
import { Video, MonitorPlay, Volume2, Network, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const logger = createLogger('StreamAnalytics');
const STATS_INTERVAL_MS = 1000;
const MAX_POINTS = 120;
const pushKeepLast = <T,>(arr: T[], v: T, max = MAX_POINTS) => {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice();
  next.push(v);
  return next;
};
const perSecondRate = (delta: number, seconds: number) =>
  delta > 0 && Number.isFinite(seconds) && seconds > 0
    ? toFixedNumber(delta / seconds, 1)
    : 0;
const formatRate = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);
type StreamSectionId = 'network' | 'video' | 'playback' | 'audio'

type StatusType = 'good' | 'warn' | 'limited' | 'stable' | 'low-latency' | 'bad'

/**
 * MetricCard Props
 */
interface MetricCardProps {
  icon?: string
  title: string
  /** Abnormal-only badge; omit when everything is normal */
  badge?: { status: StatusType; text: string } | null
  metrics?: Array<{
    label: string
    value: string
    /** Highlight the value when abnormal */
    warn?: boolean
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
};
type StatsRecord = RTCStats & Record<string, unknown>
type InboundVideo = {
  bytesReceived: number
  packetsReceived: number
  packetsLost: number
  packetsDiscarded: number
  jitter: number
  jitterBufferDelay: number
  jitterBufferEmittedCount: number
  framesPerSecond: number
  framesReceived: number
  framesDecoded: number
  framesDropped: number
  totalDecodeTime: number
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
] as const;
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
] as const;
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
const makeInboundVideoSnapshot = (report: StatsRecord): InboundVideo & { totalDecodeTime: number } => {
  const snap: InboundVideo & { totalDecodeTime: number } = {
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
    totalDecodeTime: 0,
  };
  INBOUND_VIDEO_KEYS.forEach(key => {
    snap[key] = toNumber(report[key] as number | undefined);
  });
  // Save totalDecodeTime for delta calculation (not in INBOUND_VIDEO_KEYS)
  snap.totalDecodeTime = toNumber(report.totalDecodeTime as number | undefined);
  return snap;
};
const makeInboundAudioSnapshot = (report: StatsRecord): InboundAudio => {
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
  };
  INBOUND_AUDIO_KEYS.forEach(key => {
    snap[key] = toNumber(report[key] as number | undefined);
  });
  return snap;
};
const makeOutboundVideoSnapshot = (report: StatsRecord): OutboundVideo => {
  return {
    bytesSent: toNumber(report.bytesSent),
    packetsSent: toNumber(report.packetsSent),
    framesSent: toNumber(report.framesSent),
    framesEncoded: toNumber(report.framesEncoded),
  };
};
const makeOutboundAudioSnapshot = (report: StatsRecord): OutboundAudio => {
  return {
    bytesSent: toNumber(report.bytesSent),
    packetsSent: toNumber(report.packetsSent),
  };
};
type CalcInboundAudioMetricsArgs = {
  curr: InboundAudio
  prev: InboundAudio | undefined
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
  const dt = dtMs / 1000;

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
    };
  }

  // audio jitter buffer lifetime avg delay (sec -> ms) - calculate early for stream reset case
  const jbDelayMsAvg =
    (curr.jitterBufferDelay ?? 0) >= 0 &&
    (curr.jitterBufferEmittedCount ?? 0) > 0
      ? Math.round(
          ((curr.jitterBufferDelay ?? 0) /
            (curr.jitterBufferEmittedCount ?? 1)) *
            1000
        )
      : 0;

  const dBytes = (curr.bytesReceived ?? 0) - (prev.bytesReceived ?? 0);
  // Detect stream reset (new stream started, bytesReceived reset to 0)
  if (dBytes < 0) {
    // Stream was reset, treat as first sample
    return {
      kbps: 0,
      jitterMs: (curr.jitter ?? 0) * 1000,
      lossRate: 0,
      discardRate: 0,
      healthRate: 0,
      accelMs: 0,
      decelMs: 0,
      jitterBufferDelayMs: 0,
      jitterBufferDelayMsAvg: jbDelayMsAvg,
    };
  }
  const dRecv = (curr.packetsReceived ?? 0) - (prev.packetsReceived ?? 0);
  const dLost = (curr.packetsLost ?? 0) - (prev.packetsLost ?? 0);
  const dDisc = (curr.packetsDiscarded ?? 0) - (prev.packetsDiscarded ?? 0);
  const dPlay =
    (curr.totalSamplesDuration ?? 0) - (prev.totalSamplesDuration ?? 0);
  const dRem =
    (curr.removedSamplesForAcceleration ?? 0) -
    (prev.removedSamplesForAcceleration ?? 0);
  const dIns =
    (curr.insertedSamplesForDeceleration ?? 0) -
    (prev.insertedSamplesForDeceleration ?? 0);

  const kbps = Math.round((dBytes * 8) / dt / 1000);

  const sentEst = dRecv + dLost;
  const lossRate = sentEst > 0 ? dLost / sentEst : 0;
  const discardRate = dRecv > 0 ? dDisc / dRecv : 0;

  const healthRate = dt > 0 ? dPlay / dt : 0;

  const accelMs = (dRem / sampleRate) * 1000;
  const decelMs = (dIns / sampleRate) * 1000;

  // audio jitter buffer avg delay for this stats interval (sec -> ms)
  const dDelayAudio =
    (curr.jitterBufferDelay ?? 0) - (prev.jitterBufferDelay ?? 0);
  const dCountAudio =
    (curr.jitterBufferEmittedCount ?? 0) - (prev.jitterBufferEmittedCount ?? 0);

  const jbDelayMs =
    dCountAudio > 0 ? Math.round((dDelayAudio / dCountAudio) * 1000) : 0;

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
  };
};
type CalcInboundVideoMetricsArgs = {
  curr: InboundVideo
  prev: InboundVideo | undefined
  dtMs: number
}

export const calcInboundVideoMetrics = ({
  curr,
  prev,
  dtMs,
}: CalcInboundVideoMetricsArgs) => {
  const dt = dtMs / 1000;
  const { framesPerSecond, jitterBufferDelay, jitterBufferEmittedCount } = curr;
  const fps = toNumber(framesPerSecond);
  const packetsLost = toNumber(curr.packetsLost);
  const jitter = toNumber(curr.jitter);
  const framesDroppedCurr = toNumber(curr.framesDropped);
  const framesReceivedCurr = toNumber(curr.framesReceived);
  const framesDecodedCurr = toNumber(curr.framesDecoded);
  // Decode time tracking (WebRTC totalDecodeTime in seconds)
  const totalDecodeTimeCurr = toNumber(curr.totalDecodeTime);
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
      decodeTimeMs: 0,
    };
  }

  const dBytes = toNumber(curr.bytesReceived) - toNumber(prev.bytesReceived);
  const dRecv = toNumber(curr.packetsReceived) - toNumber(prev.packetsReceived);
  const dLost = toNumber(curr.packetsLost) - toNumber(prev.packetsLost);
  const dDisc =
    toNumber(curr.packetsDiscarded) - toNumber(prev.packetsDiscarded);
  const dFramesDropped =
    framesDroppedCurr - toNumber(prev.framesDropped);
  const dFramesReceived =
    framesReceivedCurr - toNumber(prev.framesReceived);
  const dFramesDecoded =
    framesDecodedCurr - toNumber(prev.framesDecoded);

  const kbps = Math.round((dBytes * 8) / dt / 1000);
  const mbps = toFixedNumber(kbps / 1000);

  const sentEst = dRecv + dLost;
  const lossRate = sentEst > 0 ? dLost / sentEst : 0;
  const discardRate = dRecv > 0 ? dDisc / dRecv : 0;

  const jitterMs = jitter > 0 ? Math.round(jitter * 1000) : 0;

  const jbDelayMsAvg =
    (jitterBufferDelay ?? 0) >= 0 && (jitterBufferEmittedCount ?? 0) > 0
      ? Math.round(
          ((jitterBufferDelay ?? 0) / (jitterBufferEmittedCount ?? 1)) * 1000
        )
      : 0;

  const dDelay = (curr.jitterBufferDelay ?? 0) - (prev.jitterBufferDelay ?? 0);
  const dCount =
    (curr.jitterBufferEmittedCount ?? 0) - (prev.jitterBufferEmittedCount ?? 0);

  const jbDelayMs = dCount > 0 ? Math.round((dDelay / dCount) * 1000) : 0;

  const framesDroppedInterval = perSecondRate(dFramesDropped, dt);
  const framesReceivedInterval = perSecondRate(dFramesReceived, dt);
  const framesDecodedInterval = perSecondRate(dFramesDecoded, dt);
  const packetsDiscardedInterval = perSecondRate(dDisc, dt);

  // Calculate decode time per frame (ms)
  const totalDecodeTimePrev = toNumber(prev.totalDecodeTime);
  const dDecodeTime = totalDecodeTimeCurr - totalDecodeTimePrev; // seconds
  const decodeTimeMs = dFramesDecoded > 0 ? Math.round((dDecodeTime / dFramesDecoded) * 1000) : 0;

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
    decodeTimeMs,
  };
};
// Stats shapes derived from the metric calculators
type InboundVideoStats = ReturnType<typeof calcInboundVideoMetrics>;
type InboundAudioStats = ReturnType<typeof calcInboundAudioMetrics>;

/**
 * MetricCard - compact summary metrics card
 */
const MetricCard = memo<MetricCardProps>(
  ({ icon, title, badge, metrics, children, className = '' }) => {
    const config = badge ? STATUS_CONFIG[badge.status] : null;

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
            <span className="text-[13px] font-medium text-[var(--text-color)]">{title}</span>
          </div>

          {/* Status indicator - only rendered for abnormal states */}
          {badge && config && (
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
              <span className={config.textColor}>{badge.text}</span>
            </div>
          )}
        </div>

        {/* Metric data - dense 2-column key metrics grid */}
        {metrics && metrics.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[12px]">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-[var(--inactive-text-color)] opacity-80">{metric.label}</span>
                <span
                  className={`font-medium tabular-nums ${
                    metric.warn ? 'text-red-400' : 'text-[var(--text-color)]'
                  }`}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Custom content */}
        {children && <div className="relative z-10 mt-2">{children}</div>}
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

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
    const config = STATUS_CONFIG[status];

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
            <span className="text-[13px] font-medium text-[var(--text-color)]">{title}</span>
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
              <span className="font-medium text-[var(--text-color)]">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DetailedMetricCard.displayName = 'DetailedMetricCard';

/**
 * DenseMetricSection component props
 */
interface DenseMetricSectionProps {
  /** Section icon (Lucide icon component) */
  icon?: LucideIcon
  /** Section title (must match Chart view group name) */
  title: string
  /** Abnormal-only badge; omit when everything is normal */
  badge?: { status: StatusType; text: string } | null
  /** Metric items rendered in a 2-column dense grid */
  items: Array<{
    label: string
    value: string
    /** Highlight the value when abnormal */
    warn?: boolean
  }>
  className?: string
}

/**
 * DenseMetricSection - high-density metrics block for ops scenarios.
 * Renders metrics in a compact 2-column grid; badges appear only on
 * abnormal states to keep the page scannable.
 */
const DenseMetricSection = memo<DenseMetricSectionProps>(
  ({ icon: Icon, title, badge, items, className = '' }) => {
    const config = badge ? STATUS_CONFIG[badge.status] : null;

    return (
      <div
        className={`rounded-lg border border-(--border-color) bg-secondary-bg px-3 py-2.5 ${className}`}
      >
        {/* Section header */}
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-text opacity-80" />}
            <span className="text-[12px] font-semibold text-text">
              {title}
            </span>
          </div>
          {badge && config && (
            <div
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${config.bgColor}`}
            >
              <span className={`h-1 w-1 rounded-full ${config.dotColor}`} />
              <span className={config.textColor}>{badge.text}</span>
            </div>
          )}
        </div>

        {/* Dense 2-column metric grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-inactive-text opacity-80">
                {item.label}
              </span>
              <span
                className={`font-medium tabular-nums ${
                  item.warn ? 'text-red-400' : 'text-text'
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DenseMetricSection.displayName = 'DenseMetricSection';

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
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
    );
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';

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
  ({ peerConnection, peerState, closeIcon }) => {
    useTranslation('messages');
    // View mode: 'list' or 'chart'
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
    const [highlightedSection, setHighlightedSection] = useState<StreamSectionId | null>(null);
    const chartSectionRefs = useRef<Record<StreamSectionId, HTMLElement | null>>({
      network: null,
      video: null,
      playback: null,
      audio: null,
    });
    const toggleMain = useAppStore(s => s.ui.toggleMain);

    // Previous stats snapshot used for delta-based calculations
    const prevStatsRef = useRef<PrevStatsSnapshot | null>(null);

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
      inboundVideoDecodeTime: number[]
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
      inboundVideoDecodeTime: [],
      inboundAudioBitrate: [],
      inboundAudioJitter: [],
      inboundAudioJitterBuffer: [],
      inboundAudioJitterBufferAvg: [],
      networkRtt: [],
    });

    const openTrendSection = (section: StreamSectionId) => {
      setViewMode('chart');
      setHighlightedSection(section);
      window.setTimeout(() => {
        chartSectionRefs.current[section]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
      window.setTimeout(() => {
        setHighlightedSection(current => current === section ? null : current);
      }, 1600);
    };

    // Aggregated stats state (derived from calcInbound*Metrics outputs)
    const [stats, setStats] = useState<{
      inbound: {
        video: InboundVideoStats
        audio: InboundAudioStats & { hasReport: boolean }
      }
      outbound: {
        video: { fps: number; mbps: number; bitrate: number }
        audio: { mbps: number; bitrate: number; notSending: boolean; hasReport: boolean; codec: string; clockRate: number; channels: number }
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
          decodeTimeMs: 0,
        },
        audio: {
          hasReport: false,
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
        audio: { mbps: 0, bitrate: 0, notSending: true, hasReport: false, codec: '', clockRate: 0, channels: 0 },
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
    });

    useEffect(() => {
      if (peerState !== 'connected' || !peerConnection) return;

      let timeoutId: number | undefined;

      const getStatsAsync = async () => {
        const rtcStats = await peerConnection.getStats();

        const now = Date.now();
        const prev = prevStatsRef.current;
        const prevTimestamp = prev?.timestamp ?? 0;
        // Use functional setState to avoid capturing stale stats
        setStats(prevStats => {
          const newStats = { ...prevStats };
          newStats.inbound.audio = {
            ...newStats.inbound.audio,
            hasReport: false,
            kbps: 0,
            jitterMs: 0,
            lossRate: 0,
            discardRate: 0,
            healthRate: 0,
            accelMs: 0,
            decelMs: 0,
            jitterBufferDelayMs: 0,
            jitterBufferDelayMsAvg: 0,
          };
          newStats.outbound.audio = {
            ...newStats.outbound.audio,
            hasReport: false,
            notSending: true,
            bitrate: 0,
            mbps: 0,
          };
          newStats.codec = {
            inboundAudio: '',
            outboundAudio: '',
          };

          // Snapshot of cumulative values for this stats interval
          const currentValues: PrevStatsSnapshot = {
            timestamp: now,
          };

          rtcStats.forEach((report: StatsRecord & { currentRoundTripTime?: number; nominated?: boolean; state?: string; localCandidateId?: string; remoteCandidateId?: string; codecId?: string; label?: string; bytesReceived?: number; bytesSent?: number }) => {
            const { kind } = report;
            const type = report.type;

            if (type === 'inbound-rtp') {
              if (kind === 'video') {
                newStats.inbound.video = calcInboundVideoMetrics({
                  curr: report as unknown as InboundVideo,
                  prev: prev?.inboundVideo,
                  dtMs: prevTimestamp ? now - prevTimestamp : 0,
                });
                currentValues.inboundVideo = makeInboundVideoSnapshot(report);
              } else if (kind === 'audio') {
                newStats.inbound.audio = {
                  ...calcInboundAudioMetrics({
                    curr: report as unknown as InboundAudio,
                    prev: prev?.inboundAudio,
                    dtMs: prevTimestamp ? now - prevTimestamp : 0,
                  }),
                  hasReport: true,
                };

                currentValues.inboundAudio = makeInboundAudioSnapshot(report);

                // Resolve codec info for inbound audio
                if (report.codecId) {
                  const codecReport = (rtcStats as unknown as Map<string, StatsRecord>).get(report.codecId as string);
                  if (codecReport) {
                    const name = ((codecReport.mimeType as string) || '').replace('audio/', '');
                    const cr = (codecReport.clockRate as number) || 0;
                    const ch = (codecReport.channels as number) || 1;
                    newStats.codec.inboundAudio = `${name}/${cr}/${ch}ch`;
                  }
                }
              }
            } else if (type === 'outbound-rtp') {
              const kind = report.kind;
              const prev = prevStatsRef.current;
              const now = Date.now();
              const prevTimestamp = prev?.timestamp ?? now;
              const dtMs = now - prevTimestamp;
              const dtSec = dtMs / 1000;

              if (kind === 'video') {
                const curr = makeOutboundVideoSnapshot(report);
                const prevOut = prev?.outboundVideo;

                if (prevOut && dtSec > 0) {
                  const deltaBytes = curr.bytesSent - prevOut.bytesSent;
                  const bitrate = Math.round((deltaBytes * 8) / dtSec); // bps
                  const deltaFrames = curr.framesSent - prevOut.framesSent;
                  const fps = Math.round(deltaFrames / dtSec);

                  newStats.outbound.video.bitrate = bitrate;
                  newStats.outbound.video.mbps = bitrate / 1_000_000;
                  newStats.outbound.video.fps = fps;
                }

                currentValues.outboundVideo = curr;
              } else if (kind === 'audio') {
                const curr = makeOutboundAudioSnapshot(report);
                const prevOut = prev?.outboundAudio;
                newStats.outbound.audio.hasReport = true;

                if (prevOut && dtSec > 0) {
                  const deltaBytes = curr.bytesSent - prevOut.bytesSent;
                  const bitrate = Math.round((deltaBytes * 8) / dtSec); // bps
                  const kbps = Math.round(bitrate / 1000);

                  newStats.outbound.audio.bitrate = kbps;
                  newStats.outbound.audio.mbps = bitrate / 1_000_000;
                  newStats.outbound.audio.notSending = kbps === 0;
                }

                // Resolve codec info for outbound audio
                if (report.codecId) {
                  const codecReport = (rtcStats as unknown as Map<string, StatsRecord>).get(report.codecId as string);
                  if (codecReport) {
                    const name = ((codecReport.mimeType as string) || '').replace('audio/', '');
                    const cr = (codecReport.clockRate as number) || 0;
                    const ch = (codecReport.channels as number) || 1;
                    newStats.codec.outboundAudio = `${name}/${cr}/${ch}ch`;
                    newStats.outbound.audio.codec = name;
                    newStats.outbound.audio.clockRate = cr;
                    newStats.outbound.audio.channels = ch;
                  }
                }

                currentValues.outboundAudio = curr;
              }
            } else if (type === 'candidate-pair') {
            } else if (type === 'transport') {
            } else if (type === 'peer-connection') {
            }

            if (report.type === 'candidate-pair' && report.nominated) {
              if (report.state === 'succeeded') {
                newStats.network.rtt = report.currentRoundTripTime
                  ? Math.round((report.currentRoundTripTime as number) * 1000)
                  : 0;
              }
            } else if (
              report.type === 'data-channel' &&
              report.label === 'disk'
            ) {
              newStats.dataChannel.disk.bytesReceived =
                (report.bytesReceived as number) || 0;
              newStats.dataChannel.disk.bytesSent = (report.bytesSent as number) || 0;
            }
          });

          // Update prevStatsRef for the next delta computation
          prevStatsRef.current = currentValues;

          // Update chart history
          const chartNow = Math.floor(Date.now() / 1000); // timestamp (seconds)
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
                newStats.inbound.video.framesDroppedInterval ?? 0
              ),
              inboundVideoFramesReceivedInterval: pushKeepLast(
                prev.inboundVideoFramesReceivedInterval,
                newStats.inbound.video.framesReceivedInterval ?? 0
              ),
              inboundVideoFramesDecodedInterval: pushKeepLast(
                prev.inboundVideoFramesDecodedInterval,
                newStats.inbound.video.framesDecodedInterval ?? 0
              ),
              inboundVideoPacketsDiscardedInterval: pushKeepLast(
                prev.inboundVideoPacketsDiscardedInterval,
                newStats.inbound.video.packetsDiscardedInterval ?? 0
              ),
              inboundVideoDecodeTime: pushKeepLast(
                prev.inboundVideoDecodeTime,
                newStats.inbound.video.decodeTimeMs ?? 0
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
            };
          });

          return newStats;
        });

        // Schedule next stats polling after current run completes
        timeoutId = window.setTimeout(getStatsAsync, STATS_INTERVAL_MS);
      };

      // Kick off first polling run
      getStatsAsync();

      return () => {
        if (timeoutId !== undefined) {
          logger.debug('Cleanup stats polling');
          window.clearTimeout(timeoutId);
        }
      };
    }, [peerState, peerConnection]);

    const overviewThresholds = {
      network: { excellent: 30, warning: 150, critical: 300 },
      video: { excellent: 50, warning: 30, critical: 15 },
      playback: { warning: 150, critical: 300 },
      packetLoss: { warning: 0.01, critical: 0.05 },
      droppedFrames: { warning: 1, critical: 10 },
      jitter: { warning: 50, critical: 100 },
    };

    const isDisconnected = peerState !== 'connected';
    const rtt = stats.network.rtt;
    const fps = stats.inbound.video.fps;
    const hasNoVideo = fps === 0;
    const videoBitrate = stats.inbound.video.mbps;
    const playbackDelay = stats.inbound.video.jitterBufferDelayMs ?? 0;
    const avgPlaybackDelay = stats.inbound.video.jitterBufferDelayMsAvg ?? 0;
    const packetLoss = stats.inbound.video.lossRate;
    const videoJitter = stats.inbound.video.jitterMs;
    const droppedFrames = stats.inbound.video.framesDroppedInterval ?? 0;
    const hasAudioReport = stats.inbound.audio.hasReport;
    const audioKbps = stats.inbound.audio.kbps;
    const microphoneStatus = (() => {
      if (isDisconnected) return '—';
      if (!stats.outbound.audio.hasReport) return '—';
      if (stats.outbound.audio.bitrate > 0) return 'Active';
      return '—';
    })();
    const deviceAudioStatus = (() => {
      if (isDisconnected) return '—';
      if (!hasAudioReport) return '—';
      if (audioKbps > 0) return 'Active';
      return '—';
    })();
    const audioModuleStatus = (() => {
      if (deviceAudioStatus === 'Active') return { label: 'Active', tone: 'good' as const, detail: `${Math.round(audioKbps)} kbps` };
      return { label: '—', tone: 'muted' as const, detail: '—' };
    })();

    const moduleToneClasses = {
      good: {
        dot: 'bg-text-muted',
        label: 'text-text',
        border: 'border-(--border-color)',
        bg: 'bg-secondary-bg',
      },
      attention: {
        dot: 'bg-yellow-400',
        label: 'text-yellow-400',
        border: 'border-yellow-400/40',
        bg: 'bg-yellow-500/5',
      },
      poor: {
        dot: 'bg-red-400',
        label: 'text-red-400',
        border: 'border-red-400/40',
        bg: 'bg-red-500/5',
      },
      muted: {
        dot: 'bg-text-muted',
        label: 'text-text-muted',
        border: 'border-(--border-color)',
        bg: 'bg-secondary-bg',
      },
    };

    const overviewModules = {
      network: (() => {
        if (isDisconnected) return { label: '—', tone: 'muted' as const };
        if (rtt >= overviewThresholds.network.critical || packetLoss >= overviewThresholds.packetLoss.critical) {
          return { label: 'Poor', tone: 'poor' as const };
        }
        if (rtt >= overviewThresholds.network.warning || packetLoss >= overviewThresholds.packetLoss.warning) {
          return { label: 'Needs attention', tone: 'attention' as const };
        }
        return { label: rtt < overviewThresholds.network.excellent && packetLoss === 0 ? 'Excellent' : 'Good', tone: 'good' as const };
      })(),
      video: (() => {
        if (isDisconnected || hasNoVideo) return { label: '—', tone: 'muted' as const };
        if (fps < overviewThresholds.video.critical) return { label: 'Poor', tone: 'poor' as const };
        if (fps < overviewThresholds.video.warning || videoJitter >= overviewThresholds.jitter.warning) {
          return { label: 'Needs attention', tone: 'attention' as const };
        }
        return { label: fps >= overviewThresholds.video.excellent ? 'Excellent' : 'Good', tone: 'good' as const };
      })(),
      playback: (() => {
        if (isDisconnected || hasNoVideo) return { label: '—', tone: 'muted' as const };
        if (playbackDelay >= overviewThresholds.playback.critical || droppedFrames >= overviewThresholds.droppedFrames.critical) {
          return { label: 'Poor', tone: 'poor' as const };
        }
        if (playbackDelay >= overviewThresholds.playback.warning || droppedFrames > overviewThresholds.droppedFrames.warning) {
          return { label: 'Needs attention', tone: 'attention' as const };
        }
        return { label: 'Good', tone: 'good' as const };
      })(),
      audio: audioModuleStatus,
    };

    const primaryIssue = [
      {
        check: isDisconnected,
        label: 'Disconnected',
        value: 'Unavailable',
        message: 'Connection lost. Remote control is unavailable.',
        severity: 'poor' as const,
      },
      {
        check: hasNoVideo && !isDisconnected,
        label: 'No video stream',
        value: 'Unavailable',
        message: 'Video stream is not being received.',
        severity: 'poor' as const,
      },
      {
        check: playbackDelay >= overviewThresholds.playback.critical,
        label: 'High playback delay',
        value: `${Math.round(playbackDelay)} ms`,
        message: 'High playback delay may make remote control feel less responsive.',
        severity: 'poor' as const,
      },
      {
        check: rtt >= overviewThresholds.network.critical || packetLoss >= overviewThresholds.packetLoss.critical,
        label: 'Poor network',
        value: `${Math.round(rtt)} ms`,
        message: 'High latency or packet loss may cause input delay and stuttering.',
        severity: 'poor' as const,
      },
      {
        check: droppedFrames > overviewThresholds.droppedFrames.warning,
        label: 'Dropped Frames',
        value: `${formatRate(droppedFrames)} /s`,
        message: 'Some video frames are being dropped, which may cause visible stutter.',
        severity: droppedFrames >= overviewThresholds.droppedFrames.critical ? 'poor' as const : 'attention' as const,
      },
      {
        check: packetLoss >= overviewThresholds.packetLoss.warning,
        label: 'Video Packet Loss',
        value: `${(packetLoss * 100).toFixed(1)}%`,
        message: 'Video packets are being lost during transmission, which may cause stutter or artifacts.',
        severity: 'attention' as const,
      },
      {
        check: fps > 0 && fps < overviewThresholds.video.warning,
        label: 'Low frame rate',
        value: `${fps} fps`,
        message: 'Frame rate is below the expected range, which may make motion look less smooth.',
        severity: 'attention' as const,
      },
      {
        check: videoJitter >= overviewThresholds.jitter.warning,
        label: 'Video jitter',
        value: `${Math.round(videoJitter)} ms`,
        message: 'Video packet timing is uneven, which may make playback less stable.',
        severity: 'attention' as const,
      },
    ].find(issue => issue.check);

    const overallLabel = (() => {
      if (isDisconnected || hasNoVideo) return 'Unavailable';
      if (
        overviewModules.network.tone === 'poor' ||
        overviewModules.video.tone === 'poor' ||
        overviewModules.playback.tone === 'poor'
      ) return 'Poor';
      if (
        overviewModules.network.tone === 'attention' ||
        overviewModules.video.tone === 'attention' ||
        overviewModules.playback.tone === 'attention'
      ) return 'Needs attention';
      return 'Good';
    })();

    const statusConfig: Record<string, { color: string; icon: LucideIcon; bgColor: string }> = {
      Good: { color: 'text-text', icon: CheckCircle2, bgColor: 'bg-secondary-bg' },
      'Needs attention': { color: 'text-yellow-400', icon: AlertCircle, bgColor: 'bg-yellow-500/10' },
      Poor: { color: 'text-red-400', icon: AlertCircle, bgColor: 'bg-red-500/10' },
      Unavailable: { color: 'text-text-muted', icon: XCircle, bgColor: 'bg-secondary-bg' },
    };
    const healthySummary = hasAudioReport
      ? 'Video, network, playback, and audio performance are healthy.'
      : 'Video, network, and playback performance are healthy. Audio is not currently available.';

    return (
      <div className="h-full w-full px-3 py-4 flex flex-col overflow-x-hidden">
        {/* Header */}
        <div className="mb-5">
          <Button className='border-none bg-transparent float-right' onClick={() => toggleMain('streamAnalytics')}>
            {closeIcon ? (
              <>{closeIcon}</>
            ) : (
              <IconToBottomOne className="cursor-pointer mb-[15px]" />
            )}
          </Button>
          <div className="mb-1 flex items-start justify-between gap-2 clear-both">
            <h2 className="text-[14px] font-semibold leading-tight tracking-wide">
              Stream Diagnostics
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
                  title="Overview"
                >
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    viewMode === 'chart'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-[var(--inactive-text-color)] hover:text-[var(--text-color)]'
                  }`}
                  title="Trends"
                >
                  <span>Trends</span>
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-[var(--inactive-text-color)]">
            Real-time network, video, playback, and audio diagnostics.
          </p>

          {/* Status Summary - New design: User-centered experience status */}
          {viewMode === 'list' && (
            <div className="mt-2 p-2 rounded-lg border border-(--border-color) bg-secondary-bg">
              {(() => {
                const config = statusConfig[overallLabel];
                const Icon = config.icon;

                return (
                  <div className="flex flex-col gap-2">
                    {/* Status header with icon */}
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[14px] font-semibold ${config.color} mb-1`}>
                          {primaryIssue ? 'Stream quality needs attention' : overallLabel === 'Unavailable' ? 'Stream is unavailable' : 'Stream quality is good'}
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          {primaryIssue?.message || healthySummary}
                        </p>
                      </div>
                    </div>

                    {/* Primary issue details */}
                    {primaryIssue && (
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-secondary-bg border border-(--border-color) min-h-[40px]">
                        <div className="flex items-center gap-2 shrink-0 w-[90px]">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                          <span className="text-[11px] text-text">Primary issue</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                          <span className="text-[11px] text-text font-medium truncate max-w-[100px]">{primaryIssue.label}</span>
                          <span className={`text-[12px] font-semibold tabular-nums w-[70px] text-right ${
                            primaryIssue.severity === 'poor' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {primaryIssue.value || ''}
                          </span>
                          <button
                            onClick={() => setViewMode('chart')}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors shrink-0 w-[70px] justify-end"
                          >
                            View details
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto nice-scrollbar min-w-0">
          {/* Trends View - Professional Diagnostics Layout */}
          {viewMode === 'chart' && (
            <div className="flex flex-col gap-6 w-full min-w-0 pb-6 px-1 pt-2">
              {/* Connection Section */}
              <section
                ref={node => { chartSectionRefs.current.network = node; }}
                className={`rounded-lg transition-colors ${highlightedSection === 'network' ? 'bg-yellow-500/10' : ''}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Network className="w-4 h-4 text-text opacity-70" />
                  <span className="text-[13px] font-medium text-text">Connection</span>
                </div>

                {/* Latency */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Latency</span>
                    <span className={`text-[14px] font-medium tabular-nums ${
                      stats.network.rtt >= 100 ? 'text-red-400' :
                      stats.network.rtt >= 30 ? 'text-yellow-400' : 'text-text'
                    }`}>
                      {peerState === 'connected' ? `${Math.round(stats.network.rtt)} ms` : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Round-trip delay between your browser and the device. Lower is better.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.timestamp.length > 1 ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.networkRtt[i],
                        }))}
                        color={COLOR_SEMANTIC.network}
                        unit="ms"
                        name="Latency"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Video Section */}
              <section
                ref={node => { chartSectionRefs.current.video = node; }}
                className={`rounded-lg transition-colors ${highlightedSection === 'video' ? 'bg-yellow-500/10' : ''}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-4 h-4 text-text opacity-70" />
                  <span className="text-[13px] font-medium text-text">Video</span>
                </div>

                {/* Video Packet Loss */}
                <div className="flex items-center justify-between py-2 mb-4">
                  <div>
                    <span className="text-[12px] text-text">Video Packet Loss</span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Percentage of inbound video packets lost during transmission.
                    </p>
                  </div>
                  <span className={`text-[14px] font-medium tabular-nums ${
                    stats.inbound.video.lossRate > 0.05 ? 'text-red-400' :
                    stats.inbound.video.lossRate > 0.01 ? 'text-yellow-400' : 'text-text'
                  }`}>
                    {peerState === 'connected' ? `${(stats.inbound.video.lossRate * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>

                {/* Video Jitter */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Video Jitter</span>
                    <span className="text-[14px] font-medium text-text tabular-nums">
                      {peerState === 'connected' ? `${Math.round(stats.inbound.video.jitterMs)} ms` : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Variation in video packet arrival time. Lower is better.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.inboundVideoJitter.length > 1 ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.inboundVideoJitter[i],
                        }))}
                        color={COLOR_SEMANTIC.video}
                        unit="ms"
                        name="Video Jitter"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>

                {/* Frame Rate */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Frame Rate</span>
                    <span className="text-[14px] font-medium text-text tabular-nums">
                      {stats.inbound.video.fps > 0 ? `${stats.inbound.video.fps} fps` : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Number of video frames received per second.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.inboundVideoFps.length > 1 && chartHistory.inboundVideoFps.some(v => v > 0) ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.inboundVideoFps[i],
                        }))}
                        color={COLOR_SEMANTIC.video}
                        unit="fps"
                        name="Frame Rate"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Bitrate */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Video Bitrate</span>
                    <span className="text-[14px] font-medium text-text tabular-nums">
                      {stats.inbound.video.mbps > 0 ? `${stats.inbound.video.mbps} Mbps` : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Amount of video data received per second.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.inboundVideoBitrate.length > 1 && chartHistory.inboundVideoBitrate.some(v => v > 0) ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.inboundVideoBitrate[i] / 1000,
                        }))}
                        color={COLOR_SEMANTIC.video}
                        unit="Mbps"
                        name="Video Bitrate"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>

                {/* Average Frame Decode Time */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Average Frame Decode Time</span>
                    <span className={`text-[14px] font-medium tabular-nums ${
                      stats.inbound.video.decodeTimeMs > 30 ? 'text-yellow-400' : 'text-text'
                    }`}>
                      {stats.inbound.video.decodeTimeMs > 0
                        ? `${stats.inbound.video.decodeTimeMs} ms/frame`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Average time required to decode one video frame.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.inboundVideoDecodeTime.length > 1 && chartHistory.inboundVideoDecodeTime.some(v => v > 0) ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.inboundVideoDecodeTime[i],
                        }))}
                        color={COLOR_SEMANTIC.video}
                        unit="ms"
                        name="Decode Time"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Playback Section */}
              <section
                ref={node => { chartSectionRefs.current.playback = node; }}
                className={`rounded-lg transition-colors ${highlightedSection === 'playback' ? 'bg-yellow-500/10' : ''}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <MonitorPlay className="w-4 h-4 text-text opacity-70" />
                  <span className="text-[13px] font-medium text-text">Playback</span>
                </div>

                {/* Playback Delay */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text">Playback Delay</span>
                    <span className="text-[14px] font-medium text-text tabular-nums">
                      {(stats.inbound.video.jitterBufferDelayMs ?? 0) > 0
                        ? `${Math.round(stats.inbound.video.jitterBufferDelayMs ?? 0)} ms`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2">
                    Delay added to keep video playback smooth when packets arrive unevenly.
                  </p>
                  <div className="h-[112px] w-full">
                    {chartHistory.inboundVideoJitterBuffer.length > 1 && chartHistory.inboundVideoJitterBuffer.some(v => v > 0) ? (
                      <SingleMetricChart
                        data={chartHistory.timestamp.map((time, i) => ({
                          date: time,
                          value: chartHistory.inboundVideoJitterBuffer[i],
                        }))}
                        color={COLOR_SEMANTIC.video}
                        unit="ms"
                        name="Playback Delay"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                        Waiting for stream data
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropped Frames */}
                <div className="flex items-center justify-between py-3 border-t border-(--border-color)">
                  <div>
                    <span className="text-[12px] text-text">Dropped Frames</span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Video frames that could not be displayed in time.
                    </p>
                  </div>
                  <span className={`text-[14px] font-medium tabular-nums ${
                    (stats.inbound.video.framesDroppedInterval ?? 0) >= 5 ? 'text-yellow-400' : 'text-text'
                  }`}>
                    {`${formatRate(stats.inbound.video.framesDroppedInterval ?? 0)} /s`}
                  </span>
                </div>

                {/* Discarded Video Packets */}
                <div className="flex items-center justify-between py-3 border-t border-(--border-color)">
                  <div>
                    <span className="text-[12px] text-text">Discarded Video Packets</span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Video packets discarded before playback.
                    </p>
                  </div>
                  <span className={`text-[14px] font-medium tabular-nums ${
                    (stats.inbound.video.packetsDiscardedInterval ?? 0) >= 5 ? 'text-yellow-400' : 'text-text'
                  }`}>
                    {`${formatRate(stats.inbound.video.packetsDiscardedInterval ?? 0)} /s`}
                  </span>
                </div>
              </section>

              {/* Audio Section */}
              <section
                ref={node => { chartSectionRefs.current.audio = node; }}
                className={`rounded-lg transition-colors ${highlightedSection === 'audio' ? 'bg-yellow-500/10' : ''}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Volume2 className="w-4 h-4 text-text opacity-70" />
                  <span className="text-[13px] font-medium text-text">Audio</span>
                </div>

                {/* Audio Status */}
                <div className="flex items-center justify-between py-2 mb-3">
                  <span className="text-[12px] text-text">Audio Status</span>
                  <span className="text-[14px] text-text">
                    {(() => {
                      const hasAudioReport = stats.inbound.audio.hasReport;
                      if (!hasAudioReport) return '—';
                      // Check both RTP report and current media activity.
                      const hasAudioActivity = stats.inbound.audio.kbps > 0 || stats.inbound.audio.jitterMs > 0;
                      return hasAudioActivity ? 'Active' : '—';
                    })()}
                  </span>
                </div>

                {/* Audio Bitrate */}
                {stats.inbound.audio.hasReport && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-text">Audio Bitrate</span>
                      <span className="text-[14px] font-medium text-text tabular-nums">
                        {stats.inbound.audio.kbps > 0 ? `${Math.round(stats.inbound.audio.kbps)} kbps` : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mb-2">
                      Amount of audio data received from the device per second.
                    </p>
                    <div className="h-[112px] w-full">
                      {chartHistory.inboundAudioBitrate.length > 1 && chartHistory.inboundAudioBitrate.some(v => v > 0) ? (
                        <SingleMetricChart
                          data={chartHistory.timestamp.map((time, i) => ({
                            date: time,
                            value: chartHistory.inboundAudioBitrate[i],
                          }))}
                          color={COLOR_SEMANTIC.audio}
                          unit="kbps"
                          name="Audio Bitrate"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                          Waiting for stream data
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Jitter */}
                {stats.inbound.audio.hasReport && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-text">Audio Jitter</span>
                      <span className="text-[14px] font-medium text-text tabular-nums">
                        {stats.inbound.audio.jitterMs > 0 ? `${Math.round(stats.inbound.audio.jitterMs)} ms` : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mb-2">
                      Variation in audio packet arrival time. Lower is better.
                    </p>
                    <div className="h-[112px] w-full">
                      {chartHistory.inboundAudioJitter.length > 1 ? (
                        <SingleMetricChart
                          data={chartHistory.timestamp.map((time, i) => ({
                            date: time,
                            value: chartHistory.inboundAudioJitter[i],
                          }))}
                          color={COLOR_SEMANTIC.audio}
                          unit="ms"
                          name="Audio Jitter"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[11px] text-text-muted bg-secondary-bg/50 rounded">
                          Waiting for stream data
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Packet Loss */}
                <div className="flex items-center justify-between py-3 border-t border-(--border-color)">
                  <div>
                    <span className="text-[12px] text-text">Audio Packet Loss</span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Percentage of inbound audio packets lost during transmission.
                    </p>
                  </div>
                  <span className={`text-[14px] font-medium tabular-nums ${
                    stats.inbound.audio.lossRate > 0.05 ? 'text-red-400' :
                    stats.inbound.audio.lossRate > 0.01 ? 'text-yellow-400' : 'text-text'
                  }`}>
                    {stats.inbound.audio.kbps > 0 ? `${(stats.inbound.audio.lossRate * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              </section>
            </div>
          )}

          {/* Overview - Four Experience Modules */}
          {viewMode === 'list' && (
            <>
              <div className="mt-2 grid grid-cols-1 gap-1 w-full min-w-0">
                {(() => {
	                  const modules = [
                    {
                      id: 'network',
                      title: 'Network',
	                      status: overviewModules.network,
	                      lines: [
	                        isDisconnected ? 'Metrics unavailable' : `${Math.round(rtt)} ms latency · ${(packetLoss * 100).toFixed(1)}% packet loss`,
	                      ],
                    },
                    {
                      id: 'video',
                      title: 'Video',
	                      status: overviewModules.video,
	                      lines: [
	                        hasNoVideo ? 'Metrics unavailable' : `${fps} fps · ${videoBitrate.toFixed(2)} Mbps`,
	                      ],
                    },
                    {
                      id: 'playback',
                      title: 'Playback',
	                      status: overviewModules.playback,
	                      lines: [
	                        `${Math.round(playbackDelay)} ms delay · ${formatRate(droppedFrames)} dropped frames/s`,
	                      ],
                    },
                    {
                      id: 'audio',
	                      title: 'Audio',
	                      status: overviewModules.audio,
	                      lines: [audioModuleStatus.detail],
                    },
                  ];

                  return modules.map((module) => (
	                    <button
	                      key={module.id}
	                      onClick={() => openTrendSection(module.id as StreamSectionId)}
                      className={`flex items-center justify-between gap-3 py-1.5 px-3 rounded-lg border transition-colors text-left w-full min-h-[44px] ${moduleToneClasses[module.status.tone].bg} ${moduleToneClasses[module.status.tone].border} hover:border-[var(--text-color)]/30`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${moduleToneClasses[module.status.tone].dot}`} />
                        <span className="text-[11px] text-text font-medium w-14">{module.title}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                        <span className={`text-[11px] whitespace-nowrap ${moduleToneClasses[module.status.tone].label}`}>{module.status.label}</span>
                        <div className="text-right min-w-0">
                          {module.lines.map((line) => (
                            <div key={line} className="text-[10px] text-text-muted tabular-nums truncate">
                              {line}
                            </div>
                          ))}
                        </div>
                        <ChevronRight className="w-3 h-3 text-text-muted" />
                      </div>
                    </button>
                  ));
                })()}
              </div>

              <details className="mt-2 rounded-lg border border-(--border-color) bg-secondary-bg">
                <summary className="cursor-pointer list-none px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-text">Advanced stream details</div>
                      <div className="text-[12px] text-text-muted">Technical metrics for deeper analysis.</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </div>
                </summary>
                <div className="border-t border-(--border-color) px-3 py-2">
                  {[
	                    {
	                      title: 'Device Video',
	                      description: 'From the device to this browser',
	                      rows: [
	                        ['Frame Rate', `${fps} fps`],
	                        ['Video Bitrate', `${videoBitrate.toFixed(2)} Mbps`],
	                        ['Video Jitter', `${Math.round(videoJitter)} ms`],
	                        ['Video Packet Loss', `${(packetLoss * 100).toFixed(1)}%`],
	                        ['Average Frame Decode Time', `${stats.inbound.video.decodeTimeMs ?? 0} ms/frame`],
	                        ['Discarded Video Packets', `${formatRate(stats.inbound.video.packetsDiscardedInterval ?? 0)} /s`],
	                      ],
	                    },
	                    {
	                      title: 'Device Audio',
	                      description: 'From the device to this browser',
	                      rows: [
	                        ['Audio Status', deviceAudioStatus],
	                        ['Audio Bitrate', hasAudioReport && audioKbps > 0 ? `${Math.round(audioKbps)} kbps` : '—'],
	                        ['Audio Jitter', hasAudioReport ? `${Math.round(stats.inbound.audio.jitterMs)} ms` : '—'],
	                        ['Audio Packet Loss', hasAudioReport && audioKbps > 0 ? `${(stats.inbound.audio.lossRate * 100).toFixed(1)}%` : '—'],
	                      ],
	                    },
	                    {
	                      title: 'Microphone',
	                      description: 'From this browser to the device',
	                      rows: [
	                        ['Status', microphoneStatus],
	                        ['Outbound Bitrate', `${stats.outbound.audio.bitrate} kbps`],
	                      ],
	                    },
	                    {
	                      title: 'Playback',
	                      description: 'Playback performance in this browser',
	                      rows: [
	                        ['Playback Delay', `${Math.round(playbackDelay)} ms`],
	                        ['Average Playback Delay', `${Math.round(avgPlaybackDelay)} ms`],
                        ['Dropped Frames', `${formatRate(droppedFrames)} /s`],
                      ],
                    },
	                  ].map(group => (
	                    <section key={group.title} className="py-2 first:pt-0 last:pb-0">
	                      <div className="mb-1.5 text-[12px] font-medium text-text">{group.title}</div>
	                      <div className="mb-1.5 text-[11px] text-text-muted">{group.description}</div>
	                      <div className="space-y-1">
                        {group.rows.map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-4 text-[12px]">
                            <span className="text-text-muted">{label}</span>
                            <span className="text-text tabular-nums text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    );
  }
);

StreamAnalytics.displayName = 'StreamAnalytics';

export default StreamAnalytics;
export { CollapsibleSection, DetailedMetricCard, MetricCard };
export type {
  CollapsibleSectionProps,
  DetailedMetricCardProps,
  MetricCardProps,
  StatusType
};
// Re-export MetricChartCard for external use
export { MetricChartCard, COLOR_SEMANTIC } from './MetricChartCard';
