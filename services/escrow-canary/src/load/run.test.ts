import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it } from 'vitest';
import {
    EscrowPinMismatchError,
    EscrowPinThrottledError,
    EscrowRequestError,
} from '@learncard/sss-key-manager';
import { ProvisionError } from '../provision/errors';
import { buildPlan, type Stage } from './plan';
import { runLoad, type RunDeps, type RunOptions } from './run';
import {
    enrol,
    narrowLoadStrategy,
    pinRecovery,
    type LoadStrategy,
    type ScenarioDeps,
} from './scenarios';
import { LoadError } from './errors';
import type { EscrowObserver } from './requests';

const PIN = '13572468';

/** A scripted escrow response for the fake PIN release (429s throw as the SDK does). */
type PinResponse = { status: number; clientIp?: boolean };

/** Offline fake of lca-api + SDK strategy, keyed by Firebase uid via the ID token. */
const world = () => {
    const server = new Map<
        string,
        { did: string; active: boolean; pin?: string; optIn?: boolean }
    >();
    const calls: string[] = [];
    let keys = 0;
    let createdUsers = 0;
    const recorded: { uid: string; email: string }[] = [];
    const record: { fail: boolean } = { fail: false };
    const failures: Partial<Record<string, () => Error>> = {};
    const pinResponses: { recover?: PinResponse; complete?: PinResponse } = {};
    const params: Record<string, unknown[]> = {};
    const observers = new AsyncLocalStorage<EscrowObserver>();
    const uidOf = (token: string) => token.replace(/^id:/, '');
    const maybeFail = (name: string, args?: unknown) => {
        calls.push(name);
        (params[name] ??= []).push(args);
        const failure = failures[name];
        if (failure) throw failure();
    };
    const strategy = (): LoadStrategy =>
        ({
            fetchServerKeyStatus: async (token: string) => {
                maybeFail('status');
                const entry = server.get(uidOf(token));
                return {
                    exists: !!entry,
                    primaryDid: entry?.did ?? null,
                    sssActivationState: entry?.active ? 'active' : 'provisional',
                    shareVersion: 1,
                    ...(entry?.pin
                        ? { escrowPin: { state: 'enabled', salt: 'salt-1', wrongAttempts: 0 } }
                        : {}),
                };
            },
            atomicUpdateShares: async ({ token, did }: { token: string; did: string }) => {
                maybeFail('shares');
                server.set(uidOf(token), { did, active: false });
            },
            enableEscrowRecovery: async ({
                token,
                options,
            }: {
                token: string;
                options: { recoveryEmail: string };
            }) => {
                maybeFail('optIn');
                if (!options.recoveryEmail.includes('@')) throw new Error('contact');
                server.get(uidOf(token))!.optIn = true;
                return { enrolled: true, changed: true };
            },
            setEscrowPin: async ({ token, pin }: { token: string; pin: string }) => {
                maybeFail('setPin');
                server.get(uidOf(token))!.pin = pin;
            },
            activate: async (token: string, _provider: string, vp: string) => {
                maybeFail('activate');
                if (vp !== 'vp') throw new Error('vp');
                server.get(uidOf(token))!.active = true;
            },
            getFreshDidAuthVp: async () => 'vp',
            getEscrowEnrollmentState: async () => {
                maybeFail('enrolState');
                return { state: 'enrolled' };
            },
            ensureEscrowEnrollment: async (args: {
                token: string;
                options: { recoveryEmail: string };
            }) => {
                maybeFail('ensure', args);
                if (!args.options.recoveryEmail.includes('@')) throw new Error('contact');
                server.get(uidOf(args.token))!.optIn = true;
                return { enrolled: true, changed: true };
            },
            getEscrowRecoveryStatus: async () => {
                maybeFail('holdStatus');
                return null;
            },
            executeRecovery: async (args: {
                token: string;
                input: { pin: string; expectedDid: string };
            }) => {
                maybeFail('recover', args);
                const respond = (path: string, response: PinResponse = { status: 200 }) => {
                    observers.getStore()?.({
                        path,
                        status: response.status,
                        throttledByClientIp: response.clientIp === true,
                    });
                    if (response.status === 429) throw new EscrowPinThrottledError();
                };
                respond('/recover', pinResponses.recover);
                respond('/complete', pinResponses.complete);
                const entry = server.get(uidOf(args.token))!;
                if (entry.pin !== args.input.pin) throw new EscrowPinMismatchError(9);
                return {
                    did: entry.did,
                    privateKey: entry.did.replace('did:key:', ''),
                    escrowEnrolled: true,
                };
            },
        }) as unknown as LoadStrategy;
    let t = 0;
    const out: string[] = [];
    const deps: RunDeps = {
        admin: {
            createUser: async ({ email, emailVerified }) => {
                calls.push('createUser');
                if (!emailVerified) throw new Error('unverified');
                createdUsers += 1;
                return { uid: `uid-${email.split('-').pop()!.split('@')[0]}` };
            },
            createCustomToken: async uid => `custom:${uid}`,
        },
        recordUser: user => {
            if (record.fail) throw new Error('ENOSPC');
            recorded.push(user);
        },
        exchange: async custom => ({ idToken: custom.replace('custom:', 'id:') }),
        checkToken: () => undefined,
        sdk: { did: async key => `did:key:${key}`, sign: async () => 'vp' },
        strategy,
        randomKey: async () => `key${(keys += 1)}`,
        randomPin: () => PIN,
        observeEscrow: (observer, operation) => observers.run(observer, operation),
        now: () => t,
        // Yield a macrotask so started scenarios settle before the next arrival.
        sleep: async ms => {
            await new Promise(resolve => setImmediate(resolve));
            t += ms;
        },
        every: () => () => undefined,
        out: line => out.push(line),
    };
    return {
        server,
        calls,
        params,
        deps,
        failures,
        pinResponses,
        out,
        recorded,
        record,
        created: () => createdUsers,
    };
};

const options = (
    stages: Stage[],
    extra: Partial<RunOptions> & { pinRatio?: number; pinPool?: number } = {}
): RunOptions => {
    const pinRatio = extra.pinRatio ?? 0;
    const enrolWithPin = extra.enrolWithPin ?? false;
    return {
        plan: buildPlan({ stages, pinRatio, pinPool: extra.pinPool ?? 0, enrolWithPin }),
        address: { prefix: 'escrow-load', runId: 'a1b2c3d4', domain: 'inbox.example.org' },
        pinRatio,
        enrolWithPin,
        maxInFlight: 10,
        lateMs: 500,
        setupRate: 5,
        progressSec: 0,
        stopErrorRate: 0.5,
        ...extra,
    };
};

type StageSummary = {
    stage: string;
    started: number;
    ok: number;
    failed: number;
    throttledByClientIp: number;
    dropped: Record<string, number>;
    scenarios: Record<string, { count: number; ok: number; errors: Record<string, number> }>;
    steps: Record<string, { count: number; ok: number; errors: Record<string, number> }>;
};
const stagesOf = (summary: Record<string, unknown>) => summary.stages as StageSummary[];

describe('scenarios', () => {
    const scenarioDeps = (w: ReturnType<typeof world>): ScenarioDeps => ({
        ...w.deps,
        customToken: uid => w.deps.admin.createCustomToken(uid),
        time: (_step, operation) => operation(),
    });
    const user = { n: 1, email: 'escrow-load+a1b2c3d4-1@inbox.example.org', uid: 'uid-1' };

    const refresh = ['enrolState', 'ensure', 'enrolState', 'holdStatus'];

    it('enrol follows the app path: shares, then automatic enrolment as refreshEscrow', async () => {
        const w = world();
        expect(await enrol(scenarioDeps(w), user, { withPin: false })).toBeUndefined();
        expect(w.calls).toEqual(['status', 'shares', ...refresh]);
        expect(w.params.ensure[0]).toMatchObject({
            token: 'id:uid-1',
            providerType: 'firebase',
            privateKey: 'key1',
            signDidAuthVp: w.deps.sdk.sign,
            options: { recoveryEmail: user.email, recoveryLanguage: 'en' },
        });
        const w2 = world();
        const pinUser = await enrol(scenarioDeps(w2), user, { withPin: true });
        expect(w2.calls).toEqual(['status', 'shares', ...refresh, 'setPin', 'status', 'activate']);
        expect(pinUser).toMatchObject({ uid: 'uid-1', did: 'did:key:key1', pin: PIN });
        expect(w2.server.get('uid-1')).toMatchObject({ active: true, optIn: true, pin: PIN });
    });

    it('enrol uses the explicit opt-in only when asked', async () => {
        const w = world();
        await enrol(scenarioDeps(w), user, { withPin: false, optIn: true });
        expect(w.calls).toEqual(['status', 'shares', 'optIn']);
    });

    it('refuses an account that already has a server key', async () => {
        const w = world();
        w.server.set('uid-1', { did: 'did:key:other', active: true });
        await expect(enrol(scenarioDeps(w), user, { withPin: false })).rejects.toEqual(
            new LoadError('server_key_exists')
        );
        expect(w.calls).toEqual(['status']);
    });

    it('PIN recovery passes what the app passes, checks the DID, then refreshes escrow', async () => {
        const w = world();
        const pinUser = await enrol(scenarioDeps(w), user, { withPin: true });
        w.calls.length = 0;
        await pinRecovery(scenarioDeps(w), pinUser!);
        expect(w.calls).toEqual(['status', 'recover', ...refresh]);
        expect(w.params.recover[0]).toMatchObject({
            token: 'id:uid-1',
            providerType: 'firebase',
            input: {
                method: 'escrow-pin',
                pin: PIN,
                expectedDid: 'did:key:key1',
                pinAttempts: { priorWrongAttempts: 0, ownWrongAttempts: 0, pinSalt: 'salt-1' },
            },
            options: { recoveryEmail: user.email, recoveryLanguage: 'en' },
        });
        expect(w.params.ensure.at(-1)).toMatchObject({ privateKey: 'key1' });
        w.calls.length = 0;
        await pinRecovery(scenarioDeps(w), pinUser!, { resetPin: true });
        expect(w.calls).toEqual(['status', 'recover', 'setPin', ...refresh]);
        await expect(
            pinRecovery(scenarioDeps(w), { ...pinUser!, did: 'did:key:someone-else' })
        ).rejects.toEqual(new LoadError('did_mismatch'));
    });

    it('classifies PIN throttling by where it happened and by limiter', async () => {
        const w = world();
        const pinUser = (await enrol(scenarioDeps(w), user, { withPin: true }))!;
        w.pinResponses.recover = { status: 429, clientIp: true };
        await expect(pinRecovery(scenarioDeps(w), pinUser)).rejects.toEqual(
            new LoadError('throttled_by_client_ip', { noHold: true })
        );
        // Another 429 at start (e.g. a held PIN-operation lease): still no hold.
        w.pinResponses.recover = { status: 429 };
        await expect(pinRecovery(scenarioDeps(w), pinUser)).rejects.toEqual(
            new LoadError('rate_limit', { noHold: true })
        );
        // At completion a hold exists: not reusable.
        w.pinResponses.recover = undefined;
        w.pinResponses.complete = { status: 429, clientIp: true };
        await expect(pinRecovery(scenarioDeps(w), pinUser)).rejects.toEqual(
            new LoadError('throttled_by_client_ip')
        );
        w.pinResponses.complete = { status: 429 };
        await expect(pinRecovery(scenarioDeps(w), pinUser)).rejects.toBeInstanceOf(
            EscrowPinThrottledError
        );
    });

    it('narrowLoadStrategy fails closed when a method is missing', () => {
        const strategy = world().deps.strategy({} as never) as unknown as Record<string, unknown>;
        expect(() =>
            narrowLoadStrategy({ ...strategy, executeRecovery: undefined } as never)
        ).toThrow(LoadError);
    });
});

describe('runLoad', () => {
    it('creates users in setup, then runs measured enrol stages', async () => {
        const w = world();
        const summary = await runLoad(
            options([
                { rate: 1, durationSec: 5 },
                { rate: 2, durationSec: 5 },
            ]),
            w.deps,
            { requested: false }
        );
        expect(w.created()).toBe(15);
        // Every created user is in the manifest, with its uid and synthetic address.
        expect(w.recorded).toHaveLength(15);
        expect(w.recorded[3]).toEqual({
            uid: 'uid-3',
            email: 'escrow-load+a1b2c3d4-3@inbox.example.org',
        });
        const [setup, s1, s2] = stagesOf(summary);
        expect(setup).toMatchObject({ stage: 'setup', started: 15, ok: 15 });
        expect(setup.scenarios.createUser).toMatchObject({ count: 15, ok: 15 });
        expect(s1).toMatchObject({ stage: 's1', started: 5, ok: 5, failed: 0 });
        expect(s2).toMatchObject({ stage: 's2', started: 10, ok: 10, failed: 0 });
        expect(Object.keys(s2.steps).sort()).toEqual([
            'enrolGate',
            'enrolState',
            'enroll',
            'holdStatus',
            'login',
            'shares',
            'status',
        ]);
        expect(summary.stopped).toBeNull();
        expect(summary.emails).toMatchObject({ plannedExpected: 0, pinRecoveriesStarted: 0 });
    });

    it('prepares a PIN pool and recovers from it; output carries no secrets or addresses', async () => {
        const w = world();
        const summary = await runLoad(
            options([{ rate: 2, durationSec: 10 }], { pinRatio: 0.25, pinPool: 2, progressSec: 1 }),
            {
                ...w.deps,
                every: (_ms, callback) => {
                    callback();
                    return () => undefined;
                },
            },
            { requested: false }
        );
        const [setup, s1] = stagesOf(summary);
        expect(setup.scenarios.pinSetup).toMatchObject({ count: 2, ok: 2 });
        expect(s1.scenarios.pinRecovery).toMatchObject({ count: 5, ok: 5 });
        expect(s1.scenarios.enrol).toMatchObject({ count: 15, ok: 15 });
        expect(s1.steps.recovery).toMatchObject({ count: 5, ok: 5 });
        expect(s1.steps.resetPin).toBeUndefined();
        expect(summary.pinPool).toEqual({
            prepared: 2,
            retired: 0,
            returnedAfterStartRefused: 0,
            free: 2,
        });
        expect(summary.emails).toMatchObject({
            plannedExpected: 10,
            plannedUpperBound: 15,
            pinRecoveriesStarted: 5,
            estimatedSent: 10,
        });
        const printed = JSON.stringify(summary) + w.out.join('\n');
        expect(w.out.length).toBeGreaterThan(0);
        for (const secret of ['@', PIN, 'key1', 'did:key', 'uid-', 'id:'])
            expect(printed).not.toContain(secret);
    });

    it('retires a PIN user whose recovery failed; later PIN arrivals are dropped, not queued', async () => {
        const w = world();
        w.failures.recover = () => new EscrowRequestError(503);
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 4 }], { pinRatio: 0.5, pinPool: 1 }),
            w.deps,
            { requested: false }
        );
        const [, s1] = stagesOf(summary);
        expect(s1.scenarios.pinRecovery).toMatchObject({
            count: 1,
            ok: 0,
            errors: { http_5xx: 1 },
        });
        expect(s1.steps.recovery.errors).toEqual({ http_5xx: 1 });
        expect(s1.dropped).toEqual({ pin_pool_busy: 1 });
        expect(summary.pinPool).toMatchObject({ prepared: 1, retired: 1, free: 0 });
    });

    it('returns a pool user whose PIN start was throttled; reports it apart from failures', async () => {
        const w = world();
        w.pinResponses.recover = { status: 429, clientIp: true };
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 4 }], { pinRatio: 0.5, pinPool: 1 }),
            w.deps,
            { requested: false }
        );
        const [, s1] = stagesOf(summary);
        expect(s1).toMatchObject({ ok: 2, failed: 0, throttledByClientIp: 2 });
        expect(s1.scenarios.pinRecovery).toMatchObject({
            count: 2,
            ok: 0,
            errors: { throttled_by_client_ip: 2 },
        });
        expect(s1.steps.recovery.errors).toEqual({ throttled_by_client_ip: 2 });
        expect(s1.dropped).toEqual({});
        expect(summary.pinPool).toEqual({
            prepared: 1,
            retired: 0,
            returnedAfterStartRefused: 2,
            free: 1,
        });
        expect(summary.emails).toMatchObject({
            pinRecoveriesStarted: 2,
            pinStartsRefused: 2,
            estimatedSent: 0,
        });
    });

    it('retires a pool user throttled at completion (a hold exists)', async () => {
        const w = world();
        w.pinResponses.complete = { status: 429, clientIp: true };
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 4 }], { pinRatio: 0.5, pinPool: 1 }),
            w.deps,
            { requested: false }
        );
        const [, s1] = stagesOf(summary);
        expect(s1).toMatchObject({ failed: 0, throttledByClientIp: 1 });
        expect(s1.dropped).toEqual({ pin_pool_busy: 1 });
        expect(summary.pinPool).toMatchObject({ retired: 1, returnedAfterStartRefused: 0 });
    });

    it('stops scheduling when a stage error ratio exceeds the threshold', async () => {
        const w = world();
        w.failures.ensure = () => new EscrowRequestError(503);
        const stop = { requested: false };
        const summary = await runLoad(options([{ rate: 5, durationSec: 20 }]), w.deps, stop);
        const [, s1] = stagesOf(summary);
        expect(summary.stopped).toBe('error_rate_s1');
        expect(stop.requested).toBe(true);
        expect(s1.started).toBe(20);
        expect(s1.dropped).toEqual({ stopped: 80 });
        expect(s1.scenarios.enrol.errors).toEqual({ http_5xx: 20 });
    });

    it('a token for the wrong Firebase project is fatal', async () => {
        const w = world();
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 5 }]),
            {
                ...w.deps,
                checkToken: () => {
                    throw new ProvisionError('token', 'project');
                },
            },
            { requested: false }
        );
        const [, s1] = stagesOf(summary);
        expect(summary.stopped).toBe('fatal_token_project');
        expect(s1.started).toBe(1);
        expect(s1.dropped).toEqual({ stopped: 4 });
    });

    it('a user that cannot be recorded in the manifest stops the run', async () => {
        const w = world();
        w.record.fail = true;
        const stop = { requested: false };
        const summary = await runLoad(options([{ rate: 1, durationSec: 5 }]), w.deps, stop);
        const [setup, s1] = stagesOf(summary);
        expect(summary.stopped).toBe('fatal_manifest_write');
        expect(stop.requested).toBe(true);
        expect(w.created()).toBe(1);
        expect(setup.scenarios.createUser.errors).toEqual({ manifest_write: 1 });
        expect(s1.started).toBe(0);
    });

    it('records a fatal guard hit by an operation still in flight after the last start', async () => {
        const w = world();
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 1 }]),
            {
                ...w.deps,
                checkToken: () => {
                    throw new ProvisionError('token', 'project');
                },
            },
            { requested: false }
        );
        const [, s1] = stagesOf(summary);
        expect(s1.started).toBe(1);
        expect(summary.stopped).toBe('fatal_token_project');
    });

    it('records a Ctrl-C that arrives while waiting for in-flight work', async () => {
        const w = world();
        const stop = { requested: false };
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 1 }]),
            {
                ...w.deps,
                exchange: async custom => {
                    stop.requested = true;
                    return w.deps.exchange(custom);
                },
            },
            stop
        );
        expect(summary.stopped).toBe('interrupted');
    });

    it('an operator interrupt stops new starts', async () => {
        const w = world();
        const stop = { requested: true };
        const summary = await runLoad(options([{ rate: 1, durationSec: 3 }]), w.deps, stop);
        expect(summary.stopped).toBe('interrupted');
        expect(w.created()).toBe(0);
    });

    it('stops before the stages when no PIN user could be prepared', async () => {
        const w = world();
        w.failures.setPin = () => new EscrowRequestError(500);
        const summary = await runLoad(
            options([{ rate: 1, durationSec: 4 }], { pinRatio: 0.5, pinPool: 1 }),
            w.deps,
            { requested: false }
        );
        expect(summary.stopped).toBe('pin_pool_empty');
        const [, s1] = stagesOf(summary);
        expect(s1.started).toBe(0);
    });
});
