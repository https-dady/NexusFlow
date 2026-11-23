import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Form.jsx';
import { Badge } from '../ui/Badge.jsx';
import {
  useCreateDeviceMutation,
  useGetDeviceTemplatesQuery,
  useUpdateDeviceMutation,
} from '../../store/api/nexusApi.js';
import { errorMessage, titleCase } from '../../lib/utils.js';

const emptySensor = () => ({
  key: '',
  label: '',
  type: 'custom',
  unit: '',
  min: 0,
  max: 100,
  precision: 1,
  warnLow: null,
  warnHigh: null,
  criticalLow: null,
  criticalHigh: null,
});

const initialForm = {
  name: '',
  type: 'temperature_humidity',
  source: 'simulated',
  description: '',
  zone: 'Unassigned',
  label: '',
  firmware: 'sim-1.0.0',
  tags: '',
  sensors: [],
};

export function DeviceFormModal({ open, onClose, device = null, onSaved }) {
  const { data: templates } = useGetDeviceTemplatesQuery(undefined, { skip: !open });
  const [createDevice, { isLoading: creating }] = useCreateDeviceMutation();
  const [updateDevice, { isLoading: updating }] = useUpdateDeviceMutation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const isEdit = Boolean(device);
  const saving = creating || updating;

  const types = useMemo(() => templates?.types ?? [], [templates]);
  const selectedType = useMemo(
    () => types.find((entry) => entry.value === form.type),
    [types, form.type]
  );

  useEffect(() => {
    if (!open) return;
    setError('');
    if (device) {
      setForm({
        name: device.name ?? '',
        type: device.type ?? 'temperature_humidity',
        source: device.source ?? 'simulated',
        description: device.description ?? '',
        zone: device.location?.zone ?? 'Unassigned',
        label: device.location?.label ?? '',
        firmware: device.firmware ?? '',
        tags: (device.tags ?? []).join(', '),
        sensors: (device.sensors ?? []).map((sensor) => ({
          key: sensor.key,
          label: sensor.label,
          type: sensor.type,
          unit: sensor.unit ?? '',
          min: sensor.min ?? 0,
          max: sensor.max ?? 100,
          precision: sensor.precision ?? 1,
          warnLow: sensor.warnLow ?? null,
          warnHigh: sensor.warnHigh ?? null,
          criticalLow: sensor.criticalLow ?? null,
          criticalHigh: sensor.criticalHigh ?? null,
          model: sensor.model,
        })),
      });
    } else {
      setForm({ ...initialForm, sensors: [] });
    }
  }, [open, device]);

  useEffect(() => {
    if (isEdit || !open) return;
    if (form.sensors.length) return;
    if (!selectedType?.sensors?.length) return;
    setForm((previous) => ({
      ...previous,
      sensors: selectedType.sensors.map((sensor) => ({ ...sensor })),
      firmware: previous.source === 'mqtt' ? 'hardware-1.0.0' : 'sim-1.0.0',
    }));
  }, [selectedType, isEdit, open, form.sensors.length]);

  const changeType = (type) => {
    const template = types.find((entry) => entry.value === type);
    setForm((previous) => ({
      ...previous,
      type,
      sensors: template?.sensors
        ? template.sensors.map((sensor) => ({ ...sensor }))
        : previous.sensors,
    }));
  };

  const patchSensor = (index, patch) => {
    setForm((previous) => ({
      ...previous,
      sensors: previous.sensors.map((sensor, sensorIndex) =>
        sensorIndex === index ? { ...sensor, ...patch } : sensor
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.sensors.length === 0) {
      setError('A device needs at least one sensor.');
      return;
    }
    const invalid = form.sensors.find(
      (sensor) => !/^[a-z][a-zA-Z0-9_]{0,39}$/.test(sensor.key) || !sensor.label
    );
    if (invalid) {
      setError('Every sensor needs a valid key (lowercase start) and a label.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      source: form.source,
      description: form.description,
      location: { zone: form.zone, label: form.label },
      firmware: form.firmware,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      sensors: form.sensors.map((sensor) => ({
        ...sensor,
        min: Number(sensor.min),
        max: Number(sensor.max),
        precision: Number(sensor.precision ?? 1),
        warnLow: sensor.warnLow === '' || sensor.warnLow === null ? null : Number(sensor.warnLow),
        warnHigh:
          sensor.warnHigh === '' || sensor.warnHigh === null ? null : Number(sensor.warnHigh),
        criticalLow:
          sensor.criticalLow === '' || sensor.criticalLow === null
            ? null
            : Number(sensor.criticalLow),
        criticalHigh:
          sensor.criticalHigh === '' || sensor.criticalHigh === null
            ? null
            : Number(sensor.criticalHigh),
      })),
    };
    try {
      if (isEdit) {
        await updateDevice({ deviceId: device.deviceId, ...payload }).unwrap();
      } else {
        await createDevice(payload).unwrap();
      }
      onSaved?.();
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to save this device.'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${device?.name}` : 'Provision a device'}
      description={
        isEdit
          ? 'Update configuration, sensors and thresholds. Sensor keys are used by rules and telemetry.'
          : 'Choose a template to start with realistic sensors, then tune the details.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Provision device'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Device name"
            required
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Warehouse climate probe"
          />
          <Select
            label="Template"
            value={form.type}
            onChange={(event) => changeType(event.target.value)}
            disabled={isEdit}
            hint={isEdit ? 'Device type cannot change after provisioning.' : undefined}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select
            label="Telemetry source"
            value={form.source}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                source: event.target.value,
                firmware: event.target.value === 'mqtt' ? 'hardware-1.0.0' : 'sim-1.0.0',
              }))
            }
            disabled={isEdit}
          >
            <option value="simulated">Built-in simulator</option>
            <option value="mqtt">MQTT hardware</option>
          </Select>
          <Input
            label="Firmware"
            value={form.firmware}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, firmware: event.target.value }))
            }
            placeholder="sim-1.0.0"
          />
          <Input
            label="Zone"
            value={form.zone}
            onChange={(event) => setForm((previous) => ({ ...previous, zone: event.target.value }))}
            placeholder="Assembly line A"
          />
          <Input
            label="Location label"
            value={form.label}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, label: event.target.value }))
            }
            placeholder="North wall, rack 4"
          />
        </div>

        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, description: event.target.value }))
          }
          placeholder="What this device measures and where it sits."
        />

        <Input
          label="Tags"
          value={form.tags}
          onChange={(event) => setForm((previous) => ({ ...previous, tags: event.target.value }))}
          placeholder="cold-chain, warehouse, critical"
          hint="Comma-separated. Tags are searchable and included in reports."
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                Sensors
              </p>
              <p className="text-[11px] text-muted">
                Keys are referenced by the rule engine and exports.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() =>
                setForm((previous) => ({
                  ...previous,
                  sensors: [...previous.sensors, emptySensor()],
                }))
              }
            >
              Add sensor
            </Button>
          </div>

          <div className="space-y-2.5">
            {form.sensors.map((sensor, index) => (
              <div key={index} className="rounded-xl border border-line/70 bg-cream/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone="flame">{titleCase(sensor.type)}</Badge>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        sensors: previous.sensors.filter((_, sensorIndex) => sensorIndex !== index),
                      }))
                    }
                    className="cursor-pointer rounded-md p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                    aria-label="Remove sensor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-4">
                  <Input
                    label="Key"
                    value={sensor.key}
                    onChange={(event) => patchSensor(index, { key: event.target.value })}
                    placeholder="temperature"
                  />
                  <Input
                    label="Label"
                    value={sensor.label}
                    onChange={(event) => patchSensor(index, { label: event.target.value })}
                    placeholder="Temperature"
                  />
                  <Select
                    label="Type"
                    value={sensor.type}
                    onChange={(event) => patchSensor(index, { type: event.target.value })}
                  >
                    {[
                      'temperature',
                      'humidity',
                      'pressure',
                      'voltage',
                      'current',
                      'battery',
                      'rssi',
                      'uptime',
                      'pm25',
                      'co2',
                      'custom',
                    ].map((option) => (
                      <option key={option} value={option}>
                        {titleCase(option)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Unit"
                    value={sensor.unit}
                    onChange={(event) => patchSensor(index, { unit: event.target.value })}
                    placeholder="°C"
                  />
                  <Input
                    label="Min"
                    type="number"
                    value={sensor.min}
                    onChange={(event) => patchSensor(index, { min: event.target.value })}
                  />
                  <Input
                    label="Max"
                    type="number"
                    value={sensor.max}
                    onChange={(event) => patchSensor(index, { max: event.target.value })}
                  />
                  <Input
                    label="Warn low"
                    type="number"
                    value={sensor.warnLow ?? ''}
                    onChange={(event) => patchSensor(index, { warnLow: event.target.value })}
                  />
                  <Input
                    label="Warn high"
                    type="number"
                    value={sensor.warnHigh ?? ''}
                    onChange={(event) => patchSensor(index, { warnHigh: event.target.value })}
                  />
                </div>
              </div>
            ))}
            {form.sensors.length === 0 && (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-muted">
                Pick a template or add a sensor manually.
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
