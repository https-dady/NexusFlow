import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatNumber, formatTime } from '../../lib/utils.js';

export const chartColors = {
  flame: '#FD8549',
  gold: '#FFC123',
  sand: '#DDBD72',
  ink: '#171717',
  green: '#1F8A5B',
  blue: '#4F6B8C',
  red: '#D9483B',
  grid: '#ECEAE4',
  muted: '#8A867D',
};

export function ChartTooltip({ active, payload, label, unit = '', timeFormat = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white/95 px-3 py-2 shadow-float backdrop-blur">
      <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-muted uppercase">
        {timeFormat ? formatTime(label) : label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-[11.5px]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
          />
          <span className="capitalize text-muted">{entry.name}</span>
          <span className="ml-auto font-bold text-ink">
            {formatNumber(entry.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartShell({ children, height = 240, className = '' }) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({
  data = [],
  dataKey = 'count',
  color = chartColors.flame,
  height = 42,
}) {
  if (!data.length) return <div style={{ height }} />;
  return (
    <ChartShell height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#spark-${color.replace('#', '')})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartShell>
  );
}

export function VolumeAreaChart({ data, height = 250 }) {
  return (
    <ChartShell height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.flame} stopOpacity={0.32} />
            <stop offset="100%" stopColor={chartColors.flame} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
        <XAxis
          dataKey="ts"
          tickFormatter={(value) => formatTime(value).slice(0, 5)}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
        />
        <YAxis tickLine={false} axisLine={false} width={46} tickFormatter={formatNumber} />
        <Tooltip content={<ChartTooltip timeFormat />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Points"
          stroke={chartColors.flame}
          strokeWidth={2.2}
          fill="url(#volumeFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartShell>
  );
}

export function MultiLineChart({ data, series = [], height = 260, xKey = 'ts' }) {
  return (
    <ChartShell height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tickFormatter={(value) => formatTime(value).slice(0, 5)}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis tickLine={false} axisLine={false} width={46} tickFormatter={formatNumber} />
        <Tooltip content={<ChartTooltip timeFormat />} />
        {series.map((entry) => (
          <Line
            key={entry.key}
            type="monotone"
            dataKey={entry.key}
            name={entry.name ?? entry.key}
            stroke={entry.color ?? chartColors.flame}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartShell>
  );
}

export function SeverityBars({ data, height = 220 }) {
  return (
    <ChartShell height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F7F7F5' }} />
        <Bar dataKey="value" name="Alerts" radius={[7, 7, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  );
}

export function DonutChart({ data, height = 200, centerLabel, centerValue }) {
  return (
    <div className="relative">
      <ChartShell height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
            outerRadius="94%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ChartShell>
      {centerValue !== undefined && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] leading-none font-extrabold tracking-tight text-ink">
            {centerValue}
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
            {centerLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function StackedAlertTrend({ data, height = 250 }) {
  return (
    <ChartShell height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
        <XAxis
          dataKey="ts"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          }
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F7F7F5' }} />
        <Bar
          dataKey="critical"
          stackId="a"
          name="Critical"
          fill={chartColors.red}
          radius={[0, 0, 0, 0]}
        />
        <Bar dataKey="warning" stackId="a" name="Warning" fill={chartColors.gold} />
        <Bar dataKey="info" stackId="a" name="Info" fill={chartColors.sand} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}
