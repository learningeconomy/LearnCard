import type { SSSKeyDerivationStrategy, SSSStorageFunctions } from '@learncard/sss-key-manager';
import { narrowStrategy, type ProvisionStrategy } from '../provision/flow';
import type { Sdk } from '../sdk';
import { memoryStorage } from '../storage';
import { LoadError } from './errors';
import { loadReason } from './reasons';
import type { EscrowObserver } from './requests';
import { THROTTLED_BY_CLIENT_IP } from './stats';

/**
 * Per-user client flows, built from the same SDK strategy the canary uses
 * (`createSdk(...).strategy`, Nitro attestation pinned to reviewed PCRs), and
 * following what the app's `AuthCoordinator` calls (learn-card-base
 * `src/auth-coordinator/AuthCoordinator.ts`):
 *
 * - `enrol`: the app's new-key path (`atomicUpdateShares`, as `setupNewKey`),
 *   then the app's AUTOMATIC enrolment on reaching `ready` (`refreshEscrow`):
 *   the rollout-gate `getEscrowEnrollmentState` prefetch, `ensureEscrowEnrollment`
 *   with the recovery contact options, the follow-up `getEscrowEnrollmentState`
 *   and `getEscrowRecoveryStatus`. With `optIn`, the explicit settings opt-in
 *   (`enableEscrowRecovery`) instead. Optionally followed by `setEscrowPin` +
 *   activation (as the app's PIN setup).
 * - `pinSetup`: PIN pool preparation, as canary provisioning tier 2:
 *   shares, `setEscrowPin`, activation.
 * - `pinRecovery`: a new-device PIN sign-in, as the coordinator's
 *   `executeRecovery`: fresh sign-in, the status read that lands a new device in
 *   `needs_recovery`, then `executeRecovery({ method: 'escrow-pin' })` with the
 *   own-typos attempt context from that status and the recovery contact options,
 *   an independent DID check, and the same `refreshEscrow` the app runs on
 *   reaching `ready`. The canary's same-PIN re-set is opt-in (`resetPin`): the
 *   SDK's PIN sign-in already refreshes the PIN budget.
 *
 * Keys and PINs live only in memory for the run; nothing here prints anything.
 */
export type LoadStep =
    | 'createUser'
    | 'login'
    | 'status'
    | 'shares'
    | 'enrolGate'
    | 'enroll'
    | 'optIn'
    | 'enrolState'
    | 'holdStatus'
    | 'setPin'
    | 'activate'
    | 'recovery'
    | 'identity'
    | 'resetPin';

type LoadMethods = 'executeRecovery' | 'ensureEscrowEnrollment' | 'getEscrowRecoveryStatus';
export type LoadStrategy = ProvisionStrategy &
    Required<Pick<SSSKeyDerivationStrategy, LoadMethods>>;

export const narrowLoadStrategy = (strategy: SSSKeyDerivationStrategy): LoadStrategy => {
    const base = narrowStrategy(strategy);
    const methods: LoadMethods[] = [
        'executeRecovery',
        'ensureEscrowEnrollment',
        'getEscrowRecoveryStatus',
    ];
    const bound: Partial<Record<LoadMethods, unknown>> = {};
    for (const name of methods) {
        const method = strategy[name];
        if (typeof method !== 'function') throw new LoadError('sdk_unsupported');
        bound[name] = (method as (...args: unknown[]) => unknown).bind(strategy);
    }
    return { ...base, ...(bound as Required<Pick<SSSKeyDerivationStrategy, LoadMethods>>) };
};

export interface SyntheticUser {
    n: number;
    email: string;
    uid: string;
}

export interface PinUser extends SyntheticUser {
    privateKey: string;
    did: string;
    pin: string;
}

export interface ScenarioDeps {
    customToken(uid: string): Promise<string>;
    exchange(customToken: string): Promise<{ idToken: string }>;
    /** Throws (ProvisionError 'token') for the wrong user, project or an expired token. */
    checkToken(idToken: string, email: string): void;
    sdk: Pick<Sdk, 'did' | 'sign'>;
    strategy(storage: SSSStorageFunctions): LoadStrategy;
    randomKey(): Promise<string>;
    randomPin(): string;
    /** Times one step and records its outcome; rethrows the original error. */
    time<T>(step: LoadStep, operation: () => Promise<T>): Promise<T>;
    /** Runs `operation` with `observer` receiving its escrow responses (route + status only). */
    observeEscrow<T>(observer: EscrowObserver, operation: () => Promise<T>): Promise<T>;
}

const providerType = 'firebase' as const;

/** As the coordinator's `recoveryContactOptions`: the login email and the app locale. */
const contactFor = (user: SyntheticUser) => ({
    recoveryEmail: user.email,
    recoveryLanguage: 'en',
});

const notEnrolled = (reason: unknown): LoadError =>
    new LoadError(`not_enrolled_${String(reason).replace(/-/g, '_')}`);

type Owner = {
    token: string;
    providerType: typeof providerType;
    privateKey: string;
    signDidAuthVp: ScenarioDeps['sdk']['sign'];
};

/**
 * The coordinator's `refreshEscrow` on reaching `ready`, for an account the
 * rollout admits (the app always configures `isEscrowEnrollmentAllowed`, so the
 * gate reads the enrollment state first). The app treats a failed enrolment as
 * best effort; here it fails the scenario so it is counted.
 */
const refreshEscrow = async (
    deps: ScenarioDeps,
    strategy: LoadStrategy,
    owner: Owner,
    contact: ReturnType<typeof contactFor>
): Promise<void> => {
    const credentials = { token: owner.token, providerType: owner.providerType };
    await deps.time('enrolGate', () => strategy.getEscrowEnrollmentState(credentials));
    await deps.time('enroll', async () => {
        const result = await strategy.ensureEscrowEnrollment({ ...owner, options: contact });
        if (!result.enrolled) throw notEnrolled(result.reason);
    });
    await deps.time('enrolState', () => strategy.getEscrowEnrollmentState(credentials));
    await deps.time('holdStatus', () => strategy.getEscrowRecoveryStatus(credentials));
};

/** Custom token -> Firebase REST exchange -> local ID token check. */
export const signIn = (deps: ScenarioDeps, user: SyntheticUser): Promise<string> =>
    deps.time('login', async () => {
        const { idToken } = await deps.exchange(await deps.customToken(user.uid));
        deps.checkToken(idToken, user.email);
        return idToken;
    });

const activate = async (
    deps: ScenarioDeps,
    strategy: LoadStrategy,
    token: string,
    privateKey: string,
    did: string
): Promise<void> =>
    deps.time('activate', async () => {
        const status = await strategy.fetchServerKeyStatus(token, providerType);
        if (status.sssActivationState === 'active') return;
        await strategy.activate(
            token,
            providerType,
            await strategy.getFreshDidAuthVp(privateKey, did, deps.sdk.sign)
        );
    });

/** New key for a fresh account; refuses if the server already holds one. */
const newKey = async (deps: ScenarioDeps, user: SyntheticUser) => {
    const token = await signIn(deps, user);
    const memory = memoryStorage();
    const strategy = deps.strategy(memory.storage);
    const status = await deps.time('status', () =>
        strategy.fetchServerKeyStatus(token, providerType)
    );
    if (status.exists) throw new LoadError('server_key_exists');
    const privateKey = await deps.randomKey();
    const did = await deps.sdk.did(privateKey);
    const owner: Owner = { token, providerType, privateKey, signDidAuthVp: deps.sdk.sign };
    await deps.time('shares', () => strategy.atomicUpdateShares({ ...owner, did }));
    return { token, strategy, privateKey, did, owner };
};

export interface EnrolOptions {
    withPin: boolean;
    /** Explicit settings opt-in (`enableEscrowRecovery`) instead of automatic enrolment. */
    optIn?: boolean;
}

/** Returns the PIN user when a PIN was set (usable for later PIN recoveries). */
export const enrol = async (
    deps: ScenarioDeps,
    user: SyntheticUser,
    options: EnrolOptions
): Promise<PinUser | undefined> => {
    const { token, strategy, privateKey, did, owner } = await newKey(deps, user);
    const contact = contactFor(user);
    if (options.optIn)
        await deps.time('optIn', async () => {
            const result = await strategy.enableEscrowRecovery({ ...owner, options: contact });
            if (result.enrolled !== true) throw notEnrolled(result.reason);
        });
    else await refreshEscrow(deps, strategy, owner, contact);
    if (!options.withPin) return undefined;
    const pin = deps.randomPin();
    await deps.time('setPin', () => strategy.setEscrowPin({ ...owner, pin, options: contact }));
    await activate(deps, strategy, token, privateKey, did);
    return { ...user, privateKey, did, pin };
};

export const pinSetup = async (deps: ScenarioDeps, user: SyntheticUser): Promise<PinUser> => {
    const { token, strategy, privateKey, did, owner } = await newKey(deps, user);
    const pin = deps.randomPin();
    await deps.time('setPin', () =>
        strategy.setEscrowPin({ ...owner, pin, options: contactFor(user) })
    );
    await activate(deps, strategy, token, privateKey, did);
    return { ...user, privateKey, did, pin };
};

export interface PinRecoveryOptions {
    /** Re-set the same PIN afterwards, as the canary does (not the app). */
    resetPin?: boolean;
}

/**
 * A PIN recovery the server refused at its START (`/keys/escrow/recover`, 429):
 * lca-api throttles before it looks up the account (the per-IP limiter) or before
 * it creates a hold (a held PIN-operation lease), so no hold exists and the user
 * can be reused. A refusal at completion keeps the default (the user is retired).
 */
const pinFailure = (
    error: unknown,
    seen: { startStatus?: number; throttledByClientIp: boolean }
): unknown => {
    const reason = seen.throttledByClientIp ? THROTTLED_BY_CLIENT_IP : loadReason(error);
    if (seen.startStatus === 429) return new LoadError(reason, { noHold: true });
    return seen.throttledByClientIp ? new LoadError(reason) : error;
};

export const pinRecovery = async (
    deps: ScenarioDeps,
    user: PinUser,
    options: PinRecoveryOptions = {}
): Promise<void> => {
    const token = await signIn(deps, user);
    const memory = memoryStorage();
    const strategy = deps.strategy(memory.storage);
    // The read that puts a new device in `needs_recovery`; the coordinator takes its
    // PIN attempt baseline (own-typos rule) from it.
    const status = await deps.time('status', () =>
        strategy.fetchServerKeyStatus(token, providerType)
    );
    const pinStatus = status.escrowPin;
    const pinAttempts = pinStatus
        ? {
              ...(pinStatus.wrongAttempts !== undefined
                  ? { priorWrongAttempts: pinStatus.wrongAttempts }
                  : {}),
              ownWrongAttempts: 0,
              ...(pinStatus.salt ? { pinSalt: pinStatus.salt } : {}),
          }
        : undefined;
    const contact = contactFor(user);
    const seen: { startStatus?: number; throttledByClientIp: boolean } = {
        throttledByClientIp: false,
    };
    const recovered = await deps.time('recovery', () =>
        deps.observeEscrow(
            response => {
                if (response.path === '/recover') seen.startStatus = response.status;
                if (response.throttledByClientIp) seen.throttledByClientIp = true;
            },
            async () => {
                try {
                    return await strategy.executeRecovery({
                        token,
                        providerType,
                        input: {
                            method: 'escrow-pin',
                            pin: user.pin,
                            expectedDid: user.did,
                            ...(pinAttempts ? { pinAttempts } : {}),
                        },
                        didFromPrivateKey: deps.sdk.did,
                        signDidAuthVp: deps.sdk.sign,
                        options: contact,
                    });
                } catch (error) {
                    throw pinFailure(error, seen);
                }
            }
        )
    );
    await deps.time('identity', async () => {
        if (recovered.did !== user.did || (await deps.sdk.did(recovered.privateKey)) !== user.did)
            throw new LoadError('did_mismatch');
        // PIN sign-in keeps the enrolment; anything else would make the app re-enrol.
        if (recovered.escrowEnrolled === false) throw new LoadError('recovered_not_enrolled');
    });
    const owner: Owner = {
        token,
        providerType,
        privateKey: recovered.privateKey,
        signDidAuthVp: deps.sdk.sign,
    };
    if (options.resetPin)
        await deps.time('resetPin', () =>
            strategy.setEscrowPin({ ...owner, pin: user.pin, options: contact })
        );
    await refreshEscrow(deps, strategy, owner, contact);
};
