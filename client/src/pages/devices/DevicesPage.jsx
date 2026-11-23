import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArchiveRestore,
  ChevronRight,
  Cpu,
  FilterX,
  Pencil,
  Plus,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { DeviceFormModal } from '../../components/devices/DeviceFormModal.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SearchInput, Select, Toggle } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { PageHeader, Pagination, ProgressBar } from '../../components/ui/DataDisplay.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Form.jsx';
import {
  useArchiveDeviceMutation,
  useGetDevicesQuery,
  useRestoreDeviceMutation,
} from '../../store/api/nexusApi.js';
import { pushToast } from '../../store/uiSlice.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import {
  deviceTypeMeta,
  errorMessage,
  formatDateTime,
  relativeTime,
  smartTime,
  titleCase,
} from '../../lib/utils.js';

const statuses = ['online', 'warning', 'critical', 'offline', 'maintenance'];

export default function DevicesPage() {
  const dispatch = useDispatch();
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null);

  const query = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status || undefined,
    type: type || undefined,
    source: source || undefined,
    archived: archived ? 'true' : undefined,
    sort: archived ? '-archivedAt' : '-createdAt',
  };
  const { data, isLoading, isFetching, isError, error, refetch } = useGetDevicesQuery(query, {
    pollingInterval: 30_000,
  });
  const [archiveDevice, { isLoading: archiving }] = useArchiveDeviceMutation();
  const [restoreDevice, { isLoading: restoring }] = useRestoreDeviceMutation();

  const devices = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  useEffect(() => {
    const shouldOpen = searchParams.get('new') === '1';
    if (shouldOpen) {
      setEditing(null);
      setFormOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status, type, source, archived]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  };

  const filtersActive = Boolean(search || status || type || source || archived);

  const counts = useMemo(() => {
    const base = { total: meta?.total ?? 0, online: 0, warning: 0, critical: 0, offline: 0 };
    for (const device of devices) {
      if (base[device.status] !== undefined) base[device.status] += 1;
    }
    return base;
  }, [devices, meta]);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setType('');
    setSource('');
    setArchived(false);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveDevice({ deviceId: archiveTarget.deviceId, confirmation }).unwrap();
      dispatch(
        pushToast({
          title: 'Device archived',
          message: `${archiveTarget.name} left the active fleet. History is preserved.`,
        })
      );
      setArchiveTarget(null);
      setConfirmation('');
    } catch (requestError) {
      dispatch(
        pushToast({
          title: 'Archive failed',
          message: errorMessage(requestError),
          tone: 'danger',
        })
      );
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreDevice(restoreTarget.deviceId).unwrap();
      dispatch(
        pushToast({
          title: 'Device restored',
          message: `${restoreTarget.name} is back in the fleet.`,
        })
      );
      setRestoreTarget(null);
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Restore failed', message: errorMessage(requestError), tone: 'danger' })
      );
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Fleet"
        title="Devices"
        description="Provision simulated or MQTT-backed devices, tune sensors and watch their health in real time."
        actions={
          can(PERMISSIONS.DEVICES_WRITE) ? (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add device
            </Button>
          ) : null
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-muted">
            <Cpu className="h-3 w-3" /> {counts.total} {archived ? 'archived' : 'active'}
          </span>
          {!archived && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/5 px-2.5 py-1 text-[10.5px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {counts.online} online
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10.5px] font-semibold text-[#8a6400]">
                {counts.warning} warning
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/20 bg-danger/5 px-2.5 py-1 text-[10.5px] font-semibold text-danger">
                {counts.critical} critical
              </span>
            </>
          )}
        </div>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-2.5 border-b border-line/70 px-4 py-3.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID, tag…"
            className="min-w-[200px] flex-1"
          />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            containerClassName="w-36"
          >
            <option value="">All statuses</option>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {titleCase(option)}
              </option>
            ))}
          </Select>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value)}
            containerClassName="w-40"
          >
            <option value="">All types</option>
            {Object.entries(deviceTypeMeta).map(([value, metaValue]) => (
              <option key={value} value={value}>
                {metaValue.label}
              </option>
            ))}
          </Select>
          <Select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            containerClassName="w-36"
          >
            <option value="">Any source</option>
            <option value="simulated">Simulated</option>
            <option value="mqtt">MQTT</option>
          </Select>
          <Toggle
            checked={archived}
            onChange={setArchived}
            label="Archived"
            className="h-10 items-center border-line bg-white px-3 py-2"
          />
          {filtersActive && (
            <Button variant="ghost" size="sm" icon={FilterX} onClick={resetFilters}>
              Reset
            </Button>
          )}
          {isFetching && !isLoading && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted">
              <RotateCcw className="h-3 w-3 animate-spin" /> Refreshing
            </span>
          )}
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} title="Devices could not be loaded" />
        ) : isLoading ? (
          <TableSkeleton rows={7} columns={6} />
        ) : devices.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title={archived ? 'No archived devices' : 'No devices match these filters'}
            description={
              filtersActive
                ? 'Try a different search or clear the filters to see the full fleet.'
                : 'Provision your first device to start streaming telemetry.'
            }
            action={
              filtersActive ? (
                <Button variant="outline" size="sm" icon={FilterX} onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : can(PERMISSIONS.DEVICES_WRITE) ? (
                <Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
                  Add device
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Type / source</th>
                    <th>Zone</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Last seen</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <Link
                          to={`/devices/${device.deviceId}`}
                          className="group flex items-center gap-3"
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold"
                            style={{
                              backgroundColor: `${deviceTypeMeta[device.type]?.accent ?? '#FD8549'}18`,
                              color: deviceTypeMeta[device.type]?.accent ?? '#FD8549',
                            }}
                          >
                            {deviceTypeMeta[device.type]?.short ?? 'DV'}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[12.5px] font-bold text-ink group-hover:text-flame-deep">
                                {device.name}
                              </span>
                              {device.archivedAt && (
                                <span className="rounded-full bg-mist px-1.5 py-0.5 text-[9px] font-bold text-muted">
                                  ARCHIVED
                                </span>
                              )}
                            </span>
                            <span className="block font-mono text-[9.5px] text-muted">
                              {device.deviceId}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <p className="text-[12px] font-medium text-ink/80">
                          {deviceTypeMeta[device.type]?.label ?? titleCase(device.type)}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted">
                          {device.source === 'mqtt' ? (
                            <Radio className="h-2.5 w-2.5" />
                          ) : (
                            <SlidersHorizontal className="h-2.5 w-2.5" />
                          )}
                          {device.source}
                        </p>
                      </td>
                      <td>
                        <p className="text-[12px] text-ink/80">{device.location?.zone || '—'}</p>
                        {device.location?.label && (
                          <p className="max-w-40 truncate text-[10px] text-muted">
                            {device.location.label}
                          </p>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="w-28">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={device.health?.score ?? 0}
                            tone={
                              (device.health?.score ?? 0) >= 80
                                ? '#1F8A5B'
                                : (device.health?.score ?? 0) >= 50
                                  ? '#FFC123'
                                  : '#D9483B'
                            }
                            className="w-16"
                          />
                          <span className="text-[11px] font-bold text-ink">
                            {device.health?.score ?? 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <p className="text-[11.5px] text-ink/75">
                          {smartTime(device.lastSeenAt ?? device.lastTelemetryAt)}
                        </p>
                        <p className="mt-0.5 text-[9.5px] text-muted">
                          {device.sensorCount} sensors
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {can(PERMISSIONS.DEVICES_WRITE) && !device.archivedAt && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(device);
                                setFormOpen(true);
                              }}
                              className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
                              aria-label={`Edit ${device.name}`}
                              title="Edit device"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {can(PERMISSIONS.DEVICES_ARCHIVE) &&
                            (device.archivedAt ? (
                              <button
                                type="button"
                                onClick={() => setRestoreTarget(device)}
                                className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-success/10 hover:text-success"
                                aria-label={`Restore ${device.name}`}
                                title="Restore device"
                              >
                                <ArchiveRestore className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setArchiveTarget(device);
                                  setConfirmation('');
                                }}
                                className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                                aria-label={`Archive ${device.name}`}
                                title="Archive device"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          <Link
                            to={`/devices/${device.deviceId}`}
                            className="rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
                            aria-label={`Open ${device.name}`}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} className="border-t border-line/70" />
          </>
        )}
      </Card>

      <DeviceFormModal
        open={formOpen}
        onClose={closeForm}
        device={editing}
        onSaved={() =>
          dispatch(pushToast({ title: editing ? 'Device updated' : 'Device provisioned' }))
        }
      />

      <Modal
        open={Boolean(archiveTarget)}
        onClose={() => {
          setArchiveTarget(null);
          setConfirmation('');
        }}
        title={`Archive ${archiveTarget?.name ?? 'device'}?`}
        description="Archived devices stop accepting telemetry, disappear from active views and resolve their open alerts. Their history is preserved."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setArchiveTarget(null);
                setConfirmation('');
              }}
              disabled={archiving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={archiving}
              disabled={confirmation !== archiveTarget?.deviceId}
              onClick={confirmArchive}
            >
              Archive device
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label={`Type ${archiveTarget?.deviceId ?? ''} to confirm`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={archiveTarget?.deviceId}
            autoFocus
          />
          <p className="text-[11px] leading-relaxed text-muted">
            Provisioned on {formatDateTime(archiveTarget?.createdAt)}, last seen{' '}
            {archiveTarget?.lastSeenAt ? relativeTime(archiveTarget.lastSeenAt) : 'never'}.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        title="Restore this device?"
        description={`${restoreTarget?.name ?? 'The device'} returns to the active fleet. It will appear offline until telemetry resumes.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={restoring}>
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
