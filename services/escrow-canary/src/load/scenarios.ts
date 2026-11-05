import type { SSSKeyDerivationStrategy, SSSStorageFunctions } from '@learncard/sss-key-manager';
import { narrowStrategy, type ProvisionStrategy } from '../provision/flow';
import type { Sdk } from '../sdk';
import { memoryStorage } from '../storage';
import { LoadError } from './errors';

/**
 * Per-user client flows, built from the same SDK strategy the canary uses
 * (`createSdk(...).strategy`, Nitro attestation pinned to reviewed PCRs):
 *
 * - `enrol`: the app's new-key path (`atomicUpdateShares`, as `setupNewKey`)
 *   then `enableEscrowRecovery` (opt-in, as automatic enrolment), optionally
 *   followed by `setEscrowPin` + activation (as the app's PIN setup).
 * - `pinSetup`: PIN pool preparation, as canary provisioning tier 2:
 *   shares, `setEscrowPin`, activation.
 * - `pinRecovery`: a new-device PIN sign-in, as canary tier 2: fresh sign-in,
 *   empty memory storage, `executeRecovery({ method: 'escrow-pin' })`, an
 *   independent DID check, then the same-PIN re-set the canary performs.
 *
 * Keys and PINs live only in memory for the run; nothing here prints anything.
 */
export type LoadStep =
    | 'createUser'
    | 'login'
    | 'status'
    | 'shares'
    | 'enroll'
    | 'setPin'
    | 'activate'
    | 'recovery'
    | 'identity'
    | 'resetPin';

export type LoadStrategy = ProvisionStrategy &
    Required<Pick<SSSKeyDerivationStrategy, 'executeRecovery'>>;

export const narrowLoadStrategy = (strategy: SSSKeyDerivationStrategy): LoadStrategy => {
    const base = narrowStrategy(strategy);
    if (typeof strategy.executeRecovery !== 'function') throw new LoadError('sdk_unsupported');
    return { ...base, executeRecovery: strategy.executeRecovery.bind(strategy) };
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
}

const providerType = 'firebase' as const;

const contactFor = (user: SyntheticUser) => ({
    recoveryEmail: user.email,
    recoveryLanguage: 'en',
});

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
    const owner = { token, providerType, privateKey, signDidAuthVp: deps.sdk.sign };
    await deps.time('shares', () => strategy.atomicUpdateShares({ ...owner, did }));
    return { token, strategy, privateKey, did, owner };
};

export interface EnrolOptions {
    withPin: boolean;
}

/** Returns the PIN user when a PIN was set (usable for later PIN recoveries). */
export const enrol = async (
    deps: ScenarioDeps,
    user: SyntheticUser,
    options: EnrolOptions
): Promise<PinUser | undefined> => {
    const { token, strategy, privateKey, did, owner } = await newKey(deps, user);
    const contact = contactFor(user);
    await deps.time('enroll', async () => {
        const result = await strategy.enableEscrowRecovery({ ...owner, options: contact });
        if (result.enrolled !== true)
            throw new LoadError(`not_enrolled_${String(result.reason).replace(/-/g, '_')}`);
    });
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

export const pinRecovery = async (deps: ScenarioDeps, user: PinUser): Promise<void> => {
    const token = await signIn(deps, user);
    const memory = memoryStorage();
    const strategy = deps.strategy(memory.storage);
    const common = { token, providerType, signDidAuthVp: deps.sdk.sign };
    const recovered = await deps.time('recovery', () =>
        strategy.executeRecovery({
            ...common,
            didFromPrivateKey: deps.sdk.did,
            input: { method: 'escrow-pin', pin: user.pin, expectedDid: user.did },
        })
    );
    await deps.time('identity', async () => {
        if (recovered.did !== user.did || (await deps.sdk.did(recovered.privateKey)) !== user.did)
            throw new LoadError('did_mismatch');
    });
    // As the canary: re-set the same PIN with the recovery contact (fresh budget).
    await deps.time('resetPin', () =>
        strategy.setEscrowPin({
            ...common,
            privateKey: recovered.privateKey,
            pin: user.pin,
            options: contactFor(user),
        })
    );
};
