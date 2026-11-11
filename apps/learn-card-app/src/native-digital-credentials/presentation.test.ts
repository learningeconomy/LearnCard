import { describe, expect, it, vi } from 'vitest';
import { parseSdJwtVc, presentSdJwtVc } from '@learncard/sd-jwt-vc-plugin';
import { generateLearnCard, getTestCache } from '@learncard/core';
import { getLearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import {
    createLabCredential,
    decode,
    publicJwk,
    verifyPresentation,
    verifier,
    fixture,
} from '../../android/digital-credentials-lab/web/fixture';
import { buildAccountInventory, type DigitalCredentialWallet } from './inventory';
import { prepareAccountPresentation } from './presentation';
import type { ConsentPicks } from '../pages/oid4vp/components/RequestConsent';

vi.mock('learn-card-base', () => ({ getLogger: () => ({ warn: vi.fn() }) }));
const cloudIndex = vi.hoisted(() => vi.fn());
vi.mock('@learncard/learn-cloud-client', () => ({
    getClient: () => ({ index: { get: { query: cloudIndex } } }),
}));

const ORIGIN = `android:apk-key-hash:${'A'.repeat(43)}`;
const setup = async () => {
    const credential = await createLabCredential();
    let stored = credential.compact;
    let indexed = true;
    const key = { ...publicJwk(decode(credential.holderSecret)), d: credential.holderSecret } as {
        kty: string;
        crv: string;
        x: string;
        d: string;
    };
    const wallet: DigitalCredentialWallet = {
        id: { did: () => 'did:example:account', keypair: () => key },
        index: {
            LearnCloud: {
                get: async () => (indexed ? [{ uri: 'lc:cloud:encrypted-course' }] : []),
            },
        },
        read: { get: vi.fn(async () => stored) },
        invoke: {
            parseSdJwtVc,
            verifySdJwtVc: async compact => {
                await verifier().verify(compact);
                return { checks: ['issuer_signature'], warnings: [], errors: [] };
            },
            presentSdJwtVc: (compact, options) =>
                presentSdJwtVc(compact, { ...options, activeHolderPublicJwk: key }),
        },
    };
    const inventory = await buildAccountInventory(wallet, undefined, 'Digital credential');
    const pending = {
        requestId: 'native-request',
        selectedEntryId: inventory.entries[0].id,
        origin: ORIGIN,
        request: {
            protocol: 'openid4vp-v1-unsigned',
            data: {
                response_type: 'vp_token',
                response_mode: 'dc_api',
                nonce: 'account-nonce',
                dcql_query: {
                    credentials: [
                        {
                            id: 'course_completion',
                            format: 'dc+sd-jwt',
                            meta: { vct_values: [fixture.template.vct] },
                            claims: [{ path: ['course_name'] }, { path: ['completion_date'] }],
                        },
                    ],
                },
            },
        },
    };
    const picks: ConsentPicks = {
        row: { course_completion: 0 },
        disclose: {
            'course_completion::lc:cloud:encrypted-course': {
                course_name: true,
                completion_date: true,
            },
        },
    };
    return {
        wallet,
        inventory,
        pending,
        picks,
        remove: () => {
            indexed = false;
        },
        change: () => {
            stored += '~';
        },
    };
};

describe('native LearnCard account presentation', () => {
    // Keep the real core cache wrappers AND LearnCloud get -> getPage nesting.
    // Only storage transport/decryption are fake; SD-JWT issuance/verification are real.
    const warmWallet = async (source: DigitalCredentialWallet, indexed: boolean) => {
        const record = { id: 'remaining', uri: 'lc:cloud:encrypted-course' };
        cloudIndex.mockImplementation(async () => ({
            records: indexed ? [{ encryptedRecord: record }] : [],
            hasMore: false,
        }));
        const cloud = await getLearnCloudPlugin(
            source as never,
            'https://cloud.example',
            [],
            [],
            false
        );
        const sdk = await generateLearnCard({
            plugins: [
                {
                    ...cloud,
                    read: {
                        get: async () =>
                            ({
                                proof: {
                                    type: 'SdJwtCompactProof',
                                    jwt: await source.read.get(record.uri),
                                },
                            }) as never,
                    },
                },
                getTestCache(),
            ],
        });
        Object.assign(sdk, {
            id: source.id,
            invoke: { ...source.invoke, decryptDagJwe: async (value: unknown) => value },
        });
        return { sdk, wallet: sdk as unknown as DigitalCredentialWallet, record };
    };

    it.each(['full index', 'index page', 'credential body'])(
        'prepares and approves a remaining entry in a warm process with a stale %s',
        async stale => {
            const { wallet: source, inventory, pending, picks } = await setup();
            const { sdk, wallet, record } = await warmWallet(source, true);
            const removed = { id: 'removed', uri: 'lc:cloud:removed-course' };
            if (stale === 'full index') await sdk.cache.setIndex('LearnCloud', {}, [removed]);
            if (stale === 'index page')
                await sdk.cache.setIndexPage(
                    'LearnCloud',
                    {},
                    { records: [removed], hasMore: false }
                );
            if (stale === 'credential body')
                await sdk.cache.setVc(record.uri, {
                    proof: { type: 'SdJwtCompactProof', jwt: 'stale~' },
                } as never);
            const prepared = await prepareAccountPresentation(
                wallet,
                inventory,
                pending,
                () => true
            );
            const response = JSON.parse(await prepared.approve(picks));
            await expect(
                verifyPresentation(
                    response.data.vp_token.course_completion[0],
                    ORIGIN,
                    'account-nonce'
                )
            ).resolves.toMatchObject({ course_name: expect.any(String) });
        }
    );

    it('rejects an entry removed after consent even when both warm index caches contain it', async () => {
        const { wallet: source, inventory, pending, picks } = await setup();
        const { sdk, wallet, record } = await warmWallet(source, true);
        const prepared = await prepareAccountPresentation(wallet, inventory, pending, () => true);
        await sdk.cache.setIndex('LearnCloud', {}, [record]);
        await sdk.cache.setIndexPage('LearnCloud', {}, { records: [record], hasMore: false });
        cloudIndex.mockResolvedValue({ records: [], hasMore: false });
        await expect(prepared.approve(picks)).rejects.toThrow('Credential removed');
    });

    it('reconciles replacement against current index pages and bodies without restarting the wallet', async () => {
        const { wallet: source, inventory } = await setup();
        const { sdk, wallet, record } = await warmWallet(source, true);
        const removed = { id: 'removed', uri: 'lc:cloud:removed-course' };
        const original = {
            ...inventory,
            entries: [...inventory.entries, { ...inventory.entries[0], ...removed }],
        };
        await sdk.cache.setIndex('LearnCloud', {}, [removed, record]);
        await sdk.cache.setIndexPage(
            'LearnCloud',
            {},
            { records: [removed, record], hasMore: false }
        );
        await sdk.cache.setVc(record.uri, {
            proof: { type: 'SdJwtCompactProof', jwt: 'stale~' },
        } as never);
        const replaced = await buildAccountInventory(wallet, original, 'Credential');
        expect(replaced.entries.map(entry => entry.uri)).toEqual([record.uri]);
        expect(replaced.entries[0].id).toBe(inventory.entries[0].id);
        expect(replaced.retryRequired).toBe(false);
    });

    it('fails closed on an index outage after consent despite populated warm caches', async () => {
        const { wallet: source, inventory, pending, picks } = await setup();
        const { sdk, wallet, record } = await warmWallet(source, true);
        const prepared = await prepareAccountPresentation(wallet, inventory, pending, () => true);
        await sdk.cache.setIndex('LearnCloud', {}, [record]);
        await sdk.cache.setIndexPage('LearnCloud', {}, { records: [record], hasMore: false });
        cloudIndex.mockRejectedValue(new Error('Index unavailable'));
        await expect(prepared.approve(picks)).rejects.toThrow('Index unavailable');
        await expect(buildAccountInventory(wallet, inventory, 'Credential')).rejects.toThrow(
            'Index unavailable'
        );
    });

    it('reads the account inventory, keeps stable opaque IDs and discloses only the requested fields', async () => {
        const { wallet, inventory, pending, picks } = await setup();
        const rebuilt = await buildAccountInventory(wallet, inventory, 'Digital credential');
        expect(rebuilt.entries[0].id).toBe(inventory.entries[0].id);
        wallet.id.did = () => 'did:web:network.example:users:restored-account';
        const aliased = await buildAccountInventory(wallet, inventory, 'Digital credential');
        expect(aliased.owner).toBe(inventory.owner);
        expect(aliased.entries[0].id).toBe(inventory.entries[0].id);
        const metadata = JSON.stringify(inventory.entries.map(entry => entry.projection));
        expect(metadata).not.toContain('encrypted-course');
        expect(metadata).not.toContain('Introduction to');
        expect(inventory.entries[0].projection.claims.map(claim => claim.path[0])).not.toContain(
            'skills'
        );
        const prepared = await prepareAccountPresentation(wallet, inventory, pending, () => true);
        const response = JSON.parse(await prepared.approve(picks));
        const result = await verifyPresentation(
            response.data.vp_token.course_completion[0],
            ORIGIN,
            'account-nonce'
        );
        expect(result.learner_name).toBeUndefined();
        expect(wallet.read.get).toHaveBeenCalledTimes(5);
    });

    it('rejects a selected entry mapped to another account', async () => {
        const { wallet, inventory, pending } = await setup();
        await expect(
            prepareAccountPresentation(
                wallet,
                { ...inventory, owner: 'other-account' },
                pending,
                () => true
            )
        ).rejects.toThrow('Account changed');
    });

    it('rechecks index removal and content changes after consent', async () => {
        const first = await setup();
        const prepared = await prepareAccountPresentation(
            first.wallet,
            first.inventory,
            first.pending,
            () => true
        );
        first.remove();
        await expect(prepared.approve(first.picks)).rejects.toThrow('Credential removed');
        const second = await setup();
        const changed = await prepareAccountPresentation(
            second.wallet,
            second.inventory,
            second.pending,
            () => true
        );
        second.change();
        await expect(changed.approve(second.picks)).rejects.toThrow('Credential changed');
    });

    it('rejects extra/unapproved claims, wrong VCT and an account switch before signing', async () => {
        const { wallet, inventory, pending, picks } = await setup();
        let current = true;
        const prepared = await prepareAccountPresentation(
            wallet,
            inventory,
            pending,
            () => current
        );
        const key = Object.keys(picks.disclose)[0];
        await expect(
            prepared.approve({
                ...picks,
                disclose: { [key]: { ...picks.disclose[key], learner_name: true } },
            })
        ).rejects.toThrow('Required fields');
        await expect(
            prepared.approve({
                ...picks,
                disclose: { [key]: { course_name: true, completion_date: false } },
            })
        ).rejects.toThrow('Required fields');
        current = false;
        await expect(prepared.approve(picks)).rejects.toThrow('Account changed');
        pending.request.data.dcql_query.credentials[0].meta.vct_values = [
            'https://example.com/other',
        ];
        await expect(
            prepareAccountPresentation(wallet, inventory, pending, () => true)
        ).rejects.toThrow('cannot satisfy');
    });
});
