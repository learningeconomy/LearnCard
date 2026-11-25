// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { createHmac, webcrypto } from 'node:crypto';
import { getDidKitPlugin } from '../../../../../packages/plugins/didkit/src/plugin';
import { generateEncryptedRecord } from '../../../../../packages/plugins/learn-cloud/src/helpers';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { JWE } from '@learncard/types';
import {
    beginVerifierDisclosure,
    clearVerifierHistory,
    deleteVerifierReceipt,
    loadVerifierHistory,
    setVerifierHistoryEnabled,
    visibleCredentialTitles,
    historyOrigin,
    HISTORY_SCOPE,
    HISTORY_RETENTION_MS,
    type HistoryContext,
    type HistoryWallet,
} from './history';
const opaque = (value: unknown): JWE =>
    ({ ciphertext: Buffer.from(JSON.stringify(value)).toString('base64') }) as JWE;
const clear = <T>(value: JWE): T => JSON.parse(Buffer.from(value.ciphertext, 'base64').toString());
const draft = { protocol: 'vc-api' as const, titles: ['Selected diploma'] };
const fixture = () => {
    const fixtureId = webcrypto.randomUUID();
    let sequence = 0;
    let current = true;
    const documents = new Map<string, Record<string, unknown>>();
    const wallet: HistoryWallet = {
        id: { did: () => `did:key:holder-${fixtureId}` },
        invoke: {
            createDagJwe: vi.fn(async value => opaque(value)),
            decryptDagJwe: async <T>(value: JWE) => clear<T>(value),
            learnCloudCreate: vi.fn(async value => {
                documents.set((++sequence).toString(16).padStart(24, '0'), structuredClone(value));
                return true;
            }),
            learnCloudReadPage: vi.fn(async (query, options, associated) => {
                expect(query).toEqual({ scope: HISTORY_SCOPE });
                expect(associated).toBe(false);
                const records = [...documents]
                    .filter(
                        ([id, doc]) =>
                            doc.scope === HISTORY_SCOPE && (!options.cursor || id > options.cursor)
                    )
                    .slice(0, options.limit + 1);
                return {
                    records: records.slice(0, options.limit).map(([_id, doc]) => ({ ...doc, _id })),
                    hasMore: records.length > options.limit,
                    cursor: records[options.limit - 1]?.[0],
                };
            }),
            learnCloudDelete: vi.fn(async (query, associated) => {
                expect(Object.keys(query)).toEqual(['_id']);
                expect(associated).toBe(false);
                return documents.delete(String(query._id)) ? 1 : 0;
            }),
        },
    };
    const context: HistoryContext = { wallet, isCurrent: () => current, eligible: true };
    const seed = (payload: unknown) =>
        documents.set((++sequence).toString(16).padStart(24, '0'), {
            scope: HISTORY_SCOPE,
            payload: opaque(payload),
        });
    return {
        context,
        wallet,
        documents,
        seed,
        switchAccount: () => {
            current = false;
        },
    };
};
describe('private verifier history', () => {
    it('defaults off and excludes managed and empty disclosures', async () => {
        const { context, wallet } = fixture();
        for (const input of [context, { ...context, eligible: false }])
            expect(await (await beginVerifierDisclosure(input, draft)).finish('sent')).toBe(
                'skipped'
            );
        await setVerifierHistoryEnabled(context, true);
        expect(
            await (await beginVerifierDisclosure(context, { ...draft, titles: [] })).finish('sent')
        ).toBe('skipped');
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(1);
    });
    it('allowlists the summary and strips URL capabilities', async () => {
        const { context, documents } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, {
            ...draft,
            origin: 'https://user:secret@verifier.example/session?nonce=CANARY#key',
            label: 'Verifier',
            purpose: 'Review diploma',
            claims: 'CANARY_CLAIM',
        } as never);
        expect(await attempt.finish('sent')).toBe('saved');
        const { receipts } = await loadVerifierHistory(context);
        expect(receipts[0]).toMatchObject({
            origin: 'https://verifier.example',
            label: 'Verifier',
            outcome: 'sent',
            titles: draft.titles,
        });
        expect(JSON.stringify(receipts)).not.toContain('CANARY');
        expect(
            [...documents.values()].every(
                document => Object.keys(document).sort().join(',') === 'payload,scope'
            )
        ).toBe(true);
    });
    it('does not write abandoned attempts and deduplicates finish calls', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await beginVerifierDisclosure(context, draft);
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(1);
        const attempt = await beginVerifierDisclosure(context, { ...draft, protocol: 'chapi' });
        expect(
            await Promise.all([attempt.finish('handed-off'), attempt.finish('handed-off')])
        ).toEqual(['saved', 'saved']);
        expect((await loadVerifierHistory(context)).receipts[0].outcome).toBe('handed-off');
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(2);
    });
    it('disable preserves history and clear preserves disabled preference', async () => {
        const { context } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        await setVerifierHistoryEnabled(context, false);
        expect((await loadVerifierHistory(context)).receipts).toHaveLength(1);
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(await loadVerifierHistory(context)).toMatchObject({ enabled: false, receipts: [] });
    });
    it('off/on during transport invalidates captured consent', async () => {
        const { context } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, draft);
        await setVerifierHistoryEnabled(context, false);
        await setVerifierHistoryEnabled(context, true);
        expect(await attempt.finish('sent')).toBe('skipped');
    });
    it('clear prevents late repopulation and keeps enabled', async () => {
        const { context } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, draft);
        await clearVerifierHistory(context);
        expect(await attempt.finish('sent')).toBe('skipped');
        expect(await loadVerifierHistory(context)).toMatchObject({ enabled: true, receipts: [] });
    });
    it('account switching rejects late results and writes', async () => {
        const { context, switchAccount, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, draft);
        switchAccount();
        expect(await attempt.finish('sent')).toBe('skipped');
        await expect(loadVerifierHistory(context)).rejects.toThrow('account');
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(1);
    });
    it('reconciles a lost create acknowledgement without repeating it', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const create = vi.mocked(wallet.invoke.learnCloudCreate);
        const realCreate = create.getMockImplementation()!;
        create.mockImplementationOnce(async value => {
            await realCreate(value);
            throw new Error('NETWORK_CANARY');
        });
        const attempt = await beginVerifierDisclosure(context, draft);
        expect(await attempt.finish('sent')).toBe('saved');
        expect(await attempt.finish('sent')).toBe('saved');
        expect(create).toHaveBeenCalledTimes(2);
    });
    it('quota/storage failure never throws into or repeats transport', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        vi.mocked(wallet.invoke.learnCloudCreate).mockResolvedValue(false);
        const send = vi.fn().mockResolvedValue(undefined);
        const attempt = await beginVerifierDisclosure(context, draft);
        await send();
        expect(await attempt.finish('sent')).toBe('unavailable');
        expect(await attempt.finish('sent')).toBe('unavailable');
        expect(send).toHaveBeenCalledTimes(1);
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(2);
    });
    it('paginates, caps at 500, and prunes expiry/overflow with exact deletes', async () => {
        const { context, seed, documents, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const settings = clear<{ generation: string }>([...documents.values()][0].payload as JWE);
        const now = Date.now();
        for (let index = 0; index < 505; index++)
            seed({
                kind: 'receipt',
                version: 1,
                generation: settings.generation,
                eventId: webcrypto.randomUUID(),
                ...draft,
                outcome: 'sent',
                sentAt: new Date(now - index * 1000).toISOString(),
            });
        seed({
            kind: 'receipt',
            version: 1,
            generation: settings.generation,
            eventId: webcrypto.randomUUID(),
            ...draft,
            outcome: 'sent',
            sentAt: new Date(now - HISTORY_RETENTION_MS - 1).toISOString(),
        });
        const loaded = await loadVerifierHistory(context, now);
        expect(loaded.receipts).toHaveLength(500);
        expect(documents.size).toBe(501);
        expect(wallet.invoke.learnCloudReadPage).toHaveBeenCalledWith(
            { scope: HISTORY_SCOPE },
            expect.objectContaining({ cursor: expect.any(String) }),
            false
        );
        expect(await deleteVerifierReceipt(context, loaded.receipts[0].eventId)).toBe(true);
        expect((await loadVerifierHistory(context, now)).receipts).toHaveLength(499);
    });
    it('reports incomplete cleanup but immediately hides a cleared generation', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        vi.mocked(wallet.invoke.learnCloudDelete).mockResolvedValue(false);
        expect(await clearVerifierHistory(context)).toBe(false);
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: true,
            receipts: [],
            cleanupComplete: false,
        });
        vi.mocked(wallet.invoke.learnCloudDelete).mockRejectedValue(new Error('NETWORK_CANARY'));
        expect(await loadVerifierHistory(context)).toMatchObject({
            receipts: [],
            cleanupComplete: false,
        });
    });
    it('quarantines corrupt payloads, supports explicit clear, and rejects broken pagination', async () => {
        const { context, seed, wallet } = fixture();
        seed({ kind: 'receipt', vp: 'CANARY' });
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            receipts: [],
            cleanupComplete: false,
        });
        expect(wallet.invoke.learnCloudDelete).not.toHaveBeenCalled();
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            receipts: [],
            cleanupComplete: true,
        });
        vi.mocked(wallet.invoke.learnCloudReadPage).mockResolvedValue({
            records: [],
            hasMore: true,
        });
        await expect(loadVerifierHistory(context)).rejects.toThrow('pagination');
    });
    it('unknown/off consent performs no Cloud calls before or after sending and emits no history error', async () => {
        const { context, wallet } = fixture();
        vi.mocked(wallet.invoke.learnCloudReadPage).mockRejectedValue(new Error('Cloud down'));
        expect(await (await beginVerifierDisclosure(context, draft)).finish('sent')).toBe(
            'skipped'
        );
        expect(wallet.invoke.learnCloudReadPage).not.toHaveBeenCalled();
        expect(wallet.invoke.learnCloudCreate).not.toHaveBeenCalled();
        vi.mocked(wallet.invoke.learnCloudReadPage).mockRestore();
    });
    it('enabled consent is captured locally, with authoritative Cloud checks only after transport', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        vi.mocked(wallet.invoke.learnCloudReadPage).mockClear();
        const attempt = await beginVerifierDisclosure(context, draft);
        expect(wallet.invoke.learnCloudReadPage).not.toHaveBeenCalled();
        expect(await attempt.finish('sent')).toBe('saved');
        expect(wallet.invoke.learnCloudReadPage).toHaveBeenCalledTimes(2);
        await setVerifierHistoryEnabled(context, false);
        vi.mocked(wallet.invoke.learnCloudReadPage).mockClear();
        expect(await (await beginVerifierDisclosure(context, draft)).finish('sent')).toBe(
            'skipped'
        );
        expect(wallet.invoke.learnCloudReadPage).not.toHaveBeenCalled();
    });
    it('a future-version receipt does not break known history, toggles, exact delete or clear', async () => {
        const { context, seed, documents, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        seed({
            kind: 'receipt',
            version: 2,
            eventId: webcrypto.randomUUID(),
            private: 'FUTURE_CANARY',
        });
        const futureId = [...documents.keys()].at(-1)!;
        const loaded = await loadVerifierHistory(context);
        expect(loaded).toMatchObject({ enabled: true, cleanupComplete: false });
        expect(loaded.receipts).toHaveLength(1);
        expect(documents.has(futureId)).toBe(true);
        await setVerifierHistoryEnabled(context, false);
        expect(await deleteVerifierReceipt(context, loaded.receipts[0].eventId)).toBe(true);
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(documents.has(futureId)).toBe(false);
        expect(wallet.invoke.learnCloudDelete).toHaveBeenCalledWith({ _id: futureId }, false);
    });
    it('future-dated receipts are hidden but never automatically deleted for clock skew', async () => {
        const { context, seed, documents } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const settings = clear<{ generation: string }>([...documents.values()][0].payload as JWE);
        const now = Date.now();
        seed({
            kind: 'receipt',
            version: 1,
            generation: settings.generation,
            protocol: 'vc-api',
            titles: ['Ahead'],
            outcome: 'sent',
            eventId: webcrypto.randomUUID(),
            sentAt: new Date(now + 60000).toISOString(),
        });
        expect((await loadVerifierHistory(context, now)).receipts).toHaveLength(0);
        expect(documents.size).toBe(2);
        expect((await loadVerifierHistory(context, now + 60000)).receipts).toHaveLength(1);
    });
    it('empty reads cannot reset cached consent or erase another generation', async () => {
        const { context, wallet, seed, documents } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        vi.mocked(wallet.invoke.learnCloudReadPage).mockResolvedValueOnce({
            records: [],
            hasMore: false,
        });
        await expect(setVerifierHistoryEnabled(context, true)).rejects.toThrow('settings');
        seed({
            kind: 'settings',
            version: 1,
            enabled: true,
            revision: webcrypto.randomUUID(),
            generation: webcrypto.randomUUID(),
        });
        vi.mocked(wallet.invoke.learnCloudDelete).mockClear();
        expect(await loadVerifierHistory(context)).toMatchObject({
            receipts: [],
            cleanupComplete: false,
        });
        expect(wallet.invoke.learnCloudDelete).not.toHaveBeenCalled();
        expect(documents.size).toBe(3);
        expect(await clearVerifierHistory(context)).toBe(true);
    });
    it('confirms a saved receipt even when other-generation cleanup remains incomplete', async () => {
        const { context, seed, documents, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        seed({
            kind: 'settings',
            version: 1,
            enabled: true,
            revision: webcrypto.randomUUID(),
            generation: webcrypto.randomUUID(),
        });
        await loadVerifierHistory(context);
        const attempt = await beginVerifierDisclosure(context, draft);
        vi.mocked(wallet.invoke.learnCloudDelete).mockResolvedValue(false);
        expect(await attempt.finish('sent')).toBe('saved');
        expect(await loadVerifierHistory(context)).toMatchObject({ cleanupComplete: false });
        expect(documents.size).toBe(4);
    });
    it('Clear turns recording off when a read returns no settings, even from an enabled view', async () => {
        const { context, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        await (await beginVerifierDisclosure(context, draft)).finish('sent');
        vi.mocked(wallet.invoke.learnCloudReadPage).mockResolvedValueOnce({
            records: [],
            hasMore: false,
        });
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            receipts: [],
            cleanupComplete: false,
        });
    });
    it('skips recording if the account switches after an attempt begins', async () => {
        const { context, wallet, switchAccount } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, draft);
        vi.mocked(wallet.invoke.learnCloudCreate).mockClear();
        switchAccount();
        expect(await attempt.finish('sent')).toBe('skipped');
        expect(wallet.invoke.learnCloudCreate).not.toHaveBeenCalled();
    });
    it('explicit Clear recovers missing Cloud settings without silently re-enabling recording', async () => {
        const { context, documents } = fixture();
        await setVerifierHistoryEnabled(context, true);
        documents.clear();
        await expect(loadVerifierHistory(context)).rejects.toThrow('settings');
        await expect(setVerifierHistoryEnabled(context, true)).rejects.toThrow('settings');
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            receipts: [],
            cleanupComplete: true,
        });
        expect(await (await beginVerifierDisclosure(context, draft)).finish('sent')).toBe(
            'skipped'
        );
    });
    it('recovers encrypted local consent after reload, with no pre-send Cloud traffic', async () => {
        const { context, wallet } = fixture();
        const local = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => local.get(key) ?? null,
            setItem: (key: string, value: string) => local.set(key, value),
            removeItem: (key: string) => local.delete(key),
        });
        try {
            await setVerifierHistoryEnabled(context, true);
            expect(local.size).toBe(1);
            expect([...local.values()][0]).not.toContain('generation');
            vi.resetModules();
            const reloaded = await import('./history');
            vi.mocked(wallet.invoke.learnCloudReadPage).mockClear();
            const attempt = await reloaded.beginVerifierDisclosure(context, draft);
            expect(wallet.invoke.learnCloudReadPage).not.toHaveBeenCalled();
            expect(await attempt.finish('sent')).toBe('saved');
            vi.mocked(wallet.invoke.learnCloudReadPage).mockResolvedValueOnce({
                records: [],
                hasMore: false,
            });
            await expect(reloaded.loadVerifierHistory(context)).rejects.toThrow('settings');
        } finally {
            vi.unstubAllGlobals();
        }
    });
    it('unknown settings never enable recording; clear recovers with recording disabled', async () => {
        const { context, seed, wallet } = fixture();
        await setVerifierHistoryEnabled(context, true);
        const attempt = await beginVerifierDisclosure(context, draft);
        seed({ kind: 'settings', version: 2, enabled: true });
        expect(await attempt.finish('sent')).toBe('skipped');
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            cleanupComplete: false,
        });
        await expect(setVerifierHistoryEnabled(context, true)).rejects.toThrow('settings');
        expect(await clearVerifierHistory(context)).toBe(true);
        expect(await loadVerifierHistory(context)).toMatchObject({
            enabled: false,
            cleanupComplete: true,
        });
        expect(wallet.invoke.learnCloudCreate).toHaveBeenCalledTimes(2);
    });
    it('truncates titles without leaving a trailing UTF-16 surrogate', () => {
        const [title] = visibleCredentialTitles([{ name: 'a'.repeat(159) + '😀' }]);
        expect(title).toBe('a'.repeat(159));
    });
    it('does not decode compact credentials or accept non-web origins', () => {
        expect(
            visibleCredentialTitles([
                'JWT_CANARY',
                { name: 'Diploma', credentialSubject: { secret: 'CANARY' } },
            ])
        ).toEqual(['Credential', 'Diploma']);
        expect(historyOrigin('did:web:example')).toBeUndefined();
    });
});
describe('real DIDKit encryption at the Cloud boundary', () => {
    let kit: Awaited<ReturnType<typeof getDidKitPlugin>>;
    beforeAll(async () => {
        kit = await getDidKitPlugin(
            await readFile(
                new URL(
                    '../../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
                    import.meta.url
                )
            )
        );
    });
    it('the server decrypts transport but cannot read receipt metadata; unrelated holder keys fail', async () => {
        const methods = kit.methods;
        const holderKey = methods.generateEd25519KeyFromBytes(
            {} as never,
            new Uint8Array(32).fill(21)
        );
        const serverKey = methods.generateEd25519KeyFromBytes(
            {} as never,
            new Uint8Array(32).fill(22)
        );
        const otherKey = methods.generateEd25519KeyFromBytes(
            {} as never,
            new Uint8Array(32).fill(23)
        );
        const holderDid = methods.keyToDid({} as never, 'key', holderKey);
        const serverDid = methods.keyToDid({} as never, 'key', serverKey);
        const { context, wallet, documents } = fixture();
        wallet.id.did = () => holderDid;
        wallet.invoke.createDagJwe = vi.fn(async (value, recipients = [holderDid]) =>
            methods.createDagJwe({} as never, value, recipients)
        );
        wallet.invoke.decryptDagJwe = async <T>(value: JWE) =>
            methods.decryptDagJwe({} as never, value, [holderKey]) as Promise<T>;
        await setVerifierHistoryEnabled(context, true);
        expect(
            await (
                await beginVerifierDisclosure(context, {
                    ...draft,
                    label: 'VERIFIER_CANARY',
                    titles: ['TITLE_CANARY'],
                    purpose: 'PURPOSE_CANARY',
                })
            ).finish('sent')
        ).toBe('saved');
        const document = [...documents.values()].at(-1)!;
        const genericWallet = {
            ...wallet,
            invoke: {
                ...wallet.invoke,
                hash: async (message: string) =>
                    createHmac('sha256', holderKey.d).update(message).digest('hex'),
            },
        };
        for (const unencryptedCustomFields of [[], ['scope', 'payload']]) {
            const record = await generateEncryptedRecord(
                genericWallet as never,
                document,
                unencryptedCustomFields
            );
            const outer = await methods.createDagJwe({} as never, record, [serverDid]);
            const serverView = (await methods.decryptDagJwe({} as never, outer, [
                serverKey,
            ])) as typeof record;
            for (const canary of ['VERIFIER_CANARY', 'TITLE_CANARY', 'PURPOSE_CANARY'])
                expect(JSON.stringify(serverView)).not.toContain(canary);
            await expect(
                methods.decryptDagJwe({} as never, serverView.encryptedRecord, [serverKey])
            ).resolves.toBe('');
            await expect(
                methods.decryptDagJwe({} as never, document.payload as JWE, [otherKey])
            ).resolves.toBe('');
        }
        expect((await loadVerifierHistory(context)).receipts[0].label).toBe('VERIFIER_CANARY');
        expect(Object.keys(wallet.invoke).sort()).toEqual(
            [
                'createDagJwe',
                'decryptDagJwe',
                'learnCloudCreate',
                'learnCloudDelete',
                'learnCloudReadPage',
            ].sort()
        );
    });
});
