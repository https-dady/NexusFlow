import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CirclePause,
  CirclePlay,
  Cpu,
  Radio,
  RefreshCw,
  Signal,
  Thermometer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { PageHeader } from '../components/ui/DataDisplay.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { MultiLineChart, chartColors } from '../components/charts/ChartKit.jsx';
import { useGetDeviceOptionsQuery } from '../store/api/nexusApi.js';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry.js';
import { cn, formatMetric, formatTime, smartTime } from '../lib/utils.js';

const deviceColors = [
  chartColors.flame,
  chartColors.gold,
  chartColors.blue,
  chartColors.green,
  chartColors.sand,
];

export default function LivePage() {
  const { data: optionsData, isLoading, isError, error, refetch } = useGetDeviceOptionsQuery();
  const devices = useMemo(() => optionsData?.data ?? [], [optionsData]);
  const [selected, setSelected] = useState([]);
  const [metric, setMetric] = useState('');
  const [paused, setPaused] = useState(false);
  const [history, setHistory] = useState([]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!devices.length || selected.length) return;
    const streaming = devices.filter((device) => device.status === 'online');
    const initial = (streaming.length ? streaming : devices).slice(0, 3);
    setSelected(initial.map((device) => device.deviceId));
  }, [devices, selected.length]);

  const selectedDevices = useMemo(
    () => devices.filter((device) => selected.includes(device.deviceId)),
    [devices, selected]
  );

  const { latest, connected, lastEventAt } = useLiveTelemetry(selected);

  const metricOptions = useMemo(() => {
    const map = new Map();
    for (const device of selectedDevices) {
      for (const sensor of device.sensors ?? []) {
        if (!map.has(sensor.key)) map.set(sensor.key, sensor);
      }
    }
    return [...map.values()];
  }, [selectedDevices]);

  useEffect(() => {
    if (!metricOptions.length) {
      setMetric('');
      return;
    }
    if (!metricOptions.some((option) => option.key === metric)) {
      setMetric(metricOptions[0].key);
    }
  }, [metricOptions, metric]);

  useEffect(() => {
    if (pausedRef.current) return;
    const entries = Object.values(latest);
    if (!entries.length) return;
    setHistory((previous) => {
      const stamp = Date.now();
      const point = { ts: new Date(stamp).toISOString() };
      for (const entry of entries) {
        const value = entry.metrics?.[metric];
        if (value !== undefined) point[entry.deviceId] = Number(value);
      }
      const next = [...previous, point].slice(-120);
      return next;
    });
  }, [latest, metric]);

  useEffect(() => {
    setHistory([]);
  }, [metric]);

  const series = selectedDevices.map((device, index) => ({
    key: device.deviceId,
    name: device.name,
    color: deviceColors[index % deviceColors.length],
  }));

  const toggleDevice = (deviceIdValue) => {
    setSelected((previous) => {
      if (previous.includes(deviceIdValue))
        return previous.filter((entry) => entry !== deviceIdValue);
      if (previous.length >= 4) return previous;
      return [...previous, deviceIdValue];
    });
  };

  const metricMeta = metricOptions.find((option) => option.key === metric);
  const selectedRows = selectedDevices.map((device) => {
    const live = latest[device.deviceId];
    return { device, live };
  });
  const eventCount = history.length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Real time"
        title="Live monitor"
        description="Watch device telemetry arrive over WebSockets. Up to four devices at once, with a rolling event window."
        actions={
          <>
            <span
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold',
                connected
                  ? 'border-success/20 bg-success/5 text-success'
                  : 'border-line bg-white text-muted'
              )}
            >
              {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {connected ? 'Socket connected' : 'Reconnecting'}
            </span>
            <Button
              variant="outline"
              icon={paused ? CirclePlay : CirclePause}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? 'Resume chart' : 'Pause chart'}
            </Button>
            <Button variant="ghost" size="icon" onClick={refetch} aria-label="Refresh devices">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-1">
          <CardHeader
            eyebrow="Subscriptions"
            title="Devices"
            description={`${selected.length} of 4 slots in use.`}
          />
          <div className="max-h-[440px] space-y-1.5 overflow-y-auto px-3 pb-4">
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12" />
              ))}
            {!isLoading &&
              devices.map((device) => {
                const active = selected.includes(device.deviceId);
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => toggleDevice(device.deviceId)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
                      active
                        ? 'border-flame/40 bg-flame/[0.06]'
                        : 'border-line/60 bg-white hover:border-line hover:bg-cream/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-flame text-ink' : 'bg-mist text-muted'
                      )}
                    >
                      <Cpu className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-ink">
                        {device.name}
                      </span>
                      <span className="block font-mono text-[9px] text-muted">
                        {device.deviceId}
                      </span>
                    </span>
                    <StatusBadge
                      status={device.status}
                      dot={false}
                      className="px-1.5 py-0.5 text-[8.5px]"
                    />
                  </button>
                );
              })}
            {!isLoading && devices.length === 0 && (
              <p className="px-3 py-6 text-center text-[11.5px] text-muted">No active devices.</p>
            )}
          </div>
          <div className="border-t border-line/60 px-4 py-3 text-[10.5px] text-muted">
            <p className="inline-flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              {lastEventAt
                ? `Last event ${formatTime(lastEventAt)}`
                : 'Waiting for the first event…'}
            </p>
            <p className="mt-1">Events are throttled server-side to 1 per device per second.</p>
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader
              eyebrow="Stream"
              title={metricMeta ? `${metricMeta.label} across devices` : 'Live telemetry'}
              description={
                paused
                  ? 'Chart paused — events continue to be collected in the background.'
                  : 'Rolling window of the most recent events. The chart keeps the latest 120 samples.'
              }
              action={
                <div className="flex items-center gap-2">
                  <Badge tone={paused ? 'gold' : 'success'} dot>
                    {paused ? 'Paused' : 'Streaming'}
                  </Badge>
                  <Badge tone="neutral">{eventCount} samples</Badge>
                </div>
              }
            />
            <div className="px-5 pb-5">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {metricOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setMetric(option.key)}
                    className={cn(
                      'cursor-pointer rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold transition',
                      metric === option.key
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'
                    )}
                  >
                    {option.label}
                    {option.unit ? <span className="ml-1 opacity-50">{option.unit}</span> : null}
                  </button>
                ))}
              </div>

              {isError ? (
                <ErrorState error={error} onRetry={refetch} title="Live devices are unavailable" />
              ) : history.length < 2 ? (
                <EmptyState
                  icon={Radio}
                  title="Listening for telemetry"
                  description={
                    selected.length === 0
                      ? 'Select one or more devices to subscribe to their live stream.'
                      : 'Start a simulator run or publish MQTT readings. New points will appear here within seconds.'
                  }
                  className="py-16"
                />
              ) : (
                <MultiLineChart data={history} series={series} height={320} />
              )}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {selectedRows.length === 0 && (
              <Card className="lg:col-span-2">
                <EmptyState
                  icon={Cpu}
                  title="Nothing selected"
                  description="Pick up to four devices from the list."
                />
              </Card>
            )}
            {selectedRows.map(({ device, live }) => (
              <Card key={device.deviceId} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold text-ink">{device.name}</p>
                    <p className="font-mono text-[9.5px] text-muted">{device.deviceId}</p>
                  </div>
                  <Badge tone={live ? 'success' : 'neutral'} dot>
                    {live ? 'Live' : 'Idle'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(device.sensors ?? []).slice(0, 6).map((sensor) => (
                    <div
                      key={sensor.key}
                      className="rounded-lg border border-line/60 bg-cream/40 px-2.5 py-2"
                    >
                      <p className="truncate text-[9px] font-semibold tracking-wide text-muted uppercase">
                        {sensor.label}
                      </p>
                      <p className="mt-0.5 text-[14px] font-extrabold tracking-tight text-ink">
                        {live?.metrics?.[sensor.key] != null
                          ? formatMetric(live.metrics[sensor.key], sensor.precision ?? 1)
                          : '—'}
                        <span className="ml-0.5 text-[9px] font-semibold text-muted">
                          {sensor.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {live ? formatTime(live.timestamp) : smartTime(device.lastSeenAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> {live?.source ?? device.source}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
