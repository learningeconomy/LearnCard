import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { environment } from '@environment';
import { ConsentFlowTerms } from '@models';
import { neogma } from '@instance';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { getContractTermsForProfile } from '@accesslayer/consentflowcontract/relationships/read';
import { getContractDetailsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { uploadSmartResume } from '@helpers/smartResume.helpers';

vi.mock('@helpers/smartResume.helpers', () => ({ uploadSmartResume: vi.fn() }));
const upload = vi.mocked(uploadSmartResume);

describe('SmartResume consent before publication', () => {
    let owner: Awaited<ReturnType<typeof getUser>>;
    let learner: Awaited<ReturnType<typeof getUser>>;
    let recipient: Awaited<ReturnType<typeof getUser>>;
    let contractUri: string;
    let recipientId: string;
    const originalUri = environment.SMART_RESUME_CONTRACT_URI;
    beforeEach(async () => {
        upload.mockReset().mockResolvedValue('https://example.com/resume');
        [owner, learner, recipient] = await Promise.all([
            getUser(randomBytes(32).toString('hex')),
            getUser(randomBytes(32).toString('hex')),
            getUser(randomBytes(32).toString('hex')),
        ]);
        for (const [i, actor] of [owner, learner, recipient].entries())
            await actor.clients.fullAuth.profile.createProfile({
                profileId: `resume-${i}-${randomBytes(5).toString('hex')}`,
            });
        recipientId = (await recipient.clients.fullAuth.profile.getProfile())!.profileId;
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic SmartResume',
            contract: normalContract,
            recipients: [recipientId],
        });
        environment.SMART_RESUME_CONTRACT_URI = contractUri;
    });
    afterEach(() => {
        environment.SMART_RESUME_CONTRACT_URI = originalUri;
    });
    const accept = (overrides: Record<string, unknown> = {}) =>
        learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: 1,
            recipientToken: 'synthetic-recipient-token',
            ...overrides,
        });
    const savedTerms = async () => {
        const details = (await getContractDetailsByUri(contractUri))!;
        return getContractTermsForProfile(
            (await learner.clients.fullAuth.profile.getProfile())!,
            details.contract
        );
    };

    it.each([undefined, 0])(
        'does not publish a rejected audience version %s',
        async audienceVersion => {
            await expect(accept({ audienceVersion })).rejects.toMatchObject({ code: 'CONFLICT' });
            expect(upload).not.toHaveBeenCalled();
            expect(await savedTerms()).toBeFalsy();
        }
    );
    it('commits consent before calling the external uploader and caches a completed retry', async () => {
        upload.mockImplementationOnce(async terms => {
            expect((await savedTerms())?.status).toBe('live');
            expect(terms).toEqual(normalFullTerms);
            return 'https://example.com/resume';
        });
        const result = await accept();
        expect(await accept()).toEqual(result);
        expect(upload).toHaveBeenCalledTimes(1);
        expect((await savedTerms())?.smartResumePublicationStatus).toBe('succeeded');
    });
    it('retains consent on upload failure and retries the same decision without consenting again', async () => {
        upload.mockRejectedValueOnce(new Error('Synthetic upstream outage'));
        await expect(accept()).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        const failed = (await savedTerms())!;
        expect(failed.status).toBe('live');
        expect(failed.smartResumePublicationStatus).toBe('failed');
        await expect(accept({ recipientToken: 'different-token' })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        const result = await accept();
        expect(result.termsUri).toContain(failed.id);
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: result.termsUri,
        });
        expect(history.records).toHaveLength(1);
        expect(upload).toHaveBeenCalledTimes(2);
    });
    it('rejects a failed-upload retry after the audience changes', async () => {
        upload.mockRejectedValueOnce(new Error('Synthetic upstream outage'));
        await expect(accept()).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri,
            recipient: recipientId,
        });
        await expect(accept()).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(upload).toHaveBeenCalledTimes(1);
    });
    it('rejects an audience removal between reading the contract and committing consent', async () => {
        const reads = await import('@accesslayer/consentflowcontract/relationships/read');
        const original = reads.getContractDetailsByUri;
        const spy = vi.spyOn(reads, 'getContractDetailsByUri').mockImplementationOnce(async uri => {
            const details = await original(uri);
            await owner.clients.fullAuth.contracts.removeContractRecipient({
                contractUri,
                recipient: recipientId,
            });
            return details;
        });
        try {
            await expect(accept()).rejects.toMatchObject({ code: 'CONFLICT' });
            expect(upload).not.toHaveBeenCalled();
            expect(await savedTerms()).toBeFalsy();
        } finally {
            spy.mockRestore();
        }
    });
    it('recovers a publication lease left behind by an interrupted process', async () => {
        upload.mockRejectedValueOnce(new Error('Synthetic outage'));
        await expect(accept()).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        const terms = (await savedTerms())!;
        await ConsentFlowTerms.update(
            { smartResumePublicationStatus: 'sending', smartResumeLeaseUntil: Date.now() - 1 },
            { where: { id: terms.id } }
        );
        await expect(accept()).resolves.toHaveProperty('redirectUrl', 'https://example.com/resume');
        expect(upload).toHaveBeenCalledTimes(2);
    });

    it('ties a referral upload retry to the accepted invitation', async () => {
        const profileId = (await learner.clients.fullAuth.profile.getProfile())!.profileId;
        await owner.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: profileId,
        });
        const invitation = (await owner.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: profileId,
        }))!;
        upload.mockRejectedValueOnce(new Error('Synthetic outage'));
        await expect(accept({ expectedRequestId: invitation.requestId })).rejects.toMatchObject({
            code: 'BAD_GATEWAY',
        });
        await expect(accept({ expectedRequestId: 'different-invitation' })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expect(accept({ expectedRequestId: invitation.requestId })).resolves.toHaveProperty(
            'redirectUrl'
        );
        await neogma.queryRunner.run(
            'MATCH (c:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile {profileId: $profileId}) SET r.requestId = $replacement',
            {
                contractId: contractUri.split(':').at(-1),
                profileId,
                replacement: 'replacement-invitation',
            }
        );
        await expect(accept({ expectedRequestId: invitation.requestId })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(upload).toHaveBeenCalledTimes(2);
    });

    it('allows only one uploader while a publication is in flight', async () => {
        let release!: () => void;
        let started!: () => void;
        const entered = new Promise<void>(resolve => {
            started = resolve;
        });
        upload.mockImplementationOnce(async () => {
            started();
            await new Promise<void>(resolve => {
                release = resolve;
            });
            return 'https://example.com/resume';
        });
        const first = accept();
        await entered;
        await expect(accept()).rejects.toMatchObject({ code: 'CONFLICT' });
        release();
        await first;
        expect(upload).toHaveBeenCalledTimes(1);
    });
    it('retries a one-time upload without creating a second consent', async () => {
        upload.mockRejectedValueOnce(new Error('Synthetic outage'));
        await expect(accept({ oneTime: true })).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        const result = await accept({ oneTime: true });
        expect((await savedTerms())?.status).toBe('stale');
        expect(
            (
                await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
                    uri: result.termsUri,
                })
            ).records
        ).toHaveLength(1);
    });
    it('allows a new one-time decision after a completed one-time upload', async () => {
        const first = await accept({ oneTime: true });
        const terms = structuredClone(normalFullTerms);
        terms.read.personal.name = 'Updated synthetic name';
        const second = await accept({ oneTime: true, terms });
        expect(second.termsUri).toBe(first.termsUri);
        expect(upload).toHaveBeenCalledTimes(2);
        expect(
            (
                await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
                    uri: second.termsUri,
                })
            ).records
        ).toHaveLength(2);
    });

    it('does not publish a retry after terms were changed or expired', async () => {
        upload.mockRejectedValueOnce(new Error('Synthetic outage'));
        await expect(accept()).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        const terms = (await savedTerms())!;
        await ConsentFlowTerms.update({ mutationVersion: 1 }, { where: { id: terms.id } });
        await expect(accept()).rejects.toMatchObject({ code: 'CONFLICT' });
        await ConsentFlowTerms.update(
            { mutationVersion: 0, expiresAt: '2000-01-01T00:00:00Z' },
            { where: { id: terms.id } }
        );
        await expect(accept()).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(upload).toHaveBeenCalledTimes(1);
    });
});
