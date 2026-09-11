import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { Profile, ConsentFlowContract, ConsentFlowTerms, ConsentFlowTransaction } from '@models';
import { ConsentFlowTermsValidator } from '@learncard/types';
import {
    getContractTermsByUri,
    getTransactionsForTerms,
} from '@accesslayer/consentflowcontract/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { getLearnCard, type SeedLearnCard } from '@helpers/learnCard.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { getClient } from './helpers/getClient';
import { minimalContract, minimalTerms, noTerms } from './helpers/contract';

const DOMAIN = 'localhost%3A3000';
let guardian: SeedLearnCard;
let child: SeedLearnCard;
let owner: SeedLearnCard;
let contractUri: string;

const approve = async (signer = guardian, expiresInSeconds = 300): Promise<string> => {
    // The current UI signs these claims as a DID-auth challenge, without iat.
    const token = await signer.invoke.getDidAuthVp({
        proofFormat: 'jwt',
        challenge: JSON.stringify({
            iss: signer.id.did(),
            sub: getDidWeb(DOMAIN, 'child-user'),
            exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
            scope: 'guardian-approval',
        }),
    });
    if (typeof token !== 'string') throw new Error('Expected a JWT presentation');
    return token;
};

const callerFor = (signer: SeedLearnCard, guardianApproval?: string) =>
    getClient({
        did: signer.id.did(),
        isChallengeValid: true,
        scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
        guardianApproval,
    });

const childCaller = (guardianApproval?: string) => callerFor(child, guardianApproval);

const manageChild = async (): Promise<void> => {
    await Profile.relateTo({
        alias: 'managedBy',
        where: {
            source: { profileId: 'child-user' },
            target: { profileId: 'guardian-user' },
        },
    });
};

const clearConsentState = async (): Promise<void> => {
    await ConsentFlowTransaction.delete({ detach: true, where: {} });
    await ConsentFlowTerms.delete({ detach: true, where: {} });
    await ConsentFlowContract.delete({ detach: true, where: {} });
    await Profile.delete({ detach: true, where: {} });
};

describe('Guardian-approved consent mutations', () => {
    beforeAll(async () => {
        guardian = await getLearnCard('a'.repeat(64));
        child = await getLearnCard('b'.repeat(64));
        owner = await getLearnCard('c'.repeat(64));
    });

    beforeEach(async () => {
        await clearConsentState();
        await callerFor(guardian).profile.createProfile({ profileId: 'guardian-user' });
        await childCaller().profile.createProfile({ profileId: 'child-user' });
        await callerFor(owner).profile.createProfile({ profileId: 'contract-owner' });
        contractUri = await callerFor(owner).contracts.createConsentFlowContract({
            contract: minimalContract,
            name: 'Guardian-approved data access',
        });
    });

    afterAll(clearConsentState);

    it('preserves adult consent without inventing guardian approval', async () => {
        const { termsUri } = await childCaller().contracts.consentToContract({
            contractUri,
            terms: minimalTerms,
        });
        const record = await getContractTermsByUri(termsUri);
        expect(record?.terms.status).toBe('live');
        expect(record?.terms.terms.read.personal).toEqual(minimalTerms.read.personal);
        expect(record?.terms.guardianApproval).toBeUndefined();
    });

    it('does not create consent or an audit transaction without guardian approval', async () => {
        await manageChild();
        await expect(
            childCaller().contracts.consentToContract({ contractUri, terms: minimalTerms })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await ConsentFlowTerms.findMany({ where: {} })).toEqual([]);
        expect(await ConsentFlowTransaction.findMany({ where: {} })).toEqual([]);
    });

    it('records the verified guardian and contract version on consent and permission updates', async () => {
        await manageChild();
        const beforeApproval = Date.now();
        const token = await approve();
        const caller = childCaller(token);
        const { termsUri } = await caller.contracts.consentToContract({
            contractUri,
            terms: minimalTerms,
        });
        const consent = await getContractTermsByUri(termsUri);
        const approval = consent?.terms.guardianApproval;
        expect(consent?.terms.status).toBe('live');
        expect(consent?.terms.terms.read.personal).toEqual(minimalTerms.read.personal);
        expect(approval).toEqual({
            guardianProfileId: 'guardian-user',
            guardianDid: guardian.id.did(),
            approvedAt: expect.any(String),
            contractUpdatedAt: consent?.contract.updatedAt,
        });
        expect(Date.parse(approval!.approvedAt)).toBeGreaterThanOrEqual(beforeApproval);
        expect(Date.parse(approval!.approvedAt)).toBeLessThanOrEqual(Date.now());
        const consentTransactions = await getTransactionsForTerms(consent!.terms.id, { limit: 10 });
        expect(consentTransactions).toEqual([
            expect.objectContaining({ action: 'consent', guardianApproval: approval }),
        ]);

        await caller.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: ConsentFlowTermsValidator.parse({}),
        });
        const updated = await getContractTermsByUri(termsUri);
        const providerData = await callerFor(owner).contracts.getConsentedDataForDid({
            did: child.id.did(),
        });
        expect(providerData.records).toEqual([
            expect.objectContaining({
                termsUri,
                personal: {},
                credentials: [],
                guardian: expect.objectContaining({ required: true, approved: true }),
            }),
        ]);
        expect(updated?.terms.guardianApproval).toMatchObject({
            guardianProfileId: 'guardian-user',
            guardianDid: guardian.id.did(),
            contractUpdatedAt: updated?.contract.updatedAt,
        });
        const transactions = await getTransactionsForTerms(updated!.terms.id, { limit: 10 });
        expect(transactions).toHaveLength(2);
        expect(transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ action: 'consent', guardianApproval: approval }),
                expect.objectContaining({
                    action: 'update',
                    guardianApproval: updated?.terms.guardianApproval,
                }),
            ])
        );
    });

    it('leaves consent unchanged when the approval window has expired', async () => {
        await manageChild();
        const { termsUri } = await childCaller(await approve()).contracts.consentToContract({
            contractUri,
            terms: minimalTerms,
        });
        const before = await getContractTermsByUri(termsUri);
        await expect(
            childCaller(await approve(guardian, -1)).contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: noTerms,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await getContractTermsByUri(termsUri))?.terms).toEqual(before?.terms);
        const transactions = await getTransactionsForTerms(before!.terms.id, { limit: 10 });
        expect(transactions).toHaveLength(1);
    });

    it('requires a current authorized manager, not another valid presentation signer', async () => {
        await manageChild();
        await expect(
            childCaller(await approve(owner)).contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await ConsentFlowTerms.findMany({ where: {} })).toEqual([]);
    });

    it('requires a new guardian-confirmed update for legacy managed consent', async () => {
        const { termsUri } = await childCaller().contracts.consentToContract({
            contractUri,
            terms: minimalTerms,
        });
        await manageChild();
        await expect(
            childCaller().contracts.updateConsentedContractTerms({ uri: termsUri, terms: noTerms })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        const legacy = await getContractTermsByUri(termsUri);
        expect(legacy?.terms.terms.read.personal).toEqual(minimalTerms.read.personal);
        expect(legacy?.terms.guardianApproval).toBeUndefined();

        await childCaller(await approve()).contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: noTerms,
        });
        const approved = await getContractTermsByUri(termsUri);
        expect(approved?.terms.terms.read.personal?.name).toBeUndefined();
        expect(approved?.terms.guardianApproval?.guardianProfileId).toBe('guardian-user');
        const transactions = await getTransactionsForTerms(approved!.terms.id, { limit: 10 });
        expect(
            transactions.find(transaction => transaction.action === 'consent')?.guardianApproval
        ).toBeUndefined();
        expect(
            transactions.find(transaction => transaction.action === 'update')?.guardianApproval
        ).toEqual(approved?.terms.guardianApproval);
    });

    it('cannot downgrade historical child consent when its last manager is removed', async () => {
        await manageChild();
        const { termsUri } = await childCaller(await approve()).contracts.consentToContract({
            contractUri,
            terms: minimalTerms,
        });
        const before = await getContractTermsByUri(termsUri);
        await Profile.delete({ detach: true, where: { profileId: 'guardian-user' } });
        await expect(
            childCaller().contracts.updateConsentedContractTerms({ uri: termsUri, terms: noTerms })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await getContractTermsByUri(termsUri))?.terms).toEqual(before?.terms);

        await childCaller().contracts.withdrawConsent({ uri: termsUri });
        await expect(
            childCaller().contracts.consentToContract({ contractUri, terms: noTerms })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await getContractTermsByUri(termsUri))?.terms.status).toBe('withdrawn');
    });
});
