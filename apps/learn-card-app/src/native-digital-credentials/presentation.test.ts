import { describe, expect, it, vi } from 'vitest';
import { parseSdJwtVc, presentSdJwtVc } from '@learncard/sd-jwt-vc-plugin';
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
