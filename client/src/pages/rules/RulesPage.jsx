import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Copy,
  FlaskConical,
  Pencil,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, SeverityBadge } from '../../components/ui/Badge.jsx';
import { SearchInput, Select } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, InlineNotice, Skeleton } from '../../components/ui/Feedback.jsx';
import { PageHeader, Pagination } from '../../components/ui/DataDisplay.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import {
  useArchiveRuleMutation,
  useDuplicateRuleMutation,
  useGetRulesQuery,
  useTestRuleMutation,
  useToggleRuleMutation,
} from '../../store/api/nexusApi.js';
import { pushToast } from '../../store/uiSlice.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { errorMessage, formatDateTime, relativeTime, severityTone } from '../../lib/utils.js';

const operatorLabels = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  neq: '≠',
  between: 'between',
  outside: 'outside',
};

export function conditionSummary(rule) {
  const items = rule?.conditions?.items ?? [];
  const logic = rule?.conditions?.logic ?? 'AND';
  return items
    .map(
      (item) =>
        `${item.metric} ${operatorLabels[item.operator] ?? item.operator} ${item.value}${
          item.operator === 'between' || item.operator === 'outside' ? `–${item.value2}` : ''
        }`
    )
    .join(` ${logic} `);
}

export default function RulesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const [enabledFilter, setEnabledFilter] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [testTarget, setTestTarget] = useState(null);
  const [testResults, setTestResults] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useGetRulesQuery(
    {
      page,
      limit: 12,
      search: debounced || undefined,
      enabled: enabledFilter || undefined,
      severity: severity || undefined,
    },
    { pollingInterval: 30_000 }
  );
  const [toggleRule] = useToggleRuleMutation();
  const [duplicateRule] = useDuplicateRuleMutation();
  const [archiveRule, { isLoading: archiving }] = useArchiveRuleMutation();
  const [testRule, { isLoading: testing }] = useTestRuleMutation();

  useEffect(() => setPage(1), [debounced, enabledFilter, severity]);

  const rules = data?.data ?? [];
  const enabledCount = rules.filter((rule) => rule.enabled).length;
  const totalTriggers = rules.reduce((sum, rule) => sum + (rule.triggerCount ?? 0), 0);

  const onToggle = async (rule) => {
    try {
      await toggleRule({ id: rule.id, enabled: !rule.enabled }).unwrap();
      dispatch(
        pushToast({ title: rule.enabled ? 'Rule paused' : 'Rule enabled', message: rule.name })
      );
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Update failed', message: errorMessage(requestError), tone: 'danger' })
      );
    }
  };

  const onDuplicate = async (rule) => {
    try {
      await duplicateRule(rule.id).unwrap();
      dispatch(
        pushToast({
          title: 'Rule duplicated',
          message: 'The copy starts disabled for a safe review.',
        })
      );
    } catch (requestError) {
      dispatch(
        pushToast({
          title: 'Duplicate failed',
          message: errorMessage(requestError),
          tone: 'danger',
        })
      );
    }
  };

  const onArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveRule(archiveTarget.id).unwrap();
      dispatch(pushToast({ title: 'Rule archived', message: archiveTarget.name }));
      setArchiveTarget(null);
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Archive failed', message: errorMessage(requestError), tone: 'danger' })
      );
    }
  };

  const onTest = async (rule) => {
    setTestTarget(rule);
    setTestResults(null);
    try {
      const result = await testRule(rule.id).unwrap();
      setTestResults(result.results ?? []);
    } catch (requestError) {
      dispatch(
        pushToast({ title: 'Test failed', message: errorMessage(requestError), tone: 'danger' })
      );
      setTestTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Automation"
        title="Rule engine"
        description="Structured conditions, safe evaluation. Thresholds run against every ingested telemetry point with debounce and deduplication."
        actions={
          can(PERMISSIONS.RULES_WRITE) ? (
            <Button icon={Plus} onClick={() => navigate('/rules/new')}>
              New rule
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line/70 bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">Rules</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{data?.meta?.total ?? 0}</p>
          <p className="mt-1 text-[11px] text-muted">{enabledCount} enabled on this page</p>
        </div>
        <div className="rounded-2xl border border-line/70 bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
            Lifetime triggers
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{totalTriggers}</p>
          <p className="mt-1 text-[11px] text-muted">Across visible rules</p>
        </div>
        <div className="rounded-2xl border border-ink bg-ink p-4 text-white shadow-card">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
            <ShieldAlert className="h-3 w-3 text-gold" /> Safety model
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
            No code, no scripts. Only validated metrics, operators and role-targeted notifications.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line/70 px-4 py-3.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rules…"
            className="min-w-[200px] flex-1"
          />
          <Select
            value={enabledFilter}
            onChange={(event) => setEnabledFilter(event.target.value)}
            containerClassName="w-36"
          >
            <option value="">Any state</option>
            <option value="true">Enabled</option>
            <option value="false">Paused</option>
          </Select>
          <Select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            containerClassName="w-36"
          >
            <option value="">Any severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>
          {isFetching && !isLoading && (
            <span className="ml-auto text-[10.5px] font-medium text-muted">Refreshing…</span>
          )}
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} title="Rules could not be loaded" />
        ) : isLoading ? (
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title={
              search || enabledFilter || severity ? 'No rules match these filters' : 'No rules yet'
            }
            description={
              search || enabledFilter || severity
                ? 'Adjust the filters, or create a rule that watches your fleet.'
                : 'Start with a threshold rule, for example temperature above 40°C for five minutes.'
            }
            action={
              can(PERMISSIONS.RULES_WRITE) ? (
                <Button size="sm" icon={Plus} onClick={() => navigate('/rules/new')}>
                  Create a rule
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="group relative flex flex-col rounded-2xl border border-line/70 bg-white p-4 transition hover:border-ink/20 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/rules/${rule.id}/edit`}
                          className="truncate text-[13.5px] font-bold text-ink transition hover:text-flame-deep"
                        >
                          {rule.name}
                        </Link>
                        <SeverityBadge severity={rule.severity} />
                        {!rule.enabled && <Badge tone="neutral">Paused</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed text-muted">
                        {rule.description || 'No description provided.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggle(rule)}
                      disabled={!can(PERMISSIONS.RULES_WRITE)}
                      className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={rule.enabled ? 'Pause rule' : 'Enable rule'}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="h-7 w-7 text-success" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-muted" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-1 font-semibold">
                      <Target className="h-3 w-3" /> {rule.selectorLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-1 font-semibold">
                      <SlidersHorizontal className="h-3 w-3" /> {rule.conditionCount} condition
                      {rule.conditionCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-1 font-semibold">
                      <Zap className="h-3 w-3" /> {rule.cooldownSec}s cooldown
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-line/60 bg-cream/50 px-3 py-2">
                    <p className="text-[9px] font-bold tracking-[0.14em] text-muted uppercase">
                      When
                    </p>
                    <p className="mt-0.5 font-mono text-[10.5px] leading-relaxed break-words text-ink/75">
                      {conditionSummary(rule)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-muted">
                      <span className="font-semibold text-ink">{rule.triggerCount ?? 0}</span>{' '}
                      triggers
                      {rule.lastTriggeredAt
                        ? ` · last ${relativeTime(rule.lastTriggeredAt)}`
                        : ' · never fired'}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onTest(rule)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
                        title="Test against latest telemetry"
                        aria-label={`Test ${rule.name}`}
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                      </button>
                      {can(PERMISSIONS.RULES_WRITE) && (
                        <>
                          <Link
                            to={`/rules/${rule.id}/edit`}
                            className="rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
                            title="Edit rule"
                            aria-label={`Edit ${rule.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDuplicate(rule)}
                            className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
                            title="Duplicate rule"
                            aria-label={`Duplicate ${rule.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {can(PERMISSIONS.RULES_ARCHIVE) && (
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(rule)}
                          className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                          title="Archive rule"
                          aria-label={`Archive ${rule.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-[9.5px] text-muted/80">
                    Updated {formatDateTime(rule.updatedAt)} · {rule.deviceCount} device
                    {rule.deviceCount === 1 ? '' : 's'} in scope
                  </p>
                </div>
              ))}
            </div>
            <Pagination
              meta={data?.meta}
              onPageChange={setPage}
              className="border-t border-line/70"
            />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        title={`Archive "${archiveTarget?.name}"?`}
        description="Archived rules stop evaluating immediately. Existing alerts are untouched and execution history is preserved."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setArchiveTarget(null)} disabled={archiving}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} loading={archiving} onClick={onArchive}>
              Archive rule
            </Button>
          </>
        }
      />

      <Modal
        open={Boolean(testTarget)}
        onClose={() => {
          setTestTarget(null);
          setTestResults(null);
        }}
        title={`Test "${testTarget?.name}"`}
        description="Dry-run evaluation against the latest telemetry for every device in scope. No alerts are raised."
        size="lg"
        footer={
          <Button
            variant="outline"
            onClick={() => {
              setTestTarget(null);
              setTestResults(null);
            }}
          >
            Close
          </Button>
        }
      >
        {testing || testResults === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : testResults.length === 0 ? (
          <InlineNotice tone="warning" title="No devices in scope">
            This rule targets no active devices. Update the selector to include devices or a type.
          </InlineNotice>
        ) : (
          <div className="space-y-2">
            <InlineNotice
              tone="info"
              title={`${testResults.length} device${testResults.length === 1 ? '' : 's'} evaluated`}
            >
              A matched result means the rule would fire right now given the latest telemetry.
            </InlineNotice>
            {testResults.map((result) => (
              <div
                key={result.device?.deviceId ?? result.deviceKey}
                className="flex items-start justify-between gap-3 rounded-xl border border-line/70 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink">
                    {result.device?.name ?? result.deviceName ?? result.deviceKey}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {result.device?.deviceId ?? ''}{' '}
                    {result.ts ? `· latest ${formatDateTime(result.ts)}` : '· no telemetry'}
                  </p>
                  {(result.results ?? []).length > 0 && (
                    <p className="mt-1 text-[10.5px] text-muted">
                      {(result.results ?? [])
                        .map(
                          (condition) =>
                            `${condition.metric} ${condition.passed ? 'passes' : 'fails'} (${condition.actual ?? '—'})`
                        )
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <Badge tone={result.matched ? severityTone(testTarget?.severity) : 'neutral'} dot>
                  {result.matched ? 'Would fire' : 'Clear'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
