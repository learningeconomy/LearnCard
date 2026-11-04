import { getLogger } from '../logging/logger';
const log = getLogger('auth-coordinator');
let logoutAttempt = 0;
/**
 * Auth Coordinator
 *
 * Unified state machine that coordinates authentication and key derivation.
 * Provides a single source of truth for auth state across the application.
 *
 * This coordinator is designed to be:
 * - Auth provider agnostic (Firebase, Supertokens, OIDC, etc.)
 * - Key derivation strategy agnostic (SSS, Web3Auth, MPC, etc.)
 * - Easily testable with mock providers
 * - Shareable across apps (LearnCard, Scouts, etc.)
 *
 * The coordinator delegates all server communication and recovery logic
 * to the KeyDerivationStrategy, keeping itself a pure state machine.
 */

import { withDeadline, withDeadlineOr } from '../helpers/withDeadline';
import { withNetworkFault } from '../helpers/networkFault';
import { isNetworkError } from '../helpers/networkError';
import {
    ESCROW_PIN_MAX_ATTEMPTS,
    IdentityRecoverySessionConsumedError,
    DuplicateShareCoordinateError,
    createAdaptiveStorage,
    deleteDeviceShare,
} from '@learncard/sss-key-manager';

import { AuthSessionError } from './types';
import { RecoveryInProgressError, SameEscrowPinError } from './errors';
import type { MigrationIdentityVerdict, MigrationKeySource } from './types';

const DEFAULT_AUTH_SESSION_TIMEOUT_MS = 2500;

export const MIGRATION_IDENTITY_MISMATCH_MESSAGE =
    "We couldn't safely upgrade your account because the sign-in key didn't match it. " +
    'Nothing was changed. Please contact support (MIGRATION_IDENTITY_MISMATCH).';
const DEFAULT_SERVER_STATUS_TIMEOUT_MS = 4000;

import type {
    AuthProvider,
    AuthUser,
    AuthCoordinatorConfig,
    PinChangeGuardStorage,
    EscrowEnrollmentState,
    EscrowRecoveryExpectations,
    KeyDerivationStrategy,
    PinSignInInfo,
    RecoveryMethodInfo,
    RecoveryReason,
    RecoveryResult,
    ServerKeyStatus,
    SssActivationState,
    UnifiedAuthState,
} from './types';
import type { RevokeOtherDevicesResult } from '@learncard/types';

/** True for recovery inputs that consume a single-use escrow hold (delay or PIN release). */
const isEscrowRecoveryMethod = (input: unknown): boolean =>
    typeof input === 'object' &&
    input !== null &&
    'method' in input &&
    (input.method === 'escrow' || input.method === 'escrow-pin');

/** Narrows to a PIN-release input so `expectedDid` can be filled in from state. */
const isEscrowPinInput = (
    input: unknown
): input is {
    method: 'escrow-pin';
    pin: string;
    expectedDid?: string;
    recoverySessionToken?: string;
} =>
    typeof input === 'object' &&
    input !== null &&
    'method' in input &&
    input.method === 'escrow-pin';

const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

/**
 * Equality tag of a PIN for the "choose a new PIN" guard (E): HMAC-SHA-256 over the
 * DID and the PIN, keyed by a hash of the account's private key. Only someone who
 * already holds that key can test PIN candidates against it, so the tag can be kept
 * across app starts. Never sent or logged. Undefined when Web Crypto is unavailable
 * (the check is then skipped).
 */
const pinGuardTag = async (
    privateKey: string,
    did: string,
    pin: string
): Promise<string | undefined> => {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return undefined;
    try {
        const encoder = new TextEncoder();
        const keyBytes = await subtle.digest(
            'SHA-256',
            encoder.encode(`learncard:pin-change-guard:v1:${privateKey}`)
        );
        const key = await subtle.importKey(
            'raw',
            keyBytes,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const tag = await subtle.sign('HMAC', key, encoder.encode(`${did}\u0000${pin}`));
        return toHex(new Uint8Array(tag));
    } catch {
        return undefined;
    }
};

const PIN_GUARD_STORAGE_PREFIX = 'learncard:pin-change-guard:';
/**
 * A PIN sign-in's tag until that sign-in completes. Never read as a guard: a sign-in
 * that is cancelled or abandoned (even across a restart) must not leave its PIN refused.
 * It survives a restart only so a lost-login sign-in that finishes after the new
 * login's redirect can still promote it.
 */
const PIN_GUARD_PENDING_STORAGE_PREFIX = 'learncard:pin-change-guard-pending:';

/** `localStorage` when this runtime has a working one; otherwise the guard is memory-only. */
const defaultPinGuardStorage = (): PinChangeGuardStorage | null => {
    try {
        const storage = (globalThis as { localStorage?: PinChangeGuardStorage }).localStorage;
        return storage && typeof storage.getItem === 'function' ? storage : null;
    } catch {
        return null;
    }
};

/** Legacy strategies resolve a bare state string; PIN-aware strategies resolve the full object. */
const normalizeEscrowEnrollmentState = (
    result: EscrowEnrollmentState['state'] | EscrowEnrollmentState | undefined
): EscrowEnrollmentState => {
    if (result === undefined) return { state: 'disabled' };
    if (typeof result === 'string') return { state: result };
    return result;
};

export class AuthCoordinator {
    private state: UnifiedAuthState = { status: 'idle' };
    private config: AuthCoordinatorConfig;
    private keyDerivation: KeyDerivationStrategy;
    private recoveryGeneration = 0;
    /**
     * One recovery at a time (D): every recovery input and the lost-login session steps
     * share a single-use session and one pending identity, so a second call is rejected
     * with RecoveryInProgressError before it touches any state. Each claim records the
     * recovery generation it started in; see runExclusiveRecovery.
     */
    private recoveryClaims = new Set<{ generation: number }>();
    private escrowStatusGeneration = 0;
    /**
     * Set only when a recovery's direct escrow re-enrollment failed or was deferred.
     * A PIN recovery that re-enrolled with the proven PIN (`escrowEnrolled: true`)
     * never sets it, so its PIN is not cleared; the fallback repair always clears.
     */
    private recoveredEscrowAccount?: {
        did: string;
        userId: string;
        clearPin: true;
        /** Only recovery from an existing escrow enrollment skips the rollout gate. */
        bypassRolloutGate: boolean;
    };
    private escrowOperations = new Set<Promise<unknown>>();
    private endingSession = false;
    private destroyed = false;
    /**
     * Wrong PIN entries as first reported for this account in this session, before any
     * attempt here, keyed by account so later refreshes (which include this session's
     * misses) never overwrite it. Cleared once consumed into `ready.pinSignIn`.
     */
    private pinAttemptBaseline?: { account: string; wrongAttempts?: number };
    /**
     * Tag of the PIN used for a PIN sign-in whose PIN has recorded wrong entries, so
     * `setEscrowPin` / `secureAccount` can reject re-using it. Also persisted per DID
     * (config.pinChangeGuardStorage) so the rule survives an app restart, but only once
     * that sign-in completes (until then the tag is pending, see
     * PIN_GUARD_PENDING_STORAGE_PREFIX); cleared once a new PIN is set, the account is
     * secured, the PIN shows no wrong entries, or the device is forgotten.
     */
    private signInPinDigest?: { did: string; tag: string };
    private readonly pinGuardStorage: PinChangeGuardStorage | null;
    /** Account whose "choose a new PIN" prompt was dismissed for this session. */
    private escrowPinChangeDismissed?: string;
    /** Recovery state replaced by a provisional re-derive; see needRecovery(). */
    private recoveryFallback: UnifiedAuthState | null = null;
    private stopEscrowPolling?: () => void;

    static readonly ESCROW_STATUS_REFRESH_MS = 60_000;

    /** Upper bound on waiting for in-flight escrow writes before logout / forget-device proceeds. */
    static readonly ESCROW_DRAIN_TIMEOUT_MS = 10_000;

    /** Drain escrow writes before clearing a device or changing its signed-in identity. */
    private async runEscrowOperation<T>(operation: () => Promise<T>): Promise<T> {
        if (this.endingSession) throw new Error('This recovery request was cancelled.');
        const pending = operation();
        this.escrowOperations.add(pending);
        try {
            return await pending;
        } finally {
            this.escrowOperations.delete(pending);
        }
    }

    /**
     * Wait for outstanding escrow writes, but never indefinitely: a stalled
     * network request must not block the user from logging out.
     */
    private async drainEscrowOperations(): Promise<void> {
        if (this.escrowOperations.size === 0) return;
        await withDeadlineOr(Promise.allSettled(this.escrowOperations), undefined, {
            ms: AuthCoordinator.ESCROW_DRAIN_TIMEOUT_MS,
            label: 'escrow drain',
            onTimeout: () => log.warn('Escrow operations did not settle before session end'),
        });
    }

    constructor(config: AuthCoordinatorConfig) {
        this.config = config;
        this.keyDerivation = config.keyDerivation;
        this.pinGuardStorage =
            config.pinChangeGuardStorage === undefined
                ? defaultPinGuardStorage()
                : config.pinChangeGuardStorage;
    }

    getState(): UnifiedAuthState {
        return this.state;
    }

    private setState(nextState: UnifiedAuthState): void {
        const newState = this.withEscrowPinChangeFlag(nextState);
        if (newState.status === 'idle') this.recoveredEscrowAccount = undefined;
        this.capturePinAttemptBaseline(newState);
        if (newState.status !== 'ready') this.escrowStatusGeneration++;
        const enteringReady =
            newState.status === 'ready' &&
            (this.state.status !== 'ready' ||
                (!this.state.authSessionValid && newState.authSessionValid));
        this.state = newState;
        if (newState.status !== 'ready' || !newState.authSessionValid) {
            this.stopEscrowPolling?.();
        } else if (!this.stopEscrowPolling && !this.endingSession && !this.destroyed) {
            this.startEscrowPolling();
        }
        this.config.onStateChange?.(newState);
        if (enteringReady && newState.status === 'ready' && newState.authSessionValid) {
            void this.refreshEscrow(newState);
        }
    }

    /** Poll only hold status; background discovery must never rotate shares. */
    private startEscrowPolling(): void {
        if (typeof document === 'undefined' || !this.keyDerivation.getEscrowRecoveryStatus) return;
        let stopped = false;
        let inFlight = false;
        const refresh = async (): Promise<void> => {
            const ready = this.state;
            if (
                stopped ||
                inFlight ||
                this.endingSession ||
                ready.status !== 'ready' ||
                !ready.authSessionValid ||
                document.visibilityState !== 'visible'
            )
                return;
            const generation = this.escrowStatusGeneration;
            const isCurrent = () =>
                !stopped &&
                !this.endingSession &&
                generation === this.escrowStatusGeneration &&
                this.state.status === 'ready' &&
                this.state.authSessionValid &&
                this.state.privateKey === ready.privateKey &&
                this.state.authUser?.id === ready.authUser?.id;
            inFlight = true;
            try {
                const credentials = await this.getAuthCredentials();
                if (!isCurrent()) return;
                const hold = await this.keyDerivation.getEscrowRecoveryStatus!(credentials);
                if (!isCurrent() || this.state.status !== 'ready') return;
                const pendingEscrowHold =
                    hold?.status === 'pending'
                        ? {
                              holdId: hold.holdId,
                              requestedAt: hold.requestedAt,
                              releaseAfter: hold.releaseAfter,
                          }
                        : undefined;
                // Only emit when the hold actually changed; avoid a render every tick.
                if (this.state.pendingEscrowHold?.holdId !== pendingEscrowHold?.holdId) {
                    this.setState({ ...this.state, pendingEscrowHold });
                }
            } catch (err) {
                log.warn('escrow.status.failed', err);
            } finally {
                inFlight = false;
            }
        };
        const onVisible = () => {
            void refresh();
        };
        const timer = setInterval(onVisible, AuthCoordinator.ESCROW_STATUS_REFRESH_MS);
        document.addEventListener('visibilitychange', onVisible);
        this.stopEscrowPolling = () => {
            stopped = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            this.stopEscrowPolling = undefined;
        };
    }

    /** Release background status observers when the coordinator is disposed. */
    destroy(): void {
        this.destroyed = true;
        this.stopEscrowPolling?.();
    }

    /**
     * Staged-rollout gate for FIRST-TIME automatic enrollment only (see
     * `AuthCoordinatorConfig.isEscrowEnrollmentAllowed`). Defaults to allowed,
     * and fails closed if the configured predicate rejects; the userKey is
     * passed through untouched and never logged here.
     */
    private async isEscrowEnrollmentAllowed(userKey: string): Promise<boolean> {
        if (!this.config.isEscrowEnrollmentAllowed) return true;
        try {
            return await this.config.isEscrowEnrollmentAllowed(userKey);
        } catch (err) {
            log.warn('escrow.rollout.check.failed', err);
            return false;
        }
    }

    /**
     * Decide whether `ensureEscrowEnrollment` may run this cycle, and hand back
     * whatever enrollment-state read was needed to decide so `refreshEscrow`
     * doesn't have to fetch it twice.
     *
     * The rollout gate only ever applies to a `not-enrolled` account — an
     * account that already has (or once had) escrow material must keep being
     * repaired regardless of bucket, because `ensureEscrowEnrollment` is also
     * the maintenance path that re-seals after a share-version rotation and
     * repairs a `stale` (mode-mismatch / key-rotated, P6.1) blob. Without this,
     * lowering the rollout percent — or simply being outside it when a
     * migration runs — would silently break recovery for people who are
     * already enrolled, which the rollout must never do.
     *
     * When no rollout predicate is configured at all, this is a no-op
     * (`{ allowed: true }`, no prefetch) so behavior is unchanged for any
     * consumer that hasn't opted into staged rollout.
     */
    private async resolveEscrowEnrollmentGate(
        userKey: string,
        credentials: { token: string; providerType: string }
    ): Promise<{
        allowed: boolean;
        prefetched?: EscrowEnrollmentState;
        requirePriorEnrollment?: boolean;
    }> {
        if (!this.config.isEscrowEnrollmentAllowed) return { allowed: true };

        if (!this.keyDerivation.getEscrowEnrollmentState) {
            // No way to know current status on this strategy — apply the gate as if new.
            return { allowed: await this.isEscrowEnrollmentAllowed(userKey) };
        }

        let prefetched: EscrowEnrollmentState;
        try {
            prefetched = normalizeEscrowEnrollmentState(
                await this.keyDerivation.getEscrowEnrollmentState(credentials)
            );
        } catch (err) {
            log.warn('escrow.pin.status.failed', err);
            // Unknown status — fail closed for a possible NEW enrollment. An already-enrolled
            // account is unaffected beyond this one cycle: the next refresh retries the lookup.
            return { allowed: await this.isEscrowEnrollmentAllowed(userKey) };
        }

        if (prefetched.state !== 'not-enrolled') {
            // enrolled / stale: always repair. opted-out / disabled: `ensureEscrowEnrollment`
            // already no-ops safely for these (its own return-type contract) — call it
            // unconditionally, exactly as before the rollout gate existed.
            return { allowed: true, prefetched };
        }

        if (await this.isEscrowEnrollmentAllowed(userKey)) return { allowed: true, prefetched };
        // A leftover (e.g. post-rebind `pending`) escrow method survives a reload where the
        // in-memory recovery marker does not. Repair it as maintenance, but only if the
        // strategy can prove prior enrollment (signed authority in Nitro mode).
        return prefetched.priorEscrowMethod
            ? { allowed: false, prefetched, requirePriorEnrollment: true }
            : { allowed: false, prefetched };
    }

    /** Best-effort repair and hold discovery must never block account access. */
    private async refreshEscrow(
        ready: Extract<UnifiedAuthState, { status: 'ready' }>
    ): Promise<void> {
        if (
            !this.keyDerivation.ensureEscrowEnrollment &&
            !this.keyDerivation.getEscrowRecoveryStatus &&
            !this.keyDerivation.getEscrowEnrollmentState
        )
            return;
        const generation = ++this.escrowStatusGeneration;
        const isCurrentAccount = () =>
            generation === this.escrowStatusGeneration &&
            this.state.status === 'ready' &&
            this.state.authSessionValid &&
            this.state.privateKey === ready.privateKey &&
            this.state.authUser?.id === ready.authUser?.id;
        try {
            const credentials = await this.getAuthCredentials();
            if (!isCurrentAccount()) return;
            const signDidAuthVp = this.config.signDidAuthVp;
            let publishedEnrollment = false;
            let enrollmentVerificationFailed = false;
            if (signDidAuthVp && this.keyDerivation.ensureEscrowEnrollment) {
                // Recovery rotates away the old enrollment; repairing it is maintenance, not rollout.
                const recovered = this.recoveredEscrowAccount;
                const repairingRecovery =
                    recovered?.did === ready.did && recovered?.userId === ready.authUser?.id;
                const gate =
                    repairingRecovery && recovered.bypassRolloutGate
                        ? { allowed: true }
                        : await this.resolveEscrowEnrollmentGate(ready.did, credentials);
                // Outside rollout, a non-escrow recovery may only repair a verified prior enrollment.
                const requirePriorEnrollment =
                    !gate.allowed &&
                    (repairingRecovery ||
                        ('requirePriorEnrollment' in gate && gate.requirePriorEnrollment === true));
                if (gate.allowed || requirePriorEnrollment) {
                    const enrollmentResult = await this.runEscrowOperation(async () =>
                        isCurrentAccount()
                            ? this.keyDerivation.ensureEscrowEnrollment?.({
                                  ...credentials,
                                  privateKey: ready.privateKey,
                                  signDidAuthVp,
                                  options: repairingRecovery
                                      ? {
                                            ...this.recoveryContactOptions(ready),
                                            clearPin: recovered.clearPin,
                                            ...(requirePriorEnrollment
                                                ? { requirePriorEnrollment: true }
                                                : {}),
                                        }
                                      : requirePriorEnrollment
                                        ? {
                                              ...this.recoveryContactOptions(ready),
                                              requirePriorEnrollment: true,
                                          }
                                        : this.recoveryContactOptions(ready),
                              })
                            : undefined
                    ).catch(err => {
                        enrollmentVerificationFailed = true;
                        log.warn('escrow.enrollment.failed', err);
                    });
                    // Keep the scoped intent through transient failures for the next refresh;
                    // drop it once repaired or once there is no prior enrollment to repair.
                    if (
                        repairingRecovery &&
                        (enrollmentResult?.enrolled ||
                            (enrollmentResult &&
                                (enrollmentResult.reason === 'not-enrolled' ||
                                    enrollmentResult.reason === 'pin-reset-required'))) &&
                        isCurrentAccount() &&
                        this.recoveredEscrowAccount === recovered
                    ) {
                        this.recoveredEscrowAccount = undefined;
                    }
                    // The strategy cleared the retired PIN without being asked; the user
                    // must be told and offered a new PIN (design doc Q1).
                    if (
                        enrollmentResult?.enrolled &&
                        enrollmentResult.changed &&
                        enrollmentResult.pinCleared === 'automatic' &&
                        isCurrentAccount() &&
                        this.state.status === 'ready'
                    ) {
                        this.setState({ ...this.state, escrowPinAutoCleared: true });
                    }
                    // Only a user-chosen PIN can resolve this; the strategy signed nothing,
                    // so later refreshes stay read-only until the user acts.
                    const pinResetRequired =
                        !!enrollmentResult &&
                        !enrollmentResult.enrolled &&
                        enrollmentResult.reason === 'pin-reset-required';
                    if (
                        enrollmentResult &&
                        isCurrentAccount() &&
                        this.state.status === 'ready' &&
                        pinResetRequired !== (this.state.escrowPinResetRequired === true)
                    ) {
                        this.setState({
                            ...this.state,
                            escrowPinResetRequired: pinResetRequired ? true : undefined,
                        });
                    }
                    if (
                        enrollmentResult &&
                        !enrollmentResult.enrolled &&
                        enrollmentResult.reason === 'opted-out' &&
                        isCurrentAccount() &&
                        this.state.status === 'ready'
                    ) {
                        this.setState({
                            ...this.state,
                            escrowEnrollment: 'opted-out',
                            escrowPin: undefined,
                        });
                        publishedEnrollment = true;
                    }
                } else if (gate.prefetched && isCurrentAccount() && this.state.status === 'ready') {
                    // The gate blocked the call precisely because the prefetch already proved
                    // this account is not-enrolled; nothing ran that could change that, so
                    // publish it without a second getEscrowEnrollmentState round-trip below.
                    this.setState({
                        ...this.state,
                        escrowPin: gate.prefetched.escrowPin,
                        escrowEnrollment: gate.prefetched.state,
                    });
                    publishedEnrollment = true;
                }
            }
            if (!isCurrentAccount()) return;
            // Do not overwrite a failed authority verification with Mongo's
            // optimistic enrolled flag. Recovery polling remains independent.
            if (
                !publishedEnrollment &&
                !enrollmentVerificationFailed &&
                this.keyDerivation.getEscrowEnrollmentState
            ) {
                try {
                    const enrollment = normalizeEscrowEnrollmentState(
                        await this.keyDerivation.getEscrowEnrollmentState(credentials)
                    );
                    if (isCurrentAccount() && this.state.status === 'ready') {
                        this.setState({
                            ...this.state,
                            escrowPin: enrollment.escrowPin,
                            escrowEnrollment: enrollment.state,
                        });
                    }
                } catch (err) {
                    log.warn('escrow.pin.status.failed', err);
                }
            }
            const hold = await this.keyDerivation.getEscrowRecoveryStatus?.(credentials);
            if (isCurrentAccount() && this.state.status === 'ready' && hold?.status === 'pending') {
                this.setState({
                    ...this.state,
                    pendingEscrowHold: {
                        holdId: hold.holdId,
                        requestedAt: hold.requestedAt,
                        releaseAfter: hold.releaseAfter,
                    },
                });
            }
        } catch (err) {
            log.warn('escrow.status.failed', err);
        }
    }

    /** Record the first PIN status seen for an account, before any attempt in this session. */
    private capturePinAttemptBaseline(state: UnifiedAuthState): void {
        const account =
            state.status === 'needs_recovery'
                ? (state.expectedDid ?? state.authUser.id)
                : state.status === 'identity_recovery' && state.escrowPin
                  ? state.expectedDid
                  : undefined;
        if (!account || this.pinAttemptBaseline?.account === account) return;
        const pin =
            state.status === 'needs_recovery' || state.status === 'identity_recovery'
                ? state.escrowPin
                : undefined;
        if (!pin) return;
        this.pinAttemptBaseline = { account, wrongAttempts: pin.wrongAttempts };
    }

    /** Build `ready.pinSignIn` from a strategy result, consuming the attempt baseline. */
    private takePinSignInInfo(did: string, result: RecoveryResult): PinSignInInfo | undefined {
        if (!result.pinSignIn) return undefined;
        const baseline = this.pinAttemptBaseline;
        this.pinAttemptBaseline = undefined;
        const priorWrongAttempts = baseline?.account === did ? baseline.wrongAttempts : undefined;
        return {
            mode: result.pinSignIn.mode,
            pinRefreshed: result.pinSignIn.pinRefreshed,
            // An older strategy that does not say is treated as "wrong entries recorded".
            newPinRequired: result.pinSignIn.newPinRequired !== false,
            ...(result.pinSignIn.pinRefreshFailed ? { pinRefreshFailed: true } : {}),
            ...(priorWrongAttempts !== undefined ? { priorWrongAttempts } : {}),
        };
    }

    /**
     * Derive `ready.escrowPinChangeRequired` (E): a PIN with recorded wrong entries never
     * gets a fresh budget for the same PIN, so the user is asked for a different one
     * until they set it, unless they dismissed the prompt for this account this session.
     */
    private withEscrowPinChangeFlag(state: UnifiedAuthState): UnifiedAuthState {
        if (state.status !== 'ready') return state;
        const pin = state.escrowPin;
        // The guarded PIN is gone: cleared, or replaced by a new PIN generation (a full,
        // untouched budget; the guarded PIN's own release always used one attempt).
        // Drop its tag so a later, unrelated PIN choice is not refused. A wrong-entry
        // count of 0 alone is not enough: a legacy record reports 0 after any release.
        if (
            pin &&
            (pin.state === 'none' ||
                (pin.enabled && pin.attemptsRemaining >= ESCROW_PIN_MAX_ATTEMPTS))
        )
            this.forgetPinGuard(state.did);
        const pinGuessed =
            pin?.enabled === true &&
            ((pin.wrongAttempts ?? 0) > 0 || this.readPinGuard(state.did) !== undefined);
        const required =
            this.escrowPinChangeDismissed !== state.did &&
            (state.pinSignIn?.newPinRequired === true || pinGuessed);
        if (required === (state.escrowPinChangeRequired === true)) return state;
        const { escrowPinChangeRequired: _previous, ...rest } = state;
        return required ? { ...rest, escrowPinChangeRequired: true } : rest;
    }

    private readPinGuard(did: string): string | undefined {
        if (this.signInPinDigest?.did === did) return this.signInPinDigest.tag;
        try {
            return this.pinGuardStorage?.getItem(PIN_GUARD_STORAGE_PREFIX + did) ?? undefined;
        } catch {
            return undefined;
        }
    }

    /** Drop the guard for `did` (memory, persisted and pending). */
    private forgetPinGuard(did: string | undefined): void {
        if (!did || this.signInPinDigest?.did === did) this.signInPinDigest = undefined;
        if (!did) return;
        try {
            this.pinGuardStorage?.removeItem(PIN_GUARD_STORAGE_PREFIX + did);
            this.pinGuardStorage?.removeItem(PIN_GUARD_PENDING_STORAGE_PREFIX + did);
        } catch {
            // Best effort: a stale tag only refuses one PIN for an account with that key.
        }
    }

    /**
     * Remember the PIN just used (as a keyed tag) when it must not be re-used: in memory,
     * and persisted as pending until `commitSignInPin` (the sign-in completed) or
     * `abandonSignInPin` (it did not).
     */
    private async rememberSignInPin(did: string, privateKey: string, pin: string): Promise<void> {
        const tag = await pinGuardTag(privateKey, did, pin);
        this.signInPinDigest = tag ? { did, tag } : undefined;
        if (!tag) return;
        try {
            this.pinGuardStorage?.setItem(PIN_GUARD_PENDING_STORAGE_PREFIX + did, tag);
        } catch {
            // Memory-only for this session when storage is unavailable.
        }
    }

    /** The PIN sign-in for `did` completed: its pending tag becomes the persisted guard. */
    private commitSignInPin(did: string): void {
        const memory = this.signInPinDigest?.did === did ? this.signInPinDigest.tag : undefined;
        try {
            const tag =
                this.pinGuardStorage?.getItem(PIN_GUARD_PENDING_STORAGE_PREFIX + did) ?? memory;
            if (tag) this.pinGuardStorage?.setItem(PIN_GUARD_STORAGE_PREFIX + did, tag);
            this.pinGuardStorage?.removeItem(PIN_GUARD_PENDING_STORAGE_PREFIX + did);
        } catch {
            // Memory-only for this session when storage is unavailable.
        }
    }

    /**
     * The PIN sign-in for `did` was cancelled or abandoned: drop its tag (memory and
     * pending). A guard persisted by an earlier, completed sign-in is left as it was.
     */
    private abandonSignInPin(did: string | undefined): void {
        if (!did || this.signInPinDigest?.did === did) this.signInPinDigest = undefined;
        if (!did) return;
        try {
            this.pinGuardStorage?.removeItem(PIN_GUARD_PENDING_STORAGE_PREFIX + did);
        } catch {
            // Best effort: a pending tag is never read as a guard.
        }
    }

    /**
     * Reject the PIN used for a PIN sign-in whose PIN has recorded wrong entries, in
     * this session or (via the persisted tag) after a restart.
     */
    private async assertNotSignInPin(did: string, privateKey: string, pin: string): Promise<void> {
        const remembered = this.readPinGuard(did);
        if (!remembered) return;
        if ((await pinGuardTag(privateKey, did, pin)) === remembered) {
            throw new SameEscrowPinError();
        }
    }

    /** A new PIN was set (or the account secured): the change prompt is resolved. */
    private resolveEscrowPinChange(did?: string): void {
        this.forgetPinGuard(did);
        this.signInPinDigest = undefined;
        this.escrowPinChangeDismissed = undefined;
    }

    /**
     * Dismiss the post-PIN-sign-in review ("No, everything's fine" / "Later"). Also
     * hides the "choose a new PIN" prompt for this session; the PIN keeps its reduced
     * budget and the prompt returns on the next app start while wrong entries remain.
     */
    acknowledgePinSignIn(): void {
        if (this.state.status !== 'ready') return;
        this.escrowPinChangeDismissed = this.state.did;
        this.setState({ ...this.state, pinSignIn: undefined });
    }

    /** Hide the "choose a new PIN" prompt for this session only; see acknowledgePinSignIn. */
    dismissEscrowPinChange(): void {
        if (this.state.status !== 'ready') return;
        this.escrowPinChangeDismissed = this.state.did;
        this.setState({ ...this.state });
    }

    /**
     * "Secure my account" / "Sign out of all other devices": re-split the key and drop
     * every older share version on the server, which signs out other devices and turns
     * off the old recovery phrase, backup file, passkey and email key. With `pin`,
     * escrow is re-enrolled with that PIN; `null` re-enrolls without one. The PIN is
     * passed straight to the strategy and not kept here.
     */
    async secureAccount(params: { pin: string | null }): Promise<RevokeOtherDevicesResult> {
        const ready = this.state;
        if (ready.status !== 'ready' || !ready.authSessionValid) {
            throw new Error('Sign in again to secure your account.');
        }
        const revoke = this.keyDerivation.revokeOtherDevices?.bind(this.keyDerivation);
        const signDidAuthVp = this.config.signDidAuthVp;
        if (!revoke || !signDidAuthVp) throw new Error('Securing the account is not available');
        // Re-enrolling gives a fresh budget, so a guessed-at PIN is never kept this way.
        if (params.pin !== null)
            await this.assertNotSignInPin(ready.did, ready.privateKey, params.pin);
        const credentials = await this.getAuthCredentials();
        const result = await this.runEscrowOperation(() =>
            revoke({
                ...credentials,
                privateKey: ready.privateKey,
                did: ready.did,
                signDidAuthVp,
                pin: params.pin,
                options: this.recoveryContactOptions(ready),
            })
        );
        // The re-split re-enrolled escrow (or dropped the PIN): the PIN prompt is resolved.
        this.resolveEscrowPinChange(ready.did);
        // The revoke re-opened recovery-method confirmation on the server.
        let sssActivationState: SssActivationState | null | undefined = 'provisional';
        try {
            const status = await this.keyDerivation.fetchServerKeyStatus(
                credentials.token,
                credentials.providerType
            );
            sssActivationState = status.sssActivationState ?? 'provisional';
        } catch (error) {
            log.warn('Unable to refresh activation state after securing the account', error);
        }
        const current = this.state;
        if (
            current.status === 'ready' &&
            current.privateKey === ready.privateKey &&
            current.authUser?.id === ready.authUser?.id
        ) {
            this.setState({
                ...current,
                pinSignIn: undefined,
                escrowPin: undefined,
                escrowEnrollment: undefined,
                escrowPinAutoCleared: undefined,
                escrowPinResetRequired: undefined,
                sssActivationState,
            });
            await this.refreshEscrow(this.state as Extract<UnifiedAuthState, { status: 'ready' }>);
        }
        return result;
    }

    /** Start recovery using either a signed-in identity or a verified recovery session. */
    async startEscrowRecovery(options?: { restart?: boolean }) {
        const generation = this.recoveryGeneration;
        if (!this.keyDerivation.startEscrowRecovery) throw new Error('Recovery is not available');
        const start = this.keyDerivation.startEscrowRecovery.bind(this.keyDerivation);
        const result = await this.runExclusiveRecovery('recovery', () =>
            this.runEscrowOperation(async () => {
                if (this.state.status === 'identity_recovery' && this.state.recoverySessionToken) {
                    // Independently known from the verify-recovery-session response
                    // above, never from an escrow response -- see EscrowRecoveryExpectations.
                    return start({
                        recoverySessionToken: this.state.recoverySessionToken,
                        expectedDid: this.state.expectedDid,
                        options,
                    });
                }
                if (this.state.status !== 'needs_recovery')
                    throw new Error('Recovery is not ready');
                // Independently known from the server key-status lookup above, never
                // from an escrow status response -- see EscrowRecoveryExpectations.
                return start({
                    ...(await this.getAuthCredentials()),
                    expectedDid: this.state.expectedDid,
                    options,
                });
            })
        );
        if (generation !== this.recoveryGeneration)
            throw new Error('This recovery request was cancelled.');
        return result;
    }

    /** Resume proofs allow status checks without an active sign-in session. */
    async getEscrowRecoveryStatus(proof?: {
        holdId: string;
        resumeToken: string;
        /** Retained from the hold's start response; required for a Nitro hold. */
        expectations?: EscrowRecoveryExpectations;
    }) {
        if (!this.keyDerivation.getEscrowRecoveryStatus) return null;
        return this.keyDerivation.getEscrowRecoveryStatus(
            proof ?? (await this.getAuthCredentials())
        );
    }

    /** Submit the confirmation code emailed by the enclave for an authority-mode hold. */
    async confirmEscrowRecovery(params: {
        holdId: string;
        resumeToken: string;
        code: string;
        /** Retained from the hold's start response; required for a Nitro hold. */
        expectations?: EscrowRecoveryExpectations;
    }): Promise<{ success: true }> {
        if (!this.keyDerivation.confirmEscrowRecovery) throw new Error('Recovery is not available');
        return this.keyDerivation.confirmEscrowRecovery(params);
    }

    /** Request a fresh confirmation code for a hold awaiting confirmation. */
    async resendEscrowRecoveryCode(params: {
        holdId: string;
        resumeToken: string;
    }): Promise<{ success: true }> {
        if (!this.keyDerivation.resendEscrowRecoveryCode)
            throw new Error('Recovery is not available');
        return this.keyDerivation.resendEscrowRecoveryCode(params);
    }

    /** Cancel a pending request from an account-owning device. */
    async cancelEscrowRecovery(): Promise<UnifiedAuthState> {
        const ready = this.state;
        if (
            ready.status !== 'ready' ||
            !this.keyDerivation.cancelEscrowRecovery ||
            !this.config.signDidAuthVp
        ) {
            throw new Error('Sign in on a trusted device to cancel recovery');
        }
        const generation = ++this.escrowStatusGeneration;
        await this.keyDerivation.cancelEscrowRecovery({
            ...(await this.getAuthCredentials()),
            privateKey: ready.privateKey,
            signDidAuthVp: this.config.signDidAuthVp,
        });
        if (
            generation === this.escrowStatusGeneration &&
            this.state.status === 'ready' &&
            this.state.privateKey === ready.privateKey &&
            this.state.authUser?.id === ready.authUser?.id
        ) {
            this.setState({ ...this.state, pendingEscrowHold: undefined });
        }
        return this.state;
    }

    /** Read automatic recovery status (and PIN status) from a signed-in device. */
    async getEscrowEnrollmentState(): Promise<EscrowEnrollmentState> {
        if (this.state.status !== 'ready') throw new Error('Sign in to manage recovery');
        return normalizeEscrowEnrollmentState(
            await this.keyDerivation.getEscrowEnrollmentState?.(await this.getAuthCredentials())
        );
    }

    /** Disable automatic recovery and clear any cancelled pending hold. */
    async disableEscrowRecovery(): Promise<void> {
        const ready = this.state;
        if (
            ready.status !== 'ready' ||
            !this.keyDerivation.disableEscrowRecovery ||
            !this.config.signDidAuthVp
        ) {
            throw new Error('Sign in on a trusted device to manage recovery');
        }
        const generation = ++this.escrowStatusGeneration;
        await this.runEscrowOperation(async () =>
            this.keyDerivation.disableEscrowRecovery!({
                ...(await this.getAuthCredentials()),
                privateKey: ready.privateKey,
                signDidAuthVp: this.config.signDidAuthVp!,
            })
        );
        if (
            generation === this.escrowStatusGeneration &&
            this.state.status === 'ready' &&
            this.state.privateKey === ready.privateKey &&
            this.state.authUser?.id === ready.authUser?.id
        ) {
            this.setState({ ...this.state, pendingEscrowHold: undefined });
        }
    }

    /** Opt in and enroll automatic recovery from a trusted device. */
    async enableEscrowRecovery() {
        const ready = this.state;
        if (
            ready.status !== 'ready' ||
            !this.keyDerivation.enableEscrowRecovery ||
            !this.config.signDidAuthVp
        ) {
            throw new Error('Sign in on a trusted device to manage recovery');
        }
        return this.runEscrowOperation(async () =>
            this.keyDerivation.enableEscrowRecovery!({
                ...(await this.getAuthCredentials()),
                privateKey: ready.privateKey,
                signDidAuthVp: this.config.signDidAuthVp!,
                options: this.recoveryContactOptions(ready),
            })
        );
    }

    /**
     * Set or change a PIN by rotating escrow material with an owner proof. After a PIN
     * sign-in whose PIN has recorded wrong entries, the PIN just used is rejected with
     * SameEscrowPinError before anything changes.
     */
    async setEscrowPin(pin: string): Promise<void> {
        // Only awaits while a PIN-change guard exists for this account, so ordinary PIN
        // changes still clear the published status synchronously.
        if (this.state.status === 'ready' && this.readPinGuard(this.state.did))
            await this.assertNotSignInPin(this.state.did, this.state.privateKey, pin);
        const ready = this.state;
        if (
            ready.status !== 'ready' ||
            !this.keyDerivation.setEscrowPin ||
            !this.config.signDidAuthVp
        ) {
            throw new Error('Sign in on a trusted device to manage recovery');
        }
        const generation = ++this.escrowStatusGeneration;
        const recovered = this.recoveredEscrowAccount;
        const supersedesRecovery =
            recovered?.did === ready.did && recovered?.userId === ready.authUser?.id;
        // An explicit new PIN supersedes recovery's intent to clear the retired PIN.
        if (supersedesRecovery) this.recoveredEscrowAccount = undefined;
        this.setState({
            ...ready,
            escrowPin: undefined,
            escrowEnrollment: undefined,
            escrowPinAutoCleared: undefined,
            escrowPinResetRequired: undefined,
        });
        try {
            await this.runEscrowOperation(async () =>
                this.keyDerivation.setEscrowPin!({
                    ...(await this.getAuthCredentials()),
                    privateKey: ready.privateKey,
                    signDidAuthVp: this.config.signDidAuthVp!,
                    pin,
                    options: this.recoveryContactOptions(ready),
                })
            );
            if (this.state.status === 'ready' && this.state.did === ready.did) {
                this.resolveEscrowPinChange(ready.did);
                const pinSignIn = this.state.pinSignIn;
                if (pinSignIn?.newPinRequired || pinSignIn?.pinRefreshFailed) {
                    // A new PIN generation has a full budget: nothing failed any more.
                    const { pinRefreshFailed: _failed, ...rest } = pinSignIn;
                    this.setState({
                        ...this.state,
                        pinSignIn: { ...rest, newPinRequired: false, pinRefreshed: true },
                    });
                }
            }
        } catch (err) {
            if (
                supersedesRecovery &&
                generation === this.escrowStatusGeneration &&
                !this.recoveredEscrowAccount
            )
                this.recoveredEscrowAccount = recovered;
            throw err;
        } finally {
            await this.refreshEscrowPinStatus(ready, generation);
        }
    }

    /** Mark the post-automatic-clear "set a new PIN" prompt as shown, so it shows once. */
    acknowledgeEscrowPinAutoClear(): void {
        if (this.state.status === 'ready' && this.state.escrowPinAutoCleared)
            this.setState({ ...this.state, escrowPinAutoCleared: undefined });
    }

    /** Remove a PIN by rotating escrow material with an owner proof. */
    async clearEscrowPin(): Promise<void> {
        const ready = this.state;
        if (
            ready.status !== 'ready' ||
            !this.keyDerivation.clearEscrowPin ||
            !this.config.signDidAuthVp
        ) {
            throw new Error('Sign in on a trusted device to manage recovery');
        }
        const generation = ++this.escrowStatusGeneration;
        this.setState({
            ...ready,
            escrowPin: undefined,
            escrowEnrollment: undefined,
            escrowPinAutoCleared: undefined,
            escrowPinResetRequired: undefined,
        });
        try {
            await this.runEscrowOperation(async () =>
                this.keyDerivation.clearEscrowPin!({
                    ...(await this.getAuthCredentials()),
                    privateKey: ready.privateKey,
                    signDidAuthVp: this.config.signDidAuthVp!,
                    options: this.recoveryContactOptions(ready),
                })
            );
        } finally {
            await this.refreshEscrowPinStatus(ready, generation);
        }
    }

    /** Re-fetch enrollment after a PIN change so `ready.escrowPin` reflects the new status. */
    private async refreshEscrowPinStatus(
        ready: Extract<UnifiedAuthState, { status: 'ready' }>,
        generation: number
    ): Promise<void> {
        if (!this.keyDerivation.getEscrowEnrollmentState) return;
        try {
            const enrollment = normalizeEscrowEnrollmentState(
                await this.keyDerivation.getEscrowEnrollmentState(await this.getAuthCredentials())
            );
            if (
                generation === this.escrowStatusGeneration &&
                this.state.status === 'ready' &&
                this.state.privateKey === ready.privateKey &&
                this.state.authUser?.id === ready.authUser?.id
            ) {
                this.setState({
                    ...this.state,
                    escrowPin: enrollment.escrowPin,
                    escrowEnrollment: enrollment.state,
                });
            }
        } catch (err) {
            log.warn('escrow.pin.refresh.failed', err);
        }
    }

    /**
     * P9.1 (attack C): the authenticated account's own email (never a
     * host-supplied or user-typed value at this layer) plus the app's
     * current locale, both bound into the sealed escrow blob on the device
     * side by the key-derivation strategy — lca-api cannot read or change
     * them afterward. Omitted when either is unavailable; the strategy/
     * enclave fail closed for nitro/authority-mode enroll/replace rather
     * than silently default a jargon-adjacent placeholder.
     */
    private recoveryContactOptions(ready: {
        authUser?: AuthUser;
    }): { recoveryEmail?: string; recoveryLanguage?: string } | undefined {
        const recoveryEmail = ready.authUser?.email;
        const recoveryLanguage = this.config.getRecoveryLanguage?.();
        if (!recoveryEmail && !recoveryLanguage) return undefined;
        return { recoveryEmail, recoveryLanguage };
    }

    /** Helper: get token + providerType from the auth provider.
     *  Always force-refreshes the token so downstream consumers (e.g. Web3Auth)
     *  receive a recently-issued JWT. Web3Auth's server rejects signed params
     *  whose timestamp is more than 6 minutes old, so a stale cached token
     *  (common after Android backgrounds/kills the app) would fail. */
    private async getAuthCredentials(): Promise<{ token: string; providerType: string }> {
        const token = await this.config.authProvider.getIdToken(true);
        const providerType = this.config.authProvider.getProviderType();
        return { token, providerType };
    }

    private async getFreshDidAuthVp(privateKey: string, did: string): Promise<string | undefined> {
        if (!this.config.signDidAuthVp) return undefined;

        if (this.keyDerivation.getFreshDidAuthVp) {
            return this.keyDerivation.getFreshDidAuthVp(privateKey, did, this.config.signDidAuthVp);
        }

        return this.config.signDidAuthVp(privateKey);
    }

    /**
     * Initialize the coordinator and determine the correct state.
     *
     * Flow:
     * 0. (Private-key-first) Check for cached private key in secure storage
     * 1. Check if user is authenticated via auth provider
     * 2. If authenticated, check local key component
     * 3. Ask strategy for server key status
     * 4. Determine state: ready, needs_setup, needs_migration, needs_recovery
     */
    async initialize(): Promise<UnifiedAuthState> {
        if (this.endingSession) return this.state;
        this.recoveryFallback = null;
        try {
            // --- Private-key-first path ---
            if (this.config.getCachedPrivateKey && this.config.didFromPrivateKey) {
                try {
                    const cachedKey = await this.config.getCachedPrivateKey();

                    if (cachedKey) {
                        this.setState({ status: 'deriving_key' });

                        const did = await this.config.didFromPrivateKey(cachedKey);

                        if (did) {
                            // Opportunistic + bounded: offline/slow auth must not
                            // block a cached-key resume from reaching `ready`.
                            const authUser: AuthUser | null = await withDeadlineOr(
                                withNetworkFault('getCurrentUser(pk-first)', () =>
                                    this.config.authProvider.getCurrentUser()
                                ),
                                null,
                                {
                                    ms:
                                        this.config.authSessionTimeoutMs ??
                                        DEFAULT_AUTH_SESSION_TIMEOUT_MS,
                                    label: 'getCurrentUser(pk-first)',
                                }
                            );

                            // Scope storage even on pk-first path so getLocalKey works later
                            if (authUser && this.keyDerivation.setActiveUser) {
                                this.keyDerivation.setActiveUser(authUser.id);
                            }

                            // If the strategy supports recovery (SSS) and we have an
                            // auth session, verify the server has a record for this user.
                            // A missing record means the key was created under a different
                            // strategy (e.g. Web3Auth) and needs to be migrated to SSS
                            // so it's protected by split shares + recovery methods.
                            let sssActivationState: 'provisional' | 'active' | null = null;

                            if (authUser && this.keyDerivation.capabilities?.recovery) {
                                try {
                                    const serverStatus = await withDeadline(
                                        withNetworkFault(
                                            'fetchServerKeyStatus(pk-first)',
                                            async () => {
                                                const { token, providerType } =
                                                    await this.getAuthCredentials();
                                                return this.keyDerivation.fetchServerKeyStatus(
                                                    token,
                                                    providerType
                                                );
                                            }
                                        ),
                                        {
                                            ms:
                                                this.config.serverStatusTimeoutMs ??
                                                DEFAULT_SERVER_STATUS_TIMEOUT_MS,
                                            label: 'fetchServerKeyStatus(pk-first)',
                                        }
                                    );

                                    sssActivationState = serverStatus.sssActivationState ?? null;

                                    if (
                                        !serverStatus.exists ||
                                        (serverStatus.needsMigration &&
                                            sssActivationState !== 'provisional')
                                    ) {
                                        this.setState({
                                            status: 'needs_migration',
                                            authUser,
                                            migrationData: {
                                                web3AuthKey: cachedKey,
                                                source: 'cached',
                                                expectedDid: serverStatus.primaryDid ?? undefined,
                                            },
                                        });

                                        return this.state;
                                    }
                                } catch (e) {
                                    // Server check failed — proceed to ready.
                                    // Migration will be caught on the next full init.
                                    log.warn(
                                        'Server key verification failed on pk-first path, proceeding to ready',
                                        e
                                    );
                                }
                            }

                            this.setState({
                                status: 'ready',
                                authUser: authUser ?? undefined,
                                did,
                                privateKey: cachedKey,
                                authSessionValid: !!authUser,
                                sssActivationState,
                            });

                            return this.state;
                        }
                    }
                } catch (e) {
                    log.warn('Cached private key check failed, falling through to auth flow', e);
                }
            }

            // --- Standard auth-provider-first path ---
            this.setState({ status: 'authenticating' });

            // Bound the probe so a stalled network can't hang boot; a timeout
            // surfaces as a retryable error (via the outer catch), while real
            // provider errors propagate unchanged to preserve existing handling.
            const authUser = await withDeadline(
                withNetworkFault('getCurrentUser(standard)', () =>
                    this.config.authProvider.getCurrentUser()
                ),
                {
                    ms: this.config.authSessionTimeoutMs ?? DEFAULT_AUTH_SESSION_TIMEOUT_MS,
                    label: 'getCurrentUser(standard)',
                }
            );

            if (!authUser) {
                this.setState({ status: 'idle' });
                return this.state;
            }

            this.setState({ status: 'authenticated', authUser });

            // Scope local storage to this user so device shares don't collide
            if (this.keyDerivation.setActiveUser) {
                this.keyDerivation.setActiveUser(authUser.id);
            }

            if (
                this.keyDerivation.hasPendingIdentityRecovery?.() &&
                this.keyDerivation.completeIdentityRecovery
            ) {
                this.setState({ status: 'deriving_key' });
                const { token, providerType } = await this.getAuthCredentials();
                const result = await this.keyDerivation.completeIdentityRecovery({
                    token,
                    providerType,
                    signDidAuthVp: this.config.signDidAuthVp,
                    options: this.recoveryContactOptions({ authUser }),
                });
                const pinSignIn = this.takePinSignInInfo(result.did, result);
                // The lost-login sign-in completed: keep its PIN's tag only while a new
                // PIN is required.
                if (!pinSignIn?.newPinRequired) this.forgetPinGuard(result.did);
                else {
                    this.commitSignInPin(result.did);
                    if (this.signInPinDigest?.did !== result.did) this.signInPinDigest = undefined;
                }
                // Only a failed or deferred direct enrollment needs the scoped repair.
                if (!result.escrowEnrolled) {
                    this.recoveredEscrowAccount = {
                        did: result.did,
                        userId: authUser.id,
                        clearPin: true,
                        bypassRolloutGate: result.escrowRecovery === true,
                    };
                }

                // Rebinding can require fresh recovery enrollment. Honor older servers that
                // report active, but do not skip enrollment if the status refresh fails.
                let sssActivationState: SssActivationState = 'provisional';
                try {
                    const serverStatus = await withDeadline(
                        this.keyDerivation.fetchServerKeyStatus(token, providerType),
                        {
                            ms:
                                this.config.serverStatusTimeoutMs ??
                                DEFAULT_SERVER_STATUS_TIMEOUT_MS,
                            label: 'fetchServerKeyStatus(identityRecovery)',
                        }
                    );
                    sssActivationState = serverStatus.sssActivationState ?? 'provisional';
                } catch (error) {
                    log.warn('Unable to refresh activation state after identity recovery', error);
                }

                this.setState({
                    status: 'identity_recovery_success',
                    authUser,
                    did: result.did,
                    privateKey: result.privateKey,
                    sssActivationState,
                    ...(pinSignIn ? { pinSignIn } : {}),
                });

                return this.state;
            }

            this.setState({ status: 'checking_key_status' });

            const { token, providerType } = await this.getAuthCredentials();

            const hasLocalKey = await this.keyDerivation.hasLocalKey();
            const serverStatus = await withDeadline(
                withNetworkFault('fetchServerKeyStatus(standard)', () =>
                    this.keyDerivation.fetchServerKeyStatus(token, providerType)
                ),
                {
                    ms: this.config.serverStatusTimeoutMs ?? DEFAULT_SERVER_STATUS_TIMEOUT_MS,
                    label: 'fetchServerKeyStatus(standard)',
                }
            );

            // Resolve recovery methods through the strategy (which may inject
            // client-side-only methods like email backup) when available,
            // falling back to the raw server list.
            const recoveryMethods = this.keyDerivation.getAvailableRecoveryMethods
                ? await this.keyDerivation.getAvailableRecoveryMethods(token, providerType)
                : serverStatus.recoveryMethods;

            // Case 1: No server record
            if (!serverStatus.exists) {
                // If the auth account is old enough, this is likely a legacy user
                // (e.g., Web3Auth era) who never got an SSS record. Treat as migration.
                const threshold = this.config.legacyAccountThresholdMs ?? 0;

                if (threshold > 0 && authUser.createdAt) {
                    const accountAgeMs = Date.now() - authUser.createdAt.getTime();

                    if (accountAgeMs > threshold) {
                        this.setState({ status: 'needs_migration', authUser });
                        return this.state;
                    }
                }

                this.setState({ status: 'needs_setup', authUser });
                return this.state;
            }

            // Case 2: Strategy says migration is needed
            if (serverStatus.needsMigration && serverStatus.sssActivationState !== 'provisional') {
                this.setState({
                    status: 'needs_migration',
                    authUser,
                    migrationData: { expectedDid: serverStatus.primaryDid ?? undefined },
                });
                return this.state;
            }

            // Case 3: Server has key but no local component — needs recovery
            if (!hasLocalKey) {
                return this.needRecovery(authUser, recoveryMethods, serverStatus, 'new_device');
            }

            // Case 4: Has both local and server keys — try to connect
            this.setState({ status: 'deriving_key' });

            const localKey = await this.keyDerivation.getLocalKey();

            if (!localKey || !serverStatus.authShare) {
                return this.needRecovery(
                    authUser,
                    recoveryMethods,
                    serverStatus,
                    'missing_server_data'
                );
            }

            let privateKey: string;
            let reconciledCollision = false;
            try {
                privateKey = await this.keyDerivation.reconstructKey(
                    localKey,
                    serverStatus.authShare
                );
            } catch (error) {
                // A stale pair may share a coordinate instead of producing a
                // mismatched DID. Only this typed local failure uses recovery;
                // network/programming errors retain their existing handling.
                if (
                    !(error instanceof DuplicateShareCoordinateError) ||
                    !serverStatus.primaryDid ||
                    !this.config.didFromPrivateKey ||
                    !this.keyDerivation.reconcileShares
                ) {
                    throw error;
                }
                const reconciled = await this.keyDerivation.reconcileShares({
                    token,
                    providerType,
                    expectedDid: serverStatus.primaryDid,
                    didFromPrivateKey: this.config.didFromPrivateKey,
                    signDidAuthVp: this.config.signDidAuthVp,
                });
                if (!reconciled) {
                    log.warn('Share coordinate collision - stale local key detected');
                    await this.keyDerivation.clearLocalKeys({ preservePending: true });
                    return this.needRecovery(
                        authUser,
                        recoveryMethods,
                        serverStatus,
                        'stale_local_key'
                    );
                }
                privateKey = reconciled.privateKey;
                reconciledCollision = true;
            }

            // Verify the key produces the expected DID (health check)
            if (!reconciledCollision && this.config.didFromPrivateKey && serverStatus.primaryDid) {
                const derivedDid = await this.config.didFromPrivateKey(privateKey);

                if (derivedDid !== serverStatus.primaryDid) {
                    const reconciled = this.keyDerivation.reconcileShares
                        ? await this.keyDerivation.reconcileShares({
                              token,
                              providerType,
                              expectedDid: serverStatus.primaryDid,
                              didFromPrivateKey: this.config.didFromPrivateKey,
                              signDidAuthVp: this.config.signDidAuthVp,
                          })
                        : null;

                    if (reconciled) {
                        privateKey = reconciled.privateKey;
                    } else {
                        log.warn('DID mismatch - stale local key detected');
                        await this.keyDerivation.clearLocalKeys({ preservePending: true });

                        return this.needRecovery(
                            authUser,
                            recoveryMethods,
                            serverStatus,
                            'stale_local_key'
                        );
                    }
                } else if (this.keyDerivation.reconcileShares) {
                    const reconciled = await this.keyDerivation.reconcileShares({
                        token,
                        providerType,
                        expectedDid: serverStatus.primaryDid,
                        didFromPrivateKey: this.config.didFromPrivateKey,
                        signDidAuthVp: this.config.signDidAuthVp,
                    });

                    if (reconciled) privateKey = reconciled.privateKey;
                }
            }

            let did = serverStatus.primaryDid || '';

            if (!did && this.config.didFromPrivateKey) {
                did = await this.config.didFromPrivateKey(privateKey);
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState: serverStatus.sssActivationState ?? null,
            });

            return this.state;
        } catch (e) {
            // Typed auth session errors → idle (not error)
            if (e instanceof AuthSessionError) {
                log.warn('Auth session expired or missing — returning to idle');
                this.setState({ status: 'idle' });
                return this.state;
            }

            // Connectivity failures are not hard errors: fall back to idle so
            // the offline UI (banner / boot gate) owns the UX and initialize()
            // re-runs cleanly on reconnect — never an error overlay + retry loop.
            if (isNetworkError(e)) {
                log.warn('Network unavailable during init — returning to idle', e);
                this.setState({ status: 'idle' });
                return this.state;
            }

            const errorMessage =
                e instanceof Error ? e.message : 'Unknown error during initialization';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: this.state,
            });

            return this.state;
        }
    }

    /**
     * Set up a new key for a new user.
     * Only valid when state is 'needs_setup'.
     */
    async setupNewKey(privateKey: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_setup') {
            throw new Error(`Cannot setup key in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;

        try {
            this.setState({ status: 'deriving_key' });

            const { token, providerType } = await this.getAuthCredentials();

            if (this.keyDerivation.atomicUpdateShares) {
                await this.keyDerivation.atomicUpdateShares({
                    token,
                    providerType,
                    privateKey,
                    did,
                    signDidAuthVp: this.config.signDidAuthVp,
                });
            } else {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

                await this.keyDerivation.storeLocalKey(localKey);
                await this.keyDerivation.storeAuthShare(
                    token,
                    providerType,
                    remoteKey,
                    did,
                    didAuthVp
                );
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState: 'provisional',
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to setup new key';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: { status: 'needs_setup', authUser },
            });

            return this.state;
        }
    }

    /**
     * Attach strategy-specific migration data to the current needs_migration state.
     * This allows app-level code to inject data (e.g., an extracted Web3Auth key)
     * that the auto-setup hook can read to trigger migration.
     *
     * Only valid when state is 'needs_migration'.
     */
    setMigrationData(data: Record<string, unknown>): void {
        if (this.state.status !== 'needs_migration') {
            throw new Error(`Cannot set migration data in state: ${this.state.status}`);
        }

        this.setState({
            ...this.state,
            migrationData: { ...this.state.migrationData, ...data },
        });
    }

    /**
     * Enter `needs_recovery`, except for a provisional migration from Web3Auth:
     * the server keeps that legacy fallback until a recovery method activates
     * SSS, and the account may have no confirmed method yet, so its legacy key
     * is re-derived instead, checked against the server DID and used without
     * writing (see migrate()). The recovery state is kept for
     * `fallBackToRecovery()` in case the legacy key can't be derived.
     */
    private needRecovery(
        authUser: AuthUser,
        recoveryMethods: RecoveryMethodInfo[],
        serverStatus: ServerKeyStatus,
        recoveryReason: RecoveryReason
    ): UnifiedAuthState {
        const recovery: UnifiedAuthState = {
            status: 'needs_recovery',
            authUser,
            recoveryMethods,
            recoveryReason,
            escrowPin: serverStatus.escrowPin,
            maskedRecoveryEmail: serverStatus.maskedRecoveryEmail ?? null,
            sssActivationState: serverStatus.sssActivationState ?? null,
            expectedDid: serverStatus.primaryDid ?? undefined,
        };

        if (serverStatus.needsMigration && serverStatus.sssActivationState === 'provisional') {
            this.recoveryFallback = recovery;
            this.setState({
                status: 'needs_migration',
                authUser,
                migrationData: {
                    expectedDid: serverStatus.primaryDid ?? undefined,
                    provisionalRederive: true,
                },
            });
            return this.state;
        }

        this.setState(recovery);
        return this.state;
    }

    /**
     * Leave a provisional re-derive (see `needRecovery`) for the recovery state
     * it replaced, e.g. when Web3Auth is unavailable or a QR-login share is
     * waiting. No-op in any other state.
     */
    fallBackToRecovery(): UnifiedAuthState {
        if (this.state.status === 'needs_migration' && this.recoveryFallback) {
            const recovery = this.recoveryFallback;
            this.recoveryFallback = null;
            this.setState(recovery);
        }

        return this.state;
    }

    /**
     * Decide whether a legacy key may be written as this account's SSS key.
     * A DID the server already holds is authoritative; otherwise the app's
     * verifier is asked (see AuthCoordinatorConfig.verifyMigrationIdentity).
     */
    private async checkMigrationIdentity(
        privateKey: string,
        did: string,
        migrationData: Record<string, unknown>
    ): Promise<'proceed' | 'mismatch' | 'defer'> {
        const { expectedDid } = migrationData;

        if (typeof expectedDid === 'string' && expectedDid) {
            return expectedDid === did ? 'proceed' : 'mismatch';
        }

        const verify = this.config.verifyMigrationIdentity;

        if (!verify) return 'proceed';

        const source: MigrationKeySource = migrationData.source === 'cached' ? 'cached' : 'derived';

        let verdict: MigrationIdentityVerdict;

        try {
            verdict = await verify({ privateKey, did, source });
        } catch (e) {
            log.warn('migration.identity.check_failed', {
                source,
                error: e instanceof Error ? e.name : 'unknown',
            });
            verdict = 'unknown';
        }

        if (verdict === 'match') return 'proceed';
        if (verdict === 'mismatch') return 'mismatch';
        if (source === 'cached') return 'defer';

        log.warn('migration.identity.unanchored', { source });
        return 'proceed';
    }

    /**
     * Migrate from a legacy key derivation strategy.
     * Only valid when state is 'needs_migration'.
     */
    async migrate(privateKey: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_migration') {
            throw new Error(`Cannot migrate in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;
        const migrationData = this.state.migrationData ?? {};

        try {
            this.setState({ status: 'deriving_key' });

            const identity = await this.checkMigrationIdentity(privateKey, did, migrationData);

            if (identity === 'mismatch' && migrationData.source === 'cached') {
                // The device-wide key cache holds another account's key. Drop it for
                // this attempt and derive the signed-in account's key instead; reaching
                // `ready` re-persists the right key, so later starts are normal.
                log.warn('migration.identity.cached_key_replaced', {
                    anchor: migrationData.expectedDid ? 'server' : 'verifier',
                });
                const { web3AuthKey: _key, source: _source, ...rest } = migrationData;
                this.setState({ status: 'needs_migration', authUser, migrationData: rest });
                return this.state;
            }

            if (identity === 'mismatch') {
                // Fail closed and non-retryable: retrying derives the same key, and
                // writing it would bind the account to the wrong DID for good.
                log.error('migration.identity.mismatch', {
                    source: migrationData.source ?? 'unknown',
                    anchor: migrationData.expectedDid ? 'server' : 'verifier',
                });
                this.setState({
                    status: 'error',
                    error: MIGRATION_IDENTITY_MISMATCH_MESSAGE,
                    canRetry: false,
                });
                return this.state;
            }

            if (identity === 'defer') {
                // Same outcome as an unreachable server on the cached-key path:
                // keep using the key this device already holds and migrate on a
                // later start, once the key can be checked.
                log.warn('migration.identity.deferred', { source: 'cached' });
                this.setState({
                    status: 'ready',
                    authUser,
                    did,
                    privateKey,
                    authSessionValid: true,
                    sssActivationState: null,
                });
                return this.state;
            }

            if (migrationData.provisionalRederive === true) {
                // Already migrated (provisionally) from another device, and the key
                // matches the server DID. Use it without re-splitting: a new split would
                // strand the other device's share and rotate under any escrow seal.
                // This device gets a share from the next explicit share update.
                this.setState({
                    status: 'ready',
                    authUser,
                    did,
                    privateKey,
                    authSessionValid: true,
                    sssActivationState: 'provisional',
                });
                return this.state;
            }

            const { token, providerType } = await this.getAuthCredentials();

            if (this.keyDerivation.atomicUpdateShares) {
                await this.keyDerivation.atomicUpdateShares({
                    token,
                    providerType,
                    privateKey,
                    did,
                    signDidAuthVp: this.config.signDidAuthVp,
                });
            } else {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

                await this.keyDerivation.storeLocalKey(localKey);
                await this.keyDerivation.storeAuthShare(
                    token,
                    providerType,
                    remoteKey,
                    did,
                    didAuthVp
                );
            }

            if (this.keyDerivation.markMigrated) {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                await this.keyDerivation.markMigrated(token, providerType, didAuthVp);
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState: 'provisional',
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to migrate';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: { status: 'needs_migration', authUser },
            });

            return this.state;
        }
    }

    /**
     * Commit a provisioned SSS key after recovery enrollment succeeds.
     * The server re-checks the recovery-method invariant atomically.
     */
    async activate(): Promise<UnifiedAuthState> {
        if (this.state.status !== 'ready' || this.state.sssActivationState !== 'provisional') {
            throw new Error(`Cannot activate key in state: ${this.state.status}`);
        }

        if (!this.keyDerivation.activate) {
            throw new Error('The active key derivation strategy does not support activation');
        }

        const readyState = this.state;
        const { token, providerType } = await this.getAuthCredentials();
        const didAuthVp = await this.getFreshDidAuthVp(readyState.privateKey, readyState.did);

        await this.keyDerivation.activate(token, providerType, didAuthVp);

        this.setState({ ...readyState, sssActivationState: 'active' });

        return this.state;
    }

    /**
     * Recover account using a recovery method.
     * Only valid when state is 'needs_recovery'.
     *
     * Delegates the actual recovery logic to the strategy's executeRecovery().
     */
    async recover(input: unknown): Promise<UnifiedAuthState> {
        return this.runExclusiveRecovery('recovery', () =>
            isEscrowRecoveryMethod(input)
                ? this.runEscrowOperation(() => this.executeRecovery(input))
                : this.executeRecovery(input)
        );
    }

    /**
     * Run one recovery step at a time. The check and the claim are synchronous, so a
     * second call (another method, a re-submit, a new code request) is rejected with
     * RecoveryInProgressError before it reads or writes any state, and the pending
     * recovery completes against the state it started from.
     *
     * Cancel, logout and forget-device bump the recovery generation; an abandoned step
     * then discards its own result. `'session'` steps (send / verify a recovery-email
     * code) only touch coordinator state, so they wait only for a step of the current
     * generation and a fresh lost-login flow is not stalled by an abandoned request.
     * `'recovery'` steps (any method, the hold start) share the strategy's single
     * pending identity, so they wait for every outstanding step, including an
     * abandoned one, until it has settled and cleaned up after itself.
     */
    private async runExclusiveRecovery<T>(
        kind: 'recovery' | 'session',
        operation: () => Promise<T>
    ): Promise<T> {
        const generation = this.recoveryGeneration;
        for (const claim of this.recoveryClaims) {
            if (kind === 'recovery' || claim.generation === generation)
                throw new RecoveryInProgressError();
        }
        const claim = { generation };
        this.recoveryClaims.add(claim);
        try {
            return await operation();
        } finally {
            this.recoveryClaims.delete(claim);
        }
    }

    private async executeRecovery(input: unknown): Promise<UnifiedAuthState> {
        const isEscrow = isEscrowRecoveryMethod(input);
        if (this.state.status === 'identity_recovery' && isEscrowPinInput(input)) {
            if (this.state.phase !== 'choose_method' || !this.state.recoverySessionToken) {
                throw new Error('PIN recovery requires signing in first.');
            }
            return this.executeIdentityPinSignIn(input, this.state);
        }
        if (
            this.state.status === 'identity_recovery' &&
            typeof input === 'object' &&
            input !== null &&
            'method' in input &&
            input.method === 'escrow'
        ) {
            const identityState = this.state;
            const generation = this.recoveryGeneration;
            const result = await this.keyDerivation.executeRecovery({
                token: '',
                providerType: this.config.authProvider.getProviderType(),
                input,
                didFromPrivateKey: this.config.didFromPrivateKey,
                signDidAuthVp: this.config.signDidAuthVp,
            });
            if (generation !== this.recoveryGeneration || this.state !== identityState) {
                this.keyDerivation.cancelIdentityRecovery?.();
                throw new Error('This recovery request was cancelled.');
            }
            this.setState({
                ...identityState,
                phase: 'new_login',
                recoverySessionToken: undefined,
                recoveredDid: result.did,
            });
            return this.state;
        }
        if (this.state.status !== 'needs_recovery') {
            throw new Error(`Cannot recover in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;
        const recoveryMethods = this.state.recoveryMethods;
        const recoveryReason = this.state.recoveryReason;
        const maskedRecoveryEmail = this.state.maskedRecoveryEmail;
        const sssActivationState = this.state.sssActivationState;
        const expectedDid = this.state.expectedDid;
        const generation = this.recoveryGeneration;

        try {
            // Keep the request panel mounted so it owns progress, errors and retry proofs.
            if (!isEscrow) this.setState({ status: 'deriving_key' });

            const { token, providerType } = await this.getAuthCredentials();

            const params = {
                token,
                providerType,
                // PIN release has no persisted hold to carry its own binding, so
                // fill in the DID independently known from this `needs_recovery`
                // state (never from a server response) when the caller omits it.
                input: isEscrowPinInput(input)
                    ? { ...input, expectedDid: input.expectedDid ?? expectedDid }
                    : input,
                didFromPrivateKey: this.config.didFromPrivateKey,
                signDidAuthVp: this.config.signDidAuthVp,
                options: this.recoveryContactOptions({ authUser }),
            };
            const result =
                isEscrow &&
                this.keyDerivation.hasPendingIdentityRecovery?.() &&
                this.keyDerivation.completeIdentityRecovery
                    ? await this.keyDerivation.completeIdentityRecovery(params)
                    : await this.keyDerivation.executeRecovery(params);
            const { privateKey, did, escrowEnrolled, escrowRecovery } = result;
            const guardPin =
                !!result.pinSignIn &&
                result.pinSignIn.newPinRequired !== false &&
                isEscrowPinInput(input);
            // Before the cancellation check, so nothing awaits between it and setState.
            if (guardPin) await this.rememberSignInPin(did, privateKey, input.pin);
            if (isEscrow && generation !== this.recoveryGeneration) {
                this.abandonSignInPin(did);
                this.keyDerivation.cancelIdentityRecovery?.();
                throw new Error('This recovery request was cancelled.');
            }
            if (guardPin) this.commitSignInPin(did);
            const pinSignIn = this.takePinSignInInfo(did, result);

            if (isEscrow && !escrowEnrolled)
                this.recoveredEscrowAccount = {
                    did,
                    userId: authUser.id,
                    clearPin: true,
                    bypassRolloutGate: escrowRecovery ?? true,
                };
            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState,
                ...(pinSignIn ? { pinSignIn } : {}),
            });

            return this.state;
        } catch (e) {
            if (isEscrow) throw e;
            const errorMessage = e instanceof Error ? e.message : 'Recovery failed';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: {
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods,
                    recoveryReason,
                    maskedRecoveryEmail,
                    sssActivationState,
                    expectedDid,
                },
            });

            return this.state;
        }
    }

    /**
     * PIN sign-in after the recovery-email code (lost login). The verified session
     * proves the PIN start and is consumed by it, so every attempt, right or wrong,
     * needs a fresh code: on failure the flow returns to `enter_email` and the
     * original error (e.g. attempts left) is rethrown for the PIN form.
     */
    private async executeIdentityPinSignIn(
        input: { method: 'escrow-pin'; pin: string; expectedDid?: string },
        identityState: Extract<UnifiedAuthState, { status: 'identity_recovery' }>
    ): Promise<UnifiedAuthState> {
        const generation = this.recoveryGeneration;
        try {
            const result = await this.keyDerivation.executeRecovery({
                token: '',
                providerType: this.config.authProvider.getProviderType(),
                input: {
                    ...input,
                    expectedDid: input.expectedDid ?? identityState.expectedDid,
                    recoverySessionToken: identityState.recoverySessionToken,
                },
                didFromPrivateKey: this.config.didFromPrivateKey,
                signDidAuthVp: this.config.signDidAuthVp,
            });
            // Whether a new PIN is required is known only once the new login is linked;
            // the digest is dropped there when it is not.
            await this.rememberSignInPin(result.did, result.privateKey, input.pin);
            if (generation !== this.recoveryGeneration || this.state !== identityState) {
                this.abandonSignInPin(result.did);
                this.keyDerivation.cancelIdentityRecovery?.();
                throw new Error('This recovery request was cancelled.');
            }
            this.setState({
                ...identityState,
                phase: 'new_login',
                recoverySessionToken: undefined,
                recoveredDid: result.did,
            });
            return this.state;
        } catch (error) {
            if (generation === this.recoveryGeneration && this.state === identityState) {
                this.setState({
                    status: 'identity_recovery',
                    phase: 'enter_email',
                    email: identityState.email,
                    recoveryMethods: [],
                    error: error instanceof Error ? error.message : 'Recovery failed',
                });
            }
            throw error;
        }
    }

    beginIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'idle') {
            throw new Error(`Cannot start identity recovery in state: ${this.state.status}`);
        }
        if (!this.keyDerivation.startIdentityRecovery) {
            throw new Error('Identity recovery is not supported');
        }

        this.setState({
            status: 'identity_recovery',
            phase: 'enter_email',
            recoveryMethods: [],
        });
        return this.state;
    }

    /** Rejected with RecoveryInProgressError while a recovery is in flight. */
    async sendIdentityRecoveryCode(email: string): Promise<UnifiedAuthState> {
        return this.runExclusiveRecovery('session', () => this.sendIdentityRecoveryCodeNow(email));
    }

    private async sendIdentityRecoveryCodeNow(email: string): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            !this.keyDerivation.startIdentityRecovery
        ) {
            throw new Error('Identity recovery has not been started');
        }

        await this.keyDerivation.startIdentityRecovery(email);
        this.setState({
            status: 'identity_recovery',
            phase: 'verify_email',
            email: email.trim().toLowerCase(),
            recoveryMethods: [],
        });
        return this.state;
    }

    /** Rejected with RecoveryInProgressError while a recovery is in flight. */
    async verifyIdentityRecoveryCode(code: string): Promise<UnifiedAuthState> {
        return this.runExclusiveRecovery('session', () => this.verifyIdentityRecoveryCodeNow(code));
    }

    private async verifyIdentityRecoveryCodeNow(code: string): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            this.state.phase !== 'verify_email' ||
            !this.state.email ||
            !this.keyDerivation.verifyIdentityRecovery
        ) {
            throw new Error('No recovery code is waiting to be verified');
        }

        const session = await this.keyDerivation.verifyIdentityRecovery(this.state.email, code);
        this.setState({
            status: 'identity_recovery',
            phase: 'choose_method',
            email: this.state.email,
            recoverySessionToken: session.recoverySessionToken,
            recoveryMethods: session.recoveryMethods,
            expectedDid: session.primaryDid ?? undefined,
            ...(session.escrowPin ? { escrowPin: session.escrowPin } : {}),
        });
        return this.state;
    }

    /**
     * Phrase/passkey/backup recovery in the lost-login flow. Rejected with
     * RecoveryInProgressError, without touching state, while another recovery (e.g. a
     * PIN sign-in on the same single-use session) is in flight.
     */
    async prepareIdentityRecovery(input: unknown): Promise<UnifiedAuthState> {
        return this.runExclusiveRecovery('recovery', () => this.prepareIdentityRecoveryNow(input));
    }

    private async prepareIdentityRecoveryNow(input: unknown): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            this.state.phase !== 'choose_method' ||
            !this.state.recoverySessionToken ||
            !this.keyDerivation.prepareIdentityRecovery ||
            !this.config.didFromPrivateKey
        ) {
            throw new Error('Identity recovery is not ready for a recovery method');
        }

        const email = this.state.email;
        const recoveryMethods = this.state.recoveryMethods;
        const expectedDid = this.state.expectedDid;

        try {
            const result = await this.keyDerivation.prepareIdentityRecovery({
                recoverySessionToken: this.state.recoverySessionToken,
                input,
                didFromPrivateKey: this.config.didFromPrivateKey,
            });

            this.setState({
                status: 'identity_recovery',
                phase: 'new_login',
                email,
                recoveryMethods,
                recoveredDid: result.did,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Identity recovery failed';

            if (error instanceof IdentityRecoverySessionConsumedError) {
                this.keyDerivation.cancelIdentityRecovery?.();
                this.setState({
                    status: 'identity_recovery',
                    phase: 'enter_email',
                    email,
                    recoveryMethods: [],
                    error: errorMessage,
                });
            } else {
                this.setState({
                    status: 'identity_recovery',
                    phase: 'choose_method',
                    email,
                    recoverySessionToken: this.state.recoverySessionToken,
                    recoveryMethods,
                    error: errorMessage,
                    expectedDid,
                });
            }
            // Recovery forms await this call to surface errors and release their loading state.
            throw error;
        }

        return this.state;
    }

    continueIdentityRecoveryLogin(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery' || this.state.phase !== 'new_login') {
            throw new Error('Identity recovery is not waiting for a new sign-in');
        }

        this.setState({ status: 'awaiting_rebind', did: this.state.recoveredDid ?? '' });
        return this.state;
    }

    finishIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery_success') {
            throw new Error('Identity recovery has not completed');
        }

        this.setState({
            status: 'ready',
            authUser: this.state.authUser,
            did: this.state.did,
            privateKey: this.state.privateKey,
            authSessionValid: true,
            sssActivationState: this.state.sssActivationState ?? 'provisional',
            ...(this.state.pinSignIn ? { pinSignIn: this.state.pinSignIn } : {}),
        });
        return this.state;
    }

    cancelIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery' && this.state.status !== 'awaiting_rebind') {
            return this.state;
        }

        // The lost-login PIN sign-in will not complete: its PIN stays usable.
        this.abandonSignInPin(
            this.state.status === 'awaiting_rebind'
                ? this.state.did || this.signInPinDigest?.did
                : (this.state.recoveredDid ?? this.signInPinDigest?.did)
        );
        this.recoveryGeneration++;
        this.keyDerivation.cancelIdentityRecovery?.();
        this.setState({ status: 'idle' });
        return this.state;
    }

    /**
     * Verify the integrity of stored keys.
     * Returns true if keys are healthy, false otherwise.
     */
    async verifyKeyIntegrity(): Promise<boolean> {
        if (this.state.status !== 'ready') {
            return false;
        }

        try {
            const { token, providerType } = await this.getAuthCredentials();
            const serverStatus = await this.keyDerivation.fetchServerKeyStatus(token, providerType);

            if (!serverStatus.primaryDid || !this.config.didFromPrivateKey) {
                return true; // Can't verify without DID
            }

            const localKey = await this.keyDerivation.getLocalKey();

            if (!localKey || !serverStatus.authShare) {
                return false;
            }

            if (this.keyDerivation.verifyKeys) {
                return this.keyDerivation.verifyKeys(
                    localKey,
                    serverStatus.authShare,
                    serverStatus.primaryDid,
                    this.config.didFromPrivateKey
                );
            }

            // Fallback: try to reconstruct and verify DID
            const privateKey = await this.keyDerivation.reconstructKey(
                localKey,
                serverStatus.authShare
            );
            const derivedDid = await this.config.didFromPrivateKey(privateKey);

            return derivedDid === serverStatus.primaryDid;
        } catch (e) {
            log.error('Key integrity verification failed', e);
            return false;
        }
    }

    /**
     * Attempt to refresh the auth session without navigating away.
     *
     * Layer 1: Silent refresh via the provider's refreshSession() (e.g.,
     *          Firebase force-refreshes the JWT using the refresh token).
     * Layer 2: Falls back to getIdToken() which may also trigger a refresh.
     *
     * On success, updates the current ready state with authSessionValid: true.
     * Returns true if the session was refreshed, false if full re-auth is needed.
     */
    async refreshAuthSession(): Promise<boolean> {
        // Only makes sense when we're in the ready state
        if (this.state.status !== 'ready') {
            return false;
        }

        // Layer 1: Try the provider's dedicated refresh method
        if (this.config.authProvider.refreshSession) {
            const refreshed = await this.config.authProvider.refreshSession();

            if (refreshed) {
                // Also re-fetch the authUser so it's up to date
                let authUser = this.state.authUser;

                try {
                    const freshUser = await this.config.authProvider.getCurrentUser();

                    if (freshUser) {
                        authUser = freshUser;
                    }
                } catch {
                    // Non-critical — keep existing authUser
                }

                this.setState({
                    ...this.state,
                    authUser,
                    authSessionValid: true,
                });

                return true;
            }
        }

        // Layer 2: Try getIdToken() directly (may use cached refresh token)
        try {
            await this.config.authProvider.getIdToken();

            let authUser = this.state.authUser;

            try {
                const freshUser = await this.config.authProvider.getCurrentUser();

                if (freshUser) {
                    authUser = freshUser;
                }
            } catch {
                // Non-critical
            }

            this.setState({
                ...this.state,
                authUser,
                authSessionValid: true,
            });

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Logout and clear session state.
     *
     * The device share is intentionally preserved so that returning users
     * on a trusted device can reconstruct their key without recovery.
     * To explicitly wipe the device share (e.g. on a public computer),
     * call `forgetDevice()` before or after logout.
     */
    async logout(): Promise<void> {
        const logoutAttemptId = ++logoutAttempt;
        const startedAt = performance.now();
        type LogoutPhase = 'pending_recovery' | 'provider_sign_out' | 'key_cleanup' | 'app_cleanup';
        let phase: LogoutPhase = 'pending_recovery';
        const elapsedMs = (): number => Math.round(performance.now() - startedAt);
        const runPhase = async (
            nextPhase: LogoutPhase,
            action: () => Promise<void>
        ): Promise<void> => {
            phase = nextPhase;
            const phaseStartedAt = performance.now();
            log.info('Logout phase started', { logoutAttemptId, phase, elapsedMs: elapsedMs() });
            await action();
            log.info('Logout phase completed', {
                logoutAttemptId,
                phase,
                phaseDurationMs: Math.round(performance.now() - phaseStartedAt),
                elapsedMs: elapsedMs(),
            });
        };
        log.info('Logout started', { logoutAttemptId });
        this.endingSession = true;
        this.pinAttemptBaseline = undefined;
        // An in-flight PIN sign-in is abandoned; a completed one's persisted guard stays.
        this.abandonSignInPin(this.signInPinDigest?.did);
        this.escrowPinChangeDismissed = undefined;
        this.stopEscrowPolling?.();
        this.recoveryGeneration++;
        this.escrowStatusGeneration++;
        try {
            await runPhase('pending_recovery', async () => {
                await this.drainEscrowOperations();
                this.keyDerivation.cancelIdentityRecovery?.();
            });
            await runPhase('provider_sign_out', () => this.config.authProvider.signOut());

            if (this.keyDerivation.cleanup) {
                await runPhase('key_cleanup', async () => {
                    await this.keyDerivation.cleanup?.();
                });
            }

            if (this.config.onLogout) {
                await runPhase('app_cleanup', async () => {
                    await this.config.onLogout?.();
                });
            }

            this.setState({ status: 'idle' });
            // App cleanup may schedule asynchronous deletions; their terminal
            // results are reported separately by the IndexedDB helper.
            log.info('Logout completed', { logoutAttemptId, elapsedMs: elapsedMs() });
        } catch (error) {
            log.error('Logout failed', {
                logoutAttemptId,
                phase,
                errorType: error instanceof Error ? 'error' : typeof error,
                elapsedMs: elapsedMs(),
            });
            throw error;
        } finally {
            this.endingSession = false;
        }
    }

    /**
     * Clear the local device share so this device is no longer "trusted".
     *
     * After calling this, the user will need to recover their key via a
     * recovery method (password, passkey, phrase, or backup) on next login.
     *
     * Use case: logging out on a shared / public computer.
     */
    async forgetDevice(): Promise<void> {
        this.endingSession = true;
        // The device is no longer trusted: drop this account's persisted PIN guard too.
        this.forgetPinGuard('did' in this.state ? this.state.did : undefined);
        this.signInPinDigest = undefined;
        this.escrowPinChangeDismissed = undefined;
        this.stopEscrowPolling?.();
        this.recoveryGeneration++;
        this.escrowStatusGeneration++;
        try {
            await this.drainEscrowOperations();
            this.keyDerivation.cancelIdentityRecovery?.();
            await this.keyDerivation.clearLocalKeys();
            if (this.config.clearPendingEscrowRecovery) {
                await this.config.clearPendingEscrowRecovery();
                return;
            }
            const clearPendingRecovery = async () => {
                if (typeof indexedDB !== 'undefined')
                    await deleteDeviceShare('escrow-recovery-pending');
                if (typeof sessionStorage !== 'undefined')
                    await createAdaptiveStorage().clearAllShares('escrow-recovery-pending');
            };
            if (typeof navigator !== 'undefined' && navigator.locks) {
                await navigator.locks.request('escrow-recovery-pending', clearPendingRecovery);
            } else {
                await clearPendingRecovery();
            }
        } finally {
            this.endingSession = false;
        }
    }

    /**
     * Retry from an error state.
     */
    async retry(): Promise<UnifiedAuthState> {
        if (this.state.status !== 'error') {
            return this.state;
        }

        const previousState = this.state.previousState;

        if (previousState) {
            this.setState(previousState);
        } else {
            this.setState({ status: 'idle' });
        }

        return this.initialize();
    }
}

/**
 * Create an AuthCoordinator instance.
 */
export function createAuthCoordinator(config: AuthCoordinatorConfig): AuthCoordinator {
    return new AuthCoordinator(config);
}
