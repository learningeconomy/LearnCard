/**
 * `learncard call`: write gating, dry-run, never-create, --as, args parsing, method
 * catalog accuracy and JSON-safe serialization. No test reaches a network: wallet
 * construction is mocked.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

const mocks = vi.hoisted(() => ({
    initLearnCard: vi.fn(),
    initLCALearnCard: vi.fn(),
}));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));
vi.mock('@learncard/lca-api-plugin', () => ({
    initLCALearnCard: mocks.initLCALearnCard,
    getLCAPlugin: vi.fn(),
}));

import { CliError, errorEnvelope } from './errors';
import { out } from './out';
import { STAGING_NETWORK } from './project';
import {
    signatureParameters,
    assertCallAllowed,
    effectiveChainOf,
    normalizeChain,
    normalizeMethodName,
    parseCallArgs,
    registerCallCommand,
    runCall,
} from './call';
import {
    CHAIN_METHODS,
    READ_ALLOWLIST,
    SECRET_METHODS,
    STATIC_INVOKE_METHODS,
    WRITE_OVERRIDES,
    classifyMethod,
    suggestMethods,
} from './method-catalog';
import { CIRCULAR, REDACTED, TRUNCATED, toJsonSafe } from './serialize';
import type { JsonInputIo } from './json-input';
import type { RunCommand } from './doctor';
import { METHOD_SIGNATURES } from './generated/method-signatures';
import { PLUGIN_METHOD_BLOCKS, parseMethodBlock } from '../scripts/method-signatures';

const SEED = 'a'.repeat(64);
let cwd: string;

beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-call-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.initLearnCard.mockImplementation(() => {
        throw new Error('test tried to build a networked wallet');
    });
    out.json = false;
    out.result = {};
    delete process.env.NETWORK_URL;
    delete process.env.LEARNCARD_AS;
});

afterEach(async () => {
    vi.restoreAllMocks();
    mocks.initLearnCard.mockReset();
    mocks.initLCALearnCard.mockReset();
    await fs.rm(cwd, { recursive: true, force: true });
});

const writeEnv = (text: string): Promise<void> => fs.writeFile(path.join(cwd, '.env'), text);
const readEnv = (): Promise<string> => fs.readFile(path.join(cwd, '.env'), 'utf8');

const fakeWallet = (invoke: Record<string, unknown>, did = 'did:key:z6Mk') => ({
    id: { did: () => did },
    invoke,
});

const failCode = async (promise: Promise<unknown>): Promise<string> => {
    try {
        await promise;
    } catch (error) {
        return (error as CliError).code;
    }
    throw new Error('expected a failure');
};

const noIo: JsonInputIo = {
    readStdin: async () => {
        throw new Error('stdin should not be read');
    },
    readFile: async () => {
        throw new Error('file should not be read');
    },
};

describe('classifyMethod', () => {
    it('treats read-prefixed names as read and everything else as write', () => {
        for (const name of [
            'getProfile',
            'listInvites',
            'countBoosts',
            'searchProfiles',
            'verifyCredential',
            'resolveDid',
            'isServiceTrusted',
        ])
            expect(classifyMethod(name).effect, name).toBe('read');
        for (const name of [
            'sendBoost',
            'campaignsSendTestToMe',
            'campaignsDispatch',
            'createProfile',
            'deleteBoost',
            'updateProfile',
            'revokeAuthGrant',
            'send',
            'issueCredential',
            'issuePresentation',
            'hashSomething',
            'getter',
            'learnCloudCreate',
            'someFutureMethod',
        ])
            expect(classifyMethod(name).effect, name).toBe('write');
    });

    it('honours the read allowlist and the write overrides', () => {
        expect(classifyMethod('learnCloudRead').effect).toBe('read');
        expect(classifyMethod('campaignsList').effect).toBe('read');
        // tRPC mutations or one-time-code consumers despite their read-looking names.
        expect(classifyMethod('resolveShareLink').effect).toBe('write');
        expect(classifyMethod('getShareLinkContent').effect).toBe('write');
        expect(classifyMethod('verifyContactMethod').effect).toBe('write');
    });

    it('flags secret-returning methods', () => {
        expect(classifyMethod('getSubjectKeypair')).toEqual({ effect: 'read', secret: true });
        expect(classifyMethod('getAPITokenForAuthGrant').secret).toBe(true);
        // Generic signers can mint the same DID-Auth VP / API token as the gated wrappers.
        for (const name of [
            'issuePresentation',
            'signPresentation',
            'signIdToken',
            'presentSdJwtVc',
            'exchangeAuthCodeForToken',
            'exchangePreAuthCodeForToken',
            'generateEd25519KeyFromBytes',
            'generateSecp256k1KeyFromBytes',
        ])
            expect(classifyMethod(name), name).toEqual({ effect: 'write', secret: true });
        expect(classifyMethod('getProfile').secret).toBe(false);
    });

    it('suggests close names', () => {
        expect(suggestMethods('getProfil', STATIC_INVOKE_METHODS)).toContain('getProfile');
        expect(suggestMethods('sendboost', STATIC_INVOKE_METHODS)[0]).toBe('sendBoost');
        expect(suggestMethods('zzzzzzzzzzzzzzzz', STATIC_INVOKE_METHODS)).toEqual([]);
    });
});

describe('method catalog matches the plugin type definitions', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const blocks = PLUGIN_METHOD_BLOCKS;

    const declaredMethods = async (): Promise<Set<string>> => {
        const names = new Set<string>();
        for (const [file, start] of blocks) {
            const source = await fs.readFile(path.join(repoRoot, file), 'utf8');
            const from = source.indexOf(start);
            expect(from, `${file} still declares ${start}`).toBeGreaterThanOrEqual(0);
            const end = source.indexOf('\n};', from);
            for (const match of source.slice(from, end).matchAll(/^ {4}([A-Za-z0-9_]+)\??[:(<]/gm))
                names.add(match[1]!);
        }
        return names;
    };

    it('lists only methods that exist (sorted, no duplicates)', async () => {
        const declared = await declaredMethods();
        const stale = STATIC_INVOKE_METHODS.filter(name => !declared.has(name));
        expect(stale).toEqual([]);
        expect([...STATIC_INVOKE_METHODS].sort()).toEqual(STATIC_INVOKE_METHODS);
        expect(new Set(STATIC_INVOKE_METHODS).size).toBe(STATIC_INVOKE_METHODS.length);
    });

    it('covers every method of the plugins a seeded network wallet installs', async () => {
        const declared = await declaredMethods();
        const missing = [...declared].filter(name => !STATIC_INVOKE_METHODS.includes(name));
        expect(missing).toEqual([]);
    });

    it('override lists only name real methods', () => {
        for (const name of [...READ_ALLOWLIST, ...WRITE_OVERRIDES, ...SECRET_METHODS])
            expect(STATIC_INVOKE_METHODS, name).toContain(name);
    });
});

describe('args parsing', () => {
    it('spreads a JSON array and wraps any other value', async () => {
        expect(await parseCallArgs(undefined, noIo)).toEqual([]);
        expect(await parseCallArgs('["a", {"b": 1}]', noIo)).toEqual(['a', { b: 1 }]);
        expect(await parseCallArgs('{"limit": 5}', noIo)).toEqual([{ limit: 5 }]);
        expect(await parseCallArgs('"taylor"', noIo)).toEqual(['taylor']);
        expect(await parseCallArgs('null', noIo)).toEqual([null]);
        // A single array argument must itself be wrapped.
        expect(await parseCallArgs('[["x", "y"]]', noIo)).toEqual([['x', 'y']]);
    });

    it('takes a bare non-JSON value as one string argument', async () => {
        const uri = 'lc:network:network.learncard.com/trpc:credential:abc';
        expect(await parseCallArgs(uri, noIo)).toEqual([uri]);
        expect(await parseCallArgs('some-profile-id', noIo)).toEqual(['some-profile-id']);
        // JSON still wins when the value parses: numbers, booleans and quoted strings.
        expect(await parseCallArgs('42', noIo)).toEqual([42]);
        expect(await parseCallArgs('true', noIo)).toEqual([true]);
        expect(await parseCallArgs('"42"', noIo)).toEqual(['42']);
    });

    it('reads @file and - (stdin)', async () => {
        const file = path.join(cwd, 'args.json');
        await fs.writeFile(file, '["from-file"]');
        expect(await parseCallArgs(`@${file}`)).toEqual(['from-file']);
        const io: JsonInputIo = { ...noIo, readStdin: async () => '{"from": "stdin"}' };
        expect(await parseCallArgs('-', io)).toEqual([{ from: 'stdin' }]);
    });

    it('rejects invalid JSON and missing files as USAGE', async () => {
        expect(await failCode(parseCallArgs('{nope', noIo))).toBe('USAGE');
        expect(await failCode(parseCallArgs(`@${path.join(cwd, 'missing.json')}`))).toBe('USAGE');
        expect(await failCode(parseCallArgs('@', noIo))).toBe('USAGE');
    });

    it('normalizes and validates method names', () => {
        expect(normalizeMethodName('invoke.getProfile')).toBe('getProfile');
        expect(normalizeMethodName('learnCard.invoke.getProfile')).toBe('getProfile');
        expect(() => normalizeMethodName('get-profile')).toThrow(CliError);
        expect(() => normalizeMethodName('a.b')).toThrow(CliError);
    });
});

describe('write gating', () => {
    it('refuses write methods without --write, before any I/O', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        const code = await failCode(runCall('sendBoost', { yes: true }, noIo));
        expect(code).toBe('WRITE_REQUIRES_FLAG');
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('-y does not imply --write', () => {
        expect(() => assertCallAllowed('deleteBoost', { write: false })).toThrow(/needs --write/);
        try {
            assertCallAllowed('deleteBoost', {});
        } catch (error) {
            expect(errorEnvelope('call', error)).toMatchObject({
                ok: false,
                code: 'WRITE_REQUIRES_FLAG',
                hint: expect.stringContaining('-y does not imply --write'),
            });
        }
    });

    it('refuses secret methods without --show-secret', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        expect(await failCode(runCall('getSubjectKeypair', {}, noIo))).toBe('SECRET_REQUIRES_FLAG');
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('refuses issuePresentation with --write but without --show-secret', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        const args =
            '[{"holder":"did:key:z"},{"challenge":"c","proofPurpose":"authentication","proofFormat":"jwt"}]';
        expect(await failCode(runCall('issuePresentation', { write: true, args }, noIo))).toBe(
            'SECRET_REQUIRES_FLAG'
        );
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('reports a misspelled write method as UNKNOWN_METHOD, not WRITE_REQUIRES_FLAG', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        try {
            await runCall('sendCredentail', {}, noIo);
            expect.unreachable();
        } catch (error) {
            expect((error as CliError).code).toBe('UNKNOWN_METHOD');
            expect((error as CliError).hint).toContain('sendCredential');
        }
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('runs a write method with --write', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        const sendBoost = vi.fn(async () => 'urn:uuid:sent');
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ sendBoost }));
        await runCall('sendBoost', { write: true, args: '["taylor", "boost-uri"]' }, noIo);
        expect(sendBoost).toHaveBeenCalledWith('taylor', 'boost-uri');
        expect(out.result).toMatchObject({
            method: 'sendBoost',
            effect: 'write',
            result: 'urn:uuid:sent',
        });
    });
});

describe('dry run', () => {
    it('never connects, never writes, and reports the plan', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\nNETWORK_URL=staging\n`);
        const before = await readEnv();
        await runCall('sendBoost', { dryRun: true, args: '["taylor"]', as: 'acme' }, noIo);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
        expect(await readEnv()).toBe(before);
        expect(out.result).toEqual({
            dryRun: true,
            method: 'sendBoost',
            args: ['taylor'],
            effect: 'write',
            classification: 'write',
            as: 'acme',
            network: STAGING_NETWORK,
            identity: true,
            known: true,
            allowed: false,
        });
    });

    it('works in an empty folder without creating anything', async () => {
        await runCall('getProfile', { dryRun: true, network: 'staging' }, noIo);
        expect(await fs.readdir(cwd)).toEqual([]);
        expect(out.result).toMatchObject({
            identity: false,
            allowed: true,
            effect: 'read',
            as: null,
        });
    });

    it('never echoes the seed in previewed args', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        await runCall('getProfile', { dryRun: true, args: JSON.stringify([SEED]) }, noIo);
        expect(JSON.stringify(out.result)).not.toContain(SEED);
    });
});

describe('identity', () => {
    it('fails with NO_IDENTITY in an empty folder and writes nothing', async () => {
        expect(await failCode(runCall('getProfile', {}, noIo))).toBe('NO_IDENTITY');
        expect(await fs.readdir(cwd)).toEqual([]);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('connects read-only and does not rewrite .env for another network', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        const getProfile = vi.fn(async () => ({ profileId: 'me' }));
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ getProfile }));
        await runCall('getProfile', { network: 'staging' }, noIo);
        expect(await readEnv()).toBe(`SECURE_SEED=${SEED}\n`);
        expect(mocks.initLearnCard).toHaveBeenCalledWith(
            expect.objectContaining({ seed: SEED, network: STAGING_NETWORK })
        );
        expect(out.result).toEqual({
            method: 'getProfile',
            effect: 'read',
            result: { profileId: 'me' },
        });
    });

    it('--as acts through the folder profile manager', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\nORG_PROFILE_MANAGER_DID=did:web:manager\n`);
        const managedGetProfile = vi.fn(async () => ({ profileId: 'acme' }));
        mocks.initLearnCard.mockImplementation(async (config: { didWeb?: string }) => {
            if (config.didWeb === 'did:web:manager')
                return fakeWallet({
                    getManagedProfiles: async () => ({
                        records: [{ profileId: 'acme', did: 'did:web:acme' }],
                        hasMore: false,
                    }),
                });
            if (config.didWeb === 'did:web:acme')
                return fakeWallet({ getProfile: managedGetProfile });
            throw new Error('unexpected wallet');
        });
        await runCall('getProfile', { as: 'acme' }, noIo);
        expect(managedGetProfile).toHaveBeenCalled();
        // A read must not register the did:web with LearnCloud.
        for (const [config] of mocks.initLearnCard.mock.calls)
            expect(config).toMatchObject({ cloud: { automaticallyAssociateDids: false } });
        expect(out.result).toMatchObject({ as: 'acme', result: { profileId: 'acme' } });
    });

    it('--as without a profile manager fails clearly', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        await expect(runCall('getProfile', { as: 'acme' }, noIo)).rejects.toThrow(
            /profile manager/
        );
    });
});

describe('calling', () => {
    beforeEach(() => writeEnv(`SECURE_SEED=${SEED}\n`));

    it('reports an unknown method with suggestions', async () => {
        mocks.initLearnCard.mockResolvedValue(
            fakeWallet({ getProfile: vi.fn(), getBoosts: vi.fn() })
        );
        try {
            await runCall('getProfil', {}, noIo);
            expect.unreachable();
        } catch (error) {
            expect((error as CliError).code).toBe('UNKNOWN_METHOD');
            expect((error as CliError).hint).toContain('getProfile');
        }
    });

    it('does not call inherited properties', async () => {
        mocks.initLearnCard.mockResolvedValue(fakeWallet({}));
        expect(await failCode(runCall('hasOwnProperty', {}, noIo))).toBe('UNKNOWN_METHOD');
    });

    it('wraps a thrown error as CALL_FAILED without leaking the seed', async () => {
        mocks.initLearnCard.mockResolvedValue(
            fakeWallet({
                getProfile: async () => {
                    throw new Error(`boom ${SEED}\nstack`);
                },
            })
        );
        try {
            await runCall('getProfile', {}, noIo);
            expect.unreachable();
        } catch (error) {
            const envelope = errorEnvelope('call', error);
            expect(envelope.code).toBe('CALL_FAILED');
            expect(JSON.stringify(envelope)).not.toContain(SEED);
            expect(envelope.error).toContain('getProfile failed: boom');
        }
    });

    it('serializes awkward results and redacts the seed', async () => {
        const cyclic: Record<string, unknown> = { name: 'loop' };
        cyclic.self = cyclic;
        mocks.initLearnCard.mockResolvedValue(
            fakeWallet({
                getThing: async () => ({
                    big: BigInt(10),
                    bytes: new Uint8Array([1, 2, 3]),
                    when: new Date('2026-01-02T03:04:05.000Z'),
                    map: new Map([['k', 1]]),
                    set: new Set(['x']),
                    fn: () => 1,
                    cyclic,
                    seed: SEED,
                    jwk: { d: Buffer.from(SEED, 'hex').toString('base64url') },
                }),
            })
        );
        await runCall('getThing', {}, noIo);
        const result = out.result.result as Record<string, unknown>;
        expect(result).toEqual({
            big: '10',
            bytes: 'AQID',
            when: '2026-01-02T03:04:05.000Z',
            map: [['k', 1]],
            set: ['x'],
            cyclic: { name: 'loop', self: CIRCULAR },
            seed: REDACTED,
            jwk: { d: REDACTED },
        });
        expect(() => JSON.stringify(out.result)).not.toThrow();
    });

    it('does not repeat the result on stderr in --json mode', async () => {
        mocks.initLearnCard.mockResolvedValue(
            fakeWallet({ getThing: async () => ({ marker: 'RESULT-MARKER' }) })
        );
        out.json = true;
        await runCall('getThing', {}, noIo);
        expect(out.result.result).toEqual({ marker: 'RESULT-MARKER' });
        const stderr = vi.mocked(console.error).mock.calls.flat().map(String).join('\n');
        expect(stderr).not.toContain('RESULT-MARKER');
        out.json = false;
        await runCall('getThing', {}, noIo);
        const human = [...vi.mocked(console.log).mock.calls, ...vi.mocked(console.error).mock.calls]
            .flat()
            .map(String)
            .join('\n');
        expect(human).toContain('RESULT-MARKER');
    });

    it('prints null for an undefined result', async () => {
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ getNothing: async () => undefined }));
        await runCall('getNothing', {}, noIo);
        expect(out.result.result).toBeNull();
    });
});

describe('call --list', () => {
    it('falls back to the static catalog with no identity and creates nothing', async () => {
        await runCall(undefined, { list: true }, noIo);
        expect(await fs.readdir(cwd)).toEqual([]);
        expect(out.result.source).toBe('static');
        const methods = out.result.methods as { name: string; effect: string; secret?: true }[];
        expect(methods.length).toBe(STATIC_INVOKE_METHODS.length);
        expect(methods.find(entry => entry.name === 'sendBoost')).toEqual({
            name: 'sendBoost',
            effect: 'write',
        });
        expect(methods.find(entry => entry.name === 'getKey')).toEqual({
            name: 'getKey',
            effect: 'read',
            secret: true,
        });
    });

    it('enumerates the live wallet when an identity exists', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        mocks.initLearnCard.mockResolvedValue(
            fakeWallet({ sendBoost: vi.fn(), getProfile: vi.fn(), notAFunction: 1 })
        );
        await runCall(undefined, { list: true }, noIo);
        expect(out.result).toEqual({
            source: 'wallet',
            methods: [
                { name: 'getProfile', effect: 'read' },
                { name: 'sendBoost', effect: 'write' },
            ],
        });
    });

    it('--dry-run uses the static catalog and never connects', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\nORG_PROFILE_MANAGER_DID=did:web:manager\n`);
        await runCall(undefined, { list: true, dryRun: true, as: 'acme' }, noIo);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
        expect(out.result).toMatchObject({ source: 'static', dryRun: true });
    });

    it('requires a method when not listing', async () => {
        expect(await failCode(runCall(undefined, {}, noIo))).toBe('USAGE');
    });
});

describe('toJsonSafe', () => {
    it('handles primitives and edge cases', () => {
        expect(toJsonSafe(undefined)).toBeNull();
        expect(toJsonSafe(() => 1)).toBeNull();
        expect(toJsonSafe(NaN)).toBeNull();
        expect(toJsonSafe(Infinity)).toBeNull();
        expect(toJsonSafe(BigInt(123))).toBe('123');
        expect(toJsonSafe(new Date('invalid'))).toBeNull();
        expect(toJsonSafe([undefined, () => 1, Symbol('s'), 1])).toEqual([null, null, null, 1]);
        expect(toJsonSafe({ a: undefined, b: Symbol('s'), c: 1 })).toEqual({ c: 1 });
    });

    it('encodes binary data as base64', () => {
        expect(toJsonSafe(Buffer.from('hi'))).toBe('aGk=');
        expect(toJsonSafe(new Uint8Array([255]).buffer)).toBe('/w==');
        expect(toJsonSafe(new Uint8Array([0, 1, 2, 3]).subarray(1, 3))).toBe('AQI=');
        expect(toJsonSafe(new Float32Array([1.5]))).toEqual([1.5]);
        expect(toJsonSafe(new BigInt64Array([BigInt(2)]))).toEqual(['2']);
    });

    it('keeps shared references but marks cycles', () => {
        const shared = { x: 1 };
        expect(toJsonSafe({ a: shared, b: shared })).toEqual({ a: { x: 1 }, b: { x: 1 } });
        const list: unknown[] = [];
        list.push(list);
        expect(toJsonSafe(list)).toEqual([CIRCULAR]);
        const map = new Map<string, unknown>();
        map.set('me', map);
        expect(toJsonSafe(map)).toEqual([['me', CIRCULAR]]);
    });

    it('uses toJSON, shapes errors and limits depth', () => {
        expect(toJsonSafe(new URL('https://example.org/a'))).toBe('https://example.org/a');
        const error = Object.assign(new Error('bad'), { code: 'E1' });
        expect(toJsonSafe(error)).toEqual({ name: 'Error', message: 'bad', code: 'E1' });
        expect(toJsonSafe({ a: { b: { c: 1 } } }, { maxDepth: 2 })).toEqual({
            a: { b: TRUNCATED },
        });
    });

    it('redacts secrets in strings and keys, ignoring short ones', () => {
        const secret = 'supersecretvalue';
        expect(
            toJsonSafe(
                { [secret]: `x${secret}y`, short: 'abc' },
                { redact: [secret, 'abc', undefined] }
            )
        ).toEqual({
            [REDACTED]: `x${REDACTED}y`,
            short: 'abc',
        });
    });
});

describe('registerCallCommand', () => {
    const capture = (argv: string[]): { command: string; options: Record<string, unknown> } => {
        const program = new Command();
        program.exitOverride();
        let seen: { command: string; options: Record<string, unknown> } | undefined;
        const run: RunCommand = async (command, options) => {
            seen = { command, options: options as Record<string, unknown> };
        };
        registerCallCommand(program, run);
        program.parse(['node', 'learncard', 'call', ...argv]);
        return seen!;
    };

    it('parses flags without implying --write from -y', () => {
        const { command, options } = capture([
            'getProfile',
            '--args',
            '["x"]',
            '--dry-run',
            '--network',
            'staging',
            '--json',
        ]);
        expect(command).toBe('call');
        expect(options).toMatchObject({
            args: '["x"]',
            dryRun: true,
            network: 'staging',
            json: true,
        });
        expect(options.write).toBeUndefined();
    });

    it('reads --as from LEARNCARD_AS', () => {
        process.env.LEARNCARD_AS = 'acme';
        expect(capture(['getProfile']).options.as).toBe('acme');
    });
});

describe('secret audit (OpenID4VC)', () => {
    it('classifies presentCredentials and the PKCE flow handle as secret', () => {
        // presentCredentials returns the signed vp_token and, when requested, the id_token.
        expect(classifyMethod('presentCredentials')).toEqual({ effect: 'write', secret: true });
        // beginCredentialOfferAuthCode returns flowHandle.pkceVerifier, which redeems the code.
        expect(classifyMethod('beginCredentialOfferAuthCode')).toEqual({
            effect: 'write',
            secret: true,
        });
        for (const name of SECRET_METHODS) expect(STATIC_INVOKE_METHODS).toContain(name);
    });

    it('refuses presentCredentials with --write but without --show-secret, before any I/O', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        expect(
            await failCode(
                runCall('presentCredentials', { write: true, args: '["openid4vp://x", []]' }, noIo)
            )
        ).toBe('SECRET_REQUIRES_FLAG');
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('dry-run reports presentCredentials as needing --show-secret', async () => {
        await writeEnv(`SECURE_SEED=${SEED}\n`);
        await runCall('presentCredentials', { dryRun: true, write: true }, noIo);
        expect(out.result).toMatchObject({ secret: true, allowed: false });
    });
});

describe('on-chain methods (--chain)', () => {
    beforeEach(() => writeEnv(`SECURE_SEED=${SEED}\n`));

    const chainWallet = (network: unknown, transferTokens = vi.fn(async () => '0xhash')) =>
        fakeWallet({ transferTokens, getCurrentNetwork: () => network });

    it('lists transferTokens as an on-chain method that exists in the catalog', () => {
        expect([...CHAIN_METHODS]).toEqual(['transferTokens']);
        for (const name of CHAIN_METHODS) expect(STATIC_INVOKE_METHODS).toContain(name);
    });

    it('refuses transferTokens with --write but without --chain, before any I/O', async () => {
        try {
            await runCall(
                'transferTokens',
                { write: true, network: 'staging', args: '["ETH", 1, "0xabc"]' },
                noIo
            );
            expect.unreachable();
        } catch (error) {
            expect((error as CliError).code).toBe('CHAIN_REQUIRED');
            expect((error as CliError).hint).toContain('mainnet');
        }
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('dry-run shows the plugin default chain and that --chain is required', async () => {
        await runCall('transferTokens', { dryRun: true, write: true, network: 'staging' }, noIo);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
        expect(out.result).toMatchObject({
            network: STAGING_NETWORK,
            allowed: false,
            chain: {
                effective: 'mainnet',
                requested: null,
                pluginDefault: 'mainnet',
                required: true,
            },
        });
    });

    it('dry-run with --chain previews that chain and is allowed', async () => {
        await runCall('transferTokens', { dryRun: true, write: true, chain: 'Sepolia' }, noIo);
        expect(out.result).toMatchObject({
            allowed: true,
            chain: { effective: 'sepolia', requested: 'sepolia', required: true },
        });
    });

    it('configures the plugin for --chain and submits only when the wallet reports it', async () => {
        const transferTokens = vi.fn(async () => '0xhash');
        mocks.initLearnCard.mockResolvedValue(chainWallet('sepolia', transferTokens));
        await runCall(
            'transferTokens',
            { write: true, chain: 'sepolia', args: '["ETH", 1, "0xabc"]' },
            noIo
        );
        expect(mocks.initLearnCard).toHaveBeenCalledWith(
            expect.objectContaining({ ethereumConfig: { network: 'sepolia' } })
        );
        expect(transferTokens).toHaveBeenCalledWith('ETH', 1, '0xabc');
        expect(out.result).toMatchObject({ method: 'transferTokens', chain: 'sepolia' });
    });

    it('refuses to submit when the wallet is on another chain (e.g. mainnet)', async () => {
        const transferTokens = vi.fn(async () => '0xhash');
        mocks.initLearnCard.mockResolvedValue(chainWallet('mainnet', transferTokens));
        expect(
            await failCode(
                runCall(
                    'transferTokens',
                    { write: true, chain: 'sepolia', args: '["ETH", 1, "0xabc"]' },
                    noIo
                )
            )
        ).toBe('CHAIN_MISMATCH');
        expect(transferTokens).not.toHaveBeenCalled();
    });

    it('refuses to submit when the chain cannot be read', async () => {
        const transferTokens = vi.fn(async () => '0xhash');
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ transferTokens }));
        expect(
            await failCode(
                runCall(
                    'transferTokens',
                    { write: true, chain: 'sepolia', args: '["ETH", 1, "0xabc"]' },
                    noIo
                )
            )
        ).toBe('CHAIN_MISMATCH');
        expect(transferTokens).not.toHaveBeenCalled();
    });

    it('allows mainnet only when named, accepting the ethers aliases', async () => {
        const transferTokens = vi.fn(async () => '0xhash');
        mocks.initLearnCard.mockResolvedValue(
            chainWallet({ name: 'homestead', chainId: 1 }, transferTokens)
        );
        await runCall(
            'transferTokens',
            { write: true, chain: 'ethereum', args: '["ETH", 1, "0xabc"]' },
            noIo
        );
        expect(mocks.initLearnCard).toHaveBeenCalledWith(
            expect.objectContaining({ ethereumConfig: { network: 'mainnet' } })
        );
        expect(transferTokens).toHaveBeenCalled();
    });

    it('normalizes and validates chain names', () => {
        expect(normalizeChain(' Homestead ')).toBe('mainnet');
        expect(normalizeChain('sepolia')).toBe('sepolia');
        expect(() => normalizeChain('https://rpc.example')).toThrow(/not a chain name/);
        expect(effectiveChainOf(1)).toBe('mainnet');
        expect(effectiveChainOf(11155111)).toBe('11155111');
        expect(effectiveChainOf({ chainId: 1 })).toBe('mainnet');
        expect(effectiveChainOf(undefined)).toBeUndefined();
    });

    it('rejects a malformed --chain as USAGE before any I/O', async () => {
        expect(
            await failCode(runCall('transferTokens', { write: true, chain: '../x' }, noIo))
        ).toBe('USAGE');
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
    });

    it('--list marks on-chain methods', async () => {
        await fs.rm(path.join(cwd, '.env'));
        await runCall(undefined, { list: true }, noIo);
        const methods = (out.result as { methods: { name: string; chain?: true }[] }).methods;
        expect(methods.find(entry => entry.name === 'transferTokens')).toMatchObject({
            chain: true,
        });
        expect(methods.find(entry => entry.name === 'getBalance')?.chain).toBeUndefined();
    });
});

describe('LearnCloud DID association', () => {
    beforeEach(() => writeEnv(`SECURE_SEED=${SEED}\n`));

    it('turns automatic association off for read calls (no addDid / setPrimaryDid)', async () => {
        const learnCloudRead = vi.fn(async () => []);
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ learnCloudRead }));
        await runCall('learnCloudRead', { args: '[{}]' }, noIo);
        expect(learnCloudRead).toHaveBeenCalled();
        expect(mocks.initLearnCard).toHaveBeenCalledWith(
            expect.objectContaining({ cloud: { automaticallyAssociateDids: false } })
        );
    });

    it('keeps the cloud URL alongside the association switch', async () => {
        process.env.CLOUD_URL = 'http://127.0.0.1:9';
        try {
            mocks.initLearnCard.mockResolvedValue(fakeWallet({ getProfile: vi.fn() }));
            await runCall('getProfile', {}, noIo);
            expect(mocks.initLearnCard).toHaveBeenCalledWith(
                expect.objectContaining({
                    cloud: { url: 'http://127.0.0.1:9', automaticallyAssociateDids: false },
                })
            );
        } finally {
            delete process.env.CLOUD_URL;
        }
    });

    it('turns it off for --list too', async () => {
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ getProfile: vi.fn() }));
        await runCall(undefined, { list: true }, noIo);
        expect(mocks.initLearnCard).toHaveBeenCalledWith(
            expect.objectContaining({ cloud: { automaticallyAssociateDids: false } })
        );
    });

    it('keeps the SDK default for --write calls', async () => {
        const learnCloudCreate = vi.fn(async () => true);
        mocks.initLearnCard.mockResolvedValue(fakeWallet({ learnCloudCreate }));
        await runCall('learnCloudCreate', { write: true, args: '[{}]' }, noIo);
        const [config] = mocks.initLearnCard.mock.calls[0]!;
        expect((config as { cloud?: unknown }).cloud).toBeUndefined();
    });
});

describe('registerCallCommand --chain', () => {
    it('parses --chain and never reads it from the environment', () => {
        const program = new Command();
        program.exitOverride();
        let seen: Record<string, unknown> | undefined;
        registerCallCommand(program, async (_command, options) => {
            seen = options as Record<string, unknown>;
        });
        program.parse(['node', 'learncard', 'call', 'transferTokens', '--chain', 'sepolia']);
        expect(seen?.chain).toBe('sepolia');
    });
});

describe('call --describe', () => {
    it.each(['campaignsSendTestToMe', 'campaignsDispatch'])(
        'describes %s as a write without connecting',
        async method => {
            await runCall(method, { describe: true }, noIo);
            expect(out.result).toMatchObject({
                method,
                effect: 'write',
                plugin: 'learn-card-network',
                needs: ['--write'],
            });
            expect(String(out.result.signature)).toContain(`${method}: (`);
            expect(mocks.initLearnCard).not.toHaveBeenCalled();
        }
    );

    it('every catalogued method has a generated signature', () => {
        const missing = STATIC_INVOKE_METHODS.filter(name => !METHOD_SIGNATURES[name]);
        expect(missing).toEqual([]);
    });

    it('parses a plugin block: multi-line members, JSDoc, first declaration wins', () => {
        const source = [
            'export type Methods = {',
            '    /** Read one thing. */',
            '    getThing: (id: string) => Promise<Thing>;',
            '    // a line comment',
            '    makeThing: (',
            '        input: { name: string; tags?: string[] },',
            '        options?: Options',
            '    ) => Promise<string>;',
            '    getThing: () => never;',
            '};',
        ].join('\n');
        const parsed = parseMethodBlock(source, 'export type Methods = {', 'demo');
        expect(parsed.get('getThing')).toEqual({
            plugin: 'demo',
            signature: 'getThing: (id: string) => Promise<Thing>',
            doc: 'Read one thing.',
        });
        expect(parsed.get('makeThing')?.signature).toBe(
            'makeThing: (input: {name: string; tags?: string[]}, options?: Options) => Promise<string>'
        );
    });

    it('splits top-level parameters, ignoring nested commas and arrow returns', () => {
        expect(signatureParameters('f: () => Promise<void>')).toEqual([]);
        expect(
            signatureParameters('f: (a: Map<string, number>, b?: (x: X) => Y, ...rest: Z[]) => R')
        ).toEqual([
            { name: 'a', optional: false },
            { name: 'b', optional: true },
            { name: 'rest', optional: false },
        ]);
    });

    it('describes a write method with its required flags and an example, without connecting', async () => {
        await runCall('acceptCredential', { describe: true }, noIo);
        expect(mocks.initLearnCard).not.toHaveBeenCalled();
        expect(out.result).toMatchObject({
            method: 'acceptCredential',
            effect: 'write',
            plugin: 'learn-card-network',
            needs: ['--write'],
            example: "npx @learncard/cli call acceptCredential --args '<value>' --write --json",
        });
        expect(String(out.result.signature)).toMatch(/^acceptCredential: \(uri: string/);
        expect(await fs.readdir(cwd)).toEqual([]);
    });

    it('omits --args when every parameter is optional and flags secrets and chains', async () => {
        await runCall('getProfile', { describe: true }, noIo);
        expect(out.result.example).toBe('npx @learncard/cli call getProfile --json');
        await runCall('getKey', { describe: true }, noIo);
        expect(out.result.needs).toEqual(['--show-secret']);
        await runCall('transferTokens', { describe: true }, noIo);
        expect(out.result.needs).toEqual(['--write', '--chain <name>']);
    });

    it('keeps stderr quiet in --json mode', async () => {
        out.json = true;
        await runCall('getProfile', { describe: true }, noIo);
        expect(vi.mocked(console.error)).not.toHaveBeenCalled();
        out.json = false;
    });

    it('rejects a missing or unknown method', async () => {
        expect(await failCode(runCall(undefined, { describe: true }, noIo))).toBe('USAGE');
        expect(await failCode(runCall('getProfil', { describe: true }, noIo))).toBe(
            'UNKNOWN_METHOD'
        );
    });
});
