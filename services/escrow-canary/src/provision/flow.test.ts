import { validatePin } from '@learncard/sss-key-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { secretSchema } from '../secrets';
import { keys } from '../tier3/ledger';
import { runnerConfig } from '../tier3/test-fakes';
import { ProvisionError } from './errors';
import { createProvisioner, randomPin, type ProvisionOptions } from './flow';
import { containConsole } from './output';
import { defaultOptions, ProvisionWorld, TIER12_EMAIL, tier12Config } from './test-world';

const HOLD_01 = runnerConfig.holdAccounts[0].secretId;
const READ_ONLY = tier12Config.accounts[0].secretArn;
const PIN_A = tier12Config.accounts[1].secretArn;

let world: ProvisionWorld;
beforeEach(() => {
    world = new ProvisionWorld();
    // Every network path is faked; a real fetch is a test bug.
    vi.stubGlobal('fetch', () => {
        throw new Error('network access in a unit test');
    });
});
afterEach(() => vi.unstubAllGlobals());

const run = async (
    tier: 1 | 2 | 3,
    labels: string[] = ['hold-01'],
    options: Partial<ProvisionOptions> = {}
) =>
    createProvisioner(
        await world.plan(tier, labels),
        { ...defaultOptions, ...options },
        world.deps()
    ).run();

const failure = async (promise: Promise<unknown>): Promise<ProvisionError> => {
    try {
        await promise;
    } catch (error) {
        expect(error).toBeInstanceOf(ProvisionError);
        return error as ProvisionError;
    }
    throw new Error('expected a ProvisionError');
};

const current = (secretId: string) => world.stageValue(secretId, 'AWSCURRENT');
const mutations = () =>
    world.calls.filter(call =>
        [
            'send',
            'verify',
            'put',
            'shares',
            'enroll',
            'pin',
            'activate',
            'move:AWSCURRENT',
        ].includes(call)
    );

describe('provisioning happy paths', () => {
    it('tier 3: login mail from the inbox, write-ahead before shares, opt-in, promote last', async () => {
        expect(await run(3)).toEqual([{ label: 'hold-01', result: 'provisioned' }]);
        expect(world.sends).toBe(1);
        expect(world.verifies).toBe(1);
        const order = world.calls;
        expect(order.indexOf('put')).toBeLessThan(order.indexOf('shares'));
        expect(order.indexOf('shares')).toBeLessThan(order.indexOf('enroll'));
        expect(order.lastIndexOf('move:AWSCURRENT')).toBeGreaterThan(order.indexOf('authority'));
        expect(order.filter(call => call === 'move:AWSCURRENT')).toHaveLength(1);
        expect(order).not.toContain('pin');
        expect(order).not.toContain('activate');
        const secret = secretSchema.parse(JSON.parse(current(HOLD_01)!));
        expect(secret).toMatchObject({
            accountId: runnerConfig.holdAccounts[0].id,
            recoveryEmail: 'canary-staging+1@inbox.example.com',
            recoveryLanguage: 'en',
        });
        expect(secret.hold).toBeUndefined();
        expect(secret.deviceState.shares['sss-device-share']).toBeDefined();
        expect(world.stageValue(HOLD_01, 'PROVISIONING')).toBeUndefined();
        expect(world.server.get(secret.recoveryEmail)).toMatchObject({
            enrolled: true,
            pin: false,
            active: false,
        });
    });

    it('tier 3: --activate activates after enrollment', async () => {
        await run(3, ['hold-01'], { activate: true });
        expect(world.calls.indexOf('activate')).toBeGreaterThan(world.calls.indexOf('enroll'));
        expect(world.server.get('canary-staging+1@inbox.example.com')?.active).toBe(true);
    });

    it('tier 1: code typed at the hidden prompt, opt-in, no PIN, no activation', async () => {
        await run(1);
        expect(world.prompts).toHaveLength(1);
        expect(world.prompts[0]).toMatch(/^read-only: 6-digit login code/);
        expect(world.calls).toContain('enroll');
        expect(world.calls).not.toContain('pin');
        expect(world.calls).not.toContain('activate');
        const secret = secretSchema.parse(JSON.parse(current(READ_ONLY)!));
        expect(secret).toMatchObject({ accountId: 'account-0', recoveryEmail: TIER12_EMAIL });
    });

    it('tier 2: PIN set through setEscrowPin, then activated, as the app does', async () => {
        await run(2, ['pin-a']);
        expect(world.calls).not.toContain('enroll');
        expect(world.calls.indexOf('activate')).toBeGreaterThan(world.calls.indexOf('pin'));
        const secret = secretSchema.parse(JSON.parse(current(PIN_A)!));
        expect(validatePin(secret.pin).ok).toBe(true);
        expect(world.server.get(TIER12_EMAIL)).toMatchObject({ pin: true, active: true });
    });

    it('generates valid random 8-digit PINs', () => {
        const pins = new Set(Array.from({ length: 50 }, () => randomPin()));
        for (const pin of pins) {
            expect(pin).toMatch(/^[0-9]{8}$/);
            expect(validatePin(pin).ok).toBe(true);
        }
        expect(pins.size).toBeGreaterThan(45);
    });

    it('several labels run sequentially and stop at the first failure', async () => {
        world.setStage(runnerConfig.holdAccounts[1].secretId, 'AWSCURRENT', 'not json');
        const error = await failure(run(3, ['hold-01', 'hold-02', 'hold-03']));
        expect(error.exitCode).toBe(3);
        expect(current(HOLD_01)).not.toBe('{}');
        expect(current(runnerConfig.holdAccounts[2].secretId)).toBe('{}');
        expect(world.out).toContain('hold-02 FAILED classify: current_not_placeholder');
    });
});

describe('login mail and rate limits', () => {
    it('untrusted login mail: one send, then stops without verifying or writing', async () => {
        world.options.untrustedMail = true;
        const error = await failure(run(3));
        expect(error.message).toBe('mail: no_code');
        expect(error.exitCode).toBe(1);
        expect(world.sends).toBe(1);
        expect(world.verifies).toBe(0);
        expect(world.calls).not.toContain('put');
        expect(world.out.some(line => /untrusted message/.test(line))).toBe(true);
    });

    it('silent no-mail send times out cleanly after a single send (no in-run resend)', async () => {
        world.options.send = 'silent';
        const error = await failure(run(3));
        expect(error.message).toBe('mail: no_code');
        expect(world.sends).toBe(1);
        expect(world.verifies).toBe(0);
        expect(world.users.size).toBe(0);
    });

    it('a first mail delayed past the window is never paired with a resend in the same run', async () => {
        // Mail #1 arrives after the 270 s wait; previously a resend's window could pick it
        // over mail #2 by S3 arrival order and spend the one verify on a replaced code.
        world.options.mailDelayMs = 300_000;
        const error = await failure(run(3));
        expect(error.message).toBe('mail: no_code');
        expect(world.sends).toBe(1);
        expect(world.verifies).toBe(0);
        expect(world.calls).not.toContain('put');
    });

    it('tier 1/2 prompt: a blank answer resends once and asks for the newest code', async () => {
        const deps = world.deps();
        const plan = await world.plan(1);
        const answers = ['', undefined];
        deps.prompt = async question => {
            world.prompts.push(question);
            const next = answers.shift();
            return next ?? world.codes.get(TIER12_EMAIL) ?? '';
        };
        await createProvisioner(plan, defaultOptions, deps).run();
        expect(world.sends).toBe(2);
        expect(world.verifies).toBe(1);
        expect(world.prompts[1]).toMatch(/NEWEST/);
    });

    it('a rate-limit body stops the run after one send', async () => {
        world.options.send = 'rate_limited';
        const error = await failure(run(3, ['hold-01', 'hold-02']));
        expect(error.message).toBe('send: rate_limited');
        expect(error.exitCode).toBe(1);
        expect(world.sends).toBe(1);
    });

    it('verifies each code once', async () => {
        await run(3);
        expect(world.calls.filter(call => call === 'verify')).toHaveLength(1);
    });
});

describe('idempotency and resume', () => {
    it('an existing server key with no secret stops (exit 3) before generating anything', async () => {
        world.server.set('canary-staging+1@inbox.example.com', {
            did: 'did:key:zorphan',
            shareVersion: 1,
            enrolled: false,
            pin: false,
            active: false,
            optedOut: false,
        });
        const error = await failure(run(3));
        expect(error.message).toBe('status: server_key_without_secret');
        expect(error.exitCode).toBe(3);
        expect(world.keysGenerated).toBe(0);
        expect(world.calls).not.toContain('put');
    });

    it('a live secret is never modified and never triggers a login code', async () => {
        await run(3);
        const live = current(HOLD_01);
        world.calls = [];
        expect(await run(3)).toEqual([{ label: 'hold-01', result: 'live' }]);
        expect(current(HOLD_01)).toBe(live);
        expect(world.calls).not.toContain('send');
        expect(world.calls).not.toContain('put');
        expect(world.calls).toContain('refresh');
    });

    it('a live secret for another account is refused (exit 2)', async () => {
        await run(3);
        const secret = JSON.parse(current(HOLD_01)!);
        world.setStage(HOLD_01, 'AWSCURRENT', JSON.stringify({ ...secret, accountId: 'other' }));
        const error = await failure(run(3));
        expect(error.message).toBe('classify: live_secret_other_account');
        expect(error.exitCode).toBe(2);
    });

    it.each([
        ['not json', 'current_not_placeholder'],
        ['{"accountId":"x"}', 'current_not_placeholder'],
        ['[]', 'current_not_placeholder'],
    ])('AWSCURRENT %s stops (exit 3)', async (value, reason) => {
        world.setStage(HOLD_01, 'AWSCURRENT', value);
        const error = await failure(run(3));
        expect(error.message).toBe(`classify: ${reason}`);
        expect(error.exitCode).toBe(3);
        expect(world.sends).toBe(0);
    });

    it('a malformed PROVISIONING version stops (exit 3)', async () => {
        world.setStage(HOLD_01, 'PROVISIONING', '{"privateKey":"oops"}');
        const error = await failure(run(3));
        expect(error.message).toBe('classify: provisioning_malformed');
        expect(world.sends).toBe(0);
    });

    it('resume after a crash past the write-ahead reuses the stored key and PIN, without a new code', async () => {
        world.options.sharesFailures = 1;
        const first = await failure(run(3));
        expect(first.step).toBe('shares');
        const staged = JSON.parse(world.stageValue(HOLD_01, 'PROVISIONING')!);
        expect(current(HOLD_01)).toBe('{}');
        expect(await run(3)).toEqual([{ label: 'hold-01', result: 'provisioned' }]);
        expect(world.keysGenerated).toBe(1);
        expect(world.sends).toBe(1);
        const secret = JSON.parse(current(HOLD_01)!);
        expect(secret.privateKey).toBe(staged.privateKey);
        expect(secret.pin).toBe(staged.pin);
        expect(secret.did).toBe(staged.did);
    });

    it('resume falls back to a fresh login when the stored refresh token is unusable', async () => {
        world.options.sharesFailures = 1;
        await failure(run(3));
        world.options.refreshRejected = true;
        // The login's own refresh round-trip also fails: stop, still no new key.
        const error = await failure(run(3));
        expect(error.step).toBe('refresh');
        expect(world.sends).toBe(2);
        expect(world.keysGenerated).toBe(1);
    });

    it('resume after shares were written skips shares and enrolls', async () => {
        world.options.enrollResult = 'opted-out';
        const first = await failure(run(3));
        expect(first.message).toBe('enroll: not_enrolled_opted-out');
        expect(first.exitCode).toBe(3);
        expect(current(HOLD_01)).toBe('{}');
        world.options.enrollResult = 'ok';
        world.calls = [];
        await run(3);
        expect(world.calls).not.toContain('shares');
        expect(world.calls).toContain('enroll');
        expect(world.keysGenerated).toBe(1);
    });

    it('resume with a different server DID stops (exit 3)', async () => {
        world.options.sharesFailures = 1;
        await failure(run(3));
        world.server.set('canary-staging+1@inbox.example.com', {
            did: 'did:key:zsomeoneelse',
            shareVersion: 1,
            enrolled: false,
            pin: false,
            active: false,
            optedOut: false,
        });
        const error = await failure(run(3));
        expect(error.message).toBe('status: server_did_mismatch');
        expect(error.exitCode).toBe(3);
    });

    it('a readback mismatch stops before promotion', async () => {
        world.options.tamperReadback = true;
        const error = await failure(run(3));
        expect(error.message).toBe('check: readback_mismatch');
        expect(error.exitCode).toBe(3);
        expect(current(HOLD_01)).toBe('{}');
    });

    it('promotion is a compare-and-swap on AWSCURRENT', async () => {
        const deps = world.deps();
        const plan = await world.plan(3);
        const original = deps.sdk.authority;
        deps.sdk.authority = async (...args) => {
            // Someone pastes a value while this run verifies.
            world.setStage(HOLD_01, 'AWSCURRENT', '{}');
            return original(...args);
        };
        const error = await failure(createProvisioner(plan, defaultOptions, deps).run());
        expect(error.message).toBe('promote: current_changed');
        expect(error.exitCode).toBe(3);
    });

    it('a promotion whose response was lost and whose retry failed is still a success', async () => {
        const store = world.secretStore;
        const moveStage = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            await moveStage(secretId, stage, to, from);
            // Committed, then the SDK retry is rejected (AWSCURRENT left `from`).
            if (stage === 'AWSCURRENT') throw new Error('InvalidParameter');
        };
        expect(await run(3)).toEqual([{ label: 'hold-01', result: 'provisioned' }]);
        expect(current(HOLD_01)).not.toBe('{}');
        expect(world.stageValue(HOLD_01, 'PROVISIONING')).toBeUndefined();
    });

    it('a promotion that failed without committing still stops as a stage conflict', async () => {
        const store = world.secretStore;
        const moveStage = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            if (stage === 'AWSCURRENT') throw new Error('Throttling');
            await moveStage(secretId, stage, to, from);
        };
        const error = await failure(run(3));
        expect(error.message).toBe('promote: current_changed');
        expect(error.exitCode).toBe(3);
        expect(current(HOLD_01)).toBe('{}');
    });

    it('a PROVISIONING label moved by another run aborts the next write', async () => {
        const deps = world.deps();
        const plan = await world.plan(3);
        const strategy = deps.strategy;
        deps.strategy = storage => {
            const inner = strategy(storage);
            return {
                ...inner,
                atomicUpdateShares: async params => {
                    world.setStage(HOLD_01, 'PROVISIONING', '{}');
                    return inner.atomicUpdateShares(params);
                },
            };
        };
        const error = await failure(createProvisioner(plan, defaultOptions, deps).run());
        expect(error.message).toBe('secret: provisioning_label_moved');
        expect(error.exitCode).toBe(3);
        expect(current(HOLD_01)).toBe('{}');
    });

    it('a rotated refresh token is stored before promotion', async () => {
        world.options.rotateRefresh = true;
        await run(3);
        const secret = JSON.parse(current(HOLD_01)!);
        expect(secret.refreshToken).toMatch(/#r[0-9]+$/);
    });
});

describe('dry run', () => {
    it('makes no mutating call and reports server state as unknown for a fresh label', async () => {
        expect(await run(3, ['hold-01', 'hold-02'], { dryRun: true })).toEqual([
            { label: 'hold-01', result: 'planned' },
            { label: 'hold-02', result: 'planned' },
        ]);
        expect(mutations()).toEqual([]);
        expect(world.calls).not.toContain('status');
        expect(world.out).toContain('hold-01 plan: fresh; server state unknown (needs login)');
    });

    it('uses only a stored refresh token for a staged label', async () => {
        world.options.sharesFailures = 1;
        await failure(run(3));
        world.calls = [];
        await run(3, ['hold-01'], { dryRun: true });
        expect(mutations()).toEqual([]);
        expect(world.out).toContain('hold-01 plan: server state: no server key');
    });
});

describe('pool registration', () => {
    it('init-pool runs only after all 12 hold accounts verify', async () => {
        const labels = runnerConfig.holdAccounts.map(
            (_, index) => `hold-${String(index + 1).padStart(2, '0')}`
        );
        const partial = await failure(run(3, labels.slice(0, 2), { initPool: true }));
        expect(partial.message).toBe('pool: hold-03_not_provisioned');
        expect(await world.ledger.get(keys.pool('hold-01'))).toBeUndefined();
        await run(3, labels, { initPool: true });
        expect(world.out).toContain('pool init-pool ok created=12');
        expect(await world.ledger.get(keys.pool('hold-12'))).toMatchObject({ state: 'idle' });
    });
});

describe('check-mail', () => {
    it('sends one code and checks trust and parse without verifying', async () => {
        expect(await run(3, ['hold-01'], { checkMail: true })).toEqual([
            { label: 'hold-01', result: 'mail-ok' },
        ]);
        expect(world.sends).toBe(1);
        expect(world.verifies).toBe(0);
        expect(world.users.size).toBe(0);
        expect(world.out).toContain(
            'hold-01 check-mail trusted_and_parsed=yes untrusted=0 malformed=0'
        );
    });

    it('reports untrusted mail as a failure', async () => {
        world.options.untrustedMail = true;
        const error = await failure(run(3, ['hold-01'], { checkMail: true }));
        expect(error.message).toBe('mail: no_trusted_login_mail');
        expect(world.out).toContain(
            'hold-01 check-mail trusted_and_parsed=no untrusted=1 malformed=0'
        );
    });
});

describe('secret containment', () => {
    it('never prints keys, PINs, codes or tokens, even when the SDK logs raw values', async () => {
        world.options.sdkLogs = true;
        world.options.sharesFailures = 1;
        const original = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const containment = containConsole();
        try {
            await failure(run(2, ['pin-a']));
            await run(2, ['pin-a']);
        } finally {
            containment.restore();
        }
        expect(original).not.toHaveBeenCalled();
        expect(containment.suppressed()).toBeGreaterThan(0);
        original.mockRestore();
        const output = world.out.join('\n');
        expect(world.sentinels.size).toBeGreaterThan(5);
        for (const sentinel of world.sentinels) expect(output).not.toContain(sentinel);
        expect(output).not.toContain(TIER12_EMAIL);
    });
});
