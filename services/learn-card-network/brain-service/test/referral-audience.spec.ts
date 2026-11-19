import { randomBytes } from 'node:crypto';
import { expect, it } from 'vitest';
import { neogma } from '@instance';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const actor = async () => {
    const { clients } = await getUser(randomBytes(32).toString('hex'));
    const profileId = 'program-' + randomBytes(6).toString('hex');
    await clients.fullAuth.profile.createProfile({ profileId });
    return { profileId, contracts: clients.fullAuth.contracts };
};

it('serializes program creation and freezes replacement across consent and withdrawal', async () => {
    const [owner, learner, recipient] = await Promise.all([actor(), actor(), actor()]);
    const input = {
        name: 'Example referral',
        referralProgram: 'Example referral',
        contract: normalContract,
    };
    const creates = await Promise.allSettled([
        owner.contracts.createConsentFlowContract(input),
        owner.contracts.createConsentFlowContract(input),
    ]);
    expect(creates.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const contractUri = (
        creates.find(result => result.status === 'fulfilled') as PromiseFulfilledResult<string>
    ).value;
    const change = { contractUri, recipients: [recipient.profileId] };
    const get = () => owner.contracts.getConsentFlowContract({ uri: contractUri });
    expect((await get()).referralProgram).toBe(input.referralProgram);
    await expect(learner.contracts.reconcileReferralAudience(change)).rejects.toThrow();
    expect(await owner.contracts.reconcileReferralAudience(change)).toMatchObject({
        changed: true,
        frozen: false,
    });
    expect((await get()).recipients).toHaveLength(0);
    await owner.contracts.reconcileReferralAudience({ ...change, dryRun: false });
    expect(await owner.contracts.reconcileReferralAudience(change)).toMatchObject({
        changed: false,
    });
    const { termsUri } = await learner.contracts.consentToContract({
        contractUri,
        terms: normalFullTerms,
        audienceVersion: (await get()).audienceVersion,
    });
    const remove = { contractUri, recipients: [], dryRun: false };
    await expect(owner.contracts.reconcileReferralAudience(remove)).rejects.toThrow(/new contract/);
    await learner.contracts.withdrawConsent({ uri: termsUri });
    await expect(owner.contracts.reconcileReferralAudience(remove)).rejects.toThrow(/new contract/);
    expect((await get()).recipients?.map(p => p.profileId)).toEqual([recipient.profileId]);
}, 60000);

it('rejects a listing-owned contract even when the preview would make no changes', async () => {
    const owner = await actor();
    const contractUri = await owner.contracts.createConsentFlowContract({
        name: 'Listing example',
        contract: normalContract,
    });
    await neogma.queryRunner.run(
        'MATCH (c:ConsentFlowContract {id:$id}) CREATE (:AppStoreListing)-[:HAS_CONSENT_CONTRACT]->(c)',
        { id: contractUri.split(':').at(-1) }
    );
    await expect(
        owner.contracts.reconcileReferralAudience({ contractUri, recipients: [] })
    ).rejects.toThrow(/App Store/);
}, 60000);
