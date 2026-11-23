import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Activity,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  MapPin,
  Pencil,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Trash2,
  Wifi,
} from 'lucide-react';
import { DeviceFormModal } from '../../components/devices/DeviceFormModal.jsx';
import { Card, MiniStat } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../../components/ui/Badge.jsx';
import { DataRow, ProgressBar, Tabs } from '../../components/ui/DataDisplay.jsx';
import { ErrorState, EmptyState, Skeleton, TableSkeleton } from '../../components/ui/Feedback.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { MultiLineChart, chartColors } from '../../components/charts/ChartKit.jsx';
import {
  useArchiveDeviceMutation,
  useGetDeviceActivityQuery,
  useGetDeviceHealthQuery,
  useGetDeviceQuery,
  useGetDeviceTelemetryQuery,
  useRestoreDeviceMutation,
} from '../../store/api/nexusApi.js';
import { downloadTelemetryCsv } from '../../lib/api.js';
import {
  downloadBlob,
  deviceTypeMeta,
  errorMessage,
  formatDateTime,
  formatMetric,
  relativeTime,
  secondsToReadable,
  smartTime,
  titleCase,
} from '../../lib/utils.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { pushToast } from '../../store/uiSlice.js';

const seriesColors = [
  chartColors.flame,
  chartColors.gold,
  chartColors.green,
  chartColors.blue,
  chartColors.sand,
];

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can } = useAuth();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetDeviceQuery(deviceId);
  const device = data?.device;
  const telemetryQuery = useGetDeviceTelemetryQuery(
    { deviceId, resolution: '1m', limit: 500 },
    { skip: !device, pollingInterval: 30_000 }
  );
  const healthQuery = useGetDeviceHealthQuery(deviceId, { skip: !device || tab !== 'health' });
  const activityQuery = useGetDeviceActivityQuery(
    { deviceId, limit: 20 },
    { skip: !device || tab !== 'activity' }
  );

  const [archiveDevice, { isLoading: archiving }] = useArchiveDeviceMutation();
  const [restoreDevice, { isLoading: restoring }] = useRestoreDeviceMutation();

  const points = useMemo(() => telemetryQuery.data?.points ?? [], [telemetryQuery.data]);
  const sensors = device?.sensors ?? [];
  const numericSensors = sensors
    .filter((sensor) => !['uptime', 'rssi'].includes(sensor.type))
    .slice(0, 4);
  const chartData = useMemo(
    () =>
      points.map((point) => ({
        ts: point.ts,
        ...point.metrics,
      })),
    [points]
  );
  const latest = points[points.length - 1]?.metrics ?? {};
  const series = numericSensors.map((sensor, index) => ({
    key: sensor.key,
    name: sensor.label,
    color: seriesColors[index % seriesColors.length],
  }));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await downloadTelemetryCsv({
        deviceIds: device.deviceId,
        resolution: 'raw',
        limit: 5000,
      });
      downloadBlob(blob, filename);
      dispatch(pushToast({ title: 'Telemetry export ready', message: filename }));
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Export failed', message: errorMessage(requestError), tone: 'danger' })
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmArchive = async () => {
    try {
      await archiveDevice({ deviceId, confirmation }).unwrap();
      setArchiveOpen(false);
      setConfirmation('');
      dispatch(
        pushToast({
          title: 'Device archived',
          message: 'History is preserved and alerts resolved.',
        })
      );
      refetch();
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Archive failed', message: errorMessage(requestError), tone: 'danger' })
      );
    }
  };

  const confirmRestore = async () => {
    try {
      await restoreDevice(deviceId).unwrap();
      setRestoreOpen(false);
      dispatch(pushToast({ title: 'Device restored' }));
      refetch();
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Restore failed', message: errorMessage(requestError), tone: 'danger' })
      );
    }
  };

  if (isError) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refetch} title="Device could not be loaded" />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!device) return null;

  const accent = deviceTypeMeta[device.type]?.accent ?? '#FD8549';
  const tabs = [
    { value: 'overview', label: 'Overview', icon: Activity },
    { value: 'health', label: 'Health', icon: ShieldCheck },
    { value: 'activity', label: 'Activity', icon: CalendarClock },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
        <Link
          to="/devices"
          className="inline-flex items-center gap-1 font-semibold transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Devices
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-[10.5px]">{device.deviceId}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {deviceTypeMeta[device.type]?.short ?? 'DV'}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.045em] text-ink">
                {device.name}
              </h1>
              <StatusBadge status={device.status} />
              {device.archivedAt && <Badge tone="neutral">Archived</Badge>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
              <span className="font-mono">{device.deviceId}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {device.location?.zone || 'Unassigned'}
              </span>
              <span className="inline-flex items-center gap-1">
                {device.source === 'mqtt' ? (
                  <Radio className="h-3 w-3" />
                ) : (
                  <SlidersHorizontal className="h-3 w-3" />
                )}
                {device.source}
              </span>
              <span className="inline-flex items-center gap-1">
                <Cpu className="h-3 w-3" />{' '}
                {deviceTypeMeta[device.type]?.label ?? titleCase(device.type)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={exporting}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
          {can(PERMISSIONS.SIMULATOR_MANAGE) &&
            device.source === 'simulated' &&
            !device.archivedAt && (
              <Button
                variant="outline"
                size="sm"
                icon={Gauge}
                onClick={() => navigate(`/simulator?device=${device.deviceId}`)}
              >
                Simulate
              </Button>
            )}
          {can(PERMISSIONS.DEVICES_WRITE) && !device.archivedAt && (
            <Button size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          {can(PERMISSIONS.DEVICES_ARCHIVE) &&
            (device.archivedAt ? (
              <Button size="sm" icon={ArchiveRestore} onClick={() => setRestoreOpen(true)}>
                Restore
              </Button>
            ) : (
              <Button
                variant="danger-soft"
                size="sm"
                icon={Trash2}
                onClick={() => setArchiveOpen(true)}
              >
                Archive
              </Button>
            ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Health score"
          value={`${device.health?.score ?? 0}%`}
          icon={ShieldCheck}
          accent="#1F8A5B"
        />
        <MiniStat
          label="Battery"
          value={device.lastBattery != null ? `${formatMetric(device.lastBattery)}%` : '—'}
          icon={HardDrive}
          accent="#FFC123"
        />
        <MiniStat
          label="Signal"
          value={device.lastSignal != null ? `${formatMetric(device.lastSignal)} dBm` : '—'}
          icon={Wifi}
          accent="#4F6B8C"
        />
        <MiniStat
          label="Last telemetry"
          value={device.lastTelemetryAt ? relativeTime(device.lastTelemetryAt) : 'Never'}
          icon={Activity}
        />
      </div>

      <Card className="overflow-visible">
        <Tabs tabs={tabs} value={tab} onChange={setTab} className="px-4" />

        {tab === 'overview' && (
          <div className="grid gap-5 p-5 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <div className="rounded-2xl border border-line/70 bg-cream/40 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                      Live snapshot
                    </p>
                    <p className="text-[11px] text-muted">
                      Latest values ·{' '}
                      {telemetryQuery.isFetching
                        ? 'refreshing…'
                        : smartTime(device.lastTelemetryAt)}
                    </p>
                  </div>
                  <Badge tone="flame">{telemetryQuery.data?.resolution ?? '1m'} rollup</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sensors.slice(0, 6).map((sensor) => (
                    <div
                      key={sensor.key}
                      className="rounded-xl border border-line/60 bg-white px-3.5 py-3"
                    >
                      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                        {sensor.label}
                      </p>
                      <p className="mt-1 text-[20px] leading-none font-extrabold tracking-tight text-ink">
                        {latest[sensor.key] != null
                          ? formatMetric(latest[sensor.key], sensor.precision ?? 1)
                          : '—'}
                        <span className="ml-1 text-[10.5px] font-semibold text-muted">
                          {sensor.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12.5px] font-bold text-ink">Telemetry trend</p>
                  <span className="text-[10.5px] text-muted">
                    Last 24 hours · {points.length} points
                  </span>
                </div>
                {telemetryQuery.isLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : chartData.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No telemetry yet"
                    description={
                      device.source === 'mqtt'
                        ? 'Publish readings to the device topic to see them here.'
                        : 'Start a simulation run to generate telemetry for this device.'
                    }
                    action={
                      can(PERMISSIONS.SIMULATOR_MANAGE) && device.source === 'simulated' ? (
                        <Button
                          size="sm"
                          icon={Gauge}
                          onClick={() => navigate(`/simulator?device=${device.deviceId}`)}
                        >
                          Open simulator
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <MultiLineChart data={chartData} series={series} height={270} />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line/70 bg-white p-4">
                <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  Configuration
                </p>
                <div className="mt-2 divide-y divide-line/50">
                  <DataRow
                    label="Device ID"
                    value={<span className="font-mono text-[11px]">{device.deviceId}</span>}
                  />
                  <DataRow
                    label="Type"
                    value={deviceTypeMeta[device.type]?.label ?? titleCase(device.type)}
                  />
                  <DataRow label="Source" value={titleCase(device.source)} />
                  <DataRow label="Firmware" value={device.firmware} />
                  <DataRow label="Zone" value={device.location?.zone} />
                  <DataRow label="Location" value={device.location?.label || '—'} />
                  <DataRow label="Provisioned" value={formatDateTime(device.createdAt)} />
                  <DataRow label="Last seen" value={smartTime(device.lastSeenAt)} />
                  <DataRow
                    label="Uptime"
                    value={
                      device.lastUptimeSec != null ? secondsToReadable(device.lastUptimeSec) : '—'
                    }
                  />
                </div>
                {device.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {device.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-line/70 bg-ink p-4 text-white">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
                  <Thermometer className="h-3 w-3 text-gold" /> Sensors
                </div>
                <div className="mt-3 space-y-2.5">
                  {sensors.map((sensor) => (
                    <div key={sensor.key}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-white/75">{sensor.label}</span>
                        <span className="font-mono text-[9.5px] text-white/35">
                          {sensor.min} — {sensor.max} {sensor.unit}
                        </span>
                      </div>
                      <ProgressBar
                        value={
                          latest[sensor.key] != null
                            ? Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((latest[sensor.key] - sensor.min) /
                                    (sensor.max - sensor.min || 1)) *
                                    100
                                )
                              )
                            : 0
                        }
                        tone={accent}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {device.description && (
                <div className="rounded-2xl border border-line/70 bg-cream/50 p-4">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                    Notes
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink/70">
                    {device.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'health' && (
          <div className="grid gap-5 p-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-line/70 bg-cream/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                      Current evaluation
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      {healthQuery.data?.health?.score ?? device.health?.score ?? 0}% health
                    </p>
                  </div>
                  <StatusBadge status={healthQuery.data?.status ?? device.status} />
                </div>
                <ProgressBar
                  value={healthQuery.data?.health?.score ?? device.health?.score ?? 0}
                  className="mt-3"
                  tone={chartColors.green}
                />
                <div className="mt-4 space-y-1.5">
                  {(healthQuery.data?.health?.reasons ?? device.health?.reasons ?? []).map(
                    (reason) => (
                      <div
                        key={reason}
                        className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-[11.5px] text-ink/75"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-flame" />
                        {reason}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[12.5px] font-bold text-ink">Effective thresholds</p>
                {healthQuery.isLoading ? (
                  <TableSkeleton rows={4} columns={2} />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(healthQuery.data?.config ?? {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-line/70 bg-white px-3.5 py-2.5"
                      >
                        <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-ink">
                          {typeof value === 'number' && key.toLowerCase().includes('sec')
                            ? secondsToReadable(value)
                            : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-line/70 bg-white p-4">
                <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  Signal facts
                </p>
                <div className="mt-2 divide-y divide-line/50">
                  <DataRow
                    label="Telemetry freshness"
                    value={
                      healthQuery.data?.telemetryFreshnessSec != null
                        ? `${secondsToReadable(healthQuery.data.telemetryFreshnessSec)} ago`
                        : 'No data'
                    }
                  />
                  <DataRow label="Last seen" value={smartTime(healthQuery.data?.lastSeenAt)} />
                  <DataRow
                    label="Last telemetry"
                    value={smartTime(healthQuery.data?.lastTelemetryAt)}
                  />
                  <DataRow
                    label="Battery"
                    value={
                      healthQuery.data?.lastBattery != null
                        ? `${formatMetric(healthQuery.data.lastBattery)}%`
                        : '—'
                    }
                  />
                  <DataRow
                    label="Signal"
                    value={
                      healthQuery.data?.lastSignal != null
                        ? `${formatMetric(healthQuery.data.lastSignal)} dBm`
                        : '—'
                    }
                  />
                  <DataRow
                    label="Uptime"
                    value={
                      healthQuery.data?.lastUptimeSec != null
                        ? secondsToReadable(healthQuery.data.lastUptimeSec)
                        : '—'
                    }
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-line/70 bg-cloud p-4 text-[11.5px] leading-relaxed text-muted">
                Health combines freshness, sensor failures, battery and RSSI thresholds.
                Device-level overrides take precedence over workspace defaults.
              </div>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div>
            {activityQuery.isLoading ? (
              <TableSkeleton rows={6} columns={3} />
            ) : (activityQuery.data?.data ?? []).length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No activity yet"
                description="Configuration changes will be recorded here."
              />
            ) : (
              <div className="divide-y divide-line/50">
                {activityQuery.data.data.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flame/10 text-flame-deep">
                      <Activity className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-ink">{entry.description}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {titleCase(entry.action)} · {entry.actorName || 'System'} ·{' '}
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <DeviceFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        device={device}
        onSaved={() => {
          refetch();
          dispatch(pushToast({ title: 'Device updated' }));
        }}
      />

      <Modal
        open={archiveOpen}
        onClose={() => {
          setArchiveOpen(false);
          setConfirmation('');
        }}
        title={`Archive ${device.name}?`}
        description="The device leaves the active fleet, open alerts resolve and telemetry ingestion stops. History stays intact."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={archiving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={archiving}
              disabled={confirmation !== device.deviceId}
              onClick={confirmArchive}
            >
              Archive device
            </Button>
          </>
        }
      >
        <Input
          label={`Type ${device.deviceId} to confirm`}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={device.deviceId}
          autoFocus
        />
      </Modal>

      <Modal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore this device?"
        description="The device rejoins the active fleet and will show offline until telemetry resumes."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRestoreOpen(false)} disabled={restoring}>
              Cancel
            </Button>
            <Button icon={ArchiveRestore} loading={restoring} onClick={confirmRestore}>
              Restore device
            </Button>
          </>
        }
      />
    </div>
  );
}
