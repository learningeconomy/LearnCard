import type { BackfillFailure } from '../src/admin/backfill-diagnostics';
import type { EmbeddingResumeBlock } from '../src/admin/embedding-recovery';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch, clearAuth, getAuthRevision, getDid } from './auth';
import CostEstimate, { type EstimatedCosts } from './CostEstimate';
import ObservedUsage, { type ObservedCosts } from './ObservedUsage';
import type { CostPricing } from '../src/admin/cost-model';

export type WholeBackfillPlan = {
    _id: string;
    state: 'review';
    workflowVersion?: number;
    observedRecords?: number;
    selectionLimited?: boolean;
    inventoryTruncated?: boolean;
    recordLimit: number;
    maxGenerationRequests: number;
    maxEmbeddingRequests: number;
    maxPrivacyRequests: number;
    estimate: EstimatedCosts;
    pricing: CostPricing;
    excludedComplete?: number;
    excludedIneligible?: number;
    exclusionReasons?: Record<string, number>;
    initializedSourceEpochs?: number;
};
export type WholeBackfillRun = {
    _id: string;
    planId?: string;
    workflowVersion?: number;
    selection?: {
        observedRecords: number;
        inventoryTruncated?: boolean;
        excludedComplete: number;
        excludedIneligible: number;
        exclusionReasons?: Record<string, number>;
    };
    state: string;
    stage?: string;
    alreadyComplete?: number;
    blocked?: number;
    blockedReasons?: Record<string, number>;
    reconciled?: number;
    recordLimit: number;
    processed: number;
    draining: boolean;
    resumable: boolean;
    resumeBlock?: EmbeddingResumeBlock;
    lastDispatchedFailure?: BackfillFailure;
    recovery?: {
        id: string;
        record: number;
        phase: string;
        caps: { generation: number; embedding: number; privacy: number };
        used: { generation: number; embedding: number; privacy: number };
        expiresAt: string;
    };
    written: number;
    skipped: number;
    reason?: string;
    observedUsage?: ObservedCosts | null;
    updatedAt: string;
    maxGenerationRequests: number;
    maxEmbeddingRequests: number;
    maxPrivacyRequests: number;
    generationRequests: number;
    embeddingRequests: number;
    privacyRequests: number;
};
class ReviewPayloadError extends Error {}
type ReviewPreparation = {
    _id: string;
    state: 'preparing' | 'failed' | 'interrupted';
    processed: number;
    total: number | null;
    reason?: string;
};
type Props = {
    fresh: boolean;
    stale: boolean;
    csrf: string;
    enabled: boolean;
    runs: WholeBackfillRun[];
    refresh: () => Promise<void>;
};
const button =
    'rounded-xl px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';
const exclusionLabels: Record<string, string> = {
    missing_source_identity: 'Missing or invalid source ID, owner or URI',
    missing_verification: 'Missing verification metadata',
    invalid_verification: 'Invalid or incomplete proof verification',
    missing_projection: 'Missing or unsupported safe projection',
    missing_source_hash: 'Missing or invalid source content hash',
    missing_consent_revision: 'Missing consent revision',
    owner_erased: 'Owner erasure requested',
};
function Exclusions({ reasons, total }: { reasons?: Record<string, number>; total: number }) {
    const known = Object.entries(exclusionLabels)
        .map(([key, label]) => ({ label, count: reasons?.[key] ?? 0 }))
        .filter(item => item.count > 0);
    const unclassified = Math.max(0, total - known.reduce((sum, item) => sum + item.count, 0));
    return (
        <div className="mt-2 text-sm text-slate-600">
            {known.length > 0 && (
                <ul>
                    {known.map(item => (
                        <li key={item.label}>
                            {item.label}: {item.count.toLocaleString()}
                        </li>
                    ))}
                </ul>
            )}
            {unclassified > 0 && (
                <p>
                    {unclassified.toLocaleString()} exclusions have no stored reason breakdown in
                    this older review. No reason has been inferred.
                </p>
            )}
            {total > 0 && (
                <p>
                    Each excluded credential is counted once, at its first failing check. Exclusions
                    are separate from runtime skips.
                </p>
            )}
        </div>
    );
}
export default function WholeBackfill(props: Props) {
    const [plan, setPlan] = useState<WholeBackfillPlan | null>(null);
    const [preparation, setPreparation] = useState<ReviewPreparation | null>(null);
    const [reviewCheck, setReviewCheck] = useState(0);
    const [diagnosis, setDiagnosis] = useState<{
        scanned: number;
        metadataEligible: number;
        excluded: number;
        exclusionReasons: Record<string, number>;
        incomplete: boolean;
    } | null>(null);
    const [diagnosing, setDiagnosing] = useState(false);
    const [diagnosisError, setDiagnosisError] = useState('');
    const [recordLimit, setRecordLimit] = useState('');
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState('');
    const [localRun, setLocalRun] = useState<WholeBackfillRun | null>(null);
    const [recoveryReview, setRecoveryReview] = useState<{
        runId: string;
        record: number;
        requestId: string;
    } | null>(null);
    const pending = useRef(false);
    const diagnosisPending = useRef(false);
    const planId = useRef<string | null>(null);
    const startId = useRef<string | null>(null);
    const epoch = useRef(0);
    const controller = useRef<AbortController | null>(null);
    const current = useRef(props);
    current.current = props;
    const identity = getDid();
    const authenticationRevision = getAuthRevision();
    const savedReview = (id?: string | null) => {
        try {
            if (typeof window === 'undefined' || !identity) return null;
            const key = `passport:backfill-review:${identity}`;
            if (id === null) window.sessionStorage.removeItem(key);
            else if (id !== undefined) window.sessionStorage.setItem(key, id);
            return window.sessionStorage.getItem(key);
        } catch {
            return null;
        }
    };
    useEffect(() => {
        epoch.current += 1;
        controller.current?.abort();
        pending.current = false;
        planId.current = startId.current = null;
        setPlan(null);
        setDiagnosis(null);
        setDiagnosisError('');
        setDiagnosing(false);
        diagnosisPending.current = false;
        const saved = savedReview();
        planId.current = saved;
        setPreparation(
            saved ? { _id: saved, state: 'preparing', processed: 0, total: null } : null
        );
        setLocalRun(null);
        setRecoveryReview(null);
        setMessage('');
        setBusy('');
        return () => {
            epoch.current += 1;
            controller.current?.abort();
        };
    }, [identity, authenticationRevision]);
    const confirmed = localRun && props.runs.find(run => run._id === localRun._id);
    const newerLocal =
        localRun &&
        (!confirmed || Date.parse(localRun.updatedAt) > Date.parse(confirmed.updatedAt));
    const runs = newerLocal
        ? [localRun, ...props.runs.filter(run => run._id !== localRun._id)]
        : props.runs;
    const running = runs.some(run => ['running', 'pausing'].includes(run.state));
    const replaceable = runs.find(
        run =>
            run.workflowVersion !== 2 &&
            ['paused', 'interrupted'].includes(run.state) &&
            !run.draining
    );
    const action = async <T,>(
        key: string,
        path: string,
        body: object,
        apply: (value: T) => void,
        stopOnly = false
    ) => {
        if (pending.current || (!stopOnly && !current.current.fresh)) return;
        pending.current = true;
        setBusy(key);
        setMessage('');
        const mine = epoch.current;
        const authEpoch = getAuthRevision();
        const did = getDid();
        const abort = new AbortController();
        controller.current = abort;
        const currentRequest = () =>
            mine === epoch.current &&
            !abort.signal.aborted &&
            did === getDid() &&
            authEpoch === getAuthRevision();
        try {
            const response = await authenticatedFetch(path, {
                method: 'POST',
                signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': current.current.csrf,
                },
                body: JSON.stringify(body),
            });
            if (!currentRequest()) return;
            if ([401, 403].includes(response.status)) {
                if (authEpoch === getAuthRevision()) clearAuth();
                throw new Error('Log in again with the service profile to continue.');
            }
            const value = await response.json();
            if (!response.ok) throw new Error(value.error ?? 'Backfill action unavailable.');
            if (!currentRequest()) return;
            apply(value as T);
            await current.current.refresh();
        } catch (error) {
            if (!currentRequest()) return;
            if (
                key === 'review' &&
                error instanceof Error &&
                !(error instanceof TypeError) &&
                !['TimeoutError', 'AbortError'].includes(error.name)
            ) {
                setPreparation({
                    _id: planId.current ?? '',
                    state: 'failed',
                    processed: 0,
                    total: null,
                    reason: error.message,
                });
                setMessage('No paid backfill was started.');
            } else if (key === 'review') {
                setMessage(
                    'Review response delayed. Checking this same review; no paid backfill was started.'
                );
                if (planId.current)
                    setPreparation({
                        _id: planId.current,
                        state: 'preparing',
                        processed: 0,
                        total: null,
                    });
            } else
                setMessage(
                    `${error instanceof Error ? error.message : 'Response unavailable.'} Refresh progress before retrying. An accepted server job may still be running; this page never starts another job automatically.`
                );
        } finally {
            if (controller.current === abort) {
                pending.current = false;
                controller.current = null;
            }
            if (currentRequest()) setBusy('');
        }
    };
    const acceptReview = (value: WholeBackfillPlan | ReviewPreparation) => {
        if (!value || typeof value._id !== 'string')
            throw new ReviewPayloadError('Review response unavailable.');
        if (
            value.state === 'preparing' ||
            value.state === 'failed' ||
            value.state === 'interrupted'
        ) {
            planId.current = value._id;
            savedReview(value._id);
            setPreparation(value);
            setPlan(null);
            return;
        }
        if (
            !value ||
            value.state !== 'review' ||
            typeof value._id !== 'string' ||
            !Number.isSafeInteger(value.recordLimit) ||
            value.recordLimit < 0 ||
            value.recordLimit > 10000 ||
            value.maxGenerationRequests !== value.recordLimit ||
            value.maxEmbeddingRequests !== value.recordLimit * 5 ||
            value.maxPrivacyRequests !== value.recordLimit * 3 ||
            !value.estimate ||
            !value.pricing
        )
            throw new ReviewPayloadError(
                'The review response is incomplete. No start was authorized.'
            );
        planId.current = value._id;
        savedReview(value._id);
        setPreparation(null);
        setPlan(value);
    };
    useEffect(() => {
        if (!preparation || preparation.state !== 'preparing') return;
        const controller = new AbortController();
        const mine = epoch.current;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const check = async () => {
            const requestDid = getDid();
            const authEpoch = getAuthRevision();
            const currentRequest = () =>
                !controller.signal.aborted &&
                mine === epoch.current &&
                requestDid === getDid() &&
                authEpoch === getAuthRevision();
            try {
                const response = await authenticatedFetch(
                    `/admin/embeddings/runs/plan/${preparation._id}`,
                    {
                        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
                    }
                );
                if (!currentRequest()) return;
                if ([401, 403].includes(response.status)) {
                    clearAuth();
                    return;
                }
                if (response.status === 404) {
                    setPreparation(null);
                    setMessage(
                        'No saved review was found. Retry Review in this tab to use the same request ID. No paid backfill was started.'
                    );
                    return;
                }
                const value = await response.json();
                if (!response.ok) throw new Error('Review status unavailable.');
                if (!currentRequest()) return;
                acceptReview(value);
                setMessage('');
                if (value.state === 'preparing') timer = setTimeout(check, 3000);
            } catch (error) {
                if (!currentRequest()) return;
                if (error instanceof ReviewPayloadError) {
                    setPreparation({
                        _id: preparation._id,
                        state: 'failed',
                        processed: 0,
                        total: null,
                        reason: error.message,
                    });
                    setMessage('No paid backfill was started.');
                    return;
                }
                setMessage(
                    'Review status is temporarily unavailable. Checking the same review again; no duplicate scan or paid backfill will start.'
                );
                timer = setTimeout(check, 5000);
            }
        };
        void check();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [preparation?._id, preparation?.state, reviewCheck, identity]);
    useEffect(() => {
        const id = plan?._id ?? preparation?._id;
        if (!id || !props.runs.some(run => run.planId === id)) return;
        planId.current = null;
        startId.current = null;
        savedReview(null);
        setPreparation(null);
        setPlan(null);
        setMessage(
            'This review has already been used. Existing backfill progress is shown below; no new run was started.'
        );
    }, [props.runs, plan?._id, preparation?._id]);
    const review = () => {
        if (props.stale || !props.enabled || running || startId.current) return;
        const id = (planId.current ??= crypto.randomUUID());
        savedReview(id);
        void action(
            'review',
            '/admin/embeddings/runs/plan',
            {
                requestId: id,
                ...(recordLimit === '' ? {} : { recordLimit: Number(recordLimit) }),
            },
            acceptReview
        );
    };
    const start = () => {
        if (!plan || props.stale || !props.enabled || running || plan.recordLimit < 1) return;
        void action(
            'start',
            '/admin/embeddings/runs',
            {
                requestId: (startId.current ??= crypto.randomUUID()),
                planId: plan._id,
                paidAuthorized: true,
                ...(plan.workflowVersion === 2 ? { generationRetryPolicy: 'transient-v2' } : {}),
                ...(plan.workflowVersion === 2 && replaceable
                    ? { replaceRunId: replaceable._id }
                    : {}),
            },
            (value: WholeBackfillRun) => {
                setLocalRun(value);
                setPlan(null);
                startId.current = planId.current = null;
                savedReview(null);
                setMessage(
                    'Backfill started. You can close this page and return to check progress.'
                );
            }
        );
    };
    const control = (run: WholeBackfillRun, command: 'pause' | 'cancel' | 'resume') => {
        if (
            command === 'resume' &&
            (props.stale ||
                !props.enabled ||
                running ||
                !run.resumable ||
                Boolean(run.resumeBlock) ||
                run.draining)
        )
            return;
        void action(
            `${run._id}/${command}`,
            `/admin/embeddings/runs/${run._id}/${command}`,
            command === 'resume' && run.workflowVersion === 2
                ? { generationRetryPolicy: 'transient-v2' }
                : {},
            (value: WholeBackfillRun) => {
                setLocalRun(value);
                setMessage(
                    command === 'resume'
                        ? 'Resumed within the original remaining budget.'
                        : 'Stop requested. Any in-flight provider request may still be billed.'
                );
            },
            command !== 'resume'
        );
    };
    const canRecover = (run: WholeBackfillRun) =>
        props.fresh &&
        !props.stale &&
        props.enabled &&
        !running &&
        !run.draining &&
        !busy &&
        run.resumeBlock?.code === 'embedding_attempts_exhausted' &&
        run.recovery?.record !== run.processed + 1 &&
        run.maxGenerationRequests - run.generationRequests >= 1 &&
        run.maxEmbeddingRequests - run.embeddingRequests >= 5 &&
        run.maxPrivacyRequests - run.privacyRequests >= 3;
    const confirmRecovery = (run: WholeBackfillRun) => {
        if (
            !canRecover(run) ||
            !recoveryReview ||
            recoveryReview.runId !== run._id ||
            recoveryReview.record !== run.processed + 1
        )
            return;
        void action(
            `${run._id}/recover-once`,
            `/admin/embeddings/runs/${run._id}/recover-once`,
            {
                requestId: recoveryReview.requestId,
                record: recoveryReview.record,
                paidAuthorized: true,
                caps: { generation: 1, embedding: 5, privacy: 3 },
            },
            (value: WholeBackfillRun) => {
                setLocalRun(value);
                setRecoveryReview(null);
                setMessage(
                    'Single-use recovery accepted. It pauses after this record and cannot replay after interruption.'
                );
            }
        );
    };
    const diagnose = async () => {
        if (diagnosisPending.current) return;
        diagnosisPending.current = true;
        setDiagnosis(null);
        setDiagnosing(true);
        setDiagnosisError('');
        const mine = epoch.current,
            did = getDid(),
            revision = getAuthRevision();
        const active = () =>
            mine === epoch.current && did === getDid() && revision === getAuthRevision();
        try {
            const response = await authenticatedFetch('/admin/embeddings/metadata-diagnosis', {
                signal: AbortSignal.timeout(20000),
            });
            if (!active()) return;
            if ([401, 403].includes(response.status)) {
                clearAuth();
                throw new Error('Log in with the service profile to diagnose metadata.');
            }
            const value = await response.json();
            if (!response.ok) throw new Error(value.error ?? 'Metadata diagnosis unavailable.');
            const count = (n: unknown): n is number =>
                typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 10000;
            if (
                !value ||
                !count(value.scanned) ||
                !count(value.metadataEligible) ||
                !count(value.excluded) ||
                value.scanned !== value.metadataEligible + value.excluded ||
                typeof value.incomplete !== 'boolean' ||
                !value.exclusionReasons ||
                typeof value.exclusionReasons !== 'object' ||
                Array.isArray(value.exclusionReasons) ||
                Object.entries(value.exclusionReasons).some(
                    ([key, n]) => !Object.hasOwn(exclusionLabels, key) || !count(n)
                ) ||
                Object.values(value.exclusionReasons).reduce<number>(
                    (sum, n) => sum + (n as number),
                    0
                ) !== value.excluded
            )
                throw new Error(
                    'Metadata diagnosis returned invalid counts. Existing run controls remain available.'
                );
            if (active()) setDiagnosis(value);
        } catch (error) {
            if (active())
                setDiagnosisError(
                    error instanceof Error ? error.message : 'Metadata diagnosis unavailable.'
                );
        } finally {
            if (active()) {
                diagnosisPending.current = false;
                setDiagnosing(false);
            }
        }
    };
    return (
        <section
            aria-label="Whole credential backfill"
            className="mb-8 rounded-3xl border border-indigo-200 bg-white p-6 sm:p-8 shadow-sm"
        >
            <h2 className="text-2xl font-bold">Backfill everything</h2>
            <p className="mt-2 text-slate-600">
                Verify originals, repair safe metadata and fill missing embeddings in one run.
                Anything that cannot be safely completed stays visible with a reason.
            </p>
            {!props.fresh && (
                <p className="mt-3 text-amber-900">
                    Log in again to start or resume. Pause and Cancel remain available while your
                    service-profile session is valid. An already-authorized run does not pause just
                    because the five-minute fresh-login window expires.
                </p>
            )}
            {!props.enabled && (
                <p className="mt-3 text-amber-900">
                    Backfill requires provider calls and dual writes to be enabled.
                </p>
            )}
            {!plan && !preparation && (
                <>
                    <button
                        className={`${button} mt-5 bg-indigo-600 text-white text-lg px-8 py-4`}
                        disabled={
                            Boolean(busy) ||
                            !props.fresh ||
                            props.stale ||
                            !props.enabled ||
                            running ||
                            (recordLimit !== '' &&
                                (!Number.isInteger(Number(recordLimit)) ||
                                    Number(recordLimit) < 1 ||
                                    Number(recordLimit) > 10000))
                        }
                        onClick={review}
                    >
                        {busy === 'review' ? 'Preparing…' : 'Backfill everything'}
                    </button>
                    <details className="mt-3 text-sm">
                        <summary>Optional test limit</summary>
                        <label>
                            Records (leave empty for all)
                            <input
                                aria-label="Optional record limit"
                                type="number"
                                min="1"
                                max="10000"
                                value={recordLimit}
                                disabled={Boolean(busy)}
                                onChange={event => setRecordLimit(event.target.value)}
                                className="ml-2 w-28 rounded border p-2"
                            />
                        </label>
                    </details>
                </>
            )}
            {preparation && (
                <div className="mt-4 rounded-2xl border p-4" role="status">
                    {preparation.state === 'preparing' ? (
                        <>
                            <p className="font-semibold">Preparing your backfill…</p>
                            <p>
                                {preparation.processed} / {preparation.total ?? '…'} credentials
                                checked. No paid backfill has started.
                            </p>
                            <p className="mt-2 text-sm">
                                The page checks the same preparation automatically; reloading this
                                tab restores its status.
                            </p>
                            <button
                                className={`${button} mt-3 border`}
                                onClick={() => setReviewCheck(value => value + 1)}
                            >
                                Check review status
                            </button>
                        </>
                    ) : (
                        <>
                            <p>
                                {preparation.reason ??
                                    'Review preparation stopped. No paid backfill was started.'}
                            </p>
                            <button
                                className={`${button} mt-3 border`}
                                disabled={!props.fresh || props.stale || Boolean(busy)}
                                onClick={() => {
                                    planId.current = null;
                                    savedReview(null);
                                    setPreparation(null);
                                    setMessage('');
                                }}
                            >
                                Prepare a new review
                            </button>
                        </>
                    )}
                </div>
            )}
            {plan && (
                <div className="mt-4 rounded-2xl border p-4">
                    <h3 className="text-lg font-bold">
                        {plan.recordLimit.toLocaleString()} credentials in this snapshot
                    </h3>
                    {plan.observedRecords !== undefined && (
                        <p className="mt-2 text-sm">
                            Selected {plan.recordLimit.toLocaleString()} of{' '}
                            {plan.inventoryTruncated ? 'at least ' : ''}
                            {plan.observedRecords.toLocaleString()} stored credentials.{' '}
                            {plan.selectionLimited
                                ? 'Test limit applied: unselected records are outside this run.'
                                : 'All records in this snapshot are included.'}
                        </p>
                    )}
                    <p className="mt-2 text-sm">
                        {plan.workflowVersion === 2
                            ? 'Verification and safe repair are included. Records without sufficient consent or evidence will be reported as blocked.'
                            : 'This saved plan uses the earlier embeddings-only workflow. Cancel it to prepare the complete workflow.'}
                    </p>
                    <p className="mt-2 text-sm">
                        Maximum {plan.maxGenerationRequests.toLocaleString()} generation,{' '}
                        {plan.maxEmbeddingRequests.toLocaleString()} embedding and{' '}
                        {plan.maxPrivacyRequests.toLocaleString()} privacy requests. Failed or
                        uncertain attempts also consume this fixed budget.
                    </p>
                    <p className="mt-3 text-sm">
                        {plan.estimate.totalUsd === null
                            ? 'Full dollar estimate unavailable; some rates are unknown.'
                            : `Conservative cost scenario: ${plan.estimate.totalUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`}{' '}
                        This is not an expected bill or a dollar cap. Actual usage and
                        infrastructure charges vary.
                    </p>
                    <details className="mt-2 text-sm">
                        <summary>Pricing and assumptions</summary>
                        <CostEstimate
                            title="Backfill cost scenario"
                            estimate={plan.estimate}
                            pricing={plan.pricing}
                            recordLimit={plan.recordLimit}
                        />
                    </details>
                    <p className="mt-3 text-sm">
                        Starting authorizes verification, safe metadata repair and the paid requests
                        above. Closing the page does not pause the job; the server must remain
                        running. Interruptions require explicit Resume.
                    </p>
                    {plan.workflowVersion === 2 && (
                        <p className="mt-2 text-sm">
                            Includes up to 3 automatic retries per record for generation HTTP
                            500/502/503 or confirmed provider request timeouts (excluding
                            cancellation and caller/stage deadline expiry), after 30 seconds, 2
                            minutes and 5 minutes. Repeated privacy and generation requests may
                            charge again and use the same fixed budget. Other uncertain failures
                            still pause.
                        </p>
                    )}
                    {plan.workflowVersion === 2 && replaceable && (
                        <p className="mt-3 text-sm font-semibold">
                            Starting this complete workflow also cancels your paused earlier
                            embeddings-only run. Its history and spent request budget are preserved.
                        </p>
                    )}
                    {plan.recordLimit > 0 ? (
                        <>
                            <button
                                className={`${button} mt-4 bg-indigo-600 text-white`}
                                disabled={
                                    Boolean(busy) ||
                                    !props.fresh ||
                                    props.stale ||
                                    !props.enabled ||
                                    running
                                }
                                onClick={start}
                            >
                                {busy === 'start'
                                    ? 'Starting backfill…'
                                    : startId.current
                                      ? 'Retry same start'
                                      : 'Authorize and start'}
                            </button>
                        </>
                    ) : (
                        <p className="mt-3 font-semibold">
                            Nothing eligible remains in this snapshot.
                        </p>
                    )}
                    {!startId.current && (
                        <button
                            className={`${button} ml-3 mt-4 border`}
                            disabled={Boolean(busy)}
                            onClick={() => {
                                setPlan(null);
                                planId.current = null;
                                savedReview(null);
                            }}
                        >
                            Close review
                        </button>
                    )}
                </div>
            )}
            {message && (
                <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3">
                    {message}
                </p>
            )}
            {runs.map(run => (
                <article
                    key={run._id}
                    className="mt-5 rounded-2xl border p-4"
                    aria-label="Backfill progress"
                >
                    <h3 className="font-bold">Backfill · {run.state}</h3>
                    {run.stage && run.selection && (
                        <p className="mt-2 text-sm">
                            Selected {run.recordLimit.toLocaleString()} of{' '}
                            {run.selection.inventoryTruncated ? 'at least ' : ''}
                            {run.selection.observedRecords.toLocaleString()} stored credentials.
                            {run.recordLimit < run.selection.observedRecords
                                ? ' Test limit applied; unselected records remain outside this run.'
                                : ''}
                        </p>
                    )}
                    {!run.stage && run.selection && (
                        <div className="mt-2">
                            <p>
                                Selected {run.recordLimit.toLocaleString()} of{' '}
                                {run.selection.inventoryTruncated ? 'at least ' : ''}
                                {run.selection.inventoryTruncated ? 'at least ' : ''}
                                {run.selection.observedRecords.toLocaleString()} stored credentials;{' '}
                                {run.selection.excludedComplete.toLocaleString()} already complete;{' '}
                                {run.selection.excludedIneligible.toLocaleString()} excluded before
                                starting.
                            </p>
                            <Exclusions
                                reasons={run.selection.exclusionReasons}
                                total={run.selection.excludedIneligible}
                            />
                        </div>
                    )}
                    <p className="mt-2">
                        {run.stage ? `${run.stage} · ` : ''}
                        {run.processed.toLocaleString()} / {run.recordLimit.toLocaleString()}{' '}
                        processed · {run.written.toLocaleString()} written ·{' '}
                        {(run.alreadyComplete ?? 0).toLocaleString()} already complete ·{' '}
                        {(run.blocked ?? run.skipped).toLocaleString()} blocked
                    </p>
                    {run.stage === 'reconciliation' && (
                        <p className="mt-2 text-sm">
                            Final check: {(run.reconciled ?? 0).toLocaleString()} /{' '}
                            {run.recordLimit.toLocaleString()} reconciled. No new provider work is
                            started in this stage.
                        </p>
                    )}
                    {run.blockedReasons && (
                        <ul aria-label="Blocked reasons" className="mt-2 text-sm">
                            {Object.entries(run.blockedReasons)
                                .filter(([, count]) => count > 0)
                                .map(([reason, count]) => (
                                    <li key={reason}>
                                        {reason.replaceAll('_', ' ')}: {count.toLocaleString()}
                                    </li>
                                ))}
                        </ul>
                    )}
                    {run.state === 'completed_with_blockers' && (
                        <p className="mt-2 font-semibold">
                            Finished with blocked records. These records were not backfilled; the
                            reasons above need attention.
                        </p>
                    )}
                    <progress
                        aria-label="Credentials checked"
                        className="mt-2 w-full"
                        value={run.processed}
                        max={Math.max(1, run.recordLimit)}
                    />
                    <details className="mt-2 text-sm">
                        <summary>Request budget and observed usage</summary>
                        <p className="mt-2 text-sm">
                            Reserved requests: generation {run.generationRequests}/
                            {run.maxGenerationRequests}; embedding {run.embeddingRequests}/
                            {run.maxEmbeddingRequests}; privacy {run.privacyRequests}/
                            {run.maxPrivacyRequests}. Reservations are not billing receipts.
                        </p>
                        <ObservedUsage usage={run.observedUsage} recordLimit={run.recordLimit} />
                    </details>
                    {run.state === 'completed' && (
                        <p className="mt-2 text-sm">
                            Snapshot finished. Refresh coverage to see overall readiness.
                        </p>
                    )}
                    {run.draining && run.state !== 'running' && (
                        <p className="mt-2 text-amber-900">
                            An in-flight request is settling. Resume is unavailable until it
                            finishes or its lease expires.
                        </p>
                    )}
                    {run.lastDispatchedFailure && (
                        <details className="mt-2 text-sm">
                            <summary>Earlier attempt failure with dispatched requests</summary>
                            <p>
                                Historical evidence for this record. The current pause and retry
                                limits still apply.
                            </p>
                            <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                                {JSON.stringify(run.lastDispatchedFailure, null, 2)}
                            </pre>
                        </details>
                    )}
                    {run.resumeBlock && (
                        <p role="alert" className="mt-2 font-semibold text-amber-900">
                            Record {run.resumeBlock.record}: {run.resumeBlock.message}
                        </p>
                    )}
                    {run.recovery && (
                        <p className="mt-2 text-sm">
                            Single-use recovery for record {run.recovery.record}:{' '}
                            {run.recovery.phase}. Reserved requests: generation{' '}
                            {run.recovery.used.generation}/1, embedding{' '}
                            {run.recovery.used.embedding}/5, privacy {run.recovery.used.privacy}/3.
                            Prior attempt counters are preserved.
                        </p>
                    )}
                    {run.resumeBlock?.code === 'embedding_attempts_exhausted' &&
                        run.recovery?.record !== run.processed + 1 && (
                            <div className="mt-3 rounded-xl border border-amber-300 p-4">
                                <p>
                                    This record needs a separately confirmed recovery pass. It may
                                    recompute all five embeddings. Maximum additional requests: 1
                                    generation, 5 embedding, 3 privacy, within the original
                                    remaining run budgets. No automatic retries. The pass pauses
                                    after this record; interruption consumes the pass and requires
                                    review. No record is skipped.
                                </p>
                                {recoveryReview?.runId === run._id &&
                                recoveryReview.record === run.processed + 1 ? (
                                    <>
                                        <p className="mt-2 font-semibold">
                                            Authorize paid requests for record{' '}
                                            {recoveryReview.record} only?
                                        </p>
                                        <button
                                            className={`${button} bg-amber-800 text-white`}
                                            disabled={!canRecover(run)}
                                            onClick={() => confirmRecovery(run)}
                                        >
                                            Confirm one paid recovery pass
                                        </button>
                                        <button
                                            className={`${button} border`}
                                            disabled={Boolean(busy)}
                                            onClick={() => setRecoveryReview(null)}
                                        >
                                            Close recovery review
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className={`${button} border`}
                                        disabled={!canRecover(run)}
                                        onClick={() =>
                                            setRecoveryReview({
                                                runId: run._id,
                                                record: run.processed + 1,
                                                requestId: crypto.randomUUID(),
                                            })
                                        }
                                    >
                                        Review single-use recovery
                                    </button>
                                )}
                            </div>
                        )}
                    {!run.resumeBlock && run.reason && (
                        <p className="mt-2 text-amber-900">{run.reason}</p>
                    )}
                    {run.workflowVersion === 2 &&
                        !run.resumeBlock &&
                        ['paused', 'interrupted'].includes(run.state) && (
                            <p className="mt-2 text-sm">
                                Resume enables up to 3 automatic retries per record for generation
                                HTTP 500/502/503 or confirmed provider request timeouts (excluding
                                cancellation and caller/stage deadline expiry), after 30 seconds, 2
                                minutes and 5 minutes. Privacy and generation requests may charge
                                again within the remaining budget; used retries are not reset. Other
                                uncertain failures still pause.
                            </p>
                        )}
                    <div className="mt-3 flex flex-wrap gap-3">
                        {run.state === 'running' && (
                            <button
                                className={`${button} border`}
                                disabled={Boolean(busy)}
                                onClick={() => control(run, 'pause')}
                            >
                                Pause backfill
                            </button>
                        )}
                        {!run.resumeBlock && ['paused', 'interrupted'].includes(run.state) && (
                            <button
                                className={`${button} bg-indigo-600 text-white`}
                                disabled={
                                    Boolean(busy) ||
                                    !props.fresh ||
                                    props.stale ||
                                    !props.enabled ||
                                    running ||
                                    !run.resumable ||
                                    run.draining
                                }
                                onClick={() => control(run, 'resume')}
                            >
                                Resume with remaining budget
                            </button>
                        )}
                        {!['completed', 'completed_with_blockers', 'cancelled'].includes(
                            run.state
                        ) && (
                            <button
                                className={`${button} border`}
                                disabled={Boolean(busy)}
                                onClick={() => control(run, 'cancel')}
                            >
                                Cancel backfill
                            </button>
                        )}
                    </div>
                </article>
            ))}
            <details className="mt-5 text-sm">
                <summary>Advanced diagnostics</summary>
                <div className="mt-4 border-t pt-4">
                    <button
                        className={`${button} border`}
                        disabled={diagnosing || props.stale}
                        onClick={() => void diagnose()}
                    >
                        {diagnosing ? 'Checking metadata…' : 'Diagnose excluded metadata'}
                    </button>
                    <p className="mt-2 text-sm text-slate-600">
                        Read-only current metadata counts. No repair, source changes, vector checks
                        or model calls. Counts may differ from an earlier review; passing metadata
                        does not establish current consent, owner status or vector completeness.
                    </p>
                    {diagnosisError && <p role="alert">{diagnosisError}</p>}
                    {diagnosis && (
                        <div aria-label="Metadata diagnosis">
                            <p>
                                {diagnosis.scanned.toLocaleString()} checked ·{' '}
                                {diagnosis.metadataEligible.toLocaleString()} pass metadata ·{' '}
                                {diagnosis.excluded.toLocaleString()} excluded by metadata
                            </p>
                            {diagnosis.incomplete && (
                                <p role="alert">
                                    Incomplete: scan limited to the first 10,000 records. These are
                                    partial counts.
                                </p>
                            )}
                            <Exclusions
                                reasons={diagnosis.exclusionReasons}
                                total={diagnosis.excluded}
                            />
                        </div>
                    )}
                </div>
            </details>
        </section>
    );
}
