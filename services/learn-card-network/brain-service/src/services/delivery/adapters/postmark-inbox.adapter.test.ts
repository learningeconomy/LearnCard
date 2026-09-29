import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostmarkAdapter } from './postmark.adapter';

const { sendEmail, sendEmailWithTemplate } = vi.hoisted(() => ({
    sendEmail: vi.fn().mockResolvedValue({}),
    sendEmailWithTemplate: vi.fn().mockResolvedValue({}),
}));

vi.mock('@environment', () => ({ environment: {} }));

vi.mock('postmark', () => ({
    ServerClient: class {
        sendEmail = sendEmail;
        sendEmailWithTemplate = sendEmailWithTemplate;
    },
}));

describe('Inbox email delivery', () => {
    beforeEach(() => vi.clearAllMocks());

    it.each([
        ['universal-inbox', 'emailClaimUrl'],
        ['universal-inbox-claim', 'claimUrl'],
    ])('renders %s with its claim link instead of a hosted alias', async (templateId, urlKey) => {
        const claimUrl = 'https://staging.learncard.ai/interactions/inbox-claim/test-token';
        await new PostmarkAdapter('test-only').send({
            contactMethod: { type: 'email', value: 'learner@example.com' },
            templateId,
            templateModel: {
                [urlKey]: claimUrl,
                issuer: { name: 'Demo School' },
                credential: { name: 'Biology Certificate' },
            },
            branding: { brandName: 'Demo Academy' },
            messageStream: 'universal-inbox',
        });

        // Use the real email renderer; only the external Postmark transport is mocked.
        expect(sendEmailWithTemplate).not.toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalledTimes(1);
        const call = sendEmail.mock.calls[0];
        if (!call) throw new Error('Expected a Postmark sendEmail call');
        const message = call[0];
        expect(message.To).toBe('learner@example.com');
        expect(message.MessageStream).toBe('universal-inbox');
        expect(message.HtmlBody).toContain(`href="${claimUrl}"`);
        expect(message.TextBody).toContain(claimUrl);
        expect(message.HtmlBody).toContain('Biology Certificate');
        expect(message.HtmlBody).toContain('Demo Academy');
        expect(message.Subject).toContain('Demo School');
    });

    it('preserves custom hosted templates', async () => {
        await new PostmarkAdapter('test-only').send({
            contactMethod: { type: 'email', value: 'learner@example.com' },
            templateId: 'custom-issuer-template',
            templateModel: { customField: 'value' },
        });
        expect(sendEmail).not.toHaveBeenCalled();
        expect(sendEmailWithTemplate).toHaveBeenCalledWith(
            expect.objectContaining({
                TemplateAlias: 'custom-issuer-template',
                TemplateModel: { customField: 'value' },
            })
        );
    });
});
