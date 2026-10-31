import { randomInt } from 'node:crypto';
import {
    validatePin,
    type EscrowEnrollmentState,
    type SSSKeyDerivationStrategy,
    type SSSStorageFunctions,
} from '@learncard/sss-key-manager';
import { safeReason } from '../metrics';
import type { Sdk } from '../sdk';
import { secretSchema, type AccountSecret } from '../secrets';
import { memoryStorage } from '../storage';
import { initPool } from '../tier3/admin';
import { holdLabel, TIER3_POOL_SIZE } from '../tier3/config';
import type { InboxStore } from '../tier3/inbox';
import type { Ledger } from '../tier3/ledger';
import { describe, needsHuman, ProvisionError, refuse, type ProvisionStep } from './errors';
import { checkIdToken, type LoginClient } from './login';
import { loginTrustPolicy, waitForLoginCode, type LoginMailPolicy } from './login-mail';
import type { Plan } from './preflight';
import {
    CURRENT,
    PROVISIONING,
    ProvisioningVersion,
    versionWith,
    type SecretMetadata,
    type StagedSecretStore,
} from './secret-writer';
import { tier3Targets, type Target } from './targets';

/**
 * Canary account provisioning through the NORMAL user path (PROVISIONING.md):
 * email-code login -> Firebase custom-token sign-in -> new SSS key
 * (`atomicUpdateShares`, as the app's `setupNewKey`) -> escrow opt-in or PIN
 * (as the app's settings) -> optional activation -> the runner's own checks ->
 * compare-and-swap promotion of a staged secret version.
 *
 * Nothing here prints or persists a key, PIN, code, token, share or message.
 */
type StrategyMethods =
    | 'fetchServerKeyStatus'
    | 'atomicUpdateShares'
    | 'enableEscrowRecovery'
    | 'setEscrowPin'
    | 'activate'
    | 'getFreshDidAuthVp'
    | 'getEscrowEnrollmentState';
export type ProvisionStrategy = Required<Pick<SSSKeyDerivationStrategy, StrategyMethods>>;

/** Bind the SDK strategy's optional methods, failing closed if one is missing. */
export const narrowStrategy = (strategy: SSSKeyDerivationStrategy): ProvisionStrategy => {
    const methods: StrategyMethods[] = [
        'fetchServerKeyStatus',
        'atomicUpdateShares',
        'enableEscrowRecovery',
        'setEscrowPin',
        'activate',
        'getFreshDidAuthVp',
        'getEscrowEnrollmentState',
    ];
    const bound: Partial<Record<StrategyMethods, unknown>> = {};
    for (const name of methods) {
        const method = strategy[name];
        if (typeof method !== 'function') throw new ProvisionError('status', 'sdk_unsupported');
        bound[name] = (method as (...args: unknown[]) => unknown).bind(strategy);
    }
    return bound as ProvisionStrategy;
};

/** Random 8-digit PIN that the app's own `validatePin` accepts. */
export const randomPin = (): string => {
    for (;;) {
        const pin = String(randomInt(0, 100_000_000)).padStart(8, '0');
        if (validatePin(pin).ok) return pin;
    }
};

export interface ProvisionOptions {
    dryRun: boolean;
    /** Send one code and check trust/parse only. Never verifies (no Firebase user). */
    checkMail: boolean;
    /** Activate tier 1/3 accounts too (tier 2 always activates, as the app's PIN setup does). */
    activate: boolean;
    initPool: boolean;
    /** Required whenever login mail is read from the inbox (tier 3). */
    loginMail?: LoginMailPolicy;
    /** Optional Firebase project id the ID token's `aud` must equal. */
    firebaseProject?: string;
    mailTimeoutMs?: number;
    mailPollMs?: number;
    accountGapMs?: number;
}

export interface ProvisionDeps {
    login: LoginClient;
    refresh: (
        apiKey: string,
        refreshToken: string
    ) => Promise<{ token: string; refreshToken: string }>;
    inbox?: InboxStore;
    secrets: StagedSecretStore;
    sdk: Pick<Sdk, 'attest' | 'authority' | 'did' | 'sign'>;
    strategy: (storage: SSSStorageFunctions) => ProvisionStrategy;
    /** Hidden-input prompt (tier 1/2 login code). */
    prompt: (question: string) => Promise<string>;
    randomKey: () => Promise<string>;
    randomPin: () => string;
    now: () => number;
    sleep: (ms: number) => Promise<void>;
    /** Fixed, non-secret lines only. */
    out: (line: string) => void;
    newToken?: () => string;
}

type Classification =
    | { kind: 'live'; secret: AccountSecret; currentVersionId: string; staleProvisioning: boolean }
    | { kind: 'fresh'; currentVersionId: string }
    | {
          kind: 'resume';
          currentVersionId: string;
          provisioning: { versionId: string; secret: AccountSecret };
      };

const isEmptyObject = (value: unknown): boolean =>
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0;

const parseJson = (raw: string | undefined): unknown => {
    try {
        return JSON.parse(raw ?? '');
    } catch {
        return undefined;
    }
};

/** Fields the runner requires of a canary secret for this target. */
const matchesTarget = (secret: AccountSecret, target: Target): boolean =>
    secret.accountId === target.accountId &&
    secret.recoveryEmail.toLowerCase() === target.email &&
    secret.recoveryLanguage === 'en' &&
    secret.hold === undefined &&
    secret.lastReleasedRunId === undefined;

/**
 * Secrets Manager only (no lca-api, no login). Order matters:
 * 1. AWSCURRENT parses -> live; never modified.
 * 2. AWSCURRENT is exactly `{}` -> placeholder; anything else stops.
 * 3. PROVISIONING absent -> fresh; parses for this target -> resume; else stop.
 */
export const classify = async (
    secrets: StagedSecretStore,
    target: Target,
    metadata: SecretMetadata
): Promise<Classification> => {
    const currentVersionId = versionWith(metadata, CURRENT);
    if (!currentVersionId) throw needsHuman('classify', 'no_current_version');
    const provisioningVersionId = versionWith(metadata, PROVISIONING);
    const current = parseJson(await secrets.read(target.secretId, { versionId: currentVersionId }));
    const live = secretSchema.safeParse(current);
    if (live.success) {
        if (live.data.accountId !== target.accountId)
            throw refuse('classify', 'live_secret_other_account');
        return {
            kind: 'live',
            secret: live.data,
            currentVersionId,
            staleProvisioning:
                provisioningVersionId !== undefined && provisioningVersionId !== currentVersionId,
        };
    }
    if (!isEmptyObject(current)) throw needsHuman('classify', 'current_not_placeholder');
    if (!provisioningVersionId) return { kind: 'fresh', currentVersionId };
    const staged = secretSchema.safeParse(
        parseJson(await secrets.read(target.secretId, { versionId: provisioningVersionId }))
    );
    if (!staged.success) throw needsHuman('classify', 'provisioning_malformed');
    if (!matchesTarget(staged.data, target))
        throw needsHuman('classify', 'provisioning_other_account');
    return {
        kind: 'resume',
        currentVersionId,
        provisioning: { versionId: provisioningVersionId, secret: staged.data },
    };
};

const enrollmentOf = (
    value: EscrowEnrollmentState['state'] | EscrowEnrollmentState
): EscrowEnrollmentState => (typeof value === 'string' ? { state: value } : value);

export interface Outcome {
    label: string;
    result: 'provisioned' | 'live' | 'planned' | 'mail-ok';
}

export const createProvisioner = (plan: Plan, options: ProvisionOptions, deps: ProvisionDeps) => {
    const apiKey = plan.base.firebaseApiKey;
    const providerType = 'firebase' as const;
    const step = async <T>(
        target: Target,
        name: ProvisionStep,
        operation: () => Promise<T>,
        quiet = false
    ): Promise<T> => {
        try {
            const value = await operation();
            if (!quiet) deps.out(`${target.label} ${name} ok`);
            return value;
        } catch (error) {
            if (error instanceof ProvisionError) throw error;
            throw new ProvisionError(name, safeReason(error));
        }
    };

    /**
     * Send the code and read it from the inbox or the operator.
     *
     * Inbox path: exactly ONE send per run. Each send replaces the server's code
     * (`lca-api/src/routes/firebase.ts:276-280`) and the inbox orders mail by S3
     * arrival, not send order, so after a resend a late copy of the first,
     * already-replaced code could win "newest trusted" and burn the run's single
     * verify. A missing code therefore stops the run; resending is an explicit re-run.
     * Prompt path (tier 1/2): the operator reads their own mailbox and may ask for
     * one resend (at most two sends).
     */
    const readCode = async (target: Target): Promise<string> => {
        if (target.inboxPrefix) {
            if (!deps.inbox || !options.loginMail) throw refuse('usage', 'login_mail_policy');
            const since = deps.now();
            await step(target, 'send', () => deps.login.sendCode(target.email));
            const result = await step(
                target,
                'mail',
                () =>
                    waitForLoginCode({
                        store: deps.inbox!,
                        prefix: target.inboxPrefix!,
                        since,
                        policy: loginTrustPolicy(options.loginMail!, target.email),
                        timeoutMs: options.mailTimeoutMs ?? 270_000,
                        pollMs: options.mailPollMs ?? 10_000,
                        now: deps.now,
                        sleep: deps.sleep,
                    }),
                true
            );
            if (result.untrusted > 0)
                deps.out(`${target.label} mail: ${result.untrusted} untrusted message(s) ignored`);
            if (result.malformed > 0)
                deps.out(`${target.label} mail: ${result.malformed} malformed message(s) ignored`);
            if (result.code) {
                deps.out(`${target.label} mail ok`);
                return result.code;
            }
            deps.out(`${target.label} mail: no trusted login code (re-run to send a new one)`);
            throw new ProvisionError('mail', 'no_code');
        }
        for (let sends = 1; sends <= 2; sends += 1) {
            await step(target, 'send', () => deps.login.sendCode(target.email));
            const answer = (
                await deps.prompt(
                    sends === 1
                        ? `${target.label}: 6-digit login code (blank to resend once): `
                        : `${target.label}: 6-digit login code from the NEWEST email: `
                )
            ).trim();
            if (/^[0-9]{6}$/.test(answer)) return answer;
            if (answer !== '') throw refuse('prompt', 'code_format');
        }
        throw new ProvisionError('mail', 'no_code');
    };

    /** Email-code login exactly as the app performs it; returns a fresh ID token. */
    const login = async (target: Target): Promise<{ token: string; refreshToken: string }> => {
        const code = await readCode(target);
        const custom = await step(target, 'verify', () =>
            deps.login.verifyCode(target.email, code)
        );
        const exchanged = await step(target, 'exchange', () => deps.login.exchange(custom));
        checkIdToken(exchanged.idToken, target.email, deps.now(), options.firebaseProject);
        // Prove the runner's own auth path works with this refresh token.
        return step(target, 'refresh', () => deps.refresh(apiKey, exchanged.refreshToken));
    };

    /** The runner's view of a provisioned account. Throws on the first mismatch. */
    const verifyServer = async (
        target: Target,
        secret: AccountSecret,
        token: string,
        strategy: ProvisionStrategy,
        requireActive: boolean
    ): Promise<void> => {
        const status = await step(
            target,
            'check',
            () => strategy.fetchServerKeyStatus(token, providerType),
            true
        );
        if (
            (await deps.sdk.did(secret.privateKey)) !== secret.did ||
            status.primaryDid !== secret.did
        )
            throw needsHuman('check', 'did_mismatch');
        const enrollment = enrollmentOf(
            await step(
                target,
                'check',
                () => strategy.getEscrowEnrollmentState({ token, providerType }),
                true
            )
        );
        if (enrollment.state !== 'enrolled') throw new ProvisionError('check', 'not_enrolled');
        const pinState = enrollment.escrowPin?.state ?? 'none';
        if (target.tier === 2 ? pinState !== 'enabled' : pinState !== 'none')
            throw new ProvisionError('check', 'pin_state');
        if (requireActive && status.sssActivationState !== 'active')
            throw new ProvisionError('check', 'not_active');
        const authority = await step(
            target,
            'check',
            async () => deps.sdk.authority(secret, token, await deps.sdk.attest()),
            true
        );
        if (authority.hasPin !== (target.tier === 2))
            throw new ProvisionError('check', 'authority_pin');
        if (authority.shareVersion !== status.shareVersion)
            throw new ProvisionError('check', 'authority_share_version');
        deps.out(`${target.label} check ok`);
    };

    /** Read-only report for a live secret using its stored refresh token (never a login code). */
    const checkLive = async (target: Target, secret: AccountSecret): Promise<void> => {
        const auth = await step(target, 'refresh', () => deps.refresh(apiKey, secret.refreshToken));
        if (auth.refreshToken !== secret.refreshToken)
            deps.out(
                `${target.label} warning: refresh token rotated; the runner persists rotations`
            );
        const strategy = deps.strategy(memoryStorage().storage);
        await verifyServer(target, secret, auth.token, strategy, target.tier === 2);
    };

    /** Dry run: server state only through a stored refresh token; otherwise unknown. */
    const reportServerState = async (target: Target, secret: AccountSecret): Promise<void> => {
        try {
            const auth = await deps.refresh(apiKey, secret.refreshToken);
            const status = await deps
                .strategy(memoryStorage().storage)
                .fetchServerKeyStatus(auth.token, providerType);
            const state = !status.exists
                ? 'no server key'
                : status.primaryDid === secret.did
                  ? 'server key matches staged did'
                  : 'server key does NOT match staged did';
            deps.out(`${target.label} plan: server state: ${state}`);
        } catch {
            deps.out(`${target.label} plan: server state unknown (stored token unusable)`);
        }
    };

    const provisionOne = async (target: Target): Promise<Outcome> => {
        const metadata = plan.metadata.get(target.label);
        if (!metadata) throw refuse('usage', 'unknown_target');
        const found = await step(
            target,
            'classify',
            () => classify(deps.secrets, target, metadata),
            true
        );
        deps.out(`${target.label} classify ${found.kind} secret=${metadata.name}`);
        if (found.kind === 'live') {
            if (found.staleProvisioning)
                deps.out(
                    `${target.label} warning: stale ${PROVISIONING} label present (left untouched)`
                );
            await checkLive(target, found.secret);
            return { label: target.label, result: 'live' };
        }
        if (options.dryRun) {
            if (found.kind === 'resume') {
                deps.out(
                    `${target.label} plan: resume staged did=${found.provisioning.secret.did}`
                );
                await reportServerState(target, found.provisioning.secret);
            } else deps.out(`${target.label} plan: fresh; server state unknown (needs login)`);
            return { label: target.label, result: 'planned' };
        }

        // A. Session: a resume first tries its stored refresh token (no new code).
        let auth: { token: string; refreshToken: string } | undefined;
        if (found.kind === 'resume') {
            try {
                auth = await deps.refresh(apiKey, found.provisioning.secret.refreshToken);
                deps.out(`${target.label} refresh ok`);
            } catch {
                deps.out(`${target.label} refresh: stored token unusable; logging in`);
            }
        }
        auth ??= await login(target);
        const { token } = auth;

        // B. Server state decides fresh / resume / stop.
        const memory = memoryStorage(
            found.kind === 'resume' ? found.provisioning.secret.deviceState : undefined
        );
        const strategy = deps.strategy(memory.storage);
        const status = await step(target, 'status', () =>
            strategy.fetchServerKeyStatus(token, providerType)
        );

        let secret: AccountSecret;
        let writer: ProvisioningVersion;
        let needShares: boolean;
        if (found.kind === 'fresh') {
            // A key the server knows but no secret holds is orphaned: never add a second one.
            if (status.exists) throw needsHuman('status', 'server_key_without_secret');
            // C. Generate and write ahead BEFORE any server-side change.
            const privateKey = await deps.randomKey();
            secret = {
                accountId: target.accountId,
                privateKey,
                did: await deps.sdk.did(privateKey),
                pin: deps.randomPin(),
                refreshToken: auth.refreshToken,
                recoveryEmail: target.email,
                recoveryLanguage: 'en',
                deviceState: { shares: {}, versions: {} },
            };
            if (!validatePin(secret.pin).ok) throw new ProvisionError('secret', 'pin');
            writer = new ProvisioningVersion(
                deps.secrets,
                target.secretId,
                undefined,
                deps.newToken
            );
            const versionId = await step(target, 'secret', () => writer.write(secret), true);
            deps.out(`${target.label} write-ahead ok version=${versionId} did=${secret.did}`);
            needShares = true;
        } else {
            // Resume: the stored key and PIN, never regenerated.
            secret = {
                ...structuredClone(found.provisioning.secret),
                refreshToken: auth.refreshToken,
            };
            if ((await deps.sdk.did(secret.privateKey)) !== secret.did)
                throw needsHuman('classify', 'staged_did_mismatch');
            if (!status.exists) needShares = true;
            else if (status.primaryDid === secret.did) needShares = false;
            else throw needsHuman('status', 'server_did_mismatch');
            writer = new ProvisioningVersion(
                deps.secrets,
                target.secretId,
                found.provisioning,
                deps.newToken
            );
            if (secret.refreshToken !== found.provisioning.secret.refreshToken)
                await step(target, 'secret', () => writer.write(secret));
        }
        const owner = {
            token,
            providerType,
            privateKey: secret.privateKey,
            signDidAuthVp: deps.sdk.sign,
        };

        // D. Shares (the app's setupNewKey path).
        if (needShares) {
            await step(target, 'shares', () =>
                strategy.atomicUpdateShares({ ...owner, did: secret.did })
            );
            secret.deviceState = memory.snapshot();
            await step(target, 'secret', () => writer.write(secret), true);
        }

        // E. Escrow: explicit opt-in (tiers 1/3) or PIN setup (tier 2), contact = login address.
        const contact = { recoveryEmail: target.email, recoveryLanguage: 'en' };
        await step(target, 'enroll', async () => {
            if (target.tier === 2) {
                await strategy.setEscrowPin({ ...owner, pin: secret.pin, options: contact });
                return;
            }
            const result = await strategy.enableEscrowRecovery({ ...owner, options: contact });
            if (result.enrolled !== true)
                throw needsHuman('enroll', `not_enrolled_${result.reason}`);
        });
        secret.deviceState = memory.snapshot();
        await step(target, 'secret', () => writer.write(secret), true);

        // F. Activation: tier 2 as the app's PIN setup; tiers 1/3 only when asked.
        const activate = target.tier === 2 || options.activate;
        if (activate) {
            const current = await step(
                target,
                'activate',
                () => strategy.fetchServerKeyStatus(token, providerType),
                true
            );
            if (current.sssActivationState !== 'active')
                await step(target, 'activate', async () =>
                    strategy.activate(
                        token,
                        providerType,
                        await strategy.getFreshDidAuthVp(
                            secret.privateKey,
                            secret.did,
                            deps.sdk.sign
                        )
                    )
                );
        }

        // G. Verify as the runner will, then promote with compare-and-swap.
        await verifyServer(target, secret, token, strategy, activate);
        const refreshed = await step(
            target,
            'refresh',
            () => deps.refresh(apiKey, secret.refreshToken),
            true
        );
        if (refreshed.refreshToken !== secret.refreshToken) {
            secret.refreshToken = refreshed.refreshToken;
            await step(target, 'secret', () => writer.write(secret), true);
        }
        const stored = await step(target, 'check', () => writer.readBack(), true);
        if (!matchesTarget(stored, target) || stored.did !== secret.did)
            throw needsHuman('check', 'readback_target');
        await step(target, 'promote', () => writer.promote(found.currentVersionId), true);
        deps.out(
            `${target.label} provisioned secret=${metadata.name} version=${writer.versionId} did=${secret.did}`
        );
        return { label: target.label, result: 'provisioned' };
    };

    /** `--check-mail`: one send, then trust + parse only. Never verifies. */
    const checkMail = async (target: Target): Promise<Outcome> => {
        if (!target.inboxPrefix) throw refuse('usage', 'check_mail_tier3_only');
        if (options.dryRun) {
            deps.out(`${target.label} plan: check-mail would send one login code`);
            return { label: target.label, result: 'planned' };
        }
        await readCodeOnce(target);
        return { label: target.label, result: 'mail-ok' };
    };
    const readCodeOnce = async (target: Target): Promise<void> => {
        const since = deps.now();
        await step(target, 'send', () => deps.login.sendCode(target.email));
        const result = await waitForLoginCode({
            store: deps.inbox!,
            prefix: target.inboxPrefix!,
            since,
            policy: loginTrustPolicy(options.loginMail!, target.email),
            timeoutMs: options.mailTimeoutMs ?? 270_000,
            pollMs: options.mailPollMs ?? 10_000,
            now: deps.now,
            sleep: deps.sleep,
        });
        deps.out(
            `${target.label} check-mail trusted_and_parsed=${result.code ? 'yes' : 'no'} untrusted=${result.untrusted} malformed=${result.malformed}`
        );
        if (!result.code) throw new ProvisionError('mail', 'no_trusted_login_mail');
    };

    /** `--init-pool`: all twelve hold secrets must be live and pass the runner's checks. */
    const initialisePool = async (ledger: Ledger): Promise<void> => {
        if (!plan.runner) throw refuse('usage', 'init_pool_tier3_only');
        const labels = Array.from({ length: TIER3_POOL_SIZE }, (_, index) => holdLabel(index));
        for (const target of tier3Targets(plan.runner, labels)) {
            const metadata = await deps.secrets.describe(target.secretId);
            const found = await classify(deps.secrets, target, metadata);
            if (found.kind !== 'live' || !matchesTarget(found.secret, target))
                throw new ProvisionError('pool', `${target.label}_not_provisioned`);
            await checkLive(target, found.secret);
        }
        if (options.dryRun) {
            deps.out('pool plan: all 12 hold accounts verified; init-pool would run');
            return;
        }
        const created = await initPool({ ledger, environment: plan.environment, now: deps.now() });
        deps.out(`pool init-pool ok created=${created}`);
    };

    return {
        /** Sequential, stops at the first failure. Returns outcomes for completed targets. */
        async run(): Promise<Outcome[]> {
            if (options.checkMail && (!deps.inbox || !options.loginMail))
                throw refuse('usage', 'login_mail_policy');
            const outcomes: Outcome[] = [];
            for (const [index, target] of plan.targets.entries()) {
                if (index > 0) await deps.sleep(options.accountGapMs ?? 2_000);
                try {
                    outcomes.push(
                        options.checkMail ? await checkMail(target) : await provisionOne(target)
                    );
                } catch (error) {
                    const failure = describe('classify', error);
                    deps.out(`${target.label} FAILED ${failure.message}`);
                    throw failure;
                }
            }
            if (options.initPool && !options.checkMail) {
                if (!plan.ledger) throw refuse('usage', 'init_pool_tier3_only');
                await initialisePool(plan.ledger);
            }
            return outcomes;
        },
    };
};
