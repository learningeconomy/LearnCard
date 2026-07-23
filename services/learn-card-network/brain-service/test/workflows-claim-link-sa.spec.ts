import { describe, beforeAll, beforeEach, afterAll, it, expect, vi } from 'vitest';

// The IS_TEST_ENVIRONMENT mock issuance path resolves the server LearnCard from
// process.env.SEED — make sure one is set regardless of local .env presence
process.env.SEED ||= 'a'.repeat(64);
import base64url from 'base64url';
import type { VP } from '@learncard/types';

import { getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { seedListedApp } from './helpers/app-store.helpers';
import { associateListingWithSigningAuthority } from '@accesslayer/app-store-listing/relationships/create';
import {
    Profile,
    Boost,
    Credential,
    SigningAuthority,
    AppStoreListing,
    Integration,
} from '@models';
import { getAppDidWeb } from '@helpers/did.helpers';

// Partially mock the SA helpers so we can assert the arguments the claim
// workflow passes to issueCredentialWithSigningAuthority (behavior is
// preserved — the real implementation short-circuits in test environments).
vi.mock('@helpers/signingAuthority.helpers', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('@helpers/signingAuthority.helpers');

    return {
        ...actual,
        issueCredentialWithSigningAuthority: vi.fn(actual.issueCredentialWithSigningAuthority),
    };
});

import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';

const issueSpy = issueCredentialWithSigningAuthority as ReturnType<typeof vi.fn>;

const SA_ENDPOINT = 'http://localhost:5000/api';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('VC-API claim workflow signing authority resolution', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        issueSpy.mockClear();

        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
    });

    const claimBoostViaExchange = async (saName: string, challenge: string) => {
        const uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        await userA.clients.fullAuth.boost.generateClaimLink({
            boostUri: uri,
            challenge,
            claimLinkSA: { endpoint: SA_ENDPOINT, name: saName },
        });

        const localExchangeId = base64url.encode(JSON.stringify({ boostUri: uri, challenge }));

        const initiation = await userB.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'claim',
            localExchangeId,
        });

        const vpr = initiation.verifiablePresentationRequest;
        expect(vpr).toBeDefined();

        const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
            challenge: vpr!.challenge,
            domain: vpr!.domain,
        })) as VP;

        const result = await userB.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'claim',
            localExchangeId,
            verifiablePresentation: didAuthVp,
        });

        return { result, domain: vpr!.domain };
    };

    it('passes the app did:web as ownerDidOverride when the claim link SA is app-owned', async () => {
        const saName = 'app-test3';
        const saDid = userA.learnCard.id.did();

        await userA.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: SA_ENDPOINT,
            name: saName,
            did: saDid,
        });

        const { listing } = await seedListedApp('usera', { slug: 'test3' });

        await associateListingWithSigningAuthority(listing.listing_id, SA_ENDPOINT, {
            name: saName,
            did: saDid,
            isPrimary: true,
        });

        const { result, domain } = await claimBoostViaExchange(saName, 'app-sa-challenge');

        expect(result.verifiablePresentation).toBeDefined();
        expect(issueSpy).toHaveBeenCalledTimes(1);

        // 6th argument is ownerDidOverride — must be the app's did:web, because
        // the LCA-API keys app-owned SAs by the app DID, not the user DID
        expect(issueSpy.mock.calls[0]![5]).toEqual(getAppDidWeb(domain, 'test3'));
    });

    it('passes no ownerDidOverride when the claim link SA is user-owned', async () => {
        const saName = 'mysa';

        await userA.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: SA_ENDPOINT,
            name: saName,
            did: userA.learnCard.id.did(),
        });

        const { result } = await claimBoostViaExchange(saName, 'user-sa-challenge');

        expect(result.verifiablePresentation).toBeDefined();
        expect(issueSpy).toHaveBeenCalledTimes(1);
        expect(issueSpy.mock.calls[0]![5]).toBeUndefined();
    });

    it('surfaces the underlying issuance error when the exchange fails', async () => {
        const saName = 'mysa';

        await userA.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: SA_ENDPOINT,
            name: saName,
            did: userA.learnCard.id.did(),
        });

        issueSpy.mockRejectedValueOnce(new Error('LCA-API returned 500'));

        await expect(claimBoostViaExchange(saName, 'error-detail-challenge')).rejects.toMatchObject(
            {
                code: 'INTERNAL_SERVER_ERROR',
                message: expect.stringContaining('LCA-API returned 500'),
            }
        );
    });
});
