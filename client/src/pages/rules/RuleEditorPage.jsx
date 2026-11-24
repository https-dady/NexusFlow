import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowLeft,
  BellRing,
  Check,
  ChevronRight,
  CircleAlert,
  Layers,
  Plus,
  Save,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select, Textarea, Toggle } from '../../components/ui/Form.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/DataDisplay.jsx';
import { ErrorState, InlineNotice, Skeleton } from '../../components/ui/Feedback.jsx';
import {
  useCreateRuleMutation,
  useGetRuleOptionsQuery,
  useGetRuleQuery,
  useUpdateRuleMutation,
} from '../../store/api/nexusApi.js';
import { pushToast } from '../../store/uiSlice.js';
import { errorMessage, roleLabels, titleCase } from '../../lib/utils.js';

const emptyCondition = () => ({ metric: '', operator: 'gt', value: '', value2: '' });
const emptyAction = () => ({ type: 'alert', roles: ['admin', 'operator'], message: '' });

const initialForm = {
  name: '',
  description: '',
  enabled: true,
  severity: 'warning',
  mode: 'all',
  deviceIds: [],
  deviceTypes: [],
  logic: 'AND',
  conditions: [emptyCondition()],
  actions: [emptyAction()],
  cooldownSec: 300,
};

export default function RuleEditorPage() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = Boolean(ruleId);

  const ruleQuery = useGetRuleQuery(ruleId, { skip: !isEdit });
  const optionsQuery = useGetRuleOptionsQuery();
  const [createRule, { isLoading: creating }] = useCreateRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateRuleMutation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const saving = creating || updating;

  const options = optionsQuery.data ?? {};
  const metrics = options.metrics ?? [];
  const operators = options.operators ?? [];
  const devices = options.devices ?? [];
  const deviceTypes = options.deviceTypes ?? [];
  const roles = options.roles ?? ['super_admin', 'admin', 'operator', 'viewer'];

  useEffect(() => {
    if (!isEdit || loaded) return;
    const rule = ruleQuery.data?.rule;
    if (!rule) return;
    setForm({
      name: rule.name ?? '',
      description: rule.description ?? '',
      enabled: rule.enabled ?? true,
      severity: rule.severity ?? 'warning',
      mode: rule.deviceSelector?.mode ?? 'all',
      deviceIds: rule.deviceSelector?.deviceIds ?? [],
      deviceTypes: rule.deviceSelector?.deviceTypes ?? [],
      logic: rule.conditions?.logic ?? 'AND',
      conditions: (rule.conditions?.items ?? [emptyCondition()]).map((item) => ({
        metric: item.metric,
        operator: item.operator,
        value: item.value,
        value2: item.value2 ?? '',
      })),
      actions: (rule.actions ?? [emptyAction()]).map((action) => ({
        type: action.type,
        roles: action.roles?.length ? action.roles : ['admin', 'operator'],
        message: action.message ?? '',
      })),
      cooldownSec: rule.cooldownSec ?? 300,
    });
    setLoaded(true);
  }, [isEdit, loaded, ruleQuery.data]);

  const update = (patch) => setForm((previous) => ({ ...previous, ...patch }));

  const patchCondition = (index, patch) =>
    setForm((previous) => ({
      ...previous,
      conditions: previous.conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, ...patch } : condition
      ),
    }));

  const patchAction = (index, patch) =>
    setForm((previous) => ({
      ...previous,
      actions: previous.actions.map((action, actionIndex) =>
        actionIndex === index ? { ...action, ...patch } : action
      ),
    }));

  const toggleRole = (index, role) =>
    setForm((previous) => ({
      ...previous,
      actions: previous.actions.map((action, actionIndex) => {
        if (actionIndex !== index) return action;
        const nextRoles = action.roles.includes(role)
          ? action.roles.filter((entry) => entry !== role)
          : [...action.roles, role];
        return { ...action, roles: nextRoles };
      }),
    }));

  const toggleDevice = (id) =>
    setForm((previous) => ({
      ...previous,
      deviceIds: previous.deviceIds.includes(id)
        ? previous.deviceIds.filter((entry) => entry !== id)
        : [...previous.deviceIds, id],
    }));

  const toggleType = (type) =>
    setForm((previous) => ({
      ...previous,
      deviceTypes: previous.deviceTypes.includes(type)
        ? previous.deviceTypes.filter((entry) => entry !== type)
        : [...previous.deviceTypes, type],
    }));

  const scopeLabel = useMemo(() => {
    if (form.mode === 'all') return 'All active devices';
    if (form.mode === 'type') {
      return form.deviceTypes.length
        ? `${form.deviceTypes.map((type) => titleCase(type)).join(', ')} devices`
        : 'No types selected';
    }
    return form.deviceIds.length
      ? `${form.deviceIds.length} selected device${form.deviceIds.length === 1 ? '' : 's'}`
      : 'No devices selected';
  }, [form.mode, form.deviceIds, form.deviceTypes]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Give the rule a name of at least two characters.');
      return;
    }
    if (form.mode === 'device' && form.deviceIds.length === 0) {
      setError('Select at least one device, or switch the scope to all devices.');
      return;
    }
    if (form.mode === 'type' && form.deviceTypes.length === 0) {
      setError('Select at least one device type, or switch the scope to all devices.');
      return;
    }
    if (form.conditions.length === 0) {
      setError('Add at least one condition.');
      return;
    }
    for (const [index, condition] of form.conditions.entries()) {
      if (!condition.metric) {
        setError(`Condition ${index + 1} needs a metric.`);
        return;
      }
      if (!Number.isFinite(Number(condition.value))) {
        setError(`Condition ${index + 1} needs a numeric threshold.`);
        return;
      }
      if (
        ['between', 'outside'].includes(condition.operator) &&
        !Number.isFinite(Number(condition.value2))
      ) {
        setError(`Condition ${index + 1} needs an upper bound.`);
        return;
      }
    }
    if (form.actions.length === 0) {
      setError('Add at least one action.');
      return;
    }
    for (const [index, action] of form.actions.entries()) {
      if (action.roles.length === 0) {
        setError(`Action ${index + 1} needs at least one recipient role.`);
        return;
      }
    }
    if (form.logic === 'AND' && form.conditions.length > 1) {
      // valid, just a deliberate no-op to keep parity with the server's OR/AND handling
    }

    const payload = {
      name: form.name.trim(),
      description: form.description,
      enabled: form.enabled,
      severity: form.severity,
      deviceSelector: {
        mode: form.mode,
        deviceIds: form.mode === 'device' ? form.deviceIds : [],
        deviceTypes: form.mode === 'type' ? form.deviceTypes : [],
      },
      conditions: {
        logic: form.logic,
        items: form.conditions.map((condition) => ({
          metric: condition.metric,
          operator: condition.operator,
          value: Number(condition.value),
          ...(condition.operator === 'between' || condition.operator === 'outside'
            ? { value2: Number(condition.value2) }
            : {}),
        })),
      },
      actions: form.actions.map((action) => ({
        type: action.type,
        roles: action.roles,
        message: action.message,
      })),
      cooldownSec: Number(form.cooldownSec) || 0,
    };

    try {
      if (isEdit) {
        await updateRule({ id: ruleId, ...payload }).unwrap();
        dispatch(pushToast({ title: 'Rule updated', message: payload.name }));
      } else {
        await createRule(payload).unwrap();
        dispatch(pushToast({ title: 'Rule created', message: payload.name }));
      }
      navigate('/rules');
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to save this rule.'));
    }
  };

  if (isEdit && ruleQuery.isError) {
    return (
      <Card>
        <ErrorState
          error={ruleQuery.error}
          onRetry={ruleQuery.refetch}
          title="Rule could not be loaded"
        />
      </Card>
    );
  }

  if (isEdit && ruleQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
        <Link
          to="/rules"
          className="inline-flex items-center gap-1 font-semibold transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Rule engine
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{isEdit ? 'Edit rule' : 'New rule'}</span>
      </div>

      <PageHeader
        eyebrow={isEdit ? 'Automation' : 'New automation'}
        title={isEdit ? 'Tune this rule' : 'Build a rule'}
        description="Rules evaluate the latest telemetry point per device. Use cooldowns to prevent alert storms and choose who gets notified."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/rules')} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} icon={Save} loading={saving}>
              {isEdit ? 'Save rule' : 'Create rule'}
            </Button>
          </>
        }
      />

      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {error && (
            <InlineNotice tone="danger" icon={CircleAlert} title="Check the rule">
              {error}
            </InlineNotice>
          )}

          <Card>
            <CardHeader
              eyebrow="Identity"
              title="Rule details"
              description="A clear name and description keep the team aligned."
            />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Input
                label="Rule name"
                required
                value={form.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Overheating warehouse probe"
              />
              <Select
                label="Severity"
                value={form.severity}
                onChange={(event) => update({ severity: event.target.value })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
              <Textarea
                label="Description"
                rows={2}
                containerClassName="sm:col-span-2"
                value={form.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="What this rule protects against and why it matters."
              />
              <Input
                label="Cooldown (seconds)"
                type="number"
                min={0}
                max={86400}
                value={form.cooldownSec}
                onChange={(event) => update({ cooldownSec: event.target.value })}
                hint="Extra occurrences inside the window increment the existing alert instead of creating a new one."
              />
              <Toggle
                checked={form.enabled}
                onChange={(enabled) => update({ enabled })}
                label="Enabled"
                description="Disabled rules stay configured but skip evaluation."
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Scope"
              title="Where should this rule look?"
              description="Target every device, a device type, or hand-picked devices."
            />
            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All devices', icon: Layers },
                  { value: 'type', label: 'By type', icon: SlidersHorizontal },
                  { value: 'device', label: 'Specific devices', icon: Target },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update({ mode: option.value })}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition ${
                      form.mode === option.value
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>

              {form.mode === 'type' && (
                <div className="mt-4">
                  <p className="label">Device types</p>
                  <div className="flex flex-wrap gap-2">
                    {deviceTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          form.deviceTypes.includes(type)
                            ? 'border-flame bg-flame/10 text-flame-deep'
                            : 'border-line bg-white text-muted hover:border-ink/30'
                        }`}
                      >
                        {form.deviceTypes.includes(type) && <Check className="h-3 w-3" />}
                        {titleCase(type)}
                      </button>
                    ))}
                    {deviceTypes.length === 0 && (
                      <p className="text-[11.5px] text-muted">No device types available yet.</p>
                    )}
                  </div>
                </div>
              )}

              {form.mode === 'device' && (
                <div className="mt-4">
                  <p className="label">Devices</p>
                  <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-xl border border-line/70 bg-cloud/40 p-2 sm:grid-cols-2">
                    {devices.map((device) => (
                      <label
                        key={device.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[11.5px] transition ${
                          form.deviceIds.includes(device.id)
                            ? 'border-flame/40 bg-flame/[0.07] text-ink'
                            : 'border-transparent text-ink/70 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.deviceIds.includes(device.id)}
                          onChange={() => toggleDevice(device.id)}
                          className="h-3.5 w-3.5 accent-[#FD8549]"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{device.name}</span>
                        <span className="font-mono text-[9px] text-muted">{device.deviceId}</span>
                      </label>
                    ))}
                    {devices.length === 0 && (
                      <p className="col-span-full px-2 py-3 text-[11.5px] text-muted">
                        No devices available.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Logic"
              title="Conditions"
              description="All conditions must match for AND rules; any one for OR rules."
              action={
                <div className="flex items-center gap-2">
                  <Select
                    value={form.logic}
                    onChange={(event) => update({ logic: event.target.value })}
                    containerClassName="w-24"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() => update({ conditions: [...form.conditions, emptyCondition()] })}
                    disabled={form.conditions.length >= 10}
                  >
                    Add
                  </Button>
                </div>
              }
            />
            <div className="space-y-2.5 px-5 pb-5">
              {form.conditions.map((condition, index) => (
                <div key={index} className="rounded-xl border border-line/70 bg-cream/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
                      <Zap className="h-3 w-3" /> Condition {index + 1}
                    </span>
                    {form.conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            conditions: form.conditions.filter(
                              (_, conditionIndex) => conditionIndex !== index
                            ),
                          })
                        }
                        className="cursor-pointer rounded-md p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Remove condition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-12">
                    <Select
                      label="Metric"
                      containerClassName="sm:col-span-5"
                      value={condition.metric}
                      onChange={(event) => patchCondition(index, { metric: event.target.value })}
                    >
                      <option value="">Select metric…</option>
                      {metrics.map((metric) => (
                        <option key={metric.key} value={metric.key}>
                          {metric.label} {metric.unit ? `(${metric.unit})` : ''}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Operator"
                      containerClassName="sm:col-span-3"
                      value={condition.operator}
                      onChange={(event) => patchCondition(index, { operator: event.target.value })}
                    >
                      {operators.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Threshold"
                      type="number"
                      step="any"
                      containerClassName="sm:col-span-2"
                      value={condition.value}
                      onChange={(event) => patchCondition(index, { value: event.target.value })}
                    />
                    {['between', 'outside'].includes(condition.operator) && (
                      <Input
                        label="Upper bound"
                        type="number"
                        step="any"
                        containerClassName="sm:col-span-2"
                        value={condition.value2}
                        onChange={(event) => patchCondition(index, { value2: event.target.value })}
                      />
                    )}
                  </div>
                  {condition.metric && (
                    <p className="mt-1.5 text-[10px] text-muted">
                      Fires when{' '}
                      <span className="font-mono font-semibold text-ink/70">
                        {condition.metric}
                      </span>{' '}
                      {operators
                        .find((operator) => operator.value === condition.operator)
                        ?.label?.toLowerCase()}{' '}
                      <span className="font-semibold text-ink/70">{condition.value || '—'}</span>
                      {['between', 'outside'].includes(condition.operator) && (
                        <> and {condition.value2 || '—'}</>
                      )}
                      .
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Response"
              title="Actions"
              description="Raise an alert, send an in-app notification, or both."
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={Plus}
                  onClick={() => update({ actions: [...form.actions, emptyAction()] })}
                  disabled={form.actions.length >= 5}
                >
                  Add action
                </Button>
              }
            />
            <div className="space-y-2.5 px-5 pb-5">
              {form.actions.map((action, index) => (
                <div key={index} className="rounded-xl border border-line/70 bg-cream/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
                      {action.type === 'alert' ? (
                        <BellRing className="h-3 w-3" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}{' '}
                      Action {index + 1}
                    </span>
                    {form.actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            actions: form.actions.filter((_, actionIndex) => actionIndex !== index),
                          })
                        }
                        className="cursor-pointer rounded-md p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Remove action"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      label="Action type"
                      value={action.type}
                      onChange={(event) => patchAction(index, { type: event.target.value })}
                    >
                      <option value="alert">Raise alert</option>
                      <option value="notify">Send notification</option>
                    </Select>
                    <Input
                      label="Custom message"
                      value={action.message}
                      onChange={(event) => patchAction(index, { message: event.target.value })}
                      placeholder="Optional · use {device}, {value} and {metric}"
                    />
                  </div>
                  <div className="mt-2.5">
                    <p className="label">Notify roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(index, role)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold transition ${
                            action.roles.includes(role)
                              ? 'border-ink bg-ink text-white'
                              : 'border-line bg-white text-muted hover:border-ink/30'
                          }`}
                        >
                          {roleLabels[role] ?? titleCase(role)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader
              eyebrow="Preview"
              title="Rule summary"
              description="How this rule will read in the workspace."
            />
            <div className="px-5 pb-5">
              <div className="rounded-2xl bg-ink p-4 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-bold">
                    {form.name || 'Untitled rule'}
                  </span>
                  <Badge
                    tone={
                      form.severity === 'critical'
                        ? 'danger'
                        : form.severity === 'warning'
                          ? 'gold'
                          : 'info'
                    }
                  >
                    {titleCase(form.severity)}
                  </Badge>
                </div>
                <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-white/55">
                  {form.conditions
                    .map(
                      (condition) =>
                        `${condition.metric || 'metric'} ${condition.operator} ${condition.value || '—'}`
                    )
                    .join(` ${form.logic} `)}
                </p>
                <div className="mt-3 space-y-1.5 text-[10.5px] text-white/50">
                  <p className="flex items-center gap-1.5">
                    <Target className="h-3 w-3" /> {scopeLabel}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> {form.cooldownSec}s cooldown
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3" /> {form.actions.length} action
                    {form.actions.length === 1 ? '' : 's'} ·{' '}
                    {form.actions.every((action) => action.type === 'alert')
                      ? 'alerts only'
                      : 'alerts + notifications'}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                  Recipients
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(form.actions.flatMap((action) => action.roles))].map((role) => (
                    <Badge key={role} tone="neutral">
                      {roleLabels[role] ?? titleCase(role)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-[10.5px] leading-relaxed text-[#7d6100]">
                <p className="font-bold">Safe by construction</p>
                <p className="mt-0.5">
                  Conditions are evaluated in-process against numeric metrics. No arbitrary scripts,
                  HTTP calls or actuator commands are possible.
                </p>
              </div>

              <Button type="submit" className="mt-4 w-full" icon={Save} loading={saving}>
                {isEdit ? 'Save changes' : 'Create rule'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => navigate('/rules')}
                disabled={saving}
              >
                Discard
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
