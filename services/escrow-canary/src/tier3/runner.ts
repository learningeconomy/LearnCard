import { EscrowRequestError, type EscrowHoldStatus } from '@learncard/sss-key-manager';
import type { Config } from '../config';
import { refreshIdentity, RunnerAuthError } from '../auth';
import { safeReason, type Emit, type Step, type Tier3Metric } from '../metrics';
import type { AccountSecret, SecretStore } from '../secrets';
import type { Sdk } from '../sdk';
import { memoryStorage } from '../storage';
import { holdLabel, type RunnerConfig } from './config';
import { findMessage, inboxPolicy, readKnownMessage, type InboxStore } from './inbox';
import {
    create,
    keys,
    LedgerConflictError,
    replace,
    type Ledger,
    type LedgerWrite,
    type MetaItem,
    type PoolItem,
    type RunItem,
    type StepItem,
    type StepName,
} from './ledger';
import {
    CODE_TTL_MS,
    confirmWindowOk,
    dayKey,
    deadlineSane,
    isCancelDue,
    isDailyStartDue,
    isoWeekKey,
    releaseDue,
    SKEW_MS,
    STEP_DEADLINES,
    ttlSeconds,
    WARNING_HOURS,
    warningDeadlineExpired,
} from './timing';

export interface Tier3Deps {
    ledger: Ledger;
    inbox: InboxStore;
    secrets: SecretStore;
    sdk: Sdk;
    emit: Emit;
    refresh?: typeof refreshIdentity;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
}
export interface Tier3Event {
    time: string;
}

/** Allowlisted, non-sensitive failure carrier (never server or secret text). */
class Tier3Failure extends Error {
    constructor(readonly reason: string) {
        super('Tier 3 step failed');
    }
}
const failure = (reason: string): Tier3Failure => new Tier3Failure(reason);

/** Reduce any error to an allowlisted reason; never a message or body. */
export const tier3Reason = (error: unknown): string => {
    if (error instanceof RunnerAuthError) return 'auth';
    if (error instanceof EscrowRequestError && !error.reason) {
        if (error.status === 429) return 'rate_limit';
        if (error.status === 412 || error.status >= 500) return 'unavailable';
        return 'http_refusal';
    }
    if (error instanceof Error && error.name === 'EscrowEvidenceError') return 'evidence';
    return safeReason(error);
};

interface RunContext {
    run: RunItem;
    steps: Map<StepName, StepItem>;
    pool: PoolItem;
}
interface Session {
    secret: AccountSecret;
    token: string;
}
type PoolOutcome =
    | { state: 'idle' }
    | { state: 'orphaned' }
    | { state: 'cooling' }
    | { state: 'quarantined'; reason: string };

const POLL_INTERVAL_MS = 10_000;
const POOL_LABELS = (size: number) => Array.from({ length: size }, (_, index) => holdLabel(index));

/**
 * One tier-3 tick (every 15 minutes, reserved concurrency 1). Each state change
 * is claimed in the ledger BEFORE its side effect; a non-idempotent call is never
 * repeated automatically after a crash. At most one code-sending action per tick.
 */
export const runTier3 = async (
    event: Tier3Event,
    base: Config,
    config: RunnerConfig,
    deps: Tier3Deps
): Promise<void> => {
    const now = deps.now ?? Date.now;
    const sleep = deps.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const { ledger, inbox, sdk } = deps;
    const time = Date.parse(event.time);
    if (!Number.isFinite(time) || Math.abs(now() - time) > 5 * 60_000) throw failure('stale_event');

    // -- metrics ------------------------------------------------------------
    const outcome = (
        name: Tier3Metric,
        value: number,
        ctx: RunContext,
        error?: unknown,
        duplicate = false
    ): void =>
        deps.emit(
            name,
            value,
            undefined,
            error === undefined ? undefined : { reason: tier3Reason(error) },
            {
                holdAccount: ctx.run.label as `hold-${string}`,
                kind: ctx.run.kind,
                ...(duplicate ? { outcome: 'duplicate' as const } : {}),
            }
        );
    const diagnostic = (step: Step, error: unknown, label?: string): void =>
        deps.emit(
            'Step.Failure',
            1,
            step,
            { reason: tier3Reason(error) },
            label ? { holdAccount: label as `hold-${string}` } : {}
        );

    // -- accounts and sessions ----------------------------------------------
    const accountFor = (label: string) => {
        const account = config.holdAccounts[Number(label.slice(5)) - 1];
        if (!account) throw failure('config');
        return account;
    };
    const secrets = new Map<string, AccountSecret>();
    const readSecret = async (label: string): Promise<AccountSecret> => {
        const cached = secrets.get(label);
        if (cached) return cached;
        const account = accountFor(label);
        let secret: AccountSecret;
        try {
            secret = await deps.secrets.read(account.secretArn);
        } catch {
            throw failure('secret_read');
        }
        if (
            secret.accountId !== account.id ||
            secret.recoveryLanguage !== 'en' ||
            !secret.recoveryEmail.toLowerCase().endsWith(`@${config.inbox.domain}`)
        )
            throw failure('config');
        secrets.set(label, secret);
        return secret;
    };
    const writeSecret = async (label: string, secret: AccountSecret): Promise<void> => {
        await deps.secrets.write(accountFor(label).secretArn, secret);
        secrets.set(label, secret);
    };
    const sessions = new Map<string, Promise<Session>>();
    const session = (label: string): Promise<Session> => {
        const existing = sessions.get(label);
        if (existing) return existing;
        const created = (async () => {
            const secret = await readSecret(label);
            let auth: { token: string; refreshToken: string };
            try {
                auth = await (deps.refresh ?? refreshIdentity)(
                    base.firebaseApiKey,
                    secret.refreshToken
                );
            } catch (error) {
                if (error instanceof RunnerAuthError)
                    deps.emit('Runner.AuthFailure', 1, undefined, undefined, {});
                throw error;
            }
            deps.emit('Runner.AuthFailure', 0, undefined, undefined, {});
            // Persist a rotated refresh token before ANY other I/O.
            if (auth.refreshToken !== secret.refreshToken)
                await writeSecret(label, { ...secret, refreshToken: auth.refreshToken });
            return { secret: await readSecret(label), token: auth.token };
        })();
        sessions.set(label, created);
        created.catch(() => sessions.delete(label));
        return created;
    };
    const holdFor = async (ctx: RunContext) => {
        const secret = await readSecret(ctx.run.label);
        if (!secret.hold || secret.hold.runId !== ctx.run.runId) throw failure('interrupted');
        return { secret, hold: secret.hold };
    };
    const policyFor = async (label: string) =>
        inboxPolicy(config.inbox, (await readSecret(label)).recoveryEmail);
    const prefixFor = (label: string) => `${config.inbox.prefix}${label}/`;
    const strategy = (storage = memoryStorage().storage) => sdk.strategy(storage);

    // -- ledger helpers -----------------------------------------------------
    const loadRun = async (runId: string, label: string): Promise<RunContext> => {
        const [items, pool] = await Promise.all([ledger.run(runId), ledger.get(keys.pool(label))]);
        const run = items.find((item): item is RunItem => item.type === 'run');
        if (!run || !pool || pool.type !== 'pool') throw failure('ledger');
        const steps = new Map<StepName, StepItem>();
        for (const item of items) if (item.type === 'step') steps.set(item.name, item);
        return { run, steps, pool };
    };
    const refreshCtx = (ctx: RunContext) => loadRun(ctx.run.runId, ctx.run.label);
    const update = async (
        ctx: RunContext,
        writes: (ctx: RunContext) => LedgerWrite[]
    ): Promise<RunContext> => {
        await ledger.write(writes(ctx));
        return refreshCtx(ctx);
    };
    const poolAfter = (pool: PoolItem, next: PoolOutcome, at: number): LedgerWrite =>
        replace(
            pool,
            {
                state: next.state,
                runId: undefined,
                stateSince: at,
                orphanCleanupAttempted: false,
                availableAt:
                    next.state === 'cooling'
                        ? at + config.cancelCooldownHours * 3_600_000
                        : undefined,
                quarantineReason: next.state === 'quarantined' ? next.reason : undefined,
                lastReturnedAt:
                    next.state === 'idle' || next.state === 'cooling' ? at : pool.lastReturnedAt,
            },
            at
        );
    /** Close a run in one transaction: run, every step (open ones abandoned/failed) and pool. */
    const close = async (
        ctx: RunContext,
        reason: string,
        next: PoolOutcome,
        options: {
            failed?: StepName[];
            observed?: Partial<Record<StepName, number>>;
            run?: Partial<RunItem>;
        } = {}
    ): Promise<void> => {
        const at = now();
        const expiresAt = ttlSeconds(at);
        const writes: LedgerWrite[] = [
            replace(
                ctx.run,
                { ...options.run, state: 'closed', closedAt: at, closeReason: reason, expiresAt },
                at
            ),
            poolAfter(ctx.pool, next, at),
        ];
        for (const step of ctx.steps.values()) {
            const observedAt = options.observed?.[step.name];
            if (observedAt !== undefined)
                writes.push(replace(step, { observedAt, outcome: '1', expiresAt }, at));
            else if (step.observedAt !== undefined || step.outcome !== undefined)
                writes.push(replace(step, { expiresAt }, at));
            else if (options.failed?.includes(step.name))
                writes.push(replace(step, { outcome: '0', reason, expiresAt }, at));
            else writes.push(replace(step, { outcome: 'abandoned', reason, expiresAt }, at));
        }
        await ledger.write(writes);
    };
    const putStep = (runId: string, name: StepName, dueAt: number, at: number): LedgerWrite =>
        create({
            ...keys.step(runId, name),
            type: 'step',
            env: config.environment,
            version: 1,
            updatedAt: at,
            runId,
            name,
            dueAt,
        });
    const observe = (
        ctx: RunContext,
        name: StepName,
        observedAt: number,
        at: number
    ): LedgerWrite => {
        const step = ctx.steps.get(name);
        if (!step) throw failure('ledger');
        return replace(step, { observedAt, outcome: '1' }, at);
    };

    /** A 403 is classified only from a fresh status read; the SDK drops refusal bodies. */
    const classifyRefusal = async (
        ctx: RunContext,
        error: unknown
    ): Promise<'waiting' | 'cancelled' | 'retry' | 'other'> => {
        if (
            !(error instanceof EscrowRequestError) ||
            (error.status !== 403 && error.status !== 412)
        )
            return 'other';
        const { hold } = await holdFor(ctx);
        const status = await strategy().getEscrowRecoveryStatus!({
            holdId: hold.holdId,
            resumeToken: hold.resumeToken,
            expectations: hold.expectations,
        });
        if (!status) return 'other';
        if (error.status === 403 && status.status === 'cancelled') return 'cancelled';
        if (status.status !== 'pending') return 'other';
        if (error.status === 403 && now() < Date.parse(status.releaseAfter)) return 'waiting';
        // lca-api reopens the claim after an enclave Unavailable/Time refusal.
        if (error.status === 412) return 'retry';
        return 'other';
    };
    const recoverWithHold = async (ctx: RunContext, auth: Session) => {
        const { hold, secret } = await holdFor(ctx);
        const memory = memoryStorage();
        const result = await strategy(memory.storage).executeRecovery!({
            token: auth.token,
            providerType: 'firebase',
            input: {
                method: 'escrow',
                holdId: hold.holdId,
                resumeToken: hold.resumeToken,
                clientEphemeralPrivateKey: hold.clientEphemeralPrivateKey,
                expectations: hold.expectations,
            },
            didFromPrivateKey: sdk.did,
            signDidAuthVp: sdk.sign,
            // Without the contact the next hold start fails with Policy.
            options: {
                recoveryEmail: secret.recoveryEmail,
                recoveryLanguage: secret.recoveryLanguage,
            },
        });
        return { result, deviceState: memory.snapshot() };
    };
    /** Persist the recovered device state BEFORE any further I/O; drop the spent hold. */
    const persistRecovered = async (ctx: RunContext, deviceState: AccountSecret['deviceState']) => {
        const secret = await readSecret(ctx.run.label);
        const { hold: _spent, ...rest } = secret;
        await writeSecret(ctx.run.label, {
            ...rest,
            deviceState,
            lastReleasedRunId: ctx.run.runId,
        });
    };
    /** `escrowEnrolled`: the SDK's flag (`undefined` only when replaying a lost ledger write). */
    const reenrolled = async (
        ctx: RunContext,
        auth: Session,
        escrowEnrolled: boolean | undefined
    ): Promise<boolean> => {
        if (escrowEnrolled === false) return false;
        try {
            const secret = await readSecret(ctx.run.label);
            const identity = await sdk.attest();
            // Signed authority state: active enrollment at the configured generation.
            await sdk.authority(secret, auth.token, identity);
            return true;
        } catch {
            return false;
        }
    };
    const clearHold = async (label: string): Promise<void> => {
        const secret = await readSecret(label);
        if (!secret.hold) return;
        const { hold: _cleared, ...rest } = secret;
        await writeSecret(label, rest);
    };

    // -- state handlers -----------------------------------------------------
    const confirmWith = async (ctx: RunContext, code: string): Promise<void> => {
        const { hold } = await holdFor(ctx);
        try {
            await strategy().confirmEscrowRecovery!({
                holdId: hold.holdId,
                resumeToken: hold.resumeToken,
                code,
                expectations: hold.expectations,
            });
        } catch (error) {
            // Never resubmit: every non-idempotent confirm spends one of five guesses.
            outcome('Tier3.Confirmed', 0, ctx, error);
            await close(ctx, 'confirm_failed', { state: 'orphaned' }, { failed: ['Confirmed'] });
            return;
        }
        const confirmedAt = now();
        let status: EscrowHoldStatus | null;
        try {
            // The SDK's own status type carries the (verified) signed hold record.
            status = (await strategy().getEscrowRecoveryStatus!({
                holdId: hold.holdId,
                resumeToken: hold.resumeToken,
                expectations: hold.expectations,
            })) as EscrowHoldStatus | null;
        } catch (error) {
            outcome('Tier3.Confirmed', 0, ctx, error);
            await close(ctx, 'status_failed', { state: 'orphaned' }, { failed: ['Confirmed'] });
            return;
        }
        const releaseAfter = status ? Date.parse(status.releaseAfter) : NaN;
        if (
            !status ||
            status.status !== 'pending' ||
            status.confirmed !== true ||
            status.holdRecord?.holdDurationMs !== config.holdDurationMs ||
            !confirmWindowOk({
                releaseAfter,
                confirmCallStartedAt: ctx.run.confirmCallStartedAt ?? confirmedAt,
                confirmedAt,
                holdDurationMs: config.holdDurationMs,
            })
        ) {
            outcome('Tier3.Confirmed', 0, ctx, failure('deadline_mismatch'));
            await close(ctx, 'deadline_mismatch', { state: 'orphaned' }, { failed: ['Confirmed'] });
            return;
        }
        await ledger.write([
            replace(ctx.run, { state: 'waiting', confirmedAt }, confirmedAt),
            observe(ctx, 'Confirmed', confirmedAt, confirmedAt),
            ...(ctx.run.kind === 'daily'
                ? [
                      putStep(
                          ctx.run.runId,
                          'Warning',
                          confirmedAt + STEP_DEADLINES.Warning,
                          confirmedAt
                      ),
                  ]
                : []),
        ]);
        outcome('Tier3.Confirmed', 1, ctx);
    };

    const codeDeadline = (ctx: RunContext) => ctx.run.startRequestedAt + CODE_TTL_MS - SKEW_MS;

    const awaitCode = async (initial: RunContext, pollMs: number): Promise<void> => {
        let ctx = initial;
        await holdFor(ctx);
        const policy = await policyFor(ctx.run.label);
        const started = now();
        for (;;) {
            const result = await findMessage(
                inbox,
                prefixFor(ctx.run.label),
                'code',
                ctx.run.startRequestedAt,
                policy
            );
            if (result.untrusted > 0)
                diagnostic('codeEmail', failure('email_untrusted'), ctx.run.label);
            if (result.found) {
                const at = now();
                const found = result.found;
                deps.emit(
                    'Tier3.EmailLatency',
                    Math.max(0, found.lastModified - ctx.run.startRequestedAt),
                    undefined,
                    undefined,
                    {
                        holdAccount: ctx.run.label as `hold-${string}`,
                        kind: 'code',
                    }
                );
                if (at >= codeDeadline(ctx)) break;
                // Record WHICH object is being submitted (never the code) before confirming.
                ctx = await update(ctx, c => [
                    replace(
                        c.run,
                        {
                            state: 'confirming',
                            codeObjectKey: found.key,
                            codeObservedAt: found.lastModified,
                            confirmCallStartedAt: c.run.confirmCallStartedAt ?? at,
                        },
                        at
                    ),
                    observe(c, 'CodeEmail', found.lastModified, at),
                ]);
                await confirmWith(ctx, found.template.code);
                return;
            }
            if (now() >= codeDeadline(ctx) || now() - started >= pollMs) break;
            await sleep(POLL_INTERVAL_MS);
        }
        if (now() >= codeDeadline(ctx)) {
            outcome('Tier3.Confirmed', 0, ctx, { reason: 'codeExpired' });
            await close(
                ctx,
                'code_expired',
                { state: 'orphaned' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
        }
    };

    const handleConfirming = async (ctx: RunContext): Promise<void> => {
        // Crash after recording the object but before the result: resubmit ONCE.
        // The enclave's idempotent branch answers a repeated confirm safely.
        if (ctx.run.confirmRetried || now() >= codeDeadline(ctx) || !ctx.run.codeObjectKey) {
            outcome('Tier3.Confirmed', 0, ctx, failure('interrupted'));
            await close(
                ctx,
                'confirm_interrupted',
                { state: 'orphaned' },
                { failed: ['Confirmed'] }
            );
            return;
        }
        const at = now();
        ctx = await update(ctx, c => [replace(c.run, { confirmRetried: true }, at)]);
        const found = await readKnownMessage(
            inbox,
            ctx.run.codeObjectKey!,
            'code',
            await policyFor(ctx.run.label)
        );
        if (!found) {
            outcome('Tier3.Confirmed', 0, ctx, failure('email_missing'));
            await close(
                ctx,
                'confirm_interrupted',
                { state: 'orphaned' },
                { failed: ['Confirmed'] }
            );
            return;
        }
        await confirmWith(ctx, found.template.code);
    };

    const handleStarting = async (ctx: RunContext): Promise<void> => {
        const secret = await readSecret(ctx.run.label);
        if (secret.hold?.runId === ctx.run.runId) {
            // The hold was persisted; only the ledger transition was lost.
            const at = now();
            const next = await update(ctx, c => [
                replace(c.run, { state: 'awaiting_code', startedAt: secret.hold!.requestedAt }, at),
            ]);
            outcome('Tier3.Started', 1, next, undefined, true);
            await awaitCode(next, 0);
            return;
        }
        if (ctx.run.startCallAt === undefined) {
            // Crashed before calling start: no hold can exist.
            diagnostic('start', failure('interrupted'), ctx.run.label);
            await close(ctx, 'start_not_called', { state: 'idle' });
            return;
        }
        outcome('Tier3.Started', 0, ctx, failure('start_lost'));
        await close(
            ctx,
            'start_lost',
            { state: 'orphaned' },
            { failed: ['CodeEmail', 'Confirmed'] }
        );
    };

    const startRun = async (kind: 'daily' | 'cancel', slot: string): Promise<boolean> => {
        const at = now();
        const pools = (await ledger.getMany(POOL_LABELS(config.poolSize).map(keys.pool))).filter(
            (item): item is PoolItem => item.type === 'pool'
        );
        const candidate = pools
            .filter(
                pool =>
                    (pool.state === 'idle' || pool.state === 'cooling') &&
                    (pool.availableAt === undefined || pool.availableAt <= at)
            )
            .sort(
                (a, b) => a.lastReturnedAt - b.lastReturnedAt || a.label.localeCompare(b.label)
            )[0];
        if (!candidate) return false; // PoolAvailable (evaluator) and StartAge page instead.
        const runId = `${kind}-${slot}-${candidate.label}`;
        const common = { env: config.environment, version: 1, updatedAt: at };
        try {
            await ledger.write([
                create({ ...keys.slot(kind, slot), ...common, type: 'slot', runId }),
                replace(
                    candidate,
                    {
                        state: 'busy',
                        runId,
                        stateSince: at,
                        availableAt: undefined,
                        orphanCleanupAttempted: false,
                    },
                    at
                ),
                create({
                    ...keys.run(runId),
                    ...common,
                    type: 'run',
                    runId,
                    kind,
                    label: candidate.label,
                    state: 'starting',
                    startRequestedAt: at,
                }),
                putStep(runId, 'CodeEmail', at + STEP_DEADLINES.CodeEmail, at),
                putStep(runId, 'Confirmed', at + STEP_DEADLINES.Confirmed, at),
            ]);
        } catch (error) {
            if (error instanceof LedgerConflictError) return true;
            throw error;
        }
        let ctx = await loadRun(runId, candidate.label);
        let auth: Session;
        try {
            auth = await session(candidate.label);
        } catch (error) {
            outcome('Tier3.Started', 0, ctx, error);
            await close(
                ctx,
                'start_not_called',
                { state: 'idle' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
            return true;
        }
        ctx = await update(ctx, c => [replace(c.run, { startCallAt: now() }, now())]);
        const memory = memoryStorage();
        let start;
        try {
            // The app's own call: no release policy, no restart, Nitro DID binding.
            start = await sdk.strategy(memory.storage).startEscrowRecovery!({
                token: auth.token,
                providerType: 'firebase',
                expectedDid: auth.secret.did,
            });
        } catch (error) {
            outcome('Tier3.Started', 0, ctx, error);
            await close(
                ctx,
                'start_failed',
                { state: 'orphaned' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
            return true;
        }
        const full = start as typeof start & {
            clientEphemeralPrivateKey?: string;
            expectations?: NonNullable<AccountSecret['hold']>['expectations'];
            codeSent?: boolean;
        };
        if (full.resumeToken === null || typeof full.resumeToken !== 'string') {
            // An existing pending hold was reported: nothing of ours to resume.
            outcome('Tier3.Started', 0, ctx, failure('existing_hold'));
            await close(
                ctx,
                'existing_hold',
                { state: 'orphaned' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
            return true;
        }
        if (
            !full.expectations ||
            !full.clientEphemeralPrivateKey ||
            full.expectations.did !== auth.secret.did ||
            full.expectations.holdId !== full.holdId
        ) {
            outcome('Tier3.Started', 0, ctx, failure('evidence'));
            await close(
                ctx,
                'start_evidence',
                { state: 'orphaned' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
            return true;
        }
        // Persist resume material before any later I/O.
        await writeSecret(candidate.label, {
            ...(await readSecret(candidate.label)),
            hold: {
                runId,
                holdId: full.holdId,
                resumeToken: full.resumeToken,
                clientEphemeralPrivateKey: full.clientEphemeralPrivateKey,
                expectations: { ...full.expectations },
                requestedAt: at,
            },
        });
        if (full.codeSent !== true) {
            outcome('Tier3.Started', 0, ctx, failure('code_not_sent'));
            await close(
                ctx,
                'code_not_sent',
                { state: 'orphaned' },
                { failed: ['CodeEmail', 'Confirmed'] }
            );
            return true;
        }
        ctx = await update(ctx, c => [
            replace(c.run, { state: 'awaiting_code', startedAt: now() }, now()),
        ]);
        outcome('Tier3.Started', 1, ctx);
        await awaitCode(ctx, config.codePollMs);
        return true;
    };

    const handleWaitingDaily = async (ctx: RunContext): Promise<void> => {
        const confirmedAt = ctx.run.confirmedAt!;
        if (now() < confirmedAt + 6 * 86_400_000) return;
        const result = await findMessage(
            inbox,
            prefixFor(ctx.run.label),
            'warning',
            confirmedAt,
            await policyFor(ctx.run.label)
        );
        if (result.untrusted > 0) diagnostic('warning', failure('email_untrusted'), ctx.run.label);
        if (!result.found) return; // Overdue (evaluator) pages after confirm + 6d + 2h.
        const arrival = result.found.lastModified;
        if (result.found.template.hours !== WARNING_HOURS) {
            outcome('Tier3.Warned', 0, ctx, failure('malformed'));
            await close(ctx, 'warning_malformed', { state: 'orphaned' }, { failed: ['Warning'] });
            return;
        }
        if (ctx.run.warningObservedAt === undefined)
            ctx = await update(ctx, c => [replace(c.run, { warningObservedAt: arrival }, now())]);
        const { hold } = await holdFor(ctx);
        const status = await strategy().getEscrowRecoveryStatus!({
            holdId: hold.holdId,
            resumeToken: hold.resumeToken,
            expectations: hold.expectations,
        });
        if (!status || status.status !== 'pending') {
            outcome('Tier3.Warned', 0, ctx, failure('invalid_hold'));
            await close(ctx, 'warning_status', { state: 'orphaned' }, { failed: ['Warning'] });
            return;
        }
        const releaseAfter = Date.parse(status.releaseAfter);
        if (
            !deadlineSane({
                releaseAfter,
                confirmedAt,
                warningArrival: arrival,
                holdDurationMs: config.holdDurationMs,
            })
        ) {
            // lca-api saves the recomputed deadline only after the enclave sends the warning.
            const warning = ctx.steps.get('Warning');
            if (
                warning &&
                warningDeadlineExpired({
                    now: now(),
                    warningDueAt: warning.dueAt,
                    warningArrival: arrival,
                })
            ) {
                outcome('Tier3.Warned', 0, ctx, failure('deadline_mismatch'));
                await close(
                    ctx,
                    'deadline_mismatch',
                    { state: 'orphaned' },
                    { failed: ['Warning'] }
                );
            }
            return;
        }
        let refusal: unknown;
        if (ctx.run.earlyRefusalCheckedAt !== undefined) {
            // A crash interrupted the one early attempt: its result is unknown.
            refusal = failure('interrupted');
        } else if (now() < releaseAfter - SKEW_MS) {
            const auth = await session(ctx.run.label);
            ctx = await update(ctx, c => [replace(c.run, { earlyRefusalCheckedAt: now() }, now())]);
            try {
                const { result, deviceState } = await recoverWithHold(ctx, auth);
                // Released before the deadline: a safety failure. Keep the account usable.
                await persistRecovered(ctx, deviceState);
                const ok =
                    result.did === auth.secret.did &&
                    (await reenrolled(ctx, auth, result.escrowEnrolled === true));
                outcome('Tier3.Warned', 0, ctx, failure('early_release'));
                await close(
                    ctx,
                    'early_release',
                    ok ? { state: 'idle' } : { state: 'quarantined', reason: 'early_release' },
                    { failed: ['Warning'] }
                );
                return;
            } catch (error) {
                const kind = await classifyRefusal(ctx, error).catch(() => 'other' as const);
                if (kind !== 'waiting') {
                    outcome('Tier3.Warned', 0, ctx, error);
                    await close(
                        ctx,
                        'early_not_refused',
                        { state: 'orphaned' },
                        { failed: ['Warning'] }
                    );
                    return;
                }
            }
        }
        const at = now();
        await ledger.write([
            replace(ctx.run, { state: 'warned', releaseAfter }, at),
            refusal === undefined
                ? observe(ctx, 'Warning', arrival, at)
                : replace(
                      ctx.steps.get('Warning')!,
                      { observedAt: arrival, outcome: '0', reason: 'interrupted' },
                      at
                  ),
            putStep(ctx.run.runId, 'Released', releaseAfter + STEP_DEADLINES.Released, at),
            putStep(ctx.run.runId, 'Reenrolled', releaseAfter + STEP_DEADLINES.Released, at),
        ]);
        outcome('Tier3.Warned', refusal === undefined ? 1 : 0, ctx, refusal);
    };

    const finishRelease = async (
        ctx: RunContext,
        auth: Session,
        escrowEnrolled: boolean | undefined,
        duplicate: boolean
    ): Promise<void> => {
        const releasedAt = ctx.run.releasedAt ?? now();
        const ok = await reenrolled(ctx, auth, escrowEnrolled);
        await close(
            ctx,
            ok ? 'reenrolled' : 'not_enrolled',
            ok ? { state: 'idle' } : { state: 'quarantined', reason: 'not_enrolled' },
            {
                observed: { Released: releasedAt, ...(ok ? { Reenrolled: now() } : {}) },
                failed: ['Reenrolled'],
                run: { releasedAt, ...(ok ? { reenrolledAt: now() } : {}) },
            }
        );
        outcome('Tier3.Released', 1, ctx, undefined, duplicate);
        outcome(
            'Tier3.Reenrolled',
            ok ? 1 : 0,
            ctx,
            ok ? undefined : failure('not_enrolled'),
            duplicate
        );
    };

    const handleWarned = async (ctx: RunContext): Promise<void> => {
        if (!releaseDue(now(), ctx.run.releaseAfter!)) return;
        const auth = await session(ctx.run.label);
        // Claim BEFORE executeRecovery: a crash from here is never retried blindly.
        ctx = await update(ctx, c => [
            replace(c.run, { state: 'releasing', releaseClaimedAt: now() }, now()),
        ]);
        let recovered;
        try {
            recovered = await recoverWithHold(ctx, auth);
        } catch (error) {
            const kind = await classifyRefusal(ctx, error).catch(() => 'other' as const);
            const due = ctx.steps.get('Released')?.dueAt ?? 0;
            if ((kind === 'waiting' || kind === 'retry') && now() < due) {
                // Hold still pending (refused before claim, or claim reopened): retry next tick.
                diagnostic('release', error, ctx.run.label);
                await update(ctx, c => [
                    replace(c.run, { state: 'warned', releaseClaimedAt: undefined }, now()),
                ]);
                return;
            }
            outcome('Tier3.Released', 0, ctx, error);
            await close(
                ctx,
                'release_failed',
                { state: 'quarantined', reason: 'release_failed' },
                { failed: ['Released'] }
            );
            return;
        }
        const { result, deviceState } = recovered;
        if (
            result.did !== auth.secret.did ||
            (await sdk.did(result.privateKey)) !== auth.secret.did
        ) {
            outcome('Tier3.Released', 0, ctx, failure('did_mismatch'));
            await close(
                ctx,
                'did_mismatch',
                { state: 'quarantined', reason: 'did_mismatch' },
                { failed: ['Released'] }
            );
            return;
        }
        await persistRecovered(ctx, deviceState);
        await finishRelease(ctx, auth, result.escrowEnrolled === true, false);
    };

    const handleReleasing = async (ctx: RunContext): Promise<void> => {
        const secret = await readSecret(ctx.run.label);
        if (secret.lastReleasedRunId === ctx.run.runId) {
            // Release and secret write finished; only the ledger write was lost.
            await finishRelease(ctx, await session(ctx.run.label), undefined, true);
            return;
        }
        // Never call executeRecovery again: the claim/rebind make a blind retry unsafe.
        outcome('Tier3.Released', 0, ctx, failure('release_interrupted'));
        await close(
            ctx,
            'release_interrupted',
            { state: 'quarantined', reason: 'release_interrupted' },
            { failed: ['Released'] }
        );
    };

    const assertCancelledRefusal = async (ctx: RunContext, auth: Session): Promise<void> => {
        try {
            const { deviceState } = await recoverWithHold(ctx, auth);
            await persistRecovered(ctx, deviceState);
            outcome('Tier3.Cancelled', 0, ctx, failure('cancel_not_refused'));
            await close(
                ctx,
                'cancel_not_refused',
                { state: 'quarantined', reason: 'cancel_not_refused' },
                { failed: ['Cancelled'] }
            );
            return;
        } catch (error) {
            const kind = await classifyRefusal(ctx, error).catch(() => 'other' as const);
            if (kind !== 'cancelled') {
                outcome('Tier3.Cancelled', 0, ctx, failure('cancel_not_refused'));
                await close(
                    ctx,
                    'cancel_not_refused',
                    { state: 'orphaned' },
                    { failed: ['Cancelled'] }
                );
                return;
            }
        }
        await clearHold(ctx.run.label);
        const at = now();
        await close(
            ctx,
            'cancelled',
            { state: 'cooling' },
            { observed: { Cancelled: at }, run: { cancelledAt: at } }
        );
        outcome('Tier3.Cancelled', 1, ctx);
    };

    const handleWaitingCancel = async (ctx: RunContext): Promise<void> => {
        const auth = await session(ctx.run.label);
        const at = now();
        ctx = await update(ctx, c => [
            putStep(c.run.runId, 'Cancelled', at + STEP_DEADLINES.Cancelled, at),
            replace(c.run, { state: 'cancelling', cancelRequestedAt: at }, at),
        ]);
        let cancelled: boolean;
        try {
            cancelled = (
                await strategy().cancelEscrowRecovery!({
                    token: auth.token,
                    providerType: 'firebase',
                    privateKey: auth.secret.privateKey,
                    signDidAuthVp: sdk.sign,
                })
            ).cancelled;
        } catch (error) {
            outcome('Tier3.Cancelled', 0, ctx, error);
            await close(ctx, 'cancel_failed', { state: 'orphaned' }, { failed: ['Cancelled'] });
            return;
        }
        if (cancelled !== true) {
            outcome('Tier3.Cancelled', 0, ctx, failure('invalid_hold'));
            await close(ctx, 'cancel_failed', { state: 'orphaned' }, { failed: ['Cancelled'] });
            return;
        }
        await assertCancelledRefusal(ctx, auth);
    };

    const handleCancelling = async (ctx: RunContext): Promise<void> => {
        const { hold } = await holdFor(ctx);
        const status = await strategy().getEscrowRecoveryStatus!({
            holdId: hold.holdId,
            resumeToken: hold.resumeToken,
            expectations: hold.expectations,
        });
        if (status?.status === 'cancelled') {
            await assertCancelledRefusal(ctx, await session(ctx.run.label));
            return;
        }
        outcome('Tier3.Cancelled', 0, ctx, failure('interrupted'));
        await close(ctx, 'cancel_interrupted', { state: 'orphaned' }, { failed: ['Cancelled'] });
    };

    /** The user's own cancel path (DID-authenticated); never edits escrow state. */
    const cleanupOrphan = async (pool: PoolItem): Promise<void> => {
        const at = now();
        await ledger.write([replace(pool, { orphanCleanupAttempted: true }, at)]);
        const claimed = (await ledger.get(keys.pool(pool.label))) as PoolItem;
        try {
            const auth = await session(pool.label);
            const { cancelled } = await strategy().cancelEscrowRecovery!({
                token: auth.token,
                providerType: 'firebase',
                privateKey: auth.secret.privateKey,
                signDidAuthVp: sdk.sign,
            });
            await clearHold(pool.label);
            await ledger.write([
                poolAfter(claimed, { state: cancelled ? 'cooling' : 'idle' }, now()),
            ]);
        } catch (error) {
            diagnostic('cleanup', failure('cleanup_failed'), pool.label);
            await ledger.write([
                poolAfter(claimed, { state: 'quarantined', reason: 'cleanup_failed' }, now()),
            ]);
            if (error instanceof RunnerAuthError) return;
        }
    };

    // -- tick ---------------------------------------------------------------
    const at = now();
    let meta = (await ledger.get(keys.meta)) as MetaItem | undefined;
    if (!meta) {
        try {
            await ledger.write([
                create({
                    ...keys.meta,
                    type: 'meta',
                    env: config.environment,
                    version: 1,
                    updatedAt: at,
                    enabledAt: at,
                    paused: false,
                }),
            ]);
        } catch (error) {
            if (!(error instanceof LedgerConflictError)) throw error;
        }
        meta = (await ledger.get(keys.meta)) as MetaItem | undefined;
    }
    if (!meta || meta.type !== 'meta') throw failure('ledger');
    if (meta.paused) return;
    const pools = (await ledger.getMany(POOL_LABELS(config.poolSize).map(keys.pool))).filter(
        (item): item is PoolItem => item.type === 'pool'
    );
    // `tier3-admin init-pool` is a precondition for enabling tier 3.
    if (pools.length !== config.poolSize) throw failure('config');

    const order: Record<string, number> = {
        releasing: 0,
        warned: 1,
        waiting: 2,
        cancelling: 3,
        confirming: 4,
        awaiting_code: 5,
        starting: 6,
    };
    const open: RunContext[] = [];
    for (const pool of pools)
        if (pool.state === 'busy' && pool.runId) {
            try {
                const ctx = await loadRun(pool.runId, pool.label);
                if (ctx.run.state !== 'closed') open.push(ctx);
            } catch (error) {
                diagnostic('ledger', error, pool.label);
            }
        }
    open.sort((a, b) => order[a.run.state] - order[b.run.state]);
    for (const ctx of open) {
        try {
            switch (ctx.run.state) {
                case 'releasing':
                    await handleReleasing(ctx);
                    break;
                case 'warned':
                    await handleWarned(ctx);
                    break;
                case 'waiting':
                    await (ctx.run.kind === 'daily'
                        ? handleWaitingDaily(ctx)
                        : handleWaitingCancel(ctx));
                    break;
                case 'cancelling':
                    await handleCancelling(ctx);
                    break;
                case 'confirming':
                    await handleConfirming(ctx);
                    break;
                case 'awaiting_code':
                    await awaitCode(ctx, 0);
                    break;
                case 'starting':
                    await handleStarting(ctx);
                    break;
            }
        } catch (error) {
            // Another invocation owns the transition, or an unexpected error: never retried blindly.
            if (!(error instanceof LedgerConflictError)) diagnostic('ledger', error, ctx.run.label);
        }
    }

    const orphan = pools.find(
        pool =>
            pool.state === 'orphaned' &&
            !pool.orphanCleanupAttempted &&
            now() >= pool.stateSince + config.orphanCleanupDelayMs
    );
    if (orphan) {
        const fresh = (await ledger.get(keys.pool(orphan.label))) as PoolItem | undefined;
        if (fresh?.state === 'orphaned' && !fresh.orphanCleanupAttempted)
            await cleanupOrphan(fresh).catch(error => {
                if (!(error instanceof LedgerConflictError))
                    diagnostic('cleanup', error, orphan.label);
            });
    }

    // At most one code-sending action per tick (per-DID send budget; poll time).
    const tickNow = now();
    if (isDailyStartDue(tickNow, config.startHourUtc)) {
        const slot = dayKey(tickNow);
        if (!(await ledger.get(keys.slot('daily', slot)))) {
            await startRun('daily', slot);
            return;
        }
    }
    if (isCancelDue(tickNow, config.startHourUtc)) {
        const slot = isoWeekKey(tickNow);
        if (!(await ledger.get(keys.slot('cancel', slot)))) await startRun('cancel', slot);
    }
};
