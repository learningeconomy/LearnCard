import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch, clearAuth, getAuthRevision, getDid } from './auth';
import { estimateCosts, type CostPricing } from '../src/admin/cost-model';
import CostEstimate, { unavailablePricing } from './CostEstimate';
import type { ObservedCosts } from './ObservedUsage';
export type BatchStatus = {
    _id: string;
    jobId: string;
    kind: 'verification' | 'apply';
    limit: number;
    state: string;
    processed: number;
    sequence: number;
    reason?: string;
    recoverable?: boolean;
};
const buttonBase =
    'mt-3 rounded-xl px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40';
const primaryButton = `${buttonBase} bg-indigo-600 text-white enabled:hover:bg-indigo-700`;
const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-slate-900 enabled:hover:bg-slate-50`;
type Props = {
    fresh: boolean;
    stale?: boolean;
    csrf: string;
    paidEnabled: boolean;
    pricing?: CostPricing;
    jobs: {
        _id: string;
        scanned: number;
        state: string;
        dryRun?: boolean;
        plan?: { observedUsage?: ObservedCosts | null };
    }[];
    repairs: { _id: string; scanned: number; state: string }[];
    batches: BatchStatus[];
    refresh: () => Promise<void>;
};
export default function BatchControls(props: Props) {
    const [kind, setKind] = useState<'verification' | 'apply'>('verification');
    const [jobId, setJobId] = useState('');
    const [limit, setLimit] = useState(5);
    const [inputTokenAllowance, setInputTokenAllowance] = useState('20000');
    const [paid, setPaid] = useState(false);
    const [active, setActive] = useState<BatchStatus | null>(null);
    const [message, setMessage] = useState('');
    const [starting, setStarting] = useState(false);
    const pendingStart = useRef(false);
    const [previewing, setPreviewing] = useState(false);
    const previewPending = useRef(false);
    const previewController = useRef<AbortController | null>(null);
    const [controlPending, setControlPending] = useState<string | null>(null);
    const controlRef = useRef<string | null>(null);
    const startId = useRef<string | null>(null);
    const revision = useRef(0);
    const [preflight, setPreflight] = useState<any>(null);
    const identity = getDid();
    const current = useRef(props);
    current.current = props;
    const displayedBatches =
        active && !props.batches.some(batch => batch._id === active._id)
            ? [active, ...props.batches]
            : props.batches;
    const jobs = (
        kind === 'verification' ? props.repairs : props.jobs.filter(j => !j.dryRun)
    ).filter(j => ['paused', 'ready'].includes(j.state));
    const selected = jobs.find(j => j._id === jobId);
    const selectedUsage =
        kind === 'apply'
            ? props.jobs.find(job => job._id === jobId)?.plan?.observedUsage
            : undefined;
    const planningInputTokens = inputTokenAllowance === '' ? 20000 : Number(inputTokenAllowance);
    const validPlanningInput =
        Number.isSafeInteger(planningInputTokens) &&
        planningInputTokens >= 0 &&
        planningInputTokens <= 272000;
    const validPlanningLimit =
        Number.isInteger(limit) && limit >= 1 && limit <= (selected ? 100 - selected.scanned : 100);
    const post = async (path: string, body: object, signal?: AbortSignal) => {
        const authEpoch = getAuthRevision();
        const requestIdentity = getDid();
        const response = await authenticatedFetch(path, {
            method: 'POST',
            signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(180000)])
                : AbortSignal.timeout(20000),
            headers: {
                'Content-Type': 'application/json',
                'X-Passport-CSRF': current.current.csrf,
            },
            body: JSON.stringify(body),
        });
        if ([401, 403].includes(response.status)) {
            if (authEpoch === getAuthRevision() && requestIdentity === getDid() && !signal?.aborted)
                clearAuth();
            throw new Error('Profile access changed. Log in again.');
        }
        const value = await response.json();
        if (!response.ok) throw new Error(value.error ?? 'Batch unavailable');
        return value as BatchStatus;
    };
    useEffect(() => {
        const interrupt = () => {
            if (document.hidden) {
                revision.current += 1;
                setActive(null);
                setMessage('Page hidden; refresh progress and start explicitly to continue.');
            }
        };
        const leave = () => {
            revision.current += 1;
            setActive(null);
        };
        document.addEventListener('visibilitychange', interrupt);
        window.addEventListener('pagehide', leave);
        return () => {
            revision.current += 1;
            previewController.current?.abort();
            document.removeEventListener('visibilitychange', interrupt);
            window.removeEventListener('pagehide', leave);
        };
    }, []);
    useEffect(() => {
        revision.current += 1;
        setActive(null);
        setPaid(false);
        previewController.current?.abort();
        setPreflight(null);
        startId.current = null;
    }, [identity]);
    useEffect(() => {
        if (!props.fresh) {
            revision.current += 1;
            setActive(null);
        }
    }, [props.fresh]);
    useEffect(() => {
        if (!active || props.stale) return;
        const observed = props.batches.find(batch => batch._id === active._id);
        const job = (active.kind === 'apply' ? props.jobs : props.repairs).find(
            job => job._id === active.jobId
        );
        // A normal source job can be paused between units. Only its terminal state,
        // or a non-running batch at least as new as our last response, stops us.
        if (
            (observed && observed.sequence >= active.sequence && observed.state !== 'running') ||
            (job && ['cancelled', 'completed'].includes(job.state))
        ) {
            revision.current += 1;
            setActive(null);
            setMessage(
                'Batch stopped on the server. Refresh progress; any new work requires an explicit start.'
            );
        }
    }, [props.batches, props.jobs, props.repairs, props.stale, active?._id, active?.sequence]);
    useEffect(() => {
        if (!active || active.state !== 'running' || !props.fresh) return;
        const runRevision = revision.current;
        const controller = new AbortController();
        let stopped = false;
        const hide = () => {
            if (document.hidden) {
                stopped = true;
                controller.abort();
                setActive(null);
                setMessage(
                    'Batch interrupted by navigation. Refresh progress; start explicitly to continue.'
                );
            }
        };
        document.addEventListener('visibilitychange', hide);
        const timer = setTimeout(() => {
            if (document.hidden) {
                hide();
                return;
            }
            void post(
                `/admin/embeddings/batches/${active._id}/advance`,
                { sequence: active.sequence },
                controller.signal
            )
                .then(async value => {
                    if (stopped || runRevision !== revision.current) return;
                    setActive(value.state === 'running' ? value : null);
                    setMessage(
                        value.reason ??
                            (value.state === 'completed' ? 'Bounded batch finished.' : '')
                    );
                    await current.current.refresh();
                })
                .catch(() => {
                    if (stopped || runRevision !== revision.current) return;
                    setActive(null);
                    setMessage(
                        'Batch request interrupted. Refresh job progress before an explicit new start.'
                    );
                    void current.current.refresh();
                });
        }, 500);
        return () => {
            stopped = true;
            clearTimeout(timer);
            controller.abort();
            document.removeEventListener('visibilitychange', hide);
        };
    }, [active?._id, active?.sequence, props.fresh, identity]);
    const start = async () => {
        if (pendingStart.current || !selected || !props.fresh || props.stale) return;
        const startRevision = revision.current;
        pendingStart.current = true;
        setStarting(true);
        try {
            const value = await post('/admin/embeddings/batches', {
                requestId: (startId.current ??= crypto.randomUUID()),
                kind,
                jobId,
                limit,
                paidAuthorized: kind === 'apply' && paid,
            });
            if (startRevision !== revision.current || document.hidden) return;
            startId.current = null;
            setActive(value.state === 'running' ? value : null);
            setMessage('');
            await props.refresh();
        } catch {
            setMessage('Start interrupted or unavailable. Refresh before retrying the same start.');
        } finally {
            pendingStart.current = false;
            setStarting(false);
        }
    };
    const previewMetadata = async () => {
        if (previewPending.current || !props.fresh || props.stale) return;
        const requestRevision = revision.current;
        const authEpoch = getAuthRevision();
        const requestIdentity = getDid();
        const controller = new AbortController();
        previewController.current = controller;
        previewPending.current = true;
        setPreviewing(true);
        try {
            const response = await authenticatedFetch('/admin/embeddings/preflight', {
                signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
            });
            if (
                [401, 403].includes(response.status) &&
                authEpoch === getAuthRevision() &&
                requestIdentity === getDid() &&
                !controller.signal.aborted
            )
                clearAuth();
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (requestRevision === revision.current) setPreflight(data);
        } catch {
            if (requestRevision === revision.current) setMessage('Metadata preflight unavailable.');
        } finally {
            previewPending.current = false;
            setPreviewing(false);
        }
    };
    const stop = async (id: string, action: 'pause' | 'cancel' | 'recover') => {
        if (controlRef.current || !props.fresh || (action === 'recover' && props.stale)) return;
        const key = `${id}/${action}`;
        controlRef.current = key;
        setControlPending(key);
        revision.current += 1;
        setActive(null);
        try {
            await post(`/admin/embeddings/batches/${id}/${action}`, {});
            await props.refresh();
        } catch {
            setMessage(
                'Control response unavailable. Refresh status; no further client steps will run.'
            );
        } finally {
            controlRef.current = null;
            setControlPending(null);
        }
    };
    const change = () => {
        startId.current = null;
        setPaid(false);
    };
    return (
        <section aria-label="Bounded batches" className="rounded-3xl border bg-white p-6 mb-6">
            <h2 className="text-xl font-bold">Bounded batches</h2>
            <p>
                Each start runs only its chosen record limit while this page remains visible and
                login stays fresh. Closing, interrupting or reopening never automatically resumes.
                Pause/cancel stops future work; an already completed request may remain billed.
                Existing job budgets are never replenished.
            </p>
            <button
                className={primaryButton}
                disabled={!props.fresh || props.stale || previewing}
                aria-busy={previewing}
                aria-label="Preview aggregate metadata"
                onClick={() => void previewMetadata()}
            >
                {previewing ? 'Previewing metadata…' : 'Preview aggregate metadata'}
            </button>
            {preflight && (
                <p>
                    Observed {preflight.observed} records
                    {preflight.truncated ? ' (bounded inventory; more records remain)' : ''};{' '}
                    {preflight.missingVerification} non-generated missing verification;{' '}
                    {preflight.generated} generated; {preflight.missingOwnerOrUri} missing
                    owner/URI. Categories can overlap. Remote consent, original availability and
                    proof validity not checked. No model calls.
                </p>
            )}
            <label className="mt-3 block">
                Batch operation{' '}
                <select
                    className="block w-full max-w-full rounded-xl border px-3 py-2"
                    disabled={starting || Boolean(active)}
                    value={kind}
                    onChange={e => {
                        change();
                        setKind(e.target.value as typeof kind);
                        setJobId('');
                    }}
                >
                    <option value="verification">Model-free verification</option>
                    <option value="apply">Paid embedding apply</option>
                </select>
            </label>
            <label className="mt-3 block">
                Existing job{' '}
                <select
                    className="block w-full max-w-full rounded-xl border px-3 py-2"
                    disabled={starting || Boolean(active)}
                    value={jobId}
                    onChange={e => {
                        change();
                        setJobId(e.target.value);
                    }}
                >
                    <option value="">Choose a paused job</option>
                    {jobs.map(j => (
                        <option key={j._id} value={j._id}>
                            {j._id} · {j.scanned} processed
                        </option>
                    ))}
                </select>
            </label>
            <label className="mt-3 block">
                Record limit{' '}
                <input
                    className="block w-full max-w-full rounded-xl border px-3 py-2"
                    type="number"
                    min="1"
                    max={selected ? 100 - selected.scanned : 100}
                    disabled={starting || Boolean(active)}
                    value={limit}
                    onChange={e => {
                        change();
                        setLimit(Number(e.target.value));
                    }}
                />
            </label>
            {kind === 'verification' ? (
                <p>
                    Checks current consent and original signature/status/owner. No model or
                    privacy-provider calls. Metadata preflight is not proof of eligibility.
                </p>
            ) : (
                <>
                    <p>
                        At most {limit} representation calls and {limit * 5} embedding requests for
                        this record limit, subject to the job’s remaining fixed budgets. Additional
                        generation and privacy inspection charges apply; request counters are
                        reservations/attempts, not billing receipts. Sources are chosen by existing
                        inventory order, not by repair job.
                    </p>
                    <CostEstimate
                        title="Selected paid batch pricing"
                        estimate={
                            validPlanningLimit && validPlanningInput
                                ? estimateCosts(
                                      limit * 5,
                                      limit,
                                      props.pricing ?? unavailablePricing,
                                      planningInputTokens
                                  )
                                : null
                        }
                        pricing={props.pricing}
                        observedUsage={selectedUsage}
                        recordLimit={validPlanningLimit ? limit : undefined}
                    >
                        <p className="mt-2 text-slate-700">
                            Credential-case stress scenario for {limit} records: five embedding
                            requests and one representation call per record, before skips or
                            remaining job budgets.
                        </p>
                        <label className="mt-3 block text-sm">
                            Generation input tokens per record (optional scenario allowance)
                            <input
                                className="mt-1 block w-full max-w-full rounded-xl border px-3 py-2"
                                type="number"
                                min="0"
                                max="272000"
                                step="1"
                                placeholder="20000"
                                value={inputTokenAllowance}
                                aria-invalid={!validPlanningInput}
                                aria-describedby="input-token-planning-help"
                                onChange={event => setInputTokenAllowance(event.target.value)}
                            />
                        </label>
                        <p id="input-token-planning-help" className="mt-1 text-xs text-slate-600">
                            Defaults to 20,000, including instructions and schemas. Changes this
                            scenario only; it does not set a provider limit or change the job
                            budget.
                        </p>
                        {!validPlanningInput && (
                            <p className="mt-2 text-sm text-amber-900">
                                Enter a whole number from 0 to 272,000 to calculate the scenario, or
                                leave blank for the default. Longer-context pricing is not covered.
                            </p>
                        )}
                    </CostEstimate>
                    <label className="mt-3 block">
                        <input
                            type="checkbox"
                            disabled={starting || Boolean(active)}
                            checked={paid}
                            onChange={e => setPaid(e.target.checked)}
                        />
                        Authorize this paid batch
                    </label>
                </>
            )}
            <button
                className={primaryButton}
                aria-busy={starting}
                aria-label={`Start bounded ${kind === 'verification' ? 'verification' : 'paid apply'}`}
                disabled={
                    starting ||
                    Boolean(active) ||
                    !props.fresh ||
                    props.stale ||
                    !selected ||
                    !Number.isInteger(limit) ||
                    limit < 1 ||
                    limit > 100 - selected.scanned ||
                    (kind === 'apply' && (!paid || !props.paidEnabled))
                }
                onClick={() => void start()}
            >
                {starting
                    ? 'Starting batch…'
                    : `Start bounded ${kind === 'verification' ? 'verification' : 'paid apply'}`}
            </button>
            {message && <p role="status">{message}</p>}
            {displayedBatches.map(b => (
                <article key={b._id}>
                    <p>
                        {b.kind} batch · {b.state} · {b.processed}/{b.limit} processed{' '}
                        {b.reason ?? ''}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {b.recoverable && (
                            <button
                                className={secondaryButton}
                                disabled={!props.fresh || props.stale || Boolean(controlPending)}
                                aria-busy={controlPending === `${b._id}/recover`}
                                aria-label="Recover interrupted batch"
                                onClick={() => void stop(b._id, 'recover')}
                            >
                                {controlPending === `${b._id}/recover`
                                    ? 'Recovering…'
                                    : 'Recover interrupted batch'}
                            </button>
                        )}
                        {b.state === 'running' && (
                            <>
                                <button
                                    className={secondaryButton}
                                    disabled={!props.fresh || Boolean(controlPending)}
                                    aria-busy={controlPending === `${b._id}/pause`}
                                    aria-label="Pause batch"
                                    onClick={() => void stop(b._id, 'pause')}
                                >
                                    {controlPending === `${b._id}/pause`
                                        ? 'Pausing…'
                                        : 'Pause batch'}
                                </button>
                                <button
                                    className={secondaryButton}
                                    disabled={!props.fresh || Boolean(controlPending)}
                                    aria-busy={controlPending === `${b._id}/cancel`}
                                    aria-label="Cancel batch"
                                    onClick={() => void stop(b._id, 'cancel')}
                                >
                                    {controlPending === `${b._id}/cancel`
                                        ? 'Cancelling…'
                                        : 'Cancel batch'}
                                </button>
                            </>
                        )}
                    </div>
                </article>
            ))}
        </section>
    );
}
