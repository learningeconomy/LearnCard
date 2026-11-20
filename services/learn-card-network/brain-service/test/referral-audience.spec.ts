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

it('leaves an ordinary contract untouched and preserves its add and remove routes', async () => {
    const [owner, current, replacement] = await Promise.all([actor(), actor(), actor()]);
    const contractUri = await owner.contracts.createConsentFlowContract({
        name: 'Ordinary contract',
        contract: normalContract,
        recipients: [current.profileId],
    });
    const snapshot = async () => {
        const contract = await owner.contracts.getConsentFlowContract({ uri: contractUri });
        const { records } = await neogma.queryRunner.run(
            'MATCH (c:ConsentFlowContract {id:$id}) RETURN c.audienceLock AS audienceLock',
            { id: contractUri.split(':').at(-1) }
        );
        return {
            recipients: contract.recipients?.map(p => p.profileId),
            audienceVersion: contract.audienceVersion,
            audienceLock: records[0]?.get('audienceLock'),
        };
    };
    const before = await snapshot();
    expect(before.recipients).toEqual([current.profileId]);

    for (const dryRun of [true, false])
        await expect(
            owner.contracts.reconcileReferralAudience({
                contractUri,
                recipients: [replacement.profileId],
                dryRun,
            })
        ).rejects.toThrow(/Owned referral contract not found/);
    expect(await snapshot()).toEqual(before);

    await owner.contracts.addContractRecipient({
        contractUri,
        recipient: replacement.profileId,
    });
    await owner.contracts.removeContractRecipient({ contractUri, recipient: current.profileId });
    expect((await snapshot()).recipients).toEqual([replacement.profileId]);
}, 60000);

it('preserves retained edges and rejects invalid or stale replacements', async () => {
    const [owner, retained, removed, added] = await Promise.all([
        actor(),
        actor(),
        actor(),
        actor(),
    ]);
    const contractUri = await owner.contracts.createConsentFlowContract({
        name: 'Preserve recipient metadata',
        referralProgram: 'Preserve recipient metadata',
        contract: normalContract,
        recipients: [retained.profileId, removed.profileId],
    });
    const parameters = { id: contractUri.split(':').at(-1), retained: retained.profileId };
    await neogma.queryRunner.run(
        'MATCH (c:ConsentFlowContract {id:$id})-[r:SHARES_DATA_WITH]->(:Profile {profileId:$retained}) SET r.addedAt = "original-time", r.testMarker = "retained-metadata"',
        parameters
    );
    const get = () => owner.contracts.getConsentFlowContract({ uri: contractUri });
    const before = await get();
    const expectedRecipients = [retained.profileId, removed.profileId];
    const missing = 'missing-' + randomBytes(6).toString('hex');
    const invalid = { contractUri, expectedRecipients, recipients: [retained.profileId, missing] };
    // The preview can account for a declared profile even before the CLI creates it.
    expect(await owner.contracts.reconcileReferralAudience(invalid)).toMatchObject({
        changed: true,
        frozen: false,
    });
    await expect(
        owner.contracts.reconcileReferralAudience({ ...invalid, dryRun: false })
    ).rejects.toThrow(/existing profiles/);
    expect((await get()).audienceVersion).toBe(before.audienceVersion);

    const replacement = { contractUri, recipients: [retained.profileId, added.profileId] };
    await expect(
        owner.contracts.reconcileReferralAudience({
            ...replacement,
            expectedRecipients: [retained.profileId],
            dryRun: false,
        })
    ).rejects.toThrow(/audience changed since preview/);
    expect((await get()).audienceVersion).toBe(before.audienceVersion);

    // A disclosure-only audience version bump must not invalidate an unchanged member set.
    await neogma.queryRunner.run(
        'MATCH (c:ConsentFlowContract {id:$id}) SET c.audienceVersion = coalesce(c.audienceVersion, 0) + 1',
        parameters
    );
    await owner.contracts.reconcileReferralAudience({
        ...replacement,
        expectedRecipients,
        dryRun: false,
    });
    const after = await get();
    expect(after.recipients?.map(p => p.profileId).sort()).toEqual(
        [retained.profileId, added.profileId].sort()
    );
    expect(after.audienceVersion).toBe(before.audienceVersion! + 2);
    const { records } = await neogma.queryRunner.run(
        'MATCH (c:ConsentFlowContract {id:$id})-[r:SHARES_DATA_WITH]->(:Profile {profileId:$retained}) RETURN properties(r) AS props',
        parameters
    );
    expect(records[0]?.get('props')).toMatchObject({
        addedAt: 'original-time',
        testMarker: 'retained-metadata',
    });
}, 60000);

it('commits a referral audience and terms together, or leaves both untouched', async () => {
    const [owner, retained, removed, added, writer] = await Promise.all([
        actor(),
        actor(),
        actor(),
        actor(),
        actor(),
    ]);
    const uri = await owner.contracts.createConsentFlowContract({
        name: 'Atomic referral update',
        referralProgram: 'Atomic referral update',
        contract: normalContract,
        recipients: [retained.profileId, removed.profileId],
    });
    const id = uri.split(':').at(-1);
    const snapshot = async () => {
        const contract = await owner.contracts.getConsentFlowContract({ uri });
        const { records } = await neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id:$id})
             RETURN [(c)-[:CAN_WRITE]->(p:Profile) | p.profileId] AS writers,
                 size([(c)-[:HAS_VERSION]->(v:ConsentFlowContractVersion) | v]) AS versions,
                 COUNT { MATCH (:ConsentFlowEvent {contractId:$id, kind:'contract_updated'}) } AS events`,
            { id }
        );
        return {
            version: contract.version,
            audienceVersion: contract.audienceVersion,
            recipients: contract.recipients?.map(p => p.profileId).sort(),
            fields: contract.contract.read.personal,
            writers: records[0]?.get('writers'),
            versions: Number(records[0]?.get('versions')),
            events: Number(records[0]?.get('events')),
        };
    };
    const before = await snapshot();
    expect(before.recipients).toEqual([retained.profileId, removed.profileId].sort());
    const request = {
        uri,
        changes: {
            contract: { read: { personal: { name: { required: true } } } },
            writers: [writer.profileId],
        },
        reason: 'Require the learner name for the referral',
        expectedVersion: before.version,
        referralAudience: {
            recipients: [retained.profileId, added.profileId],
            expectedRecipients: before.recipients!,
            allowReconsent: false,
        },
    };
    await expect(
        owner.contracts.updateConsentFlowContract({ ...request, dryRun: true })
    ).resolves.toMatchObject({ kind: 'requires_consent' });
    await expect(owner.contracts.updateConsentFlowContract(request)).rejects.toThrow(
        /explicit permission/
    );
    expect(await snapshot()).toEqual(before);

    const authorized = {
        ...request,
        referralAudience: { ...request.referralAudience, allowReconsent: true },
    };
    await expect(
        owner.contracts.updateConsentFlowContract({
            ...authorized,
            referralAudience: { ...authorized.referralAudience, expectedRecipients: [] },
        })
    ).rejects.toThrow(/Could not publish the referral update/);
    expect(await snapshot()).toEqual(before);

    const missing = 'missing-' + randomBytes(6).toString('hex');
    await expect(
        owner.contracts.updateConsentFlowContract({
            ...authorized,
            referralAudience: { ...authorized.referralAudience, recipients: [missing] },
        })
    ).rejects.toThrow(/Could not publish the referral update/);
    expect(await snapshot()).toEqual(before);

    await expect(owner.contracts.updateConsentFlowContract(authorized)).resolves.toMatchObject({
        version: before.version! + 1,
        kind: 'requires_consent',
    });
    expect(await snapshot()).toEqual({
        version: before.version! + 1,
        audienceVersion: before.audienceVersion! + 1,
        recipients: [retained.profileId, added.profileId].sort(),
        fields: { name: { required: true } },
        writers: [writer.profileId],
        versions: before.versions + 1,
        events: before.events + 1,
    });
}, 60000);
