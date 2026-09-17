import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { UnsignedVC, VP } from '@learncard/types';
const mocks = vi.hoisted(() => ({ sign: vi.fn(), verify: vi.fn() }));
vi.mock('@helpers/signingAuthority.helpers', async original => ({
    ...(await original<Record<string, unknown>>()),
    issueCredentialWithSigningAuthority: mocks.sign,
}));
// This suite tests DB races and lifecycle; real-signing E2E covers authority transport/proofs.
vi.mock('@helpers/credential-refresh-proof.helpers', () => ({
    verifyManagedRefreshProof: mocks.verify,
}));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: vi.fn() }),
}));
vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({ isTrusted: async () => true }),
}));
import { neogma } from '@instance';
import { getUser, getClient } from './helpers/getClient';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { verifyContactMethod } from '@accesslayer/contact-method/update';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import {
    updateInboxCredential,
    expireInboxCredentials,
} from '@accesslayer/inbox-credential/update';
import { getCredentialRefresh, getCredentialRefreshHead } from '@accesslayer/credential-refresh';
import { finalizeInboxRefresh } from '@helpers/inbox-refresh.helpers';
import { decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import * as notifications from '@helpers/notifications.helpers';

const DOMAIN = 'localhost%3A3000';
const SA = { endpoint: 'https://sa.example.com', name: 'inbox-refresh' };
let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let stranger: Awaited<ReturnType<typeof getUser>>;
const template = (): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    name: 'Provisional Results',
    issuer: 'did:web:localhost%3A3000:users:inbox-refresh-issuer',
    credentialSubject: {},
});
const issue = (overrides = {}) =>
    issuer.clients.fullAuth.inbox.issue({
        recipient: { type: 'email', value: 'unknown@example.com' },
        credential: template(),
        refresh: true,
        configuration: { signingAuthority: SA, delivery: { suppress: true } },
        ...overrides,
    });
const queue = async (
    issued: Awaited<ReturnType<typeof issue>>,
    name: string,
    idempotencyKey?: string
) => {
    const inbox = (await getInboxCredentialById(issued.issuanceId))!;
    const body = JSON.parse(await decryptInboxCredential(inbox.credential));
    return issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        refreshId: issued.refresh!.refreshId,
        mode: 'signing-authority',
        credential: { ...body, name },
        signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
        idempotencyKey,
    });
};
const claim = async (issued: Awaited<ReturnType<typeof issue>>) =>
    finalizeInboxRefresh({
        inboxId: issued.issuanceId,
        holderDid: holder.learnCard.id.did(),
        holderProfile: await getProfileByProfileId('inbox-refresh-holder'),
        domain: DOMAIN,
    });
const replay = (refreshId: string, idempotencyKey: string) =>
    issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        mode: 'signing-authority',
        refreshId,
        credential: template(),
        signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
        idempotencyKey,
    });

beforeAll(async () => {
    issuer = await getUser('e'.repeat(64));
    holder = await getUser('9'.repeat(64));
    stranger = await getUser('1'.repeat(64));
    vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue();
});
beforeEach(async () => {
    // @instance is the isolated Testcontainers database, never the user's local demo stack.
    await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
    await issuer.clients.fullAuth.profile.createProfile({ profileId: 'inbox-refresh-issuer' });
    await holder.clients.fullAuth.profile.createProfile({ profileId: 'inbox-refresh-holder' });
    await stranger.clients.fullAuth.profile.createProfile({ profileId: 'inbox-refresh-stranger' });
    await issuer.clients.fullAuth.profile.registerSigningAuthority({
        ...SA,
        did: issuer.learnCard.id.did(),
    });
    mocks.sign.mockReset();
    mocks.verify.mockReset();
    mocks.sign.mockImplementation(async (_owner, body) => ({
        kind: 'issued-credential',
        credential: {
            ...body,
            proof: {
                type: 'DataIntegrityProof',
                cryptosuite: 'eddsa-rdfc-2022',
                proofValue: 'test',
                created: new Date().toISOString(),
                proofPurpose: 'assertionMethod',
                verificationMethod: issuer.learnCard.id.did(),
            },
        },
        statusEntries: [],
    }));
});

describe('managed Universal Inbox refresh', () => {
    it.each(['email', 'phone'] as const)(
        'allocates for unknown %s, claims latest, then publishes normally',
        async type => {
            const issued = await issue({
                recipient: {
                    type,
                    value: type === 'email' ? 'unknown@example.com' : '+12025550123',
                },
            });
            expect(issued.status).toBe('PENDING');
            expect(issued.refresh?.holderDid).toBeUndefined();
            expect(mocks.sign).not.toHaveBeenCalled();
            const id = issued.refresh!.refreshId;
            expect(await getCredentialRefresh(id)).toMatchObject({
                state: 'pending_holder',
                currentVersion: 1,
            });
            expect((await getInboxCredentialById(issued.issuanceId))?.credential).toMatch(
                /^lc-inbox-jwe:v1:/
            );
            expect(await getCredentialRefreshHead(id)).toBeNull();
            expect(await queue(issued, 'Review complete', 'update-1')).toMatchObject({
                version: 2,
                notification: 'not-applicable',
            });
            expect(await queue(issued, 'Final grade A', 'update-2')).toMatchObject({ version: 3 });
            const delivered = await claim(issued);
            expect(delivered.credential.name).toBe('Final grade A');
            expect(delivered.credential.refreshService).toMatchObject({
                id: issued.refresh!.refreshService.id,
            });
            expect(await getCredentialRefresh(id)).toMatchObject({
                state: 'active',
                currentVersion: 3,
                holderDid: holder.learnCard.id.did(),
            });
            expect((await getInboxCredentialById(issued.issuanceId))?.credential).toBeUndefined();
            const head = (await getCredentialRefreshHead(id))!;
            expect(head.version).toBe(3);
            expect(
                await holder.learnCard.invoke.decryptDagJwe(JSON.parse(head.credential))
            ).toMatchObject({ name: 'Final grade A' });
            const issuerRead = await issuer.learnCard.invoke
                .decryptDagJwe(JSON.parse(head.credential))
                .catch(() => null);
            expect(issuerRead).toBeFalsy();
            const published =
                await issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'signing-authority',
                    refreshId: id,
                    credential: {
                        ...delivered.credential,
                        proof: undefined,
                        name: 'Final grade A with honors',
                    },
                    signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
                    idempotencyKey: 'after-claim',
                });
            expect(published.version).toBe(4);
            expect(await replay(id, 'update-1')).toMatchObject({ version: 2 });
            const history =
                await issuer.clients.fullAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: id,
                });
            expect(history.records.map(v => v.version)).toEqual([4, 3, 2, 1]);
        }
    );
    it('reuses one issuance/allocation and rejects a changed keyed request', async () => {
        const first = await issue({ idempotencyKey: 'issue-key' });
        expect(await issue({ idempotencyKey: 'issue-key' })).toEqual(first);
        await expect(
            issue({ idempotencyKey: 'issue-key', credential: { ...template(), name: 'Different' } })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(
            Number(
                (
                    await neogma.queryRunner.run(
                        'MATCH (ic:InboxCredential) RETURN count(ic) AS count'
                    )
                ).records[0]?.get('count')
            )
        ).toBe(1);
    });
    it('re-signs latest content when publication wins during claim', async () => {
        const issued = await issue();
        mocks.sign.mockImplementationOnce(async (_owner, body) => {
            await queue(issued, 'Published while signing', 'racing-update');
            return {
                kind: 'issued-credential',
                credential: {
                    ...body,
                    proof: {
                        type: 'test',
                        created: new Date().toISOString(),
                        proofPurpose: 'assertionMethod',
                        verificationMethod: issuer.learnCard.id.did(),
                    },
                },
                statusEntries: [],
            };
        });
        expect((await claim(issued)).credential.name).toBe('Published while signing');
        expect(mocks.sign).toHaveBeenCalledTimes(2);
    });
    it('binds only one claimant and refuses guardian-gated or expired claims', async () => {
        const issued = await issue();
        await updateInboxCredential(issued.issuanceId, { guardianStatus: 'AWAITING_GUARDIAN' });
        await expect(claim(issued)).rejects.toMatchObject({ code: 'CONFLICT' });
        await updateInboxCredential(issued.issuanceId, { guardianStatus: 'GUARDIAN_APPROVED' });
        const results = await Promise.allSettled([
            claim(issued),
            finalizeInboxRefresh({
                inboxId: issued.issuanceId,
                holderDid: stranger.learnCard.id.did(),
                holderProfile: await getProfileByProfileId('inbox-refresh-stranger'),
                domain: DOMAIN,
            }),
        ]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        const expired = await issue({ recipient: { type: 'email', value: 'expired@example.com' } });
        await updateInboxCredential(expired.issuanceId, { expiresAt: '2000-01-01T00:00:00.000Z' });
        await expect(claim(expired)).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(queue(expired, 'Too late')).rejects.toMatchObject({ code: 'CONFLICT' });
        await expireInboxCredentials();
        expect((await getInboxCredentialById(expired.issuanceId))?.credential).toBeUndefined();
    });
    it('supports the profile finalize route and exposes a bound receipt to the issuer', async () => {
        const issued = await issue();
        await queue(issued, 'Latest at profile claim');
        const contact = (await getContactMethodByValue('email', 'unknown@example.com'))!;
        await createProfileContactMethodRelationship('inbox-refresh-holder', contact.id);
        await verifyContactMethod(contact.id);
        await updateInboxCredential(issued.issuanceId, { isAccepted: true });
        const result = await holder.clients.fullAuth.inbox.finalize({});
        expect(result).toMatchObject({ claimed: 1, errors: 0 });
        expect(result.verifiableCredentials[0]?.name).toBe('Latest at profile claim');
        const metadata = await issuer.clients.fullAuth.inbox.getInboxCredential({
            credentialId: issued.issuanceId,
        });
        expect(metadata.refresh?.holderDid).toBe(holder.learnCard.id.did());
    });

    it('supports the claim-link exchange with the newest pending version', async () => {
        const issued = await issue();
        await queue(issued, 'Latest at link claim');
        const localExchangeId = new URL(issued.claimUrl!).pathname.split('/').pop()!;
        const start = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const vp = (await holder.learnCard.invoke.getDidAuthVp({
            challenge: start.verifiablePresentationRequest?.challenge,
            domain: start.verifiablePresentationRequest?.domain,
        })) as VP;
        const result = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });
        expect(result.verifiablePresentation?.verifiableCredential?.[0]).toMatchObject({
            name: 'Latest at link claim',
        });
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.state).toBe('active');
    });

    it('auto-delivers to a verified existing recipient with refresh enabled', async () => {
        await holder.clients.fullAuth.contactMethods.addContactMethod({
            type: 'email',
            value: 'known@example.com',
        });
        await verifyContactMethod(
            (await getContactMethodByValue('email', 'known@example.com'))!.id
        );
        const issued = await issue({ recipient: { type: 'email', value: 'known@example.com' } });
        expect(issued).toMatchObject({
            status: 'ISSUED',
            recipientDid: holder.learnCard.id.did(),
            refresh: { holderDid: holder.learnCard.id.did() },
        });
        expect((await getInboxCredentialById(issued.issuanceId))?.credential).toBeUndefined();
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.state).toBe(
            'awaiting_claim'
        );
    });

    it('routes unified send to the same inbox lifecycle and reuses its boost on retry', async () => {
        await issuer.clients.fullAuth.profile.setPrimarySigningAuthority(SA);
        const input = {
            type: 'boost' as const,
            recipient: 'unknown@example.com',
            template: { credential: template() },
            refresh: true,
            idempotencyKey: 'unified-key',
            options: { suppressDelivery: true },
        };
        const first = await issuer.clients.fullAuth.boost.send(input);
        expect(first.inbox?.refresh?.refreshId).toBeTruthy();
        expect(await issuer.clients.fullAuth.boost.send(input)).toEqual(first);
        expect(
            Number(
                (
                    await neogma.queryRunner.run('MATCH (b:Boost) RETURN count(b) AS count')
                ).records[0]?.get('count')
            )
        ).toBe(1);
        await expect(
            issuer.clients.fullAuth.boost.send({ ...input, recipient: 'different@example.com' })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('retains escrow when signing fails and can retry the same claim', async () => {
        const issued = await issue();
        mocks.sign.mockRejectedValueOnce(new Error('Authority unavailable'));
        await expect(claim(issued)).rejects.toThrow('Authority unavailable');
        expect((await getInboxCredentialById(issued.issuanceId))?.credential).toMatch(
            /^lc-inbox-jwe:v1:/
        );
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.holderDid).toBeUndefined();
        expect((await claim(issued)).credential.name).toBe('Provisional Results');
    });

    it('keeps concurrent issue retries on a single aggregate and inbox record', async () => {
        const results = await Promise.all([
            issue({ idempotencyKey: 'concurrent' }),
            issue({ idempotencyKey: 'concurrent' }),
        ]);
        expect(results[0].issuanceId).toBe(results[1].issuanceId);
        expect(results[0].refresh).toEqual(results[1].refresh);
        expect(
            Number(
                (
                    await neogma.queryRunner.run(
                        'MATCH (r:CredentialRefresh) RETURN count(r) AS count'
                    )
                ).records[0]?.get('count')
            )
        ).toBe(1);
    });

    it('returns a valid allocation receipt for VC1 without status entries', async () => {
        const issued = await issue({
            credential: {
                ...template(),
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                issuanceDate: new Date().toISOString(),
            },
        });
        expect(issued.refresh?.credentialStatus).toBeUndefined();
        expect((await claim(issued)).credential.id).toBe(issued.refresh?.credentialId);
    });

    it('resumes notification delivery after an auto-delivery bind committed', async () => {
        await holder.clients.fullAuth.contactMethods.addContactMethod({
            type: 'email',
            value: 'retry-known@example.com',
        });
        await verifyContactMethod(
            (await getContactMethodByValue('email', 'retry-known@example.com'))!.id
        );
        vi.mocked(notifications.addNotificationToQueue).mockRejectedValueOnce(
            new Error('Queue unavailable')
        );
        const options = {
            recipient: { type: 'email', value: 'retry-known@example.com' },
            idempotencyKey: 'known-retry',
        };
        await expect(issue(options)).rejects.toThrow();
        const retried = await issue(options);
        expect(retried).toMatchObject({
            status: 'ISSUED',
            recipientDid: holder.learnCard.id.did(),
        });
        expect(mocks.sign).toHaveBeenCalledTimes(1);
        expect(
            (await getCredentialRefresh(retried.refresh!.refreshId))?.initialNotificationSentAt
        ).toBeTruthy();
    });

    it('concurrent pending publications with one key create one revision', async () => {
        const issued = await issue();
        const outcomes = await Promise.all([
            queue(issued, 'Final', 'same-key'),
            queue(issued, 'Final', 'same-key'),
        ]);
        expect(outcomes[0]).toEqual(outcomes[1]);
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.currentVersion).toBe(2);
    });

    it('rejects changed pending identity and mechanisms without advancing the version', async () => {
        const issued = await issue();
        const inbox = (await getInboxCredentialById(issued.issuanceId))!;
        const body = JSON.parse(await decryptInboxCredential(inbox.credential));
        for (const patch of [
            { id: 'urn:uuid:different' },
            { issuer: stranger.learnCard.id.did() },
            { credentialSubject: { id: stranger.learnCard.id.did() } },
            { credentialStatus: undefined },
            { refreshService: { ...body.refreshService, id: 'https://example.com/refresh' } },
            { boostId: 'different-boost' },
        ]) {
            await expect(
                issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'signing-authority',
                    refreshId: issued.refresh!.refreshId,
                    credential: { ...body, ...patch },
                    signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        }
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.currentVersion).toBe(1);
        expect(mocks.sign).not.toHaveBeenCalled();
    });

    it('requires credentials:write in addition to inbox:write before allocation', async () => {
        const limited = getClient({
            did: issuer.learnCard.id.did(),
            isChallengeValid: true,
            scope: 'inbox:write',
        });
        await expect(
            limited.inbox.issue({
                recipient: { type: 'email', value: 'unknown@example.com' },
                credential: template(),
                refresh: true,
                configuration: { signingAuthority: SA, delivery: { suppress: true } },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        const result = await neogma.queryRunner.run(
            'MATCH (r:CredentialRefresh) RETURN count(r) AS count'
        );
        expect(Number(result.records[0]?.get('count'))).toBe(0);
    });

    it('preserves the effective time across claim for later publication validation', async () => {
        const issued = await issue({
            credential: { ...template(), validFrom: '2026-09-17T00:00:00.000Z' },
        });
        const delivered = await claim(issued);
        expect((await getCredentialRefreshHead(issued.refresh!.refreshId))?.effectiveAt).toBe(
            '2026-09-17T00:00:00.000Z'
        );
        await expect(
            issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                mode: 'signing-authority',
                refreshId: issued.refresh!.refreshId,
                credential: {
                    ...delivered.credential,
                    proof: undefined,
                    validFrom: '2026-09-16T00:00:00.000Z',
                },
                signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('rejects another issuer and pre-signed pending content', async () => {
        const issued = await issue();
        await expect(
            stranger.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                mode: 'signing-authority',
                refreshId: issued.refresh!.refreshId,
                credential: template(),
                signingAuthority: { type: 'LearnCardSigningAuthority', ...SA },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            issue({
                credential: {
                    ...template(),
                    proof: {
                        type: 'test',
                        created: new Date().toISOString(),
                        proofPurpose: 'assertionMethod',
                        verificationMethod: issuer.learnCard.id.did(),
                    },
                },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
});
