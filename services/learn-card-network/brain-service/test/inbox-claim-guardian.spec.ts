import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { UnsignedVC, VP } from '@learncard/types';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import * as inboxReads from '@accesslayer/inbox-credential/read';

const mocks = vi.hoisted(() => ({ sign: vi.fn(), verify: vi.fn(), sendEmail: vi.fn() }));

vi.mock('@helpers/signingAuthority.helpers', async original => ({
    ...(await original<Record<string, unknown>>()),
    issueCredentialWithSigningAuthority: mocks.sign,
}));
// This suite drives the workflows route end-to-end with a mocked signer; real-signing
// E2E covers authority transport and proofs.
vi.mock('@helpers/credential-refresh-proof.helpers', () => ({
    verifyManagedRefreshProof: mocks.verify,
}));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.sendEmail }),
}));
vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({ isTrusted: async () => true }),
}));

import { neogma } from '@instance';
import { getUser } from './helpers/getClient';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import { updateInboxCredential } from '@accesslayer/inbox-credential/update';
import { getCredentialRefresh } from '@accesslayer/credential-refresh';
import * as notifications from '@helpers/notifications.helpers';

const SA = { endpoint: 'https://sa.example.com', name: 'guardian-claim' };
const RECIPIENT = 'guardian-claim@example.com';
const ISSUER_DID = 'did:web:localhost%3A3000:users:lc2219-issuer';

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;

const template = (name: string): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    name,
    issuer: ISSUER_DID,
    credentialSubject: {},
});

const issue = (overrides = {}) =>
    issuer.clients.fullAuth.inbox.issue({
        recipient: { type: 'email', value: RECIPIENT },
        credential: template('Guardian gated credential'),
        refresh: true,
        configuration: { signingAuthority: SA, delivery: { suppress: true } },
        ...overrides,
    });

const startExchange = async (claimUrl: string) => {
    const localExchangeId = new URL(claimUrl).pathname.split('/').pop()!;
    const initiation = await holder.clients.fullAuth.workflows.participateInExchange({
        localWorkflowId: 'inbox-claim',
        localExchangeId,
    });
    return {
        localExchangeId,
        challenge: initiation.verifiablePresentationRequest!.challenge!,
        domain: initiation.verifiablePresentationRequest!.domain!,
    };
};

const present = async (localExchangeId: string, challenge: string, domain: string) => {
    const vp = (await holder.learnCard.invoke.getDidAuthVp({ challenge, domain })) as VP;
    return holder.clients.fullAuth.workflows.participateInExchange({
        localWorkflowId: 'inbox-claim',
        localExchangeId,
        verifiablePresentation: vp,
    });
};

const claim = async (issued: Awaited<ReturnType<typeof issue>>) => {
    const { localExchangeId, challenge, domain } = await startExchange(issued.claimUrl!);
    return present(localExchangeId, challenge, domain);
};

const issuanceErrorWebhooks = () =>
    vi
        .mocked(notifications.addNotificationToQueue)
        .mock.calls.filter(
            ([event]) => event?.type === LCNNotificationTypeEnumValidator.enum.ISSUANCE_ERROR
        );

beforeAll(async () => {
    issuer = await getUser('e'.repeat(64));
    holder = await getUser('9'.repeat(64));
    vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);
});

beforeEach(async () => {
    mocks.sendEmail.mockReset().mockResolvedValue(undefined);
    // @instance is the isolated Testcontainers database, never the user's local demo stack.
    await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
    await issuer.clients.fullAuth.profile.createProfile({ profileId: 'lc2219-issuer' });
    await holder.clients.fullAuth.profile.createProfile({ profileId: 'lc2219-holder' });
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

describe('guardian-gated inbox claim exchange', () => {
    it('does not deliver a legacy credential deleted after the pending query', async () => {
        const issued = await issue({ refresh: false });
        const lookup = vi.spyOn(inboxReads, 'getInboxCredentialById').mockResolvedValueOnce(null);
        try {
            const result = await claim(issued);
            expect(result.inboxDeliveries).toEqual([]);
            expect(result.inboxClaimOutcomes).toBeUndefined();
            expect(mocks.sign).not.toHaveBeenCalled();
        } finally {
            lookup.mockRestore();
        }
    });

    it('blocks an awaiting credential without signing, delivering, or alerting', async () => {
        const issued = await issue();
        await updateInboxCredential(issued.issuanceId, {
            guardianStatus: 'AWAITING_GUARDIAN',
            webhookUrl: 'https://example.com/guardian-hook',
        });
        vi.mocked(notifications.addNotificationToQueue).mockClear();

        const result = await claim(issued);

        expect(result.inboxClaimOutcomes).toEqual([
            { id: issued.issuanceId, status: 'AWAITING_GUARDIAN' },
        ]);
        expect(result.inboxDeliveries).toEqual([]);
        expect(result.verifiablePresentation?.verifiableCredential ?? []).toHaveLength(0);
        expect(mocks.sign).not.toHaveBeenCalled();
        // A pending guardian claim must not be reported to the issuer as an issuance error.
        expect(notifications.addNotificationToQueue).not.toHaveBeenCalled();
        expect(issuanceErrorWebhooks()).toHaveLength(0);
        expect((await getInboxCredentialById(issued.issuanceId))?.currentStatus).toBe('PENDING');
    });

    it('reports a guardian-rejected credential as rejected', async () => {
        const issued = await issue();
        await updateInboxCredential(issued.issuanceId, { guardianStatus: 'GUARDIAN_REJECTED' });

        const result = await claim(issued);

        expect(result.inboxClaimOutcomes).toEqual([
            { id: issued.issuanceId, status: 'GUARDIAN_REJECTED' },
        ]);
        expect(result.inboxDeliveries).toEqual([]);
        expect(mocks.sign).not.toHaveBeenCalled();
    });

    it('blocks both refresh and legacy credentials in one batch', async () => {
        const refresh = await issue();
        const legacy = await issue({ refresh: false });
        await updateInboxCredential(refresh.issuanceId, { guardianStatus: 'AWAITING_GUARDIAN' });
        await updateInboxCredential(legacy.issuanceId, { guardianStatus: 'AWAITING_GUARDIAN' });

        const result = await claim(refresh);

        expect(result.inboxClaimOutcomes).toHaveLength(2);
        expect(result.inboxClaimOutcomes).toEqual(
            expect.arrayContaining([
                { id: refresh.issuanceId, status: 'AWAITING_GUARDIAN' },
                { id: legacy.issuanceId, status: 'AWAITING_GUARDIAN' },
            ])
        );
        expect(result.inboxDeliveries).toEqual([]);
        expect(mocks.sign).not.toHaveBeenCalled();
    });

    it('returns successful deliveries alongside blocked outcomes in a mixed batch', async () => {
        const blocked = await issue();
        await updateInboxCredential(blocked.issuanceId, { guardianStatus: 'AWAITING_GUARDIAN' });
        const deliverable = await issue({ credential: template('Deliverable credential') });

        const result = await claim(deliverable);

        expect(result.inboxClaimOutcomes).toEqual([
            { id: blocked.issuanceId, status: 'AWAITING_GUARDIAN' },
        ]);
        expect(result.inboxDeliveries).toHaveLength(1);
        expect(result.inboxDeliveries![0]!.id).toBe(deliverable.issuanceId);
        expect(result.inboxDeliveries![0]!.credential.name).toBe('Deliverable credential');
        expect(result.verifiablePresentation?.verifiableCredential).toHaveLength(1);
    });

    it('still signs and delivers an ungated legacy credential', async () => {
        const issued = await issue({ refresh: false });

        const result = await claim(issued);

        expect(result.inboxClaimOutcomes).toBeUndefined();
        expect(result.inboxDeliveries).toHaveLength(1);
        expect(result.inboxDeliveries![0]!.credential.name).toBe('Guardian gated credential');
        expect(mocks.sign).toHaveBeenCalledTimes(1);
        expect((await getInboxCredentialById(issued.issuanceId))?.currentStatus).toBe('ISSUED');
        expect((await getInboxCredentialById(issued.issuanceId))?.credential).toBeUndefined();
    });

    it('keeps generic failures on the existing error path without guardian outcomes', async () => {
        const issued = await issue({ refresh: false });
        await updateInboxCredential(issued.issuanceId, {
            webhookUrl: 'https://example.com/error-hook',
        });
        vi.mocked(notifications.addNotificationToQueue).mockClear();
        mocks.sign.mockRejectedValueOnce(new Error('Authority unavailable'));

        const result = await claim(issued);

        expect(result.inboxClaimOutcomes).toBeUndefined();
        expect(result.inboxDeliveries).toEqual([]);
        expect(issuanceErrorWebhooks()).toHaveLength(1);
        expect((await getInboxCredentialById(issued.issuanceId))?.currentStatus).toBe('PENDING');
        expect((await getInboxCredentialById(issued.issuanceId))?.credential).toBeTruthy();
    });

    it('succeeds with the same issuance on a fresh challenge after approval', async () => {
        const issued = await issue();
        await updateInboxCredential(issued.issuanceId, { guardianStatus: 'AWAITING_GUARDIAN' });
        const blocked = await claim(issued);
        expect(blocked.inboxClaimOutcomes).toEqual([
            { id: issued.issuanceId, status: 'AWAITING_GUARDIAN' },
        ]);

        await updateInboxCredential(issued.issuanceId, { guardianStatus: 'GUARDIAN_APPROVED' });

        // Fresh initiation on the same valid email token is how the UI checks again.
        const approved = await claim(issued);

        expect(approved.inboxClaimOutcomes).toBeUndefined();
        expect(approved.inboxDeliveries).toHaveLength(1);
        expect(approved.inboxDeliveries![0]!.credential.id).toBe(issued.refresh?.credentialId);
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.state).toBe('active');
        const bound = await getInboxCredentialById(issued.issuanceId);
        expect(bound?.currentStatus).toBe('ISSUED');
        // The escrow payload is wiped while the holder recovery copy is retained.
        expect(bound?.credential).toBeUndefined();
        expect((bound as { deliveryRecipientDid?: string } | null)?.deliveryRecipientDid).toBe(
            holder.learnCard.id.did()
        );
    });

    it('does not allow replaying a signed presentation after the challenge is exhausted', async () => {
        const issued = await issue();
        const { localExchangeId, challenge, domain } = await startExchange(issued.claimUrl!);
        const vp = (await holder.learnCard.invoke.getDidAuthVp({ challenge, domain })) as VP;

        const first = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });
        expect(first.inboxDeliveries).toHaveLength(1);

        await expect(
            holder.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: vp,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect((await getCredentialRefresh(issued.refresh!.refreshId))?.state).toBe('active');
    });
});
