import { beforeEach, expect, mock, test } from 'bun:test';
import type { ExternalArtifact, ExternalArtifactDeletion } from '../db';
import type { UnsignedVC } from '@learncard/types';

const owner = 'did:example:learner';
const prefix = 'lc:network:network.example/trpc';
let ledger: ExternalArtifact[] = [];
const remaining = new Set<string>();
const children = new Map<string, string>();
const failures = new Map<string, unknown>();
const payloads = new Map<string, UnsignedVC>();
const calls: string[] = [];
let persistenceFails = false;
let falseResult = false;

mock.module('../constants/env', () => ({
    LEARNCARD_NETWORK_URL: 'https://network.example/trpc',
}));
mock.module('../db', () => ({
    db: {
        getExternalArtifacts: async (did: string) => {
            if (did !== owner) throw new Error('Wrong owner');
            return structuredClone(ledger);
        },
        recordExternalArtifactDeletion: async (
            did: string,
            operationId: string,
            deletion: ExternalArtifactDeletion
        ) => {
            if (did !== owner) throw new Error('Wrong owner');
            if (persistenceFails) throw new Error('Ledger unavailable');
            const artifact = ledger.find(entry => entry.operationId === operationId);
            if (!artifact) throw new Error('Missing reservation');
            artifact.deletion = deletion;
        },
    },
}));

const remove = async (uri: string, kind: 'credential' | 'boost') => {
    calls.push(uri);
    if (!uri.startsWith(`${prefix}:${kind}:`)) throw new Error('Wrong deletion endpoint');
    if (failures.has(uri)) throw failures.get(uri);
    if (falseResult) return false;
    if (!remaining.has(uri)) throw { data: { code: 'NOT_FOUND' }, message: 'Not found' };
    if ([...children].some(([child, parent]) => parent === uri && remaining.has(child))) {
        throw {
            data: { code: 'FORBIDDEN' },
            message: 'Cannot delete boost with children',
        };
    }
    remaining.delete(uri);
    return true;
};
mock.module('./index', () => ({
    getLearnCard: async () => ({
        id: { did: () => 'did:example:issuer' },
        read: { get: async (uri: string) => payloads.get(uri) },
        invoke: {
            getBoost: async (uri: string) => ({ boost: payloads.get(uri) }),
            deleteCredential: async (uri: string) => remove(uri, 'credential'),
            deleteBoost: async (uri: string) => remove(uri, 'boost'),
        },
    }),
}));
// Install SDK/database boundaries before loading the cleanup module; no live wallet is initialized.
const { cleanupExternalArtifacts } = await import('./external-artifact-deletion');

const add = (id: string, kind: string, overrides: Partial<ExternalArtifact> = {}) => {
    const artifact: ExternalArtifact = {
        subjectRef: 'owner-hmac',
        operationId: id,
        credentialId: `urn:uuid:${id}`,
        kind,
        status: 'complete',
        uris: [`${prefix}:${kind === 'contract-credential' ? 'credential' : 'boost'}:${id}`],
        reservedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
    ledger.push(artifact);
    artifact.uris.forEach(uri => {
        remaining.add(uri);
        payloads.set(uri, {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            issuanceDate: '2026-01-01T00:00:00.000Z',
            credentialSubject: { id: owner },
        });
    });
    return artifact.uris[0]!;
};

beforeEach(() => {
    ledger = [];
    remaining.clear();
    children.clear();
    failures.clear();
    payloads.clear();
    calls.length = 0;
    persistenceFails = false;
    falseResult = false;
});

test('deletes sent credentials before children and roots and persists idempotent completion', async () => {
    const root = add('root', 'boost');
    const child = add('child', 'child-boost');
    const credential = add('issued', 'contract-credential');
    children.set(child, root);
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(true);
    expect(result.retryable).toBe(false);
    expect(remaining.size).toBe(0);
    expect(calls).toEqual([credential, child, root]);
    const repeated = await cleanupExternalArtifacts(owner);
    expect(repeated.complete).toBe(true);
    expect(calls).toEqual([credential, child, root]);
});

test('unknown hierarchy is retried until children are removed without spinning on blocked parents', async () => {
    const root = add('root', 'boost');
    const intermediate = add('intermediate', 'boost');
    const leaf = add('leaf', 'boost');
    children.set(leaf, intermediate);
    children.set(intermediate, root);
    expect((await cleanupExternalArtifacts(owner)).complete).toBe(true);
    expect(remaining.size).toBe(0);
    expect(calls).toEqual([root, intermediate, leaf, root, intermediate, root]);
});

test('permission and outside-child blocks remain explicit while independent cleanup continues', async () => {
    const denied = add('denied', 'contract-credential');
    const root = add('root', 'boost');
    const outside = `${prefix}:boost:outside`;
    remaining.add(outside);
    children.set(outside, root);
    failures.set(denied, {
        data: { code: 'UNAUTHORIZED' },
        message: 'Private profile text',
    });
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(result.retryable).toBe(false);
    expect(result.artifacts.map(({ deletion }) => deletion)).toEqual([
        {
            status: 'blocked',
            code: 'remote_permission_denied',
            attemptedAt: expect.any(String),
        },
        {
            status: 'blocked',
            code: 'remote_children_remaining',
            attemptedAt: expect.any(String),
        },
    ]);
    expect(calls).toEqual([denied, root]);
    expect(JSON.stringify(result)).not.toContain('Private profile text');
});

test('transient deletion failure is durable and can complete on a subsequent attempt', async () => {
    const uri = add('transient', 'contract-credential');
    failures.set(uri, new Error('Timeout with private remote response'));
    const first = await cleanupExternalArtifacts(owner);
    expect(first.complete).toBe(false);
    expect(first.retryable).toBe(true);
    expect(ledger[0]?.deletion?.status).toBe('retryable');
    expect(remaining.has(uri)).toBe(true);
    failures.clear();
    expect((await cleanupExternalArtifacts(owner)).complete).toBe(true);
    expect(remaining.has(uri)).toBe(false);
});

test('lost creation results, reservations and legacy unknown attribution never claim erasure', async () => {
    add('lost', 'boost', { status: 'unknown', uris: [] });
    add('reserved', 'boost', { status: 'reserved', uris: [] });
    const legacy = add('legacy', 'boost', { status: 'unknown' });
    add('not-started', 'boost', { status: 'failed', uris: [] });
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(result.artifacts.map(({ deletion }) => deletion?.status)).toEqual([
        'unknown',
        'unknown',
        'deleted',
        'deleted',
    ]);
    expect(calls).toEqual([legacy]);
    expect((await cleanupExternalArtifacts(owner)).complete).toBe(false);
    expect(calls).toEqual([legacy]);
});

test('a lost deletion response followed by absent graph state cannot prove cached storage deleted', async () => {
    const uri = add('lost-delete', 'contract-credential');
    remaining.delete(uri);
    failures.set(uri, new Error('Response lost'));
    expect((await cleanupExternalArtifacts(owner)).retryable).toBe(true);
    failures.clear();
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(result.artifacts[0]?.deletion).toMatchObject({
        status: 'unknown',
        code: 'remote_absence_unconfirmed',
    });
});

test('false SDK results and unsupported or wrong-server references cannot report completion', async () => {
    const valid = add('false', 'boost');
    add('outside', 'boost', {
        uris: ['lc:network:outside.example/trpc:boost:outside'],
    });
    add('wrong-kind', 'boost', { uris: [`${prefix}:credential:wrong-kind`] });
    add('short-uri', 'boost', { uris: ['lc:boost:short-uri'] });
    falseResult = true;
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(calls).toEqual([valid]);
    expect(result.artifacts.every(({ deletion }) => deletion?.status === 'unknown')).toBe(true);
});

test('durable outcome failure rejects rather than falsely reporting account erasure', async () => {
    add('durable', 'boost');
    persistenceFails = true;
    await expect(cleanupExternalArtifacts(owner)).rejects.toThrow('Ledger unavailable');
    expect(ledger[0]?.deletion).toBeUndefined();
});

test('legacy reused boosts, other issuers and shared subjects cannot authorize remote deletion', async () => {
    const reused = add('reused', 'boost', { status: 'unknown' });
    const shared = add('shared', 'boost', { status: 'unknown' });
    const foreignIssuer = add('foreign', 'contract-credential', {
        status: 'unknown',
    });
    const unavailable = add('missing-payload', 'boost', { status: 'unknown' });
    const base = payloads.get(reused)!;
    payloads.set(reused, {
        ...base,
        credentialSubject: { id: 'did:example:another-owner' },
    });
    payloads.set(shared, {
        ...base,
        credentialSubject: [{ id: owner }, { id: 'did:example:another-owner' }],
    });
    payloads.set(foreignIssuer, {
        ...base,
        issuer: 'did:example:another-issuer',
    });
    payloads.delete(unavailable);
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(calls).toEqual([]);
    expect(remaining.size).toBe(4);
    expect(
        result.artifacts.every(
            ({ deletion }) =>
                deletion?.status === 'unknown' && deletion.code === 'remote_ownership_unconfirmed'
        )
    ).toBe(true);
});

test('authorized legacy credential deletion is acknowledged once without claiming exhaustive erasure', async () => {
    const credential = add('legacy-credential', 'contract-credential', {
        status: 'unknown',
    });
    const result = await cleanupExternalArtifacts(owner);
    expect(result.complete).toBe(false);
    expect(result.artifacts[0]?.deletion?.status).toBe('deleted');
    expect(remaining.has(credential)).toBe(false);
    expect((await cleanupExternalArtifacts(owner)).complete).toBe(false);
    expect(calls).toEqual([credential]);
});
