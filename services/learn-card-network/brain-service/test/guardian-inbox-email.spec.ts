import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderEmail, resolveBranding } from '@learncard/email-templates';
import type { Notification } from '@services/delivery/delivery.service';
import type { ProfileType } from 'types/profile';
import type { Context } from '@routes';

/**
 * LC-2219 — recipient email alignment for guardian-gated inbox issuance.
 *
 * A guardian-pending credential must never invite the child to claim it now.
 * The explicit `guardianEmail` path already sends `credential-awaiting-guardian`;
 * the auto-detected managed-child path must do the same by default, while
 * preserving explicit caller template overrides and the guardian approval
 * request/in-app notification. Transports stay mocked; the content assertion
 * uses the real local renderer.
 */

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    getProfileByVerifiedContactMethod: vi.fn(),
    getProfilesThatManageAProfile: vi.fn(),
    getContactMethodByValue: vi.fn(),
    getContactMethodsForProfile: vi.fn(),
    getProfileByContactMethod: vi.fn(),
    createContactMethod: vi.fn(),
    getProfileForInboxCredential: vi.fn(),
    createInboxCredential: vi.fn(),
    createDeliveredRelationship: vi.fn(),
    createEmailSentRelationship: vi.fn(),
    generateInboxClaimToken: vi.fn(),
    generateClaimUrl: vi.fn(),
    generateGuardianCredentialApprovalToken: vi.fn(),
    generateGuardianCredentialApprovalUrl: vi.fn(),
    addNotificationToQueue: vi.fn(),
    getLearnCard: vi.fn(),
    getEmptyLearnCard: vi.fn(),
    sendCredential: vi.fn(),
    prepareCredentialFromBoost: vi.fn(),
    getBoostUri: vi.fn(),
    sendBoost: vi.fn(),
    issueCredentialWithSigningAuthority: vi.fn(),
    getBoostByUri: vi.fn(),
    getSigningAuthorityForUserByName: vi.fn(),
    getPrimarySigningAuthorityForUser: vi.fn(),
    logCredentialDelivered: vi.fn(),
    getNotificationMessage: vi.fn(),
    isTrusted: vi.fn(),
    recordInboxRefreshClaimUrl: vi.fn(),
    assertInboxRefreshEnabled: vi.fn(),
    prepareInboxRefresh: vi.fn(),
    getInboxRefreshReceipt: vi.fn(),
    finalizeInboxRefresh: vi.fn(),
    getInboxRefreshIssueKey: vi.fn(),
    resumeInboxRefreshDelivery: vi.fn(),
}));

vi.mock('@environment', () => ({ environment: { IS_OFFLINE: false } }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));
vi.mock('@accesslayer/contact-method/relationships/read', () => ({
    getProfileByVerifiedContactMethod: mocks.getProfileByVerifiedContactMethod,
}));
vi.mock('@accesslayer/profile/relationships/read', () => ({
    getProfilesThatManageAProfile: mocks.getProfilesThatManageAProfile,
}));
vi.mock('@accesslayer/contact-method/read', () => ({
    getContactMethodByValue: mocks.getContactMethodByValue,
    getContactMethodsForProfile: mocks.getContactMethodsForProfile,
    getProfileByContactMethod: mocks.getProfileByContactMethod,
}));
vi.mock('@accesslayer/contact-method/create', () => ({
    createContactMethod: mocks.createContactMethod,
}));
vi.mock('@accesslayer/inbox-credential/read', () => ({
    getProfileForInboxCredential: mocks.getProfileForInboxCredential,
}));
vi.mock('@accesslayer/inbox-credential/create', () => ({
    createInboxCredential: mocks.createInboxCredential,
}));
vi.mock('@accesslayer/inbox-credential/relationships/create', () => ({
    createDeliveredRelationship: mocks.createDeliveredRelationship,
    createEmailSentRelationship: mocks.createEmailSentRelationship,
}));
vi.mock('@accesslayer/inbox-credential/refresh', () => ({
    recordInboxRefreshClaimUrl: mocks.recordInboxRefreshClaimUrl,
}));
vi.mock('@accesslayer/boost/read', () => ({ getBoostByUri: mocks.getBoostByUri }));
vi.mock('@accesslayer/signing-authority/relationships/read', () => ({
    getSigningAuthorityForUserByName: mocks.getSigningAuthorityForUserByName,
    getPrimarySigningAuthorityForUser: mocks.getPrimarySigningAuthorityForUser,
}));
vi.mock('@accesslayer/profile-manager/relationships/read', () => ({
    doesProfileManageProfile: vi.fn().mockResolvedValue(true),
}));
vi.mock('@helpers/did.helpers', () => ({
    getAppDidWeb: (domain: string, slug: string) => `did:web:${domain}:app:${slug}`,
}));
vi.mock('@helpers/contact-method.helpers', () => ({
    generateInboxClaimToken: mocks.generateInboxClaimToken,
    generateClaimUrl: mocks.generateClaimUrl,
}));
vi.mock('@helpers/guardian-approval.helpers', () => ({
    generateGuardianCredentialApprovalToken: mocks.generateGuardianCredentialApprovalToken,
    generateGuardianCredentialApprovalUrl: mocks.generateGuardianCredentialApprovalUrl,
}));
vi.mock('@helpers/notifications.helpers', () => ({
    addNotificationToQueue: mocks.addNotificationToQueue,
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getLearnCard: mocks.getLearnCard,
    getEmptyLearnCard: mocks.getEmptyLearnCard,
}));
vi.mock('@helpers/credential.helpers', () => ({ sendCredential: mocks.sendCredential }));
vi.mock('@helpers/boost.helpers', () => ({
    prepareCredentialFromBoost: mocks.prepareCredentialFromBoost,
    getBoostUri: mocks.getBoostUri,
    sendBoost: mocks.sendBoost,
}));
vi.mock('@helpers/signingAuthority.helpers', () => ({
    issueCredentialWithSigningAuthority: mocks.issueCredentialWithSigningAuthority,
}));
vi.mock('@helpers/activity.helpers', () => ({
    logCredentialDelivered: mocks.logCredentialDelivered,
}));
vi.mock('@helpers/notificationMessages', () => ({
    getNotificationMessage: mocks.getNotificationMessage,
}));
vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({ isTrusted: mocks.isTrusted }),
}));
vi.mock('@helpers/inbox-refresh.helpers', () => ({
    assertInboxRefreshEnabled: mocks.assertInboxRefreshEnabled,
    prepareInboxRefresh: mocks.prepareInboxRefresh,
    getInboxRefreshReceipt: mocks.getInboxRefreshReceipt,
    finalizeInboxRefresh: mocks.finalizeInboxRefresh,
    getInboxRefreshIssueKey: mocks.getInboxRefreshIssueKey,
    resumeInboxRefreshDelivery: mocks.resumeInboxRefreshDelivery,
}));

import { issueToInbox } from '../src/helpers/inbox.helpers';

const ISSUER = {
    profileId: 'issuer',
    did: 'did:web:example.test:users:issuer',
    displayName: 'Springfield Elementary',
} as unknown as ProfileType;

const CHILD_PROFILE = {
    profileId: 'child',
    did: 'did:web:example.test:users:child',
    displayName: 'Child One',
    locale: 'en',
} as unknown as ProfileType;

const GUARDIAN_PROFILE = {
    profileId: 'guardian',
    did: 'did:web:example.test:users:guardian',
    displayName: 'Guardian One',
} as unknown as ProfileType;

const RECIPIENT = { type: 'email' as const, value: 'child@example.com' };
const GUARDIAN_EMAIL = 'guardian@example.com';

const CREDENTIAL = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    name: 'Perfect Attendance Award',
    issuer: ISSUER.did,
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:child' },
    proof: { type: 'Ed25519Signature2020', proofValue: 'test' },
} as any;

const ctx = { domain: 'example.test' } as Context;

const CLAIM_URL = 'https://example.test/claim/CLAIM_SENTINEL';

const sends = (): Array<Notification & { templateModel: Record<string, any> }> =>
    mocks.send.mock.calls.map(call => call[0]);

const sendTo = (value: string) => sends().find(send => send.contactMethod.value === value);

const arrangeManagedChild = ({
    guardianVerifiedEmail = GUARDIAN_EMAIL as string | null,
    child = CHILD_PROFILE,
}: { guardianVerifiedEmail?: string | null; child?: ProfileType } = {}) => {
    mocks.getProfileByVerifiedContactMethod.mockResolvedValue(child);
    mocks.getProfilesThatManageAProfile.mockResolvedValue([GUARDIAN_PROFILE]);
    mocks.getContactMethodsForProfile.mockResolvedValue(
        guardianVerifiedEmail
            ? [{ type: 'email', value: guardianVerifiedEmail, isVerified: true }]
            : []
    );
    mocks.getContactMethodByValue.mockResolvedValue({
        id: 'cm-child',
        type: 'email',
        value: RECIPIENT.value,
        isVerified: false,
    });
    mocks.getProfileForInboxCredential.mockResolvedValue({
        profileId: 'child',
        displayName: 'Child One',
    });
    mocks.createInboxCredential.mockResolvedValue({ id: 'inbox-1' });
    mocks.generateGuardianCredentialApprovalToken.mockResolvedValue('approval-token');
    mocks.generateGuardianCredentialApprovalUrl.mockReturnValue(
        'https://example.test/guardian-credential-approval/approval-token'
    );
    mocks.generateInboxClaimToken.mockResolvedValue('claim-token-sentinel');
    mocks.generateClaimUrl.mockReturnValue(CLAIM_URL);
};

beforeEach(() => {
    vi.clearAllMocks();
    arrangeManagedChild();
});

describe('guardian-gated inbox recipient email', () => {
    it('sends the awaiting-guardian template to an auto-detected managed child by default', async () => {
        await issueToInbox(ISSUER, RECIPIENT, CREDENTIAL, {}, ctx);

        const childSend = sendTo(RECIPIENT.value);
        const guardianSend = sendTo(GUARDIAN_EMAIL);

        expect(guardianSend?.templateId).toBe('guardian-credential-approval');
        expect(childSend?.templateId).toBe('credential-awaiting-guardian');
        expect(
            sends().some(
                send =>
                    send.templateId === 'universal-inbox' ||
                    send.templateId === 'universal-inbox-claim'
            )
        ).toBe(false);

        expect(childSend?.templateModel).toMatchObject({
            issuer: { name: ISSUER.displayName },
            credential: { name: CREDENTIAL.name },
            recipient: { email: RECIPIENT.value },
        });

        // The default path no longer issues an email claim token for a child who
        // cannot claim yet (matching the explicit guardianEmail path).
        expect(mocks.createEmailSentRelationship).not.toHaveBeenCalled();
        expect(mocks.createInboxCredential).toHaveBeenCalledWith(
            expect.objectContaining({ guardianStatus: 'AWAITING_GUARDIAN' })
        );
    });

    it('renders pending-approval content and never a claim-now link', async () => {
        await issueToInbox(ISSUER, RECIPIENT, CREDENTIAL, {}, ctx);

        const childSend = sendTo(RECIPIENT.value)!;
        const rendered = await renderEmail(
            'credential-awaiting-guardian',
            resolveBranding(),
            childSend.templateModel as any,
            'en'
        );

        expect(rendered.subject).toContain('Pending Guardian Approval');
        expect(rendered.html).toContain('Pending guardian approval');
        expect(rendered.html).toContain(ISSUER.displayName);
        expect(rendered.html).toContain(CREDENTIAL.name);
        expect(rendered.html).not.toContain('CLAIM_SENTINEL');
    });

    it('keeps the explicit guardianEmail path on the awaiting-guardian template', async () => {
        await issueToInbox(
            ISSUER,
            RECIPIENT,
            CREDENTIAL,
            { guardianEmail: 'parent@example.com' },
            ctx
        );

        const childSend = sendTo(RECIPIENT.value);
        const guardianSend = sendTo('parent@example.com');

        expect(childSend?.templateId).toBe('credential-awaiting-guardian');
        expect(guardianSend?.templateId).toBe('guardian-credential-approval');
        expect(guardianSend?.templateModel.approvalUrl).toContain('guardian-credential-approval');
        expect(mocks.createEmailSentRelationship).not.toHaveBeenCalled();
    });

    it('suppresses the recipient email but still requests guardian approval', async () => {
        await issueToInbox(ISSUER, RECIPIENT, CREDENTIAL, { delivery: { suppress: true } }, ctx);

        expect(sendTo(RECIPIENT.value)).toBeUndefined();
        expect(sendTo(GUARDIAN_EMAIL)?.templateId).toBe('guardian-credential-approval');
        expect(mocks.addNotificationToQueue).toHaveBeenCalled();
    });

    it('does not claim a guardian email when no guardian has a verified email', async () => {
        arrangeManagedChild({ guardianVerifiedEmail: null });

        await issueToInbox(ISSUER, RECIPIENT, CREDENTIAL, {}, ctx);

        const childSend = sendTo(RECIPIENT.value);
        expect(childSend?.templateId).toBe('credential-awaiting-guardian');
        expect(sends().some(send => send.templateId === 'guardian-credential-approval')).toBe(
            false
        );
        // The in-app notification is the evidence-backed "notification" the
        // awaiting-guardian copy refers to.
        expect(mocks.addNotificationToQueue).toHaveBeenCalled();
    });

    it('preserves an explicit caller template override and its claim link', async () => {
        await issueToInbox(
            ISSUER,
            RECIPIENT,
            CREDENTIAL,
            { delivery: { suppress: false, template: { id: 'universal-inbox-claim', model: {} } } },
            ctx
        );

        const childSend = sendTo(RECIPIENT.value);
        expect(childSend?.templateId).toBe('universal-inbox-claim');
        expect(childSend?.templateModel.emailClaimUrl).toBe(CLAIM_URL);
        expect(childSend?.templateModel.claimToken).toBe('claim-token-sentinel');
        expect(mocks.createEmailSentRelationship).toHaveBeenCalledTimes(1);

        const rendered = await renderEmail(
            'inbox-claim',
            resolveBranding(),
            {
                claimUrl: childSend?.templateModel.emailClaimUrl,
                issuer: childSend?.templateModel.issuer,
                credential: childSend?.templateModel.credential,
                recipient: childSend?.templateModel.recipient,
            } as any,
            'en'
        );
        expect(rendered.html).toContain('CLAIM_SENTINEL');
    });

    it('merges caller model overrides into the awaiting-guardian template', async () => {
        await issueToInbox(
            ISSUER,
            RECIPIENT,
            CREDENTIAL,
            {
                delivery: {
                    suppress: false,
                    template: {
                        model: {
                            issuer: { name: 'Acme Academy' },
                            credential: { name: 'Custom Credential' },
                            recipient: { name: 'Kiddo' },
                        },
                    },
                },
            },
            ctx
        );

        expect(sendTo(RECIPIENT.value)?.templateModel).toMatchObject({
            issuer: { name: 'Acme Academy' },
            credential: { name: 'Custom Credential' },
            recipient: { name: 'Kiddo', email: RECIPIENT.value },
        });
    });

    it('keeps the ungated baseline claim email for non-managed recipients', async () => {
        mocks.getProfileByVerifiedContactMethod.mockResolvedValue(undefined);
        mocks.getProfilesThatManageAProfile.mockResolvedValue([]);

        await issueToInbox(ISSUER, RECIPIENT, CREDENTIAL, {}, ctx);

        expect(sends()).toHaveLength(1);
        expect(sendTo(RECIPIENT.value)?.templateId).toBe('universal-inbox-claim');
        expect(mocks.createEmailSentRelationship).toHaveBeenCalledTimes(1);
        expect(sends().some(send => send.templateId === 'credential-awaiting-guardian')).toBe(
            false
        );
    });
});
