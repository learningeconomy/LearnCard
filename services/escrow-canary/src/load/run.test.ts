import { describe, expect, it } from 'vitest';
import { EscrowPinMismatchError, EscrowRequestError } from '@learncard/sss-key-manager';
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

const PIN = '13572468';

/** Offline fake of lca-api + SDK strategy, keyed by Firebase uid via the ID token. */
const world = () => {
    const server = new Map<
        string,
        { did: string; active: boolean; pin?: string; optIn?: boolean }
    >();
    const calls: string[] = [];
    let keys = 0;
    let createdUsers = 0;
    const failures: Partial<Record<string, () => Error>> = {};
    const uidOf = (token: string) => token.replace(/^id:/, '');
    const maybeFail = (name: string) => {
        calls.push(name);
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
            getEscrowEnrollmentState: async () => ({ state: 'enrolled' }),
            executeRecovery: async ({
                token,
                input,
            }: {
                token: string;
                input: { pin: string; expectedDid: string };
            }) => {
                maybeFail('recover');
                const entry = server.get(uidOf(token))!;
                if (entry.pin !== input.pin) throw new EscrowPinMismatchError(9);
                return { did: entry.did, privateKey: entry.did.replace('did:key:', '') };
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
        exchange: async custom => ({ idToken: custom.replace('custom:', 'id:') }),
        checkToken: () => undefined,
        sdk: { did: async key => `did:key:${key}`, sign: async () => 'vp' },
        strategy,
        randomKey: async () => `key${(keys += 1)}`,
        randomPin: () => PIN,
        now: () => t,
        // Yield a macrotask so started scenarios settle before the next arrival.
        sleep: async ms => {
            await new Promise(resolve => setImmediate(resolve));
            t += ms;
        },
        every: () => () => undefined,
        out: line => out.push(line),
    };
    return { server, calls, deps, failures, out, created: () => createdUsers };
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

    it('enrol follows the app path: status, shares, opt-in, then optional PIN + activation', async () => {
        const w = world();
        expect(await enrol(scenarioDeps(w), user, { withPin: false })).toBeUndefined();
        expect(w.calls).toEqual(['status', 'shares', 'optIn']);
        const w2 = world();
        const pinUser = await enrol(scenarioDeps(w2), user, { withPin: true });
        expect(w2.calls).toEqual(['status', 'shares', 'optIn', 'setPin', 'status', 'activate']);
        expect(pinUser).toMatchObject({ uid: 'uid-1', did: 'did:key:key1', pin: PIN });
        expect(w2.server.get('uid-1')).toMatchObject({ active: true, optIn: true, pin: PIN });
    });

    it('refuses an account that already has a server key', async () => {
        const w = world();
        w.server.set('uid-1', { did: 'did:key:other', active: true });
        await expect(enrol(scenarioDeps(w), user, { withPin: false })).rejects.toEqual(
            new LoadError('server_key_exists')
        );
        expect(w.calls).toEqual(['status']);
    });

    it('PIN recovery recovers, checks the DID and re-sets the same PIN', async () => {
        const w = world();
        const pinUser = await enrol(scenarioDeps(w), user, { withPin: true });
        w.calls.length = 0;
        await pinRecovery(scenarioDeps(w), pinUser!);
        expect(w.calls).toEqual(['recover', 'setPin']);
        await expect(
            pinRecovery(scenarioDeps(w), { ...pinUser!, did: 'did:key:someone-else' })
        ).rejects.toEqual(new LoadError('did_mismatch'));
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
        const [setup, s1, s2] = stagesOf(summary);
        expect(setup).toMatchObject({ stage: 'setup', started: 15, ok: 15 });
        expect(setup.scenarios.createUser).toMatchObject({ count: 15, ok: 15 });
        expect(s1).toMatchObject({ stage: 's1', started: 5, ok: 5, failed: 0 });
        expect(s2).toMatchObject({ stage: 's2', started: 10, ok: 10, failed: 0 });
        expect(Object.keys(s2.steps).sort()).toEqual(['enroll', 'login', 'shares', 'status']);
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
        expect(s1.steps.resetPin).toMatchObject({ count: 5, ok: 5 });
        expect(summary.pinPool).toEqual({ prepared: 2, retired: 0, free: 2 });
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

    it('stops scheduling when a stage error ratio exceeds the threshold', async () => {
        const w = world();
        w.failures.optIn = () => new EscrowRequestError(503);
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
