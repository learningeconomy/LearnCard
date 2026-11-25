import WholeBackfill, { type WholeBackfillRun } from './WholeBackfill';
import BatchControls, { type BatchStatus } from './BatchControls';
import { REPAIR_LABELS, type RepairOutcome } from '../src/admin/legacy-repair-model';
import { skipSummary, type SkipCounters } from '../src/admin/skip-reasons';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch, clearAuth, getAuthRevision, getDid, onAuthChange } from './auth';
const BACKEND_URL = window.location.origin;
const DOMAIN = window.location.origin;
import MigrationCoverage, { type Coverage } from './MigrationCoverage';
import { createAdminPoller } from './admin-polling';
import { AdminAccessError, readAdminStatus, readAdminCoverage } from './admin-read';
import { estimateCosts, type CostPricing } from '../src/admin/cost-model';
import CostEstimate, { type EstimatedCosts, unavailablePricing } from './CostEstimate';
import type { ObservedCosts } from './ObservedUsage';
type Job = SkipCounters & {
    _id: string;
    dryRun: boolean;
    state: string;
    kind: string;
    scanned: number;
    written: number;
    skipped: number;
    errors: number;
    corpusComplete?: boolean;
    lastError?: string;
    plan: {
        embeddingRequests: number;
        representationCalls: number;
        embeddingUsdUpperEstimate: number | null;
        estimate?: EstimatedCosts;
        pricing?: CostPricing;
        observedUsage?: ObservedCosts | null;
    };
};
type Status = {
    readControl?: {
        configured: string;
        effective: string;
        control: string;
        degraded: boolean;
        reason: string;
        evaluatedAt?: string;
    };
    generation: string;
    target: string;
    enabled: boolean;
    dualWrite: boolean;
    fresh: boolean;
    csrf: string;
    pricing?: CostPricing;
    jobs: Job[];
    batches?: BatchStatus[];
    runs?: WholeBackfillRun[];
    repairJobs?: {
        _id: string;
        state: string;
        scanned: number;
        repaired: number;
        awaitingVerification: boolean;
        outcomes: Partial<Record<RepairOutcome, number>>;
    }[];
};
export default function AdminDashboard() {
    const [status, setStatus] = useState<Status | null>(null);
    const [message, setMessage] = useState('Checking profile access…');
    const [coverage, setCoverage] = useState<Coverage | null>(null);
    const [coverageError, setCoverageError] = useState('');
    const [stale, setStale] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<number | null>(null);
    const refresh = useRef<() => Promise<void>>(async () => {});
    const identityRevision = useRef(0);
    const mutationController = useRef<AbortController | null>(null);
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const requestId = useRef<string | null>(null);
    const [regeneration, setRegeneration] = useState(false);
    const login = new URL('/auth/login', BACKEND_URL);
    login.searchParams.set('returnTo', new URL('/admin', DOMAIN).toString());
    useEffect(() => {
        const clear = () => {
            identityRevision.current += 1;
            mutationController.current?.abort();
            requestId.current = null;
            setStatus(null);
            setStale(false);
            setCoverage(null);
            setUpdatedAt(null);
            setCoverageError('');
            setRegeneration(false);
            setMessage(
                getDid()
                    ? 'Checking profile access…'
                    : 'Log in with the configured service profile.'
            );
        };
        const accessLost = (error: AdminAccessError) => {
            clearAuth();
            setMessage(error.message);
        };
        // Coverage owns its own timeout and publish path. A slow inventory must not
        // delay fresh:false, revoked access, or a good status update.
        const coveragePoller = createAdminPoller({
            identity: getDid,
            clear: () => {},
            read: readAdminCoverage<Coverage>,
            publish: value => {
                setCoverage(value);
                setUpdatedAt(Date.now());
                setCoverageError('');
            },
            error: error => {
                if (error instanceof AdminAccessError) accessLost(error);
                else
                    setCoverageError(
                        error instanceof Error ? error.message : 'Coverage update unavailable.'
                    );
            },
        });
        const poller = createAdminPoller({
            identity: getDid,
            clear,
            read: readAdminStatus<Status>,
            publish: value => {
                setStatus(value);
                setStale(false);
                setMessage('');
                void coveragePoller.refresh();
            },
            error: error => {
                if (error instanceof AdminAccessError) {
                    accessLost(error);
                    return;
                }
                // Keep BatchControls mounted: this read does not own its in-flight
                // advance. Only real access loss or explicit interruption may stop it.
                setStale(true);
                setMessage(
                    'Status update delayed. Showing last confirmed data; new actions are disabled until status refreshes. ' +
                        (error instanceof Error ? error.message : 'Administration unavailable')
                );
            },
        });
        const unsubscribe = onAuthChange(() => {
            poller.invalidate();
            coveragePoller.invalidate();
        });
        refresh.current = poller.refresh;
        void poller.refresh();
        return () => {
            unsubscribe();
            poller.stop();
            coveragePoller.stop();
            refresh.current = async () => {};
        };
    }, []);
    async function act(path: string, body: object) {
        if (pending.current || !status || stale || !status.fresh) return;
        const revision = identityRevision.current;
        const authEpoch = getAuthRevision();
        const requestIdentity = getDid();
        mutationController.current = new AbortController();
        pending.current = true;
        setBusy(true);
        try {
            const response = await authenticatedFetch(path, {
                method: 'POST',
                signal: mutationController.current.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': status.csrf,
                },
                body: JSON.stringify(
                    path === '/admin/embeddings/jobs' ||
                        path === '/admin/embeddings/legacy-repair/jobs'
                        ? {
                              ...body,
                              requestId: (requestId.current ??= crypto.randomUUID()),
                              ...(path === '/admin/embeddings/jobs'
                                  ? { regenerationAuthorized: regeneration }
                                  : {}),
                          }
                        : body
                ),
            });
            if ([401, 403].includes(response.status)) {
                if (
                    revision === identityRevision.current &&
                    authEpoch === getAuthRevision() &&
                    requestIdentity === getDid()
                )
                    clearAuth();
                return;
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (revision !== identityRevision.current) return;
            requestId.current = null;
            await refresh.current();
        } catch (error) {
            if (revision !== identityRevision.current) return;
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Action interrupted. Refresh status before retrying.'
            );
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }
    return (
        <main className="min-h-screen bg-[#f4f6fb] p-5 sm:p-10 lg:p-12 text-slate-900">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">
                            AI Passport administration
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
                            Embedding migration
                        </h1>
                    </div>
                    <a
                        href={login.toString()}
                        className="rounded-full border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm"
                    >
                        Log in with service profile
                    </a>
                </header>
                {message && (
                    <p
                        role="status"
                        className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5"
                    >
                        {message}
                    </p>
                )}
                {status && (
                    <>
                        <div className="mb-6">
                            <MigrationCoverage
                                coverage={coverage}
                                error={coverageError}
                                updatedAt={updatedAt}
                            />
                        </div>
                        <WholeBackfill
                            fresh={status.fresh}
                            stale={stale}
                            csrf={status.csrf}
                            enabled={status.enabled && status.dualWrite}
                            runs={status.runs ?? []}
                            refresh={() => refresh.current()}
                        />
                        <details className="mt-6">
                            <summary className="cursor-pointer font-semibold">
                                Advanced support tools
                            </summary>
                            <section
                                aria-label="Active search provider"
                                className="mb-6 flex flex-wrap justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                                        Active search provider
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-950">
                                        {status.generation === 'nova1024v1'
                                            ? 'Bedrock Nova 2 · 1024 dimensions'
                                            : 'OpenAI · 1536 dimensions'}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-700">
                                        Configured deployment:{' '}
                                        {status.readControl?.configured ?? status.generation}.
                                        Control: {status.readControl?.control ?? 'deployment'}.
                                    </p>
                                    {status.readControl?.degraded && (
                                        <p
                                            role="status"
                                            className="mt-2 font-semibold text-amber-900"
                                        >
                                            Degraded control · safe OpenAI fallback (
                                            {status.readControl.reason}).
                                        </p>
                                    )}
                                </div>
                                <p className="max-w-lg text-sm leading-6 text-slate-700">
                                    New credential and message searches use this decision; in-flight
                                    searches keep their original generation. The chart below shows
                                    stored backfill copies, not search traffic. A global cutover
                                    changes the active provider.
                                </p>
                            </section>
                            <div className="mt-6">
                                <section
                                    aria-labelledby="controls-heading"
                                    className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
                                >
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                                        Advanced manual controls
                                    </p>
                                    <h2 id="controls-heading" className="font-bold text-2xl mt-2">
                                        Nova 2 · 1024 dimensions
                                    </h2>
                                    <p className="mt-2 text-slate-600">
                                        Current reads: {status.generation}. Provider calls:{' '}
                                        {status.enabled ? 'enabled' : 'disabled'}. Concurrent
                                        ingestion:{' '}
                                        {status.dualWrite ? 'dual writes' : 'single generation'}.
                                    </p>
                                    <p className="mt-3 text-sm text-slate-600">
                                        Dry-run inventories records without sending data to a model.
                                        Apply regenerates five credential representations and checks
                                        each learner’s current consent. Each action processes at
                                        most one record; closing this page pauses work after the
                                        current action. These manual controls are separate from
                                        whole-backfill runs.
                                    </p>
                                    <label className="mt-4 flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={regeneration}
                                            onChange={event =>
                                                setRegeneration(event.target.checked)
                                            }
                                        />
                                        Authorize regeneration for a future apply job (additional
                                        generation and privacy charges; maximum 100 records, 100
                                        generation calls and 600 embedding requests).
                                    </label>
                                    <div className="flex flex-wrap gap-3 mt-5">
                                        <button
                                            disabled={busy || stale || !status.fresh}
                                            onClick={() =>
                                                act('/admin/embeddings/jobs', { dryRun: true })
                                            }
                                            className="rounded-xl bg-indigo-600 text-white px-4 py-2 disabled:opacity-40"
                                        >
                                            Create dry-run
                                        </button>
                                        <button
                                            disabled={
                                                busy ||
                                                stale ||
                                                !status.fresh ||
                                                !status.enabled ||
                                                !status.dualWrite ||
                                                !regeneration
                                            }
                                            onClick={() =>
                                                act('/admin/embeddings/jobs', { dryRun: false })
                                            }
                                            className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                        >
                                            Create apply job
                                        </button>
                                        <button
                                            disabled={busy}
                                            onClick={() => {
                                                void refresh.current();
                                            }}
                                            className="rounded-xl border px-4 py-2"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    {!status.fresh && (
                                        <p className="text-amber-800 mt-3">
                                            Log in again with the configured service profile to
                                            perform actions.
                                        </p>
                                    )}
                                </section>
                            </div>
                            <BatchControls
                                fresh={status.fresh}
                                stale={stale}
                                csrf={status.csrf}
                                paidEnabled={status.enabled && status.dualWrite}
                                pricing={status.pricing}
                                jobs={status.jobs}
                                repairs={status.repairJobs ?? []}
                                batches={status.batches ?? []}
                                refresh={() => refresh.current()}
                            />
                            <section
                                aria-label="Legacy verification repair"
                                className="rounded-3xl border border-slate-200 bg-white p-6 mb-6"
                            >
                                <h2 className="text-xl font-bold">Legacy verification repair</h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Preview checks current consent for one legacy record. Verify
                                    re-fetches that original and checks its signature and owner
                                    binding before saving verified metadata and projection. These
                                    actions make network requests, including possible DID/status
                                    resolution, but no model calls, embeddings, ingestion, deletion
                                    or extension of raw retention. Each range processes at most 100
                                    records; every action requires a fresh service-profile login.
                                </p>
                                <button
                                    disabled={busy || stale || !status.fresh}
                                    onClick={() => act('/admin/embeddings/legacy-repair/jobs', {})}
                                    className="mt-3 rounded-xl border px-4 py-2 disabled:opacity-40"
                                >
                                    Create verify-only range
                                </button>
                                {(status.repairJobs ?? []).map(job => (
                                    <article key={job._id} className="mt-4 border-t pt-4">
                                        <h3 className="font-semibold">
                                            Verification repair · {job.state}
                                        </h3>
                                        <p>
                                            {job.scanned} processed · {job.repaired} repaired
                                        </p>
                                        <ul
                                            aria-label="Repair outcomes"
                                            className="text-sm text-slate-600"
                                        >
                                            {Object.entries(REPAIR_LABELS).map(([code, label]) => {
                                                const count = job.outcomes[code as RepairOutcome];
                                                return count ? (
                                                    <li key={code}>
                                                        {label}: {count}
                                                    </li>
                                                ) : null;
                                            })}
                                        </ul>
                                        {job.awaitingVerification && (
                                            <p className="mt-2">
                                                Eligible candidate previewed. Verification will
                                                recheck source and consent before saving.
                                            </p>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            <button
                                                disabled={
                                                    busy ||
                                                    stale ||
                                                    !status.fresh ||
                                                    job.state !== 'paused' ||
                                                    job.awaitingVerification
                                                }
                                                onClick={() =>
                                                    act(
                                                        `/admin/embeddings/legacy-repair/jobs/${job._id}/preview`,
                                                        {}
                                                    )
                                                }
                                                className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                            >
                                                Preview next legacy record
                                            </button>
                                            <button
                                                disabled={
                                                    busy ||
                                                    stale ||
                                                    !status.fresh ||
                                                    job.state !== 'paused' ||
                                                    !job.awaitingVerification
                                                }
                                                onClick={() =>
                                                    act(
                                                        `/admin/embeddings/legacy-repair/jobs/${job._id}/verify`,
                                                        {}
                                                    )
                                                }
                                                className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                            >
                                                Verify original and save metadata
                                            </button>
                                            {job.state === 'completed' && (
                                                <button
                                                    disabled={busy || stale || !status.fresh}
                                                    onClick={() =>
                                                        act(
                                                            '/admin/embeddings/legacy-repair/jobs',
                                                            {
                                                                continuationOf: job._id,
                                                            }
                                                        )
                                                    }
                                                    className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                                >
                                                    Continue repair range
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </section>
                            <h2 className="text-xl font-bold mb-4">Backfill activity</h2>
                            <section
                                aria-label="Backfill jobs"
                                className="grid gap-4 md:grid-cols-2"
                            >
                                {status.jobs.length === 0 && (
                                    <p className="text-slate-600">No backfill jobs yet.</p>
                                )}
                                {status.jobs.map(job => (
                                    <article
                                        key={job._id}
                                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap justify-between gap-3">
                                            <h2 className="font-semibold">
                                                {job.dryRun ? 'Dry-run' : 'Apply'} · {job.state}
                                            </h2>
                                            <span className="text-sm text-slate-500">
                                                {job.kind}
                                            </span>
                                        </div>
                                        <p className="mt-3">
                                            {job.scanned} scanned · {job.written} written ·{' '}
                                            {job.dryRun
                                                ? `${skipSummary(job).observed} observed without applying`
                                                : `${job.skipped} skipped`}{' '}
                                            · {job.errors} errors
                                        </p>
                                        {!job.dryRun &&
                                            (skipSummary(job).reasons.length > 0 ||
                                                skipSummary(job).unknownHistorical > 0) && (
                                                <ul
                                                    aria-label="Skip reasons"
                                                    className="mt-2 text-sm text-slate-600"
                                                >
                                                    {skipSummary(job).reasons.map(reason => (
                                                        <li key={reason.code}>
                                                            {reason.label}: {reason.count}
                                                        </li>
                                                    ))}
                                                    {skipSummary(job).unknownHistorical > 0 && (
                                                        <li>
                                                            Historical skips without recorded
                                                            reason:{' '}
                                                            {skipSummary(job).unknownHistorical}
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        {job.dryRun && (
                                            <p className="mt-2 text-sm text-slate-600">
                                                Planning only; eligibility and provider access were
                                                not checked. No model or privacy calls.
                                            </p>
                                        )}
                                        <p className="mt-2 text-sm text-slate-600">
                                            {job.plan.embeddingRequests} embedding requests{' '}
                                            {job.dryRun ? 'planned' : 'reserved/attempted'} ·{' '}
                                            {job.plan.representationCalls} representation calls{' '}
                                            {job.dryRun ? 'planned' : 'reserved/attempted'}.
                                        </p>
                                        <CostEstimate
                                            title={
                                                job.dryRun
                                                    ? 'Dry-run cost planning'
                                                    : 'Cumulative job cost planning'
                                            }
                                            estimate={
                                                job.plan.estimate ??
                                                estimateCosts(
                                                    job.plan.embeddingRequests,
                                                    job.plan.representationCalls,
                                                    job.plan.pricing ??
                                                        status.pricing ??
                                                        unavailablePricing
                                                )
                                            }
                                            pricing={job.plan.pricing ?? status.pricing}
                                            observedUsage={
                                                job.dryRun ? undefined : job.plan.observedUsage
                                            }
                                        >
                                            <p className="mt-1 text-slate-700">
                                                {job.dryRun
                                                    ? 'Stress scenario for the dry-run plan; this dry-run made no provider calls.'
                                                    : 'Stress scenario for cumulative job reservations/attempts, including earlier batches. Counters are not billing receipts.'}
                                            </p>
                                        </CostEstimate>
                                        {job.lastError && (
                                            <p className="text-amber-800 mt-2">
                                                Record failed; cursor preserved. Resolve the cause
                                                before resuming.
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {job.state === 'completed' &&
                                                job.corpusComplete === false && (
                                                    <button
                                                        disabled={
                                                            busy ||
                                                            stale ||
                                                            !status.fresh ||
                                                            (!job.dryRun &&
                                                                (!regeneration ||
                                                                    !status.enabled ||
                                                                    !status.dualWrite))
                                                        }
                                                        onClick={() =>
                                                            act('/admin/embeddings/jobs', {
                                                                dryRun: job.dryRun,
                                                                continuationOf: job._id,
                                                            })
                                                        }
                                                        className="rounded-xl border px-4 py-2"
                                                    >
                                                        Continue with new budget
                                                    </button>
                                                )}
                                            <button
                                                disabled={
                                                    busy ||
                                                    stale ||
                                                    !status.fresh ||
                                                    ['completed', 'cancelled'].includes(job.state)
                                                }
                                                onClick={() =>
                                                    act(`/admin/embeddings/jobs/${job._id}/step`, {
                                                        limit: 1,
                                                    })
                                                }
                                                className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                            >
                                                Run next record
                                            </button>
                                            <button
                                                disabled={
                                                    busy ||
                                                    stale ||
                                                    !status.fresh ||
                                                    ['completed', 'cancelled'].includes(job.state)
                                                }
                                                onClick={() =>
                                                    act(
                                                        `/admin/embeddings/jobs/${job._id}/cancel`,
                                                        {}
                                                    )
                                                }
                                                className="rounded-xl border px-4 py-2 disabled:opacity-40"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        </details>
                    </>
                )}
            </div>
        </main>
    );
}
