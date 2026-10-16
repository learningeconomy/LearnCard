import { expect, test } from 'bun:test';
import {
    createResetCommands,
    readResetReceipt,
    type ResetReceipt,
    type ResetDependencies,
} from './staging-reset';
import {
    deleteStagingRecovery,
    createResetSigner,
    clearResetCollection,
} from './staging-reset-adapter';
import type { ConsumerWallet } from './consumer-apps';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { importJWK, jwtVerify } from 'jose';

const harness = () => {
    const value = {
        account: { uid: 'one', email: 'native-test@example.invalid' },
        active: true,
        phase: 'ready',
        receipt: undefined as ResetReceipt | undefined,
        did: 'did:key:synthetic',
        server: 'did:key:synthetic' as string | null,
        profile: { profileId: 'learner' } as { profileId: string } | undefined,
        records: 300,
        fail: '',
        lostReply: '',
        calls: [] as string[],
    };
    const step = async (name: string, mutation: () => void) => {
        value.calls.push(name);
        if (value.fail === name) throw new Error('offline');
        mutation();
        if (value.lostReply === name) throw new Error('reply lost');
    };
    const deps: ResetDependencies = {
        account: () => value.account,
        active: () => value.active,
        phase: () => value.phase,
        journal: {
            read: async () => value.receipt && structuredClone(value.receipt),
            write: async receipt => {
                await step(`save:${receipt.stage}`, () => {
                    value.receipt = structuredClone(receipt);
                });
            },
        },
        wallet: async () => ({
            did: () => value.did,
            profile: async () => value.profile,
            collectionEmpty: async () => value.records === 0,
            clearCollection: () =>
                step('collection', () => {
                    value.records = 0;
                }),
            deleteProfile: () =>
                step('profile', () => {
                    value.profile = undefined;
                }),
        }),
        serverIdentity: async () => value.server,
        deleteRecovery: () =>
            step('recovery', () => {
                value.server = null;
            }),
        finishLocal: () =>
            step('local', () => {
                value.receipt = undefined;
            }),
        blockAccount: () => {
            value.phase = 'reset_pending';
        },
    };
    return { value, deps, commands: createResetCommands(deps) };
};
const input = { email: 'native-test@example.invalid' };
test('confirmed reset journals before each destructive boundary and finishes locally last', async () => {
    const { commands, value } = harness();
    expect(await commands.resetStart(input)).toEqual({ phase: 'reset_complete', methods: [] });
    expect(value.calls).toEqual([
        'save:collection',
        'collection',
        'save:profile',
        'profile',
        'save:recovery',
        'recovery',
        'save:local',
        'local',
    ]);
    expect(value.account.uid).toBe('one');
    expect(value.receipt).toBeUndefined();
});
test('email, ready state, existing profile and primary identity are required before any write', async () => {
    for (const invalid of ['email', 'phase', 'profile', 'server', 'did']) {
        const { commands, value } = harness();
        if (invalid === 'phase') value.phase = 'needs_recovery';
        if (invalid === 'profile') value.profile = undefined;
        if (invalid === 'server') value.server = 'did:key:other';
        if (invalid === 'did') value.did = 'did:web:other';
        await expect(
            commands.resetStart(invalid === 'email' ? { email: 'other@example.invalid' } : input)
        ).rejects.toThrow('reset:');
        expect(value.calls).toEqual([]);
    }
});
test('lost destructive replies are reconciled from server state without duplicate writes', async () => {
    for (const stage of ['collection', 'profile', 'recovery']) {
        const { commands, value } = harness();
        value.lostReply = stage;
        expect((await commands.resetStart(input)).phase).toBe('reset_complete');
        expect(value.calls.filter(name => name === stage)).toHaveLength(1);
    }
});
test('partial failures stop before the next destructive stage and resume after relaunch', async () => {
    for (const stage of ['collection', 'profile', 'recovery', 'local']) {
        const { commands, value, deps } = harness();
        value.fail = stage;
        await expect(commands.resetStart(input)).rejects.toThrow();
        expect(value.receipt?.stage).toBe(stage);
        expect(value.phase).toBe('reset_pending');
        const before = [...value.calls];
        value.fail = '';
        expect((await createResetCommands(deps).resetResume()).phase).toBe('reset_complete');
        for (const completed of ['collection', 'profile', 'recovery'].slice(
            0,
            ['collection', 'profile', 'recovery', 'local'].indexOf(stage)
        )) {
            expect(value.calls.filter(name => name === completed)).toHaveLength(
                before.filter(name => name === completed).length
            );
        }
    }
});
test('journal failure never starts an unrecorded deletion', async () => {
    const { commands, value } = harness();
    value.fail = 'save:collection';
    await expect(commands.resetStart(input)).rejects.toThrow();
    expect(value.records).toBe(300);
    expect(value.profile).toBeDefined();
    expect(value.receipt).toBeUndefined();
});
test('local completion rechecks recovery absence and refuses a replacement identity', async () => {
    const { commands, value } = harness();
    value.fail = 'local';
    await expect(commands.resetStart(input)).rejects.toThrow();
    value.fail = '';
    value.server = 'did:key:replacement';
    await expect(commands.resetResume()).rejects.toThrow('reset:changed');
    expect(value.calls.filter(name => name === 'local')).toHaveLength(1);
    expect(value.receipt?.stage).toBe('local');
});
test('receipt ownership, corruption and future timestamps fail closed', async () => {
    const { commands, value } = harness();
    value.fail = 'profile';
    await expect(commands.resetStart(input)).rejects.toThrow();
    const raw = JSON.stringify(value.receipt);
    expect(readResetReceipt(raw)?.stage).toBe('profile');
    expect(readResetReceipt(null)).toBeUndefined();
    for (const bad of [
        '{}',
        'broken',
        JSON.stringify({ ...value.receipt, createdAt: Date.now() + 1e9 }),
        JSON.stringify({ ...value.receipt, environment: 'production' }),
    ]) {
        expect(() => readResetReceipt(bad)).toThrow('reset:storage');
    }
    value.receipt!.uid = 'two';
    await expect(commands.resetResume()).rejects.toThrow('reset:changed');
});
test('read-only status never resumes mutations; inactive and concurrent operations are refused', async () => {
    const { commands, value, deps } = harness();
    value.fail = 'profile';
    await expect(commands.resetStart(input)).rejects.toThrow();
    const before = [...value.calls];
    expect((await commands.resetStatus())?.phase).toBe('reset_pending');
    expect(value.calls).toEqual(before);
    let release!: () => void;
    deps.journal.read = () =>
        new Promise(resolve => {
            release = () => resolve(structuredClone(value.receipt));
        });
    const pending = commands.resetResume();
    await expect(commands.resetResume()).rejects.toThrow('reset:unavailable');
    value.active = false;
    release();
    await expect(pending).rejects.toThrow('reset:unavailable');
    expect(value.calls).toEqual(before);
});
test('switching UID during a read prevents deletion under the new session', async () => {
    const { commands, value, deps } = harness();
    deps.serverIdentity = async () => {
        value.account = { ...value.account, uid: 'two' };
        return value.did;
    };
    await expect(commands.resetStart(input)).rejects.toThrow('reset:changed');
    expect(value.calls).toEqual([]);
});
test('recovery removal uses fresh DID challenge at fixed staging endpoints and keeps Firebase untouched', async () => {
    const proofs: (string | undefined)[] = [],
        requests: Request[] = [];
    const signer = {
        did: 'did:key:synthetic',
        proof: async (challenge?: string) => {
            proofs.push(challenge);
            return challenge ? 'fresh-proof' : 'bootstrap-proof';
        },
    };
    const request = (async (url: RequestInfo | URL, options?: RequestInit) => {
        requests.push(new Request(url, options));
        return Response.json(
            requests.length === 1 ? { challenge: 'server-challenge' } : { success: true }
        );
    }) as typeof fetch;
    await deleteStagingRecovery(signer, 'synthetic-token', 'did:key:synthetic', request);
    expect(proofs).toEqual([undefined, 'server-challenge']);
    expect(requests.map(r => r.url)).toEqual([
        'https://staging.api.learncard.app/api/keys/challenge',
        'https://staging.api.learncard.app/api/keys/delete',
    ]);
    expect(requests[1].headers.get('Authorization')).toBe('Bearer fresh-proof');
    expect(requests[1].headers.get('X-Tenant-Id')).toBe('learncard');
    expect(await requests[1].json()).toEqual({
        authToken: 'synthetic-token',
        providerType: 'firebase',
        challenge: 'server-challenge',
    });
    await expect(
        deleteStagingRecovery(signer, 'synthetic-token', 'did:key:other', request)
    ).rejects.toThrow('reset:changed');
    expect(requests).toHaveLength(2);
});

test('actual reset proofs use the seed identity and fresh nonce without a network profile', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const seed = 'e'.repeat(64),
        wallet = await initLearnCard({ seed, didkit: wasm });
    const signer = await createResetSigner(seed, wasm, wallet.id.did());
    const proof = await signer.proof('fresh-public-test-challenge');
    const payload = JSON.parse(Buffer.from(proof.split('.')[1], 'base64url').toString());
    expect(payload.iss).toBe(signer.did);
    expect(signer.did.startsWith('did:key:')).toBe(true);
    expect(payload.nonce).toBe('fresh-public-test-challenge');
    const { d: _private, ...publicJwk } = wallet.id.keypair();
    const verified = await jwtVerify(proof, await importJWK(publicJwk, 'EdDSA'));
    expect(verified.payload.iss).toBe(signer.did);
    await expect(createResetSigner(seed, wasm, 'did:web:removed-profile')).rejects.toThrow(
        'reset:changed'
    );
}, 30_000);

test('collection reset clears associated identity records and duplicate IDs across changing pages', async () => {
    const records = Array.from({ length: 127 }, (_, i) => ({
        id: `record-${i % 80}`,
        owner: i % 2 ? 'key' : 'profile',
    }));
    let reads = 0,
        removes = 0;
    const index = {
        getPage: async (_query: unknown, options: { limit: number; cursor?: string }) => {
            expect(options.cursor).toBeUndefined();
            reads++;
            return { records: records.slice(0, options.limit) };
        },
        remove: async (id: string) => {
            const at = records.findIndex(r => r.id === id);
            expect(at).toBeGreaterThanOrEqual(0);
            records.splice(at, 1);
            removes++;
            return true;
        },
        removeAll: async () => {
            throw new Error('current-DID bulk delete must not be used');
        },
    } as unknown as ConsumerWallet['index']['LearnCloud'];
    await clearResetCollection(index);
    expect(records).toHaveLength(0);
    expect(removes).toBe(127);
    expect(reads).toBeGreaterThan(2);
});
test('partial collection failure waits for all in-flight deletes and allows explicit retry', async () => {
    let records = [{ id: 'one' }, { id: 'two' }],
        fail = true;
    const index = {
        getPage: async () => ({ records: [...records] }),
        remove: async (id: string) => {
            await Promise.resolve();
            if (id === 'one' && fail) throw new Error('offline');
            records = records.filter(r => r.id !== id);
            return true;
        },
    } as unknown as ConsumerWallet['index']['LearnCloud'];
    await expect(clearResetCollection(index)).rejects.toThrow('reset:connection');
    expect(records).toEqual([{ id: 'one' }]);
    fail = false;
    await clearResetCollection(index);
    expect(records).toHaveLength(0);
});
test('one reset attempt is bounded so a large collection can continue from its receipt', async () => {
    let removes = 0;
    const index = {
        getPage: async () => ({
            records: Array.from({ length: 50 }, (_, i) => ({ id: `record-${i}` })),
        }),
        remove: async () => {
            removes++;
            return true;
        },
    } as unknown as ConsumerWallet['index']['LearnCloud'];
    await clearResetCollection(index);
    expect(removes).toBe(500);
});
