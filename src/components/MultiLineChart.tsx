import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface MultiLineChartProps {
  data: {
    date: number
    [key: string]: number
  }[]
  lines: {
    dataKey: string
    name: string
    color: string
  }[]
  unit?: string
  domain?: [string | number, string | number]
  height?: number
}

export default function MultiLineChart({
  data,
  lines,
  unit,
  domain,
  height = 200,
}: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 15, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(255, 255, 255, 0.1)"
        />
        <XAxis
          dataKey="date"
          tick={{
            fontFamily: 'system-ui',
            fontSize: '11px',
            fill: 'rgba(156, 163, 175, 1)',
          }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          ticks={
            data.length > 0
              ? [
                  data[0].date,
                  data[Math.floor(data.length / 2)].date,
                  data[data.length - 1].date,
                ]
              : []
          }
          tickFormatter={date => {
            return new Date(date * 1000).toLocaleTimeString('zh-CN', {
              hourCycle: 'h23',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        />
        <YAxis
          axisLine={false}
          orientation="right"
          tick={{
            fontFamily: 'system-ui',
            fontSize: '11px',
            fill: 'rgba(156, 163, 175, 1)',
          }}
          tickLine={false}
          domain={domain || [0, 'auto']}
          allowDecimals={false}
          tickCount={6}
          label={
            unit
              ? {
                  value: `(${unit.trim()})`,
                  angle: 0,
                  position: 'insideTopRight',
                  dx: 10,
                  dy: -10,
                  style: {
                    textAnchor: 'end',
                    fill: 'rgba(156, 163, 175, 0.7)',
                    fontSize: '10px',
                  },
                }
              : undefined
          }
        />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'rgba(156, 163, 175, 1)' }}
          itemStyle={{ color: 'rgba(229, 231, 235, 1)' }}
          labelFormatter={label => {
            return new Date(label * 1000).toLocaleTimeString('zh-CN', {
              hourCycle: 'h23',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          }}
          formatter={(value: any) => {
            const formattedValue =
              typeof value === 'number' ? value.toFixed(2) : value
            return `${formattedValue}${unit || ''}`
          }}
        />
        <Legend
          wrapperStyle={{
            fontSize: '11px',
            paddingTop: '10px',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          iconType="line"
          iconSize={12}
        />
        {lines.map(line => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
