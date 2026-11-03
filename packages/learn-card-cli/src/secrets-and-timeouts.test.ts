/**
 * Secrets stay off stdout unless asked (token, open), nothing blocks without a terminal
 * (open clipboard wait, webhook), and small validation fixes (webhook recipient/--timeout,
 * inbox enums as USAGE errors, clr validate success line). No test here reaches a network.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clrProvisionalTranscript } from '@learncard/credential-library';

const mocks = vi.hoisted(() => ({
    initLearnCard: vi.fn(),
    initLCALearnCard: vi.fn(),
    clipboardWrite: vi.fn(),
    clipboardRead: vi.fn(),
    spawn: vi.fn(),
}));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));
vi.mock('@learncard/lca-api-plugin', () => ({
    initLCALearnCard: mocks.initLCALearnCard,
    getLCAPlugin: vi.fn(),
}));
vi.mock('clipboardy', () => ({
    default: { write: mocks.clipboardWrite, read: mocks.clipboardRead },
}));
vi.mock('node:child_process', async importOriginal => ({
    ...(await importOriginal<typeof import('node:child_process')>()),
    spawn: mocks.spawn,
}));

import { out } from './out';
import { CliError } from './errors';
import { runToken, tokenResult } from './token';
import { runOpen, seedDeliveryFor, shareableUrl } from './open';
import { humanWaitTimeoutMs, parseWebhookTimeout, runWebhook, validateWebhookUrl } from './webhook';
import { parseLimit, parseSince, parseStatus } from './inbox';
import { runClrValidate, validationSummaryLine } from './clr';

const SEED = 'ab'.repeat(32);
let cwd: string;
let stdoutTTY: boolean | undefined;

const setStdoutTTY = (value: boolean): void => {
    Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true });
};

beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-secrets-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const offline = (): never => {
        throw new Error('test tried to build a networked wallet');
    };
    mocks.initLearnCard.mockImplementation(offline);
    mocks.initLCALearnCard.mockImplementation(offline);
    mocks.clipboardWrite.mockResolvedValue(undefined);
    mocks.clipboardRead.mockResolvedValue('');
    mocks.spawn.mockReturnValue({ unref: () => {} });
    stdoutTTY = process.stdout.isTTY;
    out.json = false;
    out.result = {};
    delete process.env.NETWORK_URL;
});

afterEach(async () => {
    vi.restoreAllMocks();
    for (const mock of Object.values(mocks)) mock.mockReset();
    Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTTY, configurable: true });
    process.exitCode = undefined;
    out.json = false;
    out.result = {};
    await fs.rm(cwd, { recursive: true, force: true });
});

const writeEnv = (env: Record<string, string>): Promise<void> =>
    fs.writeFile(
        path.join(cwd, '.env'),
        Object.entries(env)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n') + '\n'
    );

const stderrText = (): string =>
    (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .map(call => call.join(' '))
        .join('\n');

const stdoutText = (): string =>
    (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .map(call => call.join(' '))
        .join('\n');

describe('token --json keeps the raw token off stdout', () => {
    const fakeCard = {
        id: { did: () => 'did:key:z6Mk-test' },
        invoke: {
            getProfile: async () => ({ profileId: 'acme', displayName: 'Acme' }),
            createProfile: async () => true,
            addAuthGrant: async () => 'grant-1',
            getAPITokenForAuthGrant: async () => 'header.payload.signature',
        },
    };

    it('omits the token unless showSecret, and always reports tokenSavedTo', () => {
        const base = {
            grantId: 'g',
            scope: 'boosts:write',
            token: 'a.b.c',
            tokenSavedTo: '/x/.env',
            files: [],
        };
        expect(tokenResult(base)).toEqual({
            grantId: 'g',
            scope: 'boosts:write',
            tokenSavedTo: '/x/.env',
            files: [],
        });
        expect(tokenResult({ ...base, showSecret: true }).token).toBe('a.b.c');
    });

    it('saves the token to .env but prints it nowhere in --json mode', async () => {
        await writeEnv({ SECURE_SEED: SEED, PROFILE_ID: 'acme', DISPLAY_NAME: 'Acme' });
        mocks.initLearnCard.mockResolvedValue(fakeCard);
        out.json = true;
        await runToken({ network: 'staging', yes: true });
        expect(out.result.token).toBeUndefined();
        expect(out.result.tokenSavedTo).toBe(path.join(cwd, '.env'));
        expect(out.result.grantId).toBe('grant-1');
        expect(stderrText()).not.toContain('header.payload.signature');
        expect(stdoutText()).not.toContain('header.payload.signature');
        const env = await fs.readFile(path.join(cwd, '.env'), 'utf8');
        expect(env).toContain('API_TOKEN=header.payload.signature');
    });

    it('includes the token with --show-secret', async () => {
        await writeEnv({ SECURE_SEED: SEED, PROFILE_ID: 'acme', DISPLAY_NAME: 'Acme' });
        mocks.initLearnCard.mockResolvedValue(fakeCard);
        out.json = true;
        await runToken({ network: 'staging', yes: true, showSecret: true });
        expect(out.result.token).toBe('header.payload.signature');
    });

    it('still prints the token once in human mode', async () => {
        await writeEnv({ SECURE_SEED: SEED, PROFILE_ID: 'acme', DISPLAY_NAME: 'Acme' });
        mocks.initLearnCard.mockResolvedValue(fakeCard);
        await runToken({ network: 'staging', yes: true });
        expect(stdoutText()).toContain('header.payload.signature');
    });

    it('--list reports grants without creating a grant or changing .env', async () => {
        await writeEnv({
            SECURE_SEED: SEED,
            PROFILE_ID: 'acme',
            NETWORK_URL: 'https://staging.network.learncard.com/trpc',
        });
        const before = await fs.readFile(path.join(cwd, '.env'), 'utf8');
        const addAuthGrant = vi.fn();
        mocks.initLearnCard.mockResolvedValue({
            ...fakeCard,
            invoke: {
                ...fakeCard.invoke,
                addAuthGrant,
                getAuthGrants: async () => [
                    {
                        id: 'g1',
                        name: 'ci',
                        scope: 'boosts:write',
                        status: 'active',
                        expiresAt: '2027-01-01T00:00:00Z',
                    },
                ],
            },
        });
        out.json = true;
        await runToken({ list: true, network: 'staging' });
        expect(out.result.grants).toEqual([
            {
                id: 'g1',
                name: 'ci',
                scope: 'boosts:write',
                status: 'active',
                expiresAt: '2027-01-01T00:00:00Z',
            },
        ]);
        expect(addAuthGrant).not.toHaveBeenCalled();
        expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toBe(before);
    });

    it('--list says so when there are no grants', async () => {
        await writeEnv({
            SECURE_SEED: SEED,
            PROFILE_ID: 'acme',
            NETWORK_URL: 'https://staging.network.learncard.com/trpc',
        });
        mocks.initLearnCard.mockResolvedValue({
            ...fakeCard,
            invoke: { ...fakeCard.invoke, getAuthGrants: async () => undefined },
        });
        await runToken({ list: true, network: 'staging' });
        expect(out.result.grants).toEqual([]);
        expect(stdoutText()).toContain('No auth grants yet.');
    });

    it('--revoke revokes the named grant and reports it', async () => {
        await writeEnv({
            SECURE_SEED: SEED,
            PROFILE_ID: 'acme',
            NETWORK_URL: 'https://staging.network.learncard.com/trpc',
        });
        const revokeAuthGrant = vi.fn(async () => true);
        mocks.initLearnCard.mockResolvedValue({
            ...fakeCard,
            invoke: { ...fakeCard.invoke, revokeAuthGrant },
        });
        await runToken({ revoke: 'g1', network: 'staging' });
        expect(revokeAuthGrant).toHaveBeenCalledWith('g1');
        expect(out.result).toEqual({ grantId: 'g1' });
    });

    it('--revoke fails when the network refuses', async () => {
        await writeEnv({
            SECURE_SEED: SEED,
            PROFILE_ID: 'acme',
            NETWORK_URL: 'https://staging.network.learncard.com/trpc',
        });
        mocks.initLearnCard.mockResolvedValue({
            ...fakeCard,
            invoke: { ...fakeCard.invoke, revokeAuthGrant: async () => false },
        });
        await expect(runToken({ revoke: 'g1', network: 'staging' })).rejects.toThrow(
            'Could not revoke auth grant.'
        );
    });
});

describe('open: seed delivery and secrets', () => {
    it('only uses the clipboard for a person at a terminal', () => {
        expect(seedDeliveryFor({}, true)).toBe('clipboard');
        expect(seedDeliveryFor({}, false)).toBe('none');
        expect(seedDeliveryFor({ json: true }, true)).toBe('none');
        expect(seedDeliveryFor({ urlFragment: true }, false)).toBe('fragment');
    });

    it('strips the #seed fragment unless showSecret', () => {
        const url = `https://learncard.app/developer/sign-in?next=%2Fwallet#seed=${SEED}`;
        expect(shareableUrl(url)).toBe('https://learncard.app/developer/sign-in?next=%2Fwallet');
        expect(shareableUrl(url, true)).toBe(url);
    });

    it('--json --url-fragment returns the URL without the seed, plus seedInFragment', async () => {
        await writeEnv({ SECURE_SEED: SEED });
        setStdoutTTY(true);
        out.json = true;
        await runOpen('portal', { urlFragment: true, network: 'staging' });
        expect(out.result.url).not.toContain(SEED);
        expect(out.result.url).not.toContain('#');
        expect(out.result.seedInFragment).toBe(true);
        expect(out.result.seedDelivery).toBe('fragment');
        expect(stderrText()).not.toContain(SEED);
        expect(mocks.spawn).not.toHaveBeenCalled();
        expect(mocks.clipboardWrite).not.toHaveBeenCalled();
    });

    it('--show-secret returns the full URL', async () => {
        await writeEnv({ SECURE_SEED: SEED });
        out.json = true;
        await runOpen('portal', { urlFragment: true, showSecret: true, network: 'staging' });
        expect(out.result.url).toContain(`#seed=${SEED}`);
    });

    it('without a TTY never touches the clipboard and returns without the 60s wait', async () => {
        await writeEnv({ SECURE_SEED: SEED });
        setStdoutTTY(false);
        vi.useFakeTimers();
        try {
            // Resolves without advancing timers: no clipboard-clear wait is pending.
            await runOpen('portal', { network: 'staging' });
        } finally {
            vi.useRealTimers();
        }
        expect(mocks.clipboardWrite).not.toHaveBeenCalled();
        expect(out.result.seedDelivery).toBe('none');
        expect(mocks.spawn).not.toHaveBeenCalled();
    });

    it('at a terminal copies the seed and clears it after the TTL', async () => {
        await writeEnv({ SECURE_SEED: SEED });
        setStdoutTTY(true);
        mocks.clipboardRead.mockResolvedValue(SEED);
        vi.useFakeTimers();
        try {
            const done = runOpen('portal', { network: 'staging', browser: false });
            // runOpen reads .env (real I/O) before scheduling the clear; wait for the copy first.
            await vi.waitFor(() => expect(mocks.clipboardWrite).toHaveBeenCalledWith(SEED));
            await vi.advanceTimersByTimeAsync(60_000);
            await done;
        } finally {
            vi.useRealTimers();
        }
        expect(mocks.clipboardWrite).toHaveBeenNthCalledWith(1, SEED);
        expect(mocks.clipboardWrite).toHaveBeenLastCalledWith('');
        expect(out.result.seedDelivery).toBe('clipboard');
    });
});

describe('webhook validation and non-TTY timeout', () => {
    it('parses --timeout as positive seconds (default 60)', () => {
        expect(parseWebhookTimeout(undefined)).toBe(60_000);
        expect(parseWebhookTimeout('5')).toBe(5_000);
        for (const bad of ['0', '-1', 'abc', ''])
            expect(() => parseWebhookTimeout(bad)).toThrow(CliError);
    });

    it('applies the timeout in human mode only when stdin is not a TTY', () => {
        expect(humanWaitTimeoutMs(60_000, true)).toBeUndefined();
        expect(humanWaitTimeoutMs(60_000, false)).toBe(60_000);
    });

    it('rejects malformed and non-HTTPS production URLs as USAGE errors', () => {
        expect(() => validateWebhookUrl('not a url', false)).toThrow('Invalid --url');
        expect(() => validateWebhookUrl('ftp://x.org/hook', false)).toThrow('Invalid --url');
        expect(() => validateWebhookUrl('http://x.org/hook', true)).toThrow('HTTPS');
        expect(() => validateWebhookUrl('http://localhost:8787/hook', false)).not.toThrow();
        expect(() => validateWebhookUrl('https://x.org/hook', true)).not.toThrow();
    });

    it.each([
        [{ url: 'https://hooks.acme.org/lc', to: 'you@example.com' }, 'placeholder'],
        [{ url: 'https://hooks.acme.org/lc', to: 'Not A Recipient!' }, 'not an email'],
        [{ url: 'https://hooks.acme.org/lc', to: 'me@acme.org', timeout: 'soon' }, '--timeout'],
        [{ url: 'nope', to: 'me@acme.org' }, 'Invalid --url'],
    ])('%o fails as USAGE before creating an identity', async (options, message) => {
        const error = await runWebhook(undefined, {
            ...options,
            yes: true,
            network: 'staging',
        }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).code).toBe('USAGE');
        expect((error as Error).message).toContain(message);
        expect(await fs.readdir(cwd)).toEqual([]);
    });
});

describe('inbox flag errors are USAGE errors', () => {
    it.each([() => parseStatus('bogus'), () => parseLimit('0'), () => parseSince('yesterday-ish')])(
        '%#',
        parse => {
            try {
                parse();
                expect.unreachable();
            } catch (error) {
                expect((error as CliError).code).toBe('USAGE');
            }
        }
    );
});

describe('clr validate prints a closing line', () => {
    it('says a passing transcript is valid', () => {
        expect(validationSummaryLine('t.json', 0, 0)).toBe(
            '✓ t.json is a valid CLR 2.0 transcript.'
        );
        expect(validationSummaryLine('t.json', 0, 2, 'provisional')).toBe(
            '✓ t.json is a valid CLR 2.0 transcript (provisional profile) with 2 warnings.'
        );
        expect(validationSummaryLine('t.json', 1, 1)).toBe(
            '✖ t.json is not a valid CLR 2.0 transcript: 1 error, 1 warning.'
        );
    });

    it('prints the success line in human mode for a valid fixture', async () => {
        const file = path.join(cwd, 'clr.json');
        await fs.writeFile(file, JSON.stringify(clrProvisionalTranscript.credential));
        await runClrValidate(file, { profile: 'provisional' });
        expect(process.exitCode).toBeUndefined();
        expect(stdoutText()).toMatch(/✓ .*clr\.json is a valid CLR 2\.0 transcript/);
    });
});
