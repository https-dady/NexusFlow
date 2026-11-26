import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BellRing,
  Cpu,
  Gauge,
  Plus,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { useGetDashboardQuery } from '../store/api/nexusApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardHeader, MiniStat, StatCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageHeader, ProgressBar } from '../components/ui/DataDisplay.jsx';
import { ErrorState, Skeleton, TableSkeleton } from '../components/ui/Feedback.jsx';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge.jsx';
import { DonutChart, Sparkline, chartColors } from '../components/charts/ChartKit.jsx';
import {
  deviceTypeMeta,
  formatNumber,
  percent,
  relativeTime,
  severityTone,
  smartTime,
  titleCase,
} from '../lib/utils.js';
import { PERMISSIONS } from '../lib/permissions.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery(undefined, {
    pollingInterval: 30_000,
  });

  if (isError) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refetch} title="Dashboard is unavailable" />
      </Card>
    );
  }

  const devices = data?.devices ?? {};
  const alerts = data?.alerts ?? {};
  const telemetry = data?.telemetry ?? {};
  const rules = data?.rules ?? {};
  const health = data?.health ?? {};
  const severityData = [
    { name: 'Critical', value: alerts.active?.critical ?? 0, color: chartColors.red },
    { name: 'Warning', value: alerts.active?.warning ?? 0, color: chartColors.gold },
    { name: 'Info', value: alerts.active?.info ?? 0, color: chartColors.sand },
  ];
  const activeAlerts =
    (alerts.active?.critical ?? 0) + (alerts.active?.warning ?? 0) + (alerts.active?.info ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Control room"
        title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'}.`}
        description="Here is the live pulse of your workspace — devices, streaming telemetry and rule activity at a glance."
        actions={
          <>
            {can(PERMISSIONS.SIMULATOR_MANAGE) && (
              <Button variant="outline" icon={Gauge} onClick={() => navigate('/simulator')}>
                Simulator
              </Button>
            )}
            {can(PERMISSIONS.DEVICES_WRITE) && (
              <Button icon={Plus} onClick={() => navigate('/devices?new=1')}>
                Add device
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fleet online"
          value={isLoading ? '—' : `${devices.online ?? 0}/${devices.total ?? 0}`}
          icon={Cpu}
          accent="#FD8549"
          hint={`${devices.onlineRate ?? 0}% reachability across active devices`}
          loading={isLoading}
        />
        <StatCard
          label="Telemetry · 24h"
          value={isLoading ? '—' : formatNumber(telemetry.last24h ?? 0)}
          suffix="points"
          icon={Waves}
          accent="#FFC123"
          hint={`${telemetry.perMinute ?? 0} points / minute · last hour ${formatNumber(telemetry.lastHour ?? 0)}`}
          loading={isLoading}
        />
        <StatCard
          label="Active alerts"
          value={isLoading ? '—' : activeAlerts}
          icon={BellRing}
          accent="#D9483B"
          hint={`${alerts.last24Hours ?? 0} raised in the last 24 hours`}
          loading={isLoading}
        />
        <StatCard
          label="Rules enabled"
          value={isLoading ? '—' : (rules.enabled ?? 0)}
          suffix={`/ ${rules.total ?? 0}`}
          icon={SlidersHorizontal}
          accent="#1F8A5B"
          hint={`${rules.executions24h ?? 0} evaluations in the last 24 hours`}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Throughput"
            title="Telemetry volume"
            description="Aggregated sample counts in 30-minute buckets over the last 12 hours."
            action={
              <Link
                to="/analytics"
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-flame-deep hover:underline"
              >
                Open analytics <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="px-5 pb-5">
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="rounded-2xl border border-line/60 bg-cream/40 p-3">
                <div className="flex items-end justify-between px-2 pb-2">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                      Last hour
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">
                      {formatNumber(telemetry.lastHour ?? 0)}
                      <span className="ml-1.5 text-[12px] font-semibold text-muted">points</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10.5px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-4 rounded-full bg-flame" /> Ingested
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                    </span>
                  </div>
                </div>
                <Sparkline
                  data={telemetry.sparkline ?? []}
                  height={220}
                  color={chartColors.flame}
                />
              </div>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <MiniStat
                label="Per minute"
                value={isLoading ? '—' : (telemetry.perMinute ?? 0)}
                icon={Activity}
              />
              <MiniStat
                label="Avg health"
                value={isLoading ? '—' : `${health.averageScore ?? 0}%`}
                icon={ShieldCheck}
                accent="#1F8A5B"
              />
              <MiniStat
                label="Running demos"
                value={isLoading ? '—' : (data?.simulations?.active ?? 0)}
                icon={Gauge}
                accent="#DDBD72"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Severity"
            title="Alert mix"
            description="Active signals by severity right now."
            action={
              <Link
                to="/alerts"
                className="text-[11.5px] font-semibold text-flame-deep hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="px-5 pb-5">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <>
                <DonutChart
                  data={severityData}
                  centerValue={activeAlerts}
                  centerLabel="Active"
                  height={182}
                />
                <div className="mt-3 space-y-1.5">
                  {severityData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between rounded-xl border border-line/60 bg-cream/40 px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2 text-[11.5px] font-medium text-ink/70">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="text-[12px] font-bold text-ink">{entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-ink px-3.5 py-3 text-white">
                  <div>
                    <p className="text-[9.5px] font-bold tracking-[0.16em] text-white/45 uppercase">
                      Resolved
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold">
                      {alerts.byStatus?.resolved ?? 0}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-[#6ee7b7]">
                    <TrendingUp className="h-3 w-3" /> lifetime
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Signal"
            title="Recent alerts"
            description="The highest-priority active alerts across the fleet."
            action={
              <Link
                to="/alerts"
                className="text-[11.5px] font-semibold text-flame-deep hover:underline"
              >
                Alert centre
              </Link>
            }
          />
          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : (data?.recentAlerts ?? []).length === 0 ? (
            <div className="flex items-center gap-3 px-5 pb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">All clear</p>
                <p className="text-[11.5px] text-muted">
                  No active alerts. Rules are watching quietly.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-line/50">
              {(data?.recentAlerts ?? []).map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-cream/60"
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${severityTone(alert.severity) === 'danger' ? '#D9483B' : '#FFC123'}18`,
                      color: severityTone(alert.severity) === 'danger' ? '#D9483B' : '#8A6400',
                    }}
                  >
                    <BellRing className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[12.5px] font-bold text-ink">
                        {alert.title}
                      </span>
                      <SeverityBadge severity={alert.severity} />
                      {alert.occurrenceCount > 1 && (
                        <span className="text-[10px] font-semibold text-muted">
                          ×{alert.occurrenceCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-[11.5px] text-muted">
                      {alert.deviceName} · {alert.message}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10.5px] whitespace-nowrap text-muted">
                    {relativeTime(alert.triggeredAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            eyebrow="Attention"
            title="Device health"
            description="Devices with the lowest health scores."
            action={
              <Link
                to="/devices"
                className="text-[11.5px] font-semibold text-flame-deep hover:underline"
              >
                Fleet
              </Link>
            }
          />
          <div className="space-y-2 px-5 pb-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14" />)
            ) : (health.attention ?? []).length === 0 ? (
              <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-5 text-center">
                <ShieldCheck className="mx-auto h-6 w-6 text-success" />
                <p className="mt-2 text-[12.5px] font-bold text-ink">No attention needed</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Every active device is healthy.</p>
              </div>
            ) : (
              (health.attention ?? []).map((device) => (
                <Link
                  key={device.id}
                  to={`/devices/${device.deviceId}`}
                  className="block rounded-xl border border-line/70 bg-cream/40 px-3.5 py-3 transition hover:border-flame/40 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold text-ink">
                        {device.name}
                      </span>
                      <span className="block font-mono text-[9.5px] text-muted">
                        {device.deviceId}
                      </span>
                    </span>
                    <StatusBadge status={device.status} />
                  </div>
                  <ProgressBar
                    value={device.health?.score ?? 0}
                    className="mt-2.5"
                    tone={(device.health?.score ?? 0) < 45 ? chartColors.red : chartColors.gold}
                  />
                </Link>
              ))
            )}
            <div className="!mt-4 rounded-xl border border-line/60 bg-cloud/70 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                  Fleet health
                </span>
                <span className="text-[12px] font-extrabold text-ink">
                  {health.averageScore ?? 0}%
                </span>
              </div>
              <ProgressBar
                value={health.averageScore ?? 0}
                className="mt-2"
                tone={chartColors.green}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Inventory"
            title="Recently provisioned"
            description="Newest devices in the workspace and their latest signal."
            action={
              <Link
                to="/devices"
                className="text-[11.5px] font-semibold text-flame-deep hover:underline"
              >
                All devices
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th className="text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5}>
                      <TableSkeleton rows={3} columns={5} />
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  (data?.recentDevices ?? []).map((device) => (
                    <tr
                      key={device.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/devices/${device.deviceId}`)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[9.5px] font-extrabold"
                            style={{
                              backgroundColor: `${deviceTypeMeta[device.type]?.accent ?? '#FD8549'}18`,
                              color: deviceTypeMeta[device.type]?.accent ?? '#FD8549',
                            }}
                          >
                            {deviceTypeMeta[device.type]?.short ?? 'DV'}
                          </span>
                          <span>
                            <span className="block text-[12.5px] font-semibold text-ink">
                              {device.name}
                            </span>
                            <span className="block font-mono text-[9.5px] text-muted">
                              {device.deviceId}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="text-[12px] text-muted">
                        {deviceTypeMeta[device.type]?.label ?? titleCase(device.type)}
                      </td>
                      <td className="text-[12px] text-muted">{device.location?.zone ?? '—'}</td>
                      <td>
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="text-right text-[11.5px] text-muted">
                        {smartTime(device.lastSeenAt)}
                      </td>
                    </tr>
                  ))}
                {!isLoading && !(data?.recentDevices ?? []).length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-8 text-center text-[12px] text-muted">No devices yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden bg-ink text-white">
            <div className="grain relative p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                <Sparkles className="h-3 w-3 text-gold" /> Demo ready
              </div>
              <p className="mt-3 text-[16px] font-extrabold tracking-tight">
                Need a signal to demo?
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/50">
                Start a simulated stream, inject an anomaly, and watch a rule fire end-to-end.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  icon={Radio}
                  onClick={() => navigate('/simulator')}
                  disabled={!can(PERMISSIONS.SIMULATOR_MANAGE)}
                >
                  Open simulator
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => navigate('/rules')}
                >
                  Rule engine
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Top talkers"
              title="Alert hotspots"
              description="Last seven days."
            />
            <div className="space-y-2 px-5 pb-5">
              {(data?.topDevices ?? []).length === 0 && (
                <p className="py-4 text-center text-[11.5px] text-muted">
                  No alert history in this window.
                </p>
              )}
              {(data?.topDevices ?? []).map((device, index) => (
                <div key={device.deviceId} className="flex items-center gap-3">
                  <span className="w-4 text-[10px] font-bold text-muted">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11.5px] font-semibold text-ink">
                        {device.name}
                      </span>
                      <span className="text-[10.5px] font-bold text-muted">{device.alerts}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist">
                      <div
                        className="h-full rounded-full bg-flame"
                        style={{
                          width: `${percent(device.alerts, data.topDevices[0]?.alerts || 1)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
