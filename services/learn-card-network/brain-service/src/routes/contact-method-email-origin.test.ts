import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderEmail } from '@learncard/email-templates';

const mocks = vi.hoisted(() => ({
    getProfile: vi.fn(),
    findContact: vi.fn(),
    createContact: vi.fn(),
    createRelationship: vi.fn(),
    token: vi.fn(),
    send: vi.fn(),
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: mocks.getProfile,
    getProfileByProfileId: vi.fn(),
}));
vi.mock('@accesslayer/contact-method/create', () => ({ createContactMethod: mocks.createContact }));
vi.mock('@accesslayer/contact-method/read', () => ({
    getContactMethodByValue: mocks.findContact,
    getContactMethodById: vi.fn(),
    getProfileByContactMethod: vi.fn(),
}));
vi.mock('@accesslayer/contact-method/relationships/create', () => ({
    createProfileContactMethodRelationship: mocks.createRelationship,
}));
vi.mock('@helpers/contact-method.helpers', () => ({
    generateContactMethodVerificationToken: mocks.token,
    validateContactMethodVerificationToken: vi.fn(),
    CONTACT_METHOD_SESSION_PREFIX: 'test:',
}));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));

import { environment } from '@environment';
import { contactMethodsRouter } from './contact-methods';
import type { Context } from './index';

const profile = {
    profileId: 'test-recipient',
    did: 'did:key:test-recipient',
    displayName: 'Test recipient',
};
const originalOrigins = environment.EMAIL_APP_ORIGINS;
const context = (): Context => ({
    domain: 'staging.network.learncard.com',
    tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'header' },
    user: { did: profile.did, isChallengeValid: true, scope: '*:*' },
});

beforeEach(() => {
    vi.clearAllMocks();
    environment.EMAIL_APP_ORIGINS = JSON.stringify({ learncard: 'https://staging.learncard.ai' });
    mocks.getProfile.mockResolvedValue(profile);
    mocks.findContact.mockResolvedValue(null);
    mocks.createContact.mockResolvedValue({
        id: 'contact-1',
        type: 'email',
        value: 'synthetic@example.com',
        isVerified: false,
        isPrimary: false,
    });
    mocks.createRelationship.mockResolvedValue(undefined);
    mocks.token.mockResolvedValue('synthetic-token');
    mocks.send.mockResolvedValue(undefined);
});

afterEach(() => {
    environment.EMAIL_APP_ORIGINS = originalOrigins;
});

describe('addContactMethod email origin', () => {
    it('passes the configured staging origin to the actual verification email template', async () => {
        const caller = contactMethodsRouter.createCaller(context());
        await expect(
            caller.addContactMethod({ type: 'email', value: 'synthetic@example.com' })
        ).resolves.toMatchObject({ contactMethodId: 'contact-1', verificationRequired: true });

        expect(mocks.send).toHaveBeenCalledOnce();
        const payload = mocks.send.mock.calls[0]![0];
        expect(payload).toMatchObject({
            templateId: 'contact-method-verification',
            branding: { appUrl: 'https://staging.learncard.ai' },
        });
        const rendered = await renderEmail(
            payload.templateId,
            payload.branding,
            payload.templateModel
        );
        expect(rendered.html).toContain(
            'https://staging.learncard.ai/verify-email?token=synthetic-token'
        );
        expect(rendered.html).not.toContain('https://learncard.app/verify-email');
    });

    it.each([undefined, '{}', '{"learncard":"http://learncard.app"}'])(
        'rejects unsafe or absent origin %s before writing a contact',
        async config => {
            environment.EMAIL_APP_ORIGINS = config;
            await expect(
                contactMethodsRouter.createCaller(context()).addContactMethod({
                    type: 'email',
                    value: 'synthetic@example.com',
                })
            ).rejects.toThrow('Email app origin is not configured');
            expect(mocks.findContact).not.toHaveBeenCalled();
            expect(mocks.createContact).not.toHaveBeenCalled();
            expect(mocks.createRelationship).not.toHaveBeenCalled();
            expect(mocks.token).not.toHaveBeenCalled();
            expect(mocks.send).not.toHaveBeenCalled();
        }
    );
});
