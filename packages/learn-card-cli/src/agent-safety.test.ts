/**
 * Agent-safety contract: network aliases, never-create commands, validation before I/O,
 * JSON envelopes (success, runtime error, usage error), and uniform global flags.
 * No test here reaches a network: wallet construction is mocked to fail loudly.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command } from 'commander';
import { clrProvisionalTranscript } from '@learncard/credential-library';

const mocks = vi.hoisted(() => ({
    initLearnCard: vi.fn(),
    initLCALearnCard: vi.fn(),
}));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));
vi.mock('@learncard/lca-api-plugin', () => ({
    initLCALearnCard: mocks.initLCALearnCard,
    getLCAPlugin: vi.fn(),
}));

import {
    LOCAL_NETWORK,
    PRODUCTION_NETWORK,
    STAGING_NETWORK,
    assertProjectNetwork,
    connect,
    ensureIdentity,
    ensureProfile,
    createPrompts,
    loadProject,
    resolveNetworkAlias,
    resolveServices,
} from './project';
import { CliError, NoIdentityError, UsageError, errorEnvelope, NO_IDENTITY_HINT } from './errors';
import { out } from './out';
import { planPromotion } from './promote';
import { runWhoami } from './whoami';
import { runStatus } from './status';
import { runInboxList } from './inbox';
import { runRefreshHistory } from './refresh';
import { runDoctor } from './doctor';
import { runRevoke } from './revoke';
import { runToken } from './token';
import { runOpen } from './open';
import { runClrValidate } from './clr';
import { runSend } from './send';
import { runVerify } from './verify';
import { runConsentContract } from './consent-contract';
import { runWebhook } from './webhook';
import { runSetupSigning } from './setup-signing';
import { runInit } from './init';
import {
    buildProgram,
    configureJsonUsageErrors,
    hoistGlobalFlags,
    leafCommands,
    runCommand,
} from './program';

let cwd: string;

beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-agent-safety-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const offline = (): never => {
        throw new Error('test tried to build a networked wallet');
    };
    mocks.initLearnCard.mockImplementation(offline);
    mocks.initLCALearnCard.mockImplementation(offline);
    out.json = false;
    out.result = {};
    delete process.env.NETWORK_URL;
});

afterEach(async () => {
    vi.restoreAllMocks();
    mocks.initLearnCard.mockReset();
    mocks.initLCALearnCard.mockReset();
    process.exitCode = undefined;
    await fs.rm(cwd, { recursive: true, force: true });
});

const folderContents = (): Promise<string[]> => fs.readdir(cwd);

describe('network aliases', () => {
    it('resolves production|prod|staging|local everywhere --network is accepted', () => {
        expect(resolveNetworkAlias('production')).toBe(PRODUCTION_NETWORK);
        expect(resolveNetworkAlias('prod')).toBe(PRODUCTION_NETWORK);
        expect(resolveNetworkAlias('Staging')).toBe(STAGING_NETWORK);
        expect(resolveNetworkAlias('local')).toBe(LOCAL_NETWORK);
        expect(resolveNetworkAlias('https://example.org/trpc')).toBe('https://example.org/trpc');
        expect(resolveServices({}, 'production', {}).network).toBe(PRODUCTION_NETWORK);
        expect(resolveServices({}, 'prod', {}).network).toBe(PRODUCTION_NETWORK);
        expect(resolveServices({}, 'local', {})).toEqual({
            network: LOCAL_NETWORK,
            cloud: undefined,
            lcaAPI: undefined,
        });
        expect(resolveServices({ NETWORK_URL: 'local' }, undefined, {}).network).toBe(
            LOCAL_NETWORK
        );
    });

    it('rejects an unknown network as a USAGE error', () => {
        try {
            resolveServices({}, 'prdouction', {});
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('USAGE');
            expect((error as Error).message).toContain('production, staging, local');
        }
    });

    it('treats an aliased NETWORK_URL as the same network when guarding resources', () => {
        const project = {
            env: { NETWORK_URL: 'staging', API_TOKEN: 't' },
            envPath: '',
            existing: '',
        };
        expect(() => assertProjectNetwork(project, STAGING_NETWORK)).not.toThrow();
        expect(() => assertProjectNetwork(project, PRODUCTION_NETWORK)).toThrow(
            'set up for staging, not production'
        );
        try {
            assertProjectNetwork(project, PRODUCTION_NETWORK);
        } catch (error) {
            expect((error as CliError).code).toBe('NETWORK_MISMATCH');
            expect((error as CliError).hint).toContain('separate folder');
        }
    });

    it('promote shares the alias map, so prod and production are the same network', () => {
        expect(planPromotion('staging', 'prod').toNetwork).toBe(PRODUCTION_NETWORK);
        expect(() => planPromotion('production', 'prod')).toThrow('same network');
        expect(planPromotion('local', 'staging').fromNetwork).toBe(LOCAL_NETWORK);
    });
});

describe('never-create commands in an empty folder', () => {
    const cases: [string, () => Promise<unknown>][] = [
        ['whoami', () => runWhoami({})],
        ['status', () => runStatus(undefined, {})],
        ['status <activityId>', () => runStatus('activity-1', { network: 'staging' })],
        ['inbox list', () => runInboxList({})],
        ['refresh history', () => runRefreshHistory('refresh-1', {})],
        ['doctor', () => runDoctor({ cwd })],
        ['revoke', () => runRevoke('lc:network:x/trpc:credential:1', {})],
        ['token --list', () => runToken({ list: true })],
        ['token --revoke', () => runToken({ revoke: 'grant-1' })],
        ['open', () => runOpen('portal', {})],
    ];

    it.each(cases)('%s fails with NO_IDENTITY and writes nothing', async (_name, run) => {
        const error = await run().then(
            () => undefined,
            (caught: unknown) => caught
        );
        expect(error).toBeInstanceOf(NoIdentityError);
        expect((error as NoIdentityError).code).toBe('NO_IDENTITY');
        expect((error as NoIdentityError).hint).toBe(NO_IDENTITY_HINT);
        expect(await folderContents()).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
        expect(mocks.initLCALearnCard).not.toHaveBeenCalled();
    });

    it('clr validate --dry-run-sign refuses without an identity and writes nothing', async () => {
        const file = path.join(os.tmpdir(), `lc-clr-${Date.now()}.json`);
        await fs.writeFile(file, JSON.stringify(clrProvisionalTranscript.credential));
        try {
            await expect(
                runClrValidate(file, {
                    profile: 'provisional',
                    dryRunSign: true,
                    network: 'staging',
                })
            ).rejects.toBeInstanceOf(NoIdentityError);
            expect(await folderContents()).toEqual([]);
        } finally {
            await fs.rm(file, { force: true });
        }
    });

    it('read-only commands never write NETWORK_URL into an existing .env', async () => {
        const before = `SECURE_SEED=${'a'.repeat(64)}\nPROFILE_ID=acme\n`;
        await fs.writeFile(path.join(cwd, '.env'), before);
        const project = await loadProject(cwd);
        mocks.initLearnCard.mockResolvedValue({ id: { did: () => 'did:key:z' } });
        await connect(project, { network: 'staging', readOnly: true });
        expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toBe(before);
    });
});

describe('validation happens before any I/O', () => {
    it.each([
        ['a placeholder address', 'you@example.com', /placeholder address/],
        ['a malformed recipient', 'Not A Recipient!', /not an email, phone number/],
    ])('send rejects %s without creating an identity', async (_label, recipient, message) => {
        await expect(runSend(recipient, { yes: true })).rejects.toThrow(message);
        expect(await folderContents()).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('send rejects an unknown --network before writing .env', async () => {
        await expect(
            runSend('someone@acme.org', { yes: true, name: 'Acme', network: 'prdouction' })
        ).rejects.toThrow('Unknown network');
        expect(await folderContents()).toEqual([]);
    });

    it('send --as without a profile manager fails before creating an identity', async () => {
        await expect(runSend('someone@acme.org', { yes: true, as: 'district-1' })).rejects.toThrow(
            /profile manager/
        );
        expect(await folderContents()).toEqual([]);
    });

    it.each([
        [{ expires: 'abc' }, 'Invalid --expires'],
        [{ expires: '0' }, 'Invalid --expires'],
        [{ expires: '-3' }, 'Invalid --expires'],
        [{ scope: 'unicorns:write' }, 'Unknown scope resource'],
    ])('token %o is rejected without creating an identity', async (options, message) => {
        await expect(runToken(options)).rejects.toThrow(message);
        expect(await folderContents()).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it.each([
        [{ limit: '0' }, 'Invalid --limit'],
        [{ limit: '500' }, 'Invalid --limit'],
        [{ limit: 'ten' }, 'Invalid --limit'],
        [{ event: 'bogus' }, 'Unknown --event'],
    ])('status %o is a USAGE error before the identity check', async (options, message) => {
        const error = await runStatus(undefined, options).then(
            () => undefined,
            (caught: unknown) => caught
        );
        expect((error as Error).message).toContain(message);
        expect((error as CliError).code).toBe('USAGE');
    });

    it.each([
        ['a placeholder recipient', undefined, { to: 'you@example.com' }, /placeholder address/],
        ['a malformed recipient', 'Not A Recipient!', {}, /not an email/],
        ['a bad --timeout', 'someone@acme.org', { timeout: 'soon' }, /Invalid --timeout/],
        ['a bad --url', 'someone@acme.org', { url: 'ftp://x.io' }, /Invalid --url/],
    ])('webhook rejects %s without creating an identity', async (_label, email, extra, message) => {
        const error = await runWebhook(email, { yes: true, url: 'https://x.io', ...extra }).then(
            () => undefined,
            (caught: unknown) => caught
        );
        expect((error as Error).message).toMatch(message);
        expect((error as CliError).code).toBe('USAGE');
        expect(await folderContents()).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it.each<[{ endpoint: string; did?: string }, RegExp | undefined]>([
        [{ endpoint: 'http://x.io', did: 'did:web:x.io' }, /https/],
        [{ endpoint: 'https://x.io' }, undefined],
        [{ endpoint: 'https://x.io', did: 'not-a-did' }, /--did must be a DID/],
    ])(
        'setup-signing %o is a USAGE error before creating an identity',
        async (options, message) => {
            const error = await runSetupSigning({ yes: true, ...options }).then(
                () => undefined,
                (caught: unknown) => caught
            );
            if (message) expect((error as Error).message).toMatch(message);
            expect((error as CliError).code).toBe('USAGE');
            expect(await folderContents()).toEqual([]);
            expect(mocks.initLearnCard).not.toHaveBeenCalled();
        }
    );

    it.each([
        ['init', () => runInit({ yes: true, profileId: 'Bad Id' })],
        ['send', () => runSend('someone@acme.org', { yes: true, profileId: 'Bad Id' })],
        ['token', () => runToken({ yes: true, profileId: 'Bad Id' })],
    ])('%s rejects a malformed --profile-id without writing .env', async (_label, run) => {
        await expect(run()).rejects.toThrow(/--profile-id "Bad Id" is invalid/);
        expect(await folderContents()).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it.each([
        [{ guardianEmail: 'not-an-email' }, /--guardian-email/],
        [{ webhookUrl: 'not a url' }, /--webhook-url/],
    ])('send %o is rejected without creating an identity', async (options, message) => {
        await expect(
            runSend('someone@acme.org', { yes: true, name: 'Acme', ...options })
        ).rejects.toThrow(message);
        expect(await folderContents()).toEqual([]);
    });

    it('inbox list validates --status before the identity check', async () => {
        await expect(runInboxList({ status: 'bogus' })).rejects.toThrow('Unknown --status');
    });
});

describe('identity creation is announced', () => {
    it('reports identityCreated {profileId, keyDid, network} and a stderr line', async () => {
        const project = await loadProject(cwd);
        const identity = await ensureIdentity(project, { yes: true, network: 'local' });
        expect(identity.created).toBe(true);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(`Created a new ${LOCAL_NETWORK} identity in ${cwd}`)
        );
        mocks.initLearnCard.mockResolvedValue({ id: { did: () => 'did:key:z6Mk' } });
        await connect(project, { network: 'local' });
        expect(out.result.identityCreated).toEqual({
            profileId: identity.profileId,
            keyDid: 'did:key:z6Mk',
            network: LOCAL_NETWORK,
        });
    });

    it('records the profile DID as identityCreated.did once the profile is created', async () => {
        const project = await loadProject(cwd);
        const identity = await ensureIdentity(project, { yes: true, network: 'local' });
        mocks.initLearnCard.mockResolvedValue({ id: { did: () => 'did:key:z6Mk' } });
        await connect(project, { network: 'local' });
        await ensureProfile(
            {
                invoke: {
                    getProfile: async () => undefined,
                    createProfile: async () => 'did:web:localhost%3A4000:users:acme',
                },
            },
            { profileId: identity.profileId, displayName: 'Acme' }
        );
        expect(out.result.identityCreated).toEqual({
            profileId: identity.profileId,
            did: 'did:web:localhost%3A4000:users:acme',
            keyDid: 'did:key:z6Mk',
            network: LOCAL_NETWORK,
        });
    });

    it('does not report anything when the identity already exists', async () => {
        await fs.writeFile(
            path.join(cwd, '.env'),
            `SECURE_SEED=${'b'.repeat(64)}\nPROFILE_ID=acme\n`
        );
        const project = await loadProject(cwd);
        expect((await ensureIdentity(project, { yes: true })).created).toBe(false);
        expect(out.result.identityCreated).toBeUndefined();
    });
});

class ExitSignal extends Error {
    constructor(readonly code: number) {
        super(`exit ${code}`);
    }
}

/** Run `runCommand` with stdout and process.exit captured. */
const captureRun = async (
    command: string,
    options: { json?: boolean; network?: string },
    action: () => Promise<void>
): Promise<{ stdout: string; code: number }> => {
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
        stdout += String(chunk);
        return true;
    });
    vi.spyOn(process, 'exit').mockImplementation(code => {
        throw new ExitSignal(Number(code ?? 0));
    });
    try {
        await runCommand(command, options, action);
    } catch (error) {
        if (error instanceof ExitSignal) return { stdout, code: error.code };
        throw error;
    }
    throw new Error('runCommand did not exit');
};

describe('JSON envelopes', () => {
    it('prints NO_IDENTITY with its hint on stdout and exits 1', async () => {
        const { stdout, code } = await captureRun('whoami', { json: true }, async () => {
            throw new NoIdentityError();
        });
        expect(code).toBe(1);
        expect(stdout.trim().split('\n')).toHaveLength(1);
        expect(JSON.parse(stdout)).toEqual({
            ok: false,
            command: 'whoami',
            error: 'No LearnCard identity in this folder.',
            code: 'NO_IDENTITY',
            hint: NO_IDENTITY_HINT,
        });
    });

    it('keeps the first line as error and the full message as detail', () => {
        expect(errorEnvelope('status', new Error('[\n  {"code": "invalid_enum"}\n]'))).toEqual({
            ok: false,
            command: 'status',
            error: '[',
            code: 'ERROR',
            detail: '[\n  {"code": "invalid_enum"}\n]',
        });
    });

    it('rejects an unknown --network before running the action', async () => {
        const action = vi.fn();
        const { stdout, code } = await captureRun(
            'whoami',
            { json: true, network: 'nope' },
            action
        );
        expect(action).not.toHaveBeenCalled();
        expect(code).toBe(1);
        expect(JSON.parse(stdout)).toMatchObject({ ok: false, command: 'whoami', code: 'USAGE' });
    });
});

describe('failure after identity creation', () => {
    it('keeps identityCreated in the --json error envelope', async () => {
        const { stdout, code } = await captureRun('send', { json: true }, async () => {
            out.set({ identityCreated: { profileId: 'acme', did: 'did:key:z', network: 'x' } });
            throw new Error('fetch failed');
        });
        expect(code).toBe(1);
        expect(JSON.parse(stdout)).toEqual({
            ok: false,
            command: 'send',
            error: 'fetch failed',
            code: 'ERROR',
            identityCreated: { profileId: 'acme', did: 'did:key:z', network: 'x' },
        });
    });
});

describe('missing or invalid inputs are USAGE errors', () => {
    const originalIsTTY = process.stdin.isTTY;

    afterEach(() => {
        Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    });

    it('a required prompt value in non-interactive mode throws code USAGE', async () => {
        const prompts = createPrompts(true);
        await expect(prompts.ask('Recipient email (--to <email>)', '')).rejects.toMatchObject({
            code: 'USAGE',
        });
        prompts.close();
    });

    it('--json never prompts, even at a TTY without -y', async () => {
        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
        out.json = true;
        const prompts = createPrompts(undefined);
        expect(prompts.interactive).toBe(false);
        await expect(prompts.ask('Display name', 'Acme')).resolves.toBe('Acme');
        prompts.close();
    });

    it.each(['ftp://x', 'not a url'])(
        'consent-contract --redirect-url %s fails with USAGE before any I/O',
        async redirectUrl => {
            await expect(runConsentContract({ yes: true, redirectUrl })).rejects.toMatchObject({
                code: 'USAGE',
            });
            expect(await folderContents()).toEqual([]);
        }
    );
});

describe('status <activityId>', () => {
    it('reports an unknown activity as NOT_FOUND with a hint', async () => {
        await fs.writeFile(
            path.join(cwd, '.env'),
            `SECURE_SEED=${'ab'.repeat(32)}\nPROFILE_ID=acme\nNETWORK_URL=staging\n`
        );
        mocks.initLearnCard.mockResolvedValue({
            id: { did: () => 'did:key:z' },
            invoke: { getActivityChain: async () => [] },
        });
        const error = (await runStatus('nope', {}).then(
            () => undefined,
            (caught: unknown) => caught
        )) as CliError;
        expect(error.code).toBe('NOT_FOUND');
        expect(error.hint).toContain('status --json');
    });
});

describe('verify --json', () => {
    const credential = { type: ['VerifiableCredential'], issuer: 'did:key:z' };

    const verifyWith = async (result: unknown): Promise<{ stdout: string; code: number }> => {
        mocks.initLearnCard.mockResolvedValue({
            invoke: { verifyCredential: vi.fn().mockResolvedValue(result) },
        });
        const file = path.join(cwd, 'vc.json');
        await fs.writeFile(file, JSON.stringify(credential));
        return captureRun('verify', { json: true }, () => runVerify(file, { json: true }));
    };

    it('prints one line {ok, command, verified:true, result} and exits 0', async () => {
        const result = { checks: ['proof'], warnings: [], errors: [] };
        const { stdout, code } = await verifyWith(result);
        expect(code).toBe(0);
        expect(stdout.trim().split('\n')).toHaveLength(1);
        expect(JSON.parse(stdout)).toEqual({
            ok: true,
            command: 'verify',
            verified: true,
            result,
        });
    });

    it('reports verified:false and keeps exit status 1 for an unverified credential', async () => {
        const result = { checks: [], warnings: [], errors: ['signature error: bad'] };
        const { stdout, code } = await verifyWith(result);
        expect(code).toBe(1);
        expect(JSON.parse(stdout)).toMatchObject({ ok: true, verified: false, result });
    });

    it('uses the error envelope for unparseable input', async () => {
        const file = path.join(cwd, 'broken.json');
        await fs.writeFile(file, '{not json');
        const { stdout, code } = await captureRun('verify', { json: true }, () =>
            runVerify(file, { json: true })
        );
        expect(code).toBe(1);
        expect(JSON.parse(stdout)).toMatchObject({
            ok: false,
            command: 'verify',
            code: 'ERROR',
        });
        expect(JSON.parse(stdout).error).toContain('Invalid JSON');
    });
});

const testProgram = (): {
    program: Command;
    seen: { command: string; options: Record<string, unknown> }[];
} => {
    const seen: { command: string; options: Record<string, unknown> }[] = [];
    const program = buildProgram({
        runRepl: () => undefined,
        run: async (command, options) => {
            seen.push({ command, options: options as Record<string, unknown> });
        },
    });
    return { program, seen };
};

/** Parse argv the way index.tsx does, with usage errors captured instead of exiting. */
const parseUsage = (argv: string[]): { stdout: string; code?: number } => {
    const { program } = testProgram();
    let stdout = '';
    const full = ['node', 'learncard', ...argv];
    configureJsonUsageErrors(program, full, {
        write: line => {
            stdout += line;
        },
        exit: code => {
            throw new ExitSignal(code);
        },
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
        program.parse(full);
    } catch (error) {
        if (error instanceof ExitSignal) return { stdout, code: error.code };
        throw error;
    }
    return { stdout };
};

describe('usage errors with --json', () => {
    it.each([
        [['bogus', '--json'], null, /unknown command 'bogus'/],
        [['send', '--bogus', '--json'], 'send', /unknown option '--bogus'/],
        [['promote', '--json'], 'promote', /required option/],
        [['verify', '--json'], 'verify', /missing required argument/],
        [['inbox', '--json'], 'inbox', /subcommand is required/],
        [['--json'], null, /subcommand is required/],
        [['inbox', 'list', '--status', '--json', '--limit'], 'inbox list', /argument missing/],
        [['inbox', '--json', 'list'], 'inbox', /--json must come after the command/],
    ])('%j prints one USAGE envelope and exits non-zero', (argv, command, message) => {
        const { stdout, code } = parseUsage(argv);
        expect(code).toBeGreaterThan(0);
        expect(stdout.trim().split('\n')).toHaveLength(1);
        const envelope = JSON.parse(stdout);
        expect(envelope).toMatchObject({ ok: false, command, code: 'USAGE' });
        expect(envelope.error).toMatch(message);
    });

    it('puts only the first line of a multi-line commander message in error', () => {
        const { stdout } = parseUsage(['sned', '--json']);
        const envelope = JSON.parse(stdout);
        expect(envelope.error).toBe("unknown command 'sned'");
        expect(envelope.detail).toMatch(/unknown command 'sned'\n\(Did you mean send\?\)/);
        expect(envelope.hint).toBe('Did you mean send? See `npx @learncard/cli commands --json`.');
    });

    it('leaves help output alone and exits 0', () => {
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const { stdout, code } = parseUsage(['send', '--help', '--json']);
        expect(code).toBe(0);
        expect(stdout).toBe('');
    });
});

describe('help footer', () => {
    it('points people at the skill and the agents page', () => {
        const { program } = testProgram();
        let help = '';
        program.configureOutput({ writeOut: text => (help += text) });
        program.outputHelp();
        expect(help).toContain('npx @learncard/cli skill install');
        expect(help).toContain('https://docs.learncard.com/start-here/for-ai-agents');
    });
});

describe('global flags before the command', () => {
    const argv = (...args: string[]): string[] => ['node', 'learncard', ...args];

    it('moves leading --json, -y and --network after the command words', () => {
        expect(hoistGlobalFlags(argv('--json', 'whoami'))).toEqual(argv('whoami', '--json'));
        expect(
            hoistGlobalFlags(argv('--network', 'staging', '-y', 'org', 'apply', 'o.yaml'))
        ).toEqual(argv('org', 'apply', 'o.yaml', '--network', 'staging', '-y'));
        expect(hoistGlobalFlags(argv('--network=staging', '--yes', 'status'))).toEqual(
            argv('status', '--network=staging', '--yes')
        );
    });

    it('leaves everything else alone', () => {
        for (const args of [
            ['whoami', '--json'],
            ['--json'],
            ['--version'],
            ['--help', '--json'],
            ['--network'],
        ])
            expect(hoistGlobalFlags(argv(...args))).toEqual(argv(...args));
    });

    it('`--json whoami` then reaches whoami with --json', async () => {
        const { program, seen } = testProgram();
        await program.parseAsync(
            hoistGlobalFlags(argv('--json', '--network', 'staging', 'whoami'))
        );
        expect(seen).toEqual([
            {
                command: 'whoami',
                options: expect.objectContaining({ json: true, network: 'staging' }),
            },
        ]);
    });
});

describe('uniform global flags', () => {
    it('every leaf command except repl accepts -y --json --network', () => {
        const { program } = testProgram();
        const leaves = leafCommands(program).filter(({ path }) => path.join(' ') !== 'repl');
        expect(leaves.map(({ path }) => path.join(' '))).toEqual(
            expect.arrayContaining([
                'whoami',
                'inbox list',
                'refresh history',
                'verify',
                'clr validate',
                'status',
                'doctor',
                'org apply',
                'promote',
                'demo refresh',
                'init',
                'send',
            ])
        );

        for (const { path: commandPath, command } of leaves) {
            const { program: fresh, seen } = testProgram();
            const internals = command as unknown as {
                _args: { required: boolean }[];
                options: { mandatory: boolean; long?: string }[];
            };
            const args = internals._args.filter(arg => arg.required).map(() => 'x');
            const required = internals.options
                .filter(option => option.mandatory)
                .flatMap(option => [option.long!, 'x']);
            const argv = [
                ...commandPath,
                ...args,
                ...required,
                '-y',
                '--json',
                '--network',
                'staging',
            ];
            const { stdout } = (() => {
                let written = '';
                configureJsonUsageErrors(fresh, ['--json'], {
                    write: line => {
                        written += line;
                    },
                    exit: code => {
                        throw new ExitSignal(code);
                    },
                });
                fresh.parse(['node', 'learncard', ...argv]);
                return { stdout: written };
            })();
            expect(stdout, commandPath.join(' ')).toBe('');
            expect(seen, commandPath.join(' ')).toHaveLength(1);
            expect(seen[0]!.options, commandPath.join(' ')).toMatchObject({
                yes: true,
                json: true,
                network: 'staging',
            });
        }
    });
});

describe('human-mode error footer', () => {
    const footer = (): string => 'FOOTER';
    const runHuman = async (error: Error): Promise<string[]> => {
        vi.spyOn(process, 'exit').mockImplementation(code => {
            throw new ExitSignal(Number(code ?? 0));
        });
        await runCommand(
            'send',
            {},
            async () => {
                throw error;
            },
            { humanFooter: footer }
        ).catch(caught => {
            if (!(caught instanceof ExitSignal)) throw caught;
        });
        return vi.mocked(console.error).mock.calls.map(call => String(call[0]));
    };

    it('omits the footer for CliErrors such as input mistakes', async () => {
        expect(await runHuman(new UsageError('"x" is not an email address.'))).not.toContain(
            'FOOTER'
        );
    });

    it('prints the footer for unexpected errors', async () => {
        expect(await runHuman(new Error('fetch failed'))).toContain('FOOTER');
    });
});
