import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ConsentFlowContractValidator, type VP } from '@learncard/types';
import { neogma } from '@instance';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createProfile } from '@accesslayer/profile/create';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import { governConsentContract } from '@accesslayer/consentflowcontract/governance';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { CONSENT_WORKFLOW_ID } from '@helpers/consent-exchange.helpers';
import { getClient } from './helpers/getClient';
import { signDidAuth } from './helpers/did-auth';

const client = getClient();

const setup = async (governed = true) => {
    const id = randomUUID();
    const ownerId = `owner-${id}`;
    await createProfile({
        profileId: ownerId,
        did: `did:key:z6MkConsentOwner${id.replace(/-/g, '')}`,
        displayName: 'Owner',
    } as Parameters<typeof createProfile>[0]);
    const ecosystem = await createEcosystem({
        name: 'Demo District',
        slug: `district-${id}`,
        ownerProfileId: ownerId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const contract = await createConsentFlowContract({
        contract: ConsentFlowContractValidator.parse({
            read: { anonymize: false },
            write: { credentials: { categories: { Achievement: { required: true } } } },
        }),
        ownerProfileId: ownerId,
        name: 'Demo District data sharing',
    });
    if (governed) {
        await governConsentContract({
            ecosystemId: ecosystem.id,
            contractId: contract.id,
            actorProfileId: ownerId,
            agreement: 'institutional-data-sharing',
            grant: {
                apiVersion: 'lc.consent-grant/v1',
                grants: [
                    {
                        capability: 'record-provisioning',
                        operation: 'read',
                        scopes: [`completion:ingest:tree:${ecosystem.id}`],
                        selectors: { ecosystemIds: [ecosystem.id] },
                        tiers: ['credential-body'],
                        purpose: 'Course completions for credential issuance.',
                    },
                ],
            },
        });
    }

    // The learner's own wallet: a seed-keyed LearnCard whose did:key backs their Profile.
    const wallet = await getLearnCard(randomBytes(32).toString('hex'));
    const learnerId = `learner-${id}`;
    await createProfile({
        profileId: learnerId,
        did: wallet.id.did(),
        displayName: 'Learner',
    } as Parameters<typeof createProfile>[0]);

    return { contract, wallet, learnerId };
};

const participate = (exchangeId: string, verifiablePresentation?: VP) =>
    client.workflows.participateInExchange({
        localWorkflowId: CONSENT_WORKFLOW_ID,
        localExchangeId: exchangeId,
        verifiablePresentation,
    });

const learnerTerms = async (learnerId: string, contractId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile {profileId: $learnerId})-[:CREATED_BY]->(t:ConsentFlowTerms)
               -[:CONSENTS_TO]->(:ConsentFlowContract {id: $contractId})
         RETURN t.status AS status`,
        { learnerId, contractId }
    );
    return result.records.map(row => String(row.get('status')));
};

describe('EducationOS consent exchange (VC-API, any wallet)', () => {
    it('records real ConsentFlow consent for the wallet that proves its DID', async () => {
        const { contract, wallet, learnerId } = await setup();
        const { exchangeId, exchangeUrl, statusToken } =
            await client.workflows.startConsentExchange({ contractId: contract.id });
        expect(exchangeUrl).toContain(`/workflows/${CONSENT_WORKFLOW_ID}/exchanges/${exchangeId}`);
        expect(
            await client.workflows.consentExchangeStatus({ exchangeId, statusToken })
        ).toMatchObject({ status: 'PENDING' });
        // Without the starter's token the status reveals nothing.
        expect(
            await client.workflows.consentExchangeStatus({ exchangeId, statusToken: 'guess' })
        ).toEqual({ status: 'EXPIRED' });

        const request = await participate(exchangeId);
        const challenge = request.verifiablePresentationRequest?.challenge;
        expect(challenge).toContain(exchangeId);
        const vp = await signDidAuth(wallet, challenge!);

        expect(await participate(exchangeId, vp)).toEqual({});
        expect(await learnerTerms(learnerId, contract.id)).toEqual(['live']);
        expect(
            await client.workflows.consentExchangeStatus({ exchangeId, statusToken })
        ).toMatchObject({ status: 'COMPLETED', holderDid: wallet.id.did() });

        // Single use: the same presentation cannot be replayed.
        await expect(participate(exchangeId, vp)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rejects a presentation for a different challenge and records nothing', async () => {
        const { contract, wallet, learnerId } = await setup();
        const { exchangeId } = await client.workflows.startConsentExchange({
            contractId: contract.id,
        });
        await participate(exchangeId);
        const vp = await signDidAuth(wallet, `${exchangeId}:not-the-challenge`);

        await expect(participate(exchangeId, vp)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(await learnerTerms(learnerId, contract.id)).toEqual([]);
    });

    it('only serves agreements an ecosystem governs', async () => {
        const { contract } = await setup(false);
        await expect(
            client.workflows.startConsentExchange({ contractId: contract.id })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('never records consent for a holder who did not sign the presentation', async () => {
        const { contract, wallet, learnerId } = await setup();
        const { exchangeId } = await client.workflows.startConsentExchange({
            contractId: contract.id,
        });
        const challenge = (await participate(exchangeId)).verifiablePresentationRequest!.challenge;
        const attacker = await getLearnCard(randomBytes(32).toString('hex'));
        const forged = { ...(await signDidAuth(attacker, challenge)), holder: wallet.id.did() };

        await expect(participate(exchangeId, forged)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect(await learnerTerms(learnerId, contract.id)).toEqual([]);
    });

    it('lets only the first presentation claim an exchange', async () => {
        const { contract, wallet, learnerId } = await setup();
        const other = await getLearnCard(randomBytes(32).toString('hex'));
        const otherId = `other-${randomUUID()}`;
        await createProfile({
            profileId: otherId,
            did: other.id.did(),
            displayName: 'Other learner',
        } as Parameters<typeof createProfile>[0]);
        const { exchangeId } = await client.workflows.startConsentExchange({
            contractId: contract.id,
        });
        const challenge = (await participate(exchangeId)).verifiablePresentationRequest!.challenge;
        const [mine, theirs] = [
            await signDidAuth(wallet, challenge),
            await signDidAuth(other, challenge),
        ];
        const results = await Promise.allSettled([
            participate(exchangeId, mine),
            participate(exchangeId, theirs),
        ]);

        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        const recorded = [
            ...(await learnerTerms(learnerId, contract.id)),
            ...(await learnerTerms(otherId, contract.id)),
        ];
        expect(recorded).toEqual(['live']);
    });
});
