/**
 * @Purpose: Metric Chart Card Component
 * @Description: Chart card with header key values and interactive legend
 */
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface MetricLine {
  dataKey: string
  name: string
  color: string
  unit?: string
  yAxisId?: 'left' | 'right'
  /** Line style: solid for realtime, dashed for average */
  lineStyle?: LineStyle
  /** If true, show current value in header */
  showInHeader?: boolean
  /** Formatter for header value */
  headerFormatter?: (value: number) => string
  /** Hide this line when no audio/video data */
  hideWhenInactive?: boolean
  /** Tooltip description for this metric */
  description?: string
}

export interface MetricChartCardProps {
  /** Card icon (Lucide icon component) */
  icon?: LucideIcon
  /** Card title */
  title: string
  /** Card description tooltip */
  description?: string
  /** Overall status badge */
  status?: { type: 'good' | 'warn' | 'bad'; text: string }
  /** Current values for header display */
  currentValues: Record<string, number>
  /** Chart data */
  data: Array<Record<string, number> & { date: number }>
  /** Line definitions */
  lines: MetricLine[]
  /** Default visible lines */
  defaultVisibleLines?: string[]
  /** Card height in px (default: 240) */
  height?: number
  /** Chart area height in px (default: 140) */
  chartHeight?: number
  /** Custom className */
  className?: string
  /** Format timestamp for X-axis */
  timeFormatter?: (timestamp: number) => string
  /** Split into two chart areas (for FPS + Bitrate) */
  splitLayout?: boolean
  /** Left/top chart title (for split layout) */
  leftChartTitle?: string
  /** Right/bottom chart title (for split layout) */
  rightChartTitle?: string
  /** Check if audio is active (to hide audio lines when inactive) */
  isAudioActive?: boolean
  /** Compact mode - no chart, just metrics */
  compact?: boolean
}

const COLOR_SEMANTIC = {
  video: '#06b6d4',      // cyan
  videoAvg: '#22d3ee',   // light cyan
  audio: '#22c55e',      // green
  audioAvg: '#4ade80',   // light green
  warning: '#f97316',    // orange
  error: '#ef4444',      // red
  network: '#ec4899',    // pink
  networkSecondary: '#f59e0b', // amber
};

const STATUS_STYLES = {
  good: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  warn: { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  bad: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
};

export function MetricChartCard({
  icon: Icon,
  title,
  description,
  status,
  currentValues,
  data,
  lines,
  defaultVisibleLines,
  height = 240,
  className = '',
  timeFormatter,
  splitLayout = false,
  leftChartTitle,
  rightChartTitle,
  isAudioActive = true,
  compact = false,
}: MetricChartCardProps) {
  // Track visible lines (dataKeys)
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(defaultVisibleLines || lines.map(l => l.dataKey))
  );

  const toggleLine = (dataKey: string) => {
    setVisibleLines(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        if (next.size > 1) next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  // Filter lines based on audio active state
  const activeLines = lines.filter(line => {
    if (line.hideWhenInactive && !isAudioActive) return false;
    return true;
  });

  const headerLines = activeLines.filter(l => l.showInHeader !== false);

  // Check if we have any visible data
  const hasVisibleData = data.length > 0 && visibleLines.size > 0;

  // Split lines for split layout
  const leftLines = activeLines.filter(l => l.yAxisId === 'left' || !l.yAxisId);
  const rightLines = activeLines.filter(l => l.yAxisId === 'right');

  // Get stroke dash array based on line style
  const getStrokeDash = (style?: LineStyle) => {
    switch (style) {
      case 'dashed': return '4 4';
      case 'dotted': return '2 2';
      default: return undefined;
    }
  };

  return (
    <div
      className={`
        rounded-lg border border-(--border-color)
        bg-secondary-bg
        p-3 flex flex-col
        w-full min-w-0 max-w-full
        overflow-hidden
        ${className}
      `}
      style={{ height }}
    >
      {/* Header: Icon + Title + Status + Key Values with names - responsive layout */}
      <div className="flex flex-col gap-2 mb-2 min-w-0">
        {/* Title row with status */}
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <Icon className="w-4 h-4 shrink-0 text-text opacity-80" />
          )}
          <span
            className="text-[13px] font-medium text-text whitespace-nowrap"
            title={description}
          >
            {title}
          </span>
          {status && (
            <span className={`ml-auto text-[11px] font-medium ${STATUS_STYLES[status.type].text}`}>
              {status.text}
            </span>
          )}
        </div>

        {/* Header key values - wrap when space is limited */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] min-w-0">
          {headerLines.map(line => {
            const value = currentValues[line.dataKey] ?? 0;
            const isVisible = visibleLines.has(line.dataKey);
            const formatted = line.headerFormatter
              ? line.headerFormatter(value)
              : `${value.toFixed ? value.toFixed(1) : value} ${line.unit || ''}`.trim();

            return (
              <button
                key={line.dataKey}
                onClick={() => toggleLine(line.dataKey)}
                className={`
                  flex items-center gap-1.5 px-2 py-0.5 rounded
                  transition-all duration-200
                  ${isVisible
                    ? 'bg-bg-button'
                    : 'bg-transparent opacity-50'
                  }
                  hover:brightness-110
                  shrink-0
                `}
                title={`${line.name}: ${formatted}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-text-muted">{line.name}</span>
                <span className="text-text tabular-nums font-medium">
                  {formatted}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart area - responsive, no overflow */}
      <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
        {compact ? (
          /* Compact mode - just show metrics, no chart */
          <div className="h-full flex items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              {headerLines.map(line => {
                const value = currentValues[line.dataKey] ?? 0;
                const formatted = line.headerFormatter
                  ? line.headerFormatter(value)
                  : `${value.toFixed ? value.toFixed(1) : value} ${line.unit || ''}`.trim();
                return (
                  <span key={line.dataKey} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: line.color }}
                    />
                    <span className="text-text-muted">{line.name}:</span>
                    <span className="text-text tabular-nums font-medium">{formatted}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : !hasVisibleData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-[11px] text-inactive-text">
                Waiting for stream data
              </span>
            </div>
          </div>
        ) : splitLayout && rightLines.length > 0 ? (
          /* Split layout: two chart areas */
          <div className="h-full flex flex-col gap-2 w-full min-w-0">
            {/* Top/Left chart */}
            <div className="flex-1 flex flex-col min-w-0">
              {leftChartTitle && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-muted">{leftChartTitle}</span>
                </div>
              )}
              <div className="flex-1 w-full min-w-0 overflow-hidden">
                <SingleChart
                  data={data}
                  lines={leftLines.filter(l => visibleLines.has(l.dataKey))}
                  timeFormatter={timeFormatter}
                />
              </div>
            </div>
            {/* Bottom/Right chart */}
            <div className="flex-1 flex flex-col min-w-0">
              {rightChartTitle && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-muted">{rightChartTitle}</span>
                </div>
              )}
              <div className="flex-1 w-full min-w-0 overflow-hidden">
                <SingleChart
                  data={data}
                  lines={rightLines.filter(l => visibleLines.has(l.dataKey))}
                  timeFormatter={timeFormatter}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single chart */
          <div className="w-full h-full min-w-0 overflow-hidden">
            <SingleChart
              data={data}
              lines={activeLines.filter(l => visibleLines.has(l.dataKey))}
              timeFormatter={timeFormatter}
              getStrokeDash={getStrokeDash}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted single chart component
interface SingleChartProps {
  data: Array<Record<string, number> & { date: number }>
  lines: MetricLine[]
  timeFormatter?: (timestamp: number) => string
  getStrokeDash?: (style?: LineStyle) => string | undefined
}

function SingleChart({
  data,
  lines,
  timeFormatter,
  getStrokeDash = (s) => s === 'dashed' ? '4 4' : s === 'dotted' ? '2 2' : undefined,
}: SingleChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(255, 255, 255, 0.06)"
        />
        <XAxis
          dataKey="date"
          tick={{
            fontFamily: 'system-ui',
            fontSize: '10px',
            fill: 'rgba(156, 163, 175, 0.8)',
          }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
          tickLine={false}
          ticks={data.length > 0 ? [data[0].date, data[data.length - 1].date] : []}
          tickFormatter={timeFormatter || ((date: number) => {
            return new Date(date * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
          })}
          interval={0}
        />
        <YAxis
          axisLine={false}
          orientation="right"
          tick={{
            fontFamily: 'system-ui',
            fontSize: '10px',
            fill: 'rgba(156, 163, 175, 0.8)',
          }}
          tickLine={false}
          domain={[0, 'auto']}
          allowDecimals={false}
          tickCount={5}
          width={30}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: 'rgba(156, 163, 175, 1)', marginBottom: '4px' }}
          itemStyle={{ color: 'rgba(229, 231, 235, 1)' }}
          labelFormatter={(label: number) => {
            return new Date(label * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }}
          formatter={(value: number, name: string, props: { payload?: Record<string, number>; dataKey?: string | number }) => {
            const dataKey = typeof props.dataKey === 'string' ? props.dataKey : String(props.dataKey);
            const line = lines.find(l => l.dataKey === dataKey);
            const formatted = typeof value === 'number' ? value.toFixed(1) : value;
            return [`${formatted} ${line?.unit || ''}`.trim(), line?.name || name];
          }}
        />
        {lines.map(line => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={1.5}
            strokeDasharray={getStrokeDash(line.lineStyle)}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * SimpleTrendChart - Compact single-line trend for value display
 */
interface SimpleTrendChartProps {
  data: Array<{ date: number; value: number | null }>;
  color: string;
  unit?: string;
}

export function SimpleTrendChart({ data, color, unit }: SimpleTrendChartProps) {
  // Filter out null values for min/max calculation
  const validValues = data.map(d => d.value).filter((v): v is number => v !== null && v !== undefined);
  const minValue = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : 1;
  // Add padding to Y axis range
  const yPadding = (maxValue - minValue) * 0.1 || maxValue * 0.1 || 1;
  const yMin = Math.max(0, minValue - yPadding);
  const yMax = maxValue + yPadding;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide domain={['dataMin', 'dataMax']} />
        <YAxis hide domain={[yMin, yMax]} />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            padding: '6px 10px',
          }}
          labelFormatter={(label: number) => {
            return new Date(label * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }}
          formatter={(value: number) => {
            const formatted = typeof value === 'number' ? value.toFixed(1) : value;
            return [`${formatted} ${unit || ''}`.trim(), ''];
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * SingleMetricChart - Independent single metric chart with full axes
 * Used for main trend display in Trends view
 */
interface SingleMetricChartProps {
  data: Array<{ date: number; value: number }>;
  color: string;
  unit?: string;
  height?: number;
  yTickStep?: number;  // Y axis tick step (default: auto)
  name?: string;  // Metric name for tooltip (e.g., "Latency", "Frame Rate")
}

export function SingleMetricChart({ data, color, unit, height = 112, yTickStep, name = 'Value' }: SingleMetricChartProps) {
  // Calculate Y axis range with clean round numbers
  const values = data.map(d => d.value).filter(v => v !== null && !isNaN(v));
  const maxValue = values.length > 0 ? Math.max(...values, 1) : 1;
  const minValue = values.length > 0 ? Math.min(...values, 0) : 0;

  // Determine tick step
  const range = maxValue - minValue;
  let step = yTickStep;
  if (!step) {
    if (range <= 10) step = 2;
    else if (range <= 30) step = 5;
    else if (range <= 60) step = 10;
    else if (range <= 120) step = 20;
    else step = 30;
  }

  // Round Y max to nice number
  const yMax = Math.max(step!, Math.ceil(maxValue / step!) * step!);
  const yMin = 0;

  // Generate Y axis ticks
  const yTicks = [];
  for (let i = yMin; i <= yMax; i += step!) {
    yTicks.push(i);
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={data.length > 1 ? [data[0].date, data[data.length - 1].date] : undefined}
          tickFormatter={(value: number) => {
            const isFirstOrLast = value === data[0]?.date || value === data[data.length - 1]?.date;
            if (!isFirstOrLast) return '';
            return new Date(value * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }}
          tick={{ fontSize: 10, fill: 'rgba(156, 163, 175, 0.8)' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          domain={[yMin, yMax]}
          ticks={yTicks}
          tick={{ fontSize: 10, fill: 'rgba(156, 163, 175, 0.8)' }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(value: number) => `${Math.round(value)}${unit ? '' : ''}`}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            padding: '8px 12px',
          }}
          labelFormatter={(label: number) => {
            return new Date(label * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }}
          formatter={(value: number, name: string) => {
            const formatted = typeof value === 'number' ? value.toFixed(1) : value;
            return [`${formatted} ${unit || ''}`.trim(), name];
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={name}
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * NetworkChart - Multi-line chart for network metrics (Latency + Jitter)
 */
interface NetworkChartProps {
  data: Array<{
    date: number;
    latency: number;
    videoJitter: number;
    audioJitter: number | null;
  }>;
}

export function NetworkChart({ data }: NetworkChartProps) {
  // Calculate Y axis range with clean round numbers
  const allValues = data.flatMap(d => [
    d.latency,
    d.videoJitter,
    d.audioJitter,
  ].filter((v): v is number => v !== null));
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  // Round up to nearest 30 for clean Y-axis (0, 30, 60, 90, 120...)
  const yMax = Math.max(30, Math.ceil(maxValue / 30) * 30);

  const hasAudio = data.some(d => d.audioJitter !== null);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={data.length > 1 ? [data[0].date, data[data.length - 1].date] : undefined}
          tickFormatter={(value: number) => {
            // Only show time labels for first and last data points
            const isFirstOrLast = value === data[0]?.date || value === data[data.length - 1]?.date;
            if (!isFirstOrLast) return '';
            return new Date(value * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }}
          tick={{ fontSize: 10, fill: 'rgba(156, 163, 175, 0.8)' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          domain={[0, yMax]}
          tick={{ fontSize: 10, fill: 'rgba(156, 163, 175, 0.8)' }}
          axisLine={false}
          tickLine={false}
          width={35}
          tickCount={yMax / 30 + 1}
          tickFormatter={(value: number) => `${Math.round(value)}`}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            padding: '8px 12px',
          }}
          labelFormatter={(label: number) => {
            return new Date(label * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }}
          formatter={(value: number, name: string) => {
            const formatted = typeof value === 'number' ? Math.round(value) : value;
            return [`${formatted} ms`, name];
          }}
        />
        <Line
          type="monotone"
          dataKey="latency"
          name="Latency"
          stroke={COLOR_SEMANTIC.network}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="videoJitter"
          name="Video Jitter"
          stroke={COLOR_SEMANTIC.video}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        {hasAudio && (
          <Line
            type="monotone"
            dataKey="audioJitter"
            name="Audio Jitter"
            stroke={COLOR_SEMANTIC.audio}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export { COLOR_SEMANTIC };
