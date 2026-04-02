import { ServerClient } from 'postmark';

import { renderEmail, resolveBranding } from '@learncard/email-templates';
import type { TemplateId, TemplateDataMap } from '@learncard/email-templates';

import { DeliveryService, Notification } from '../delivery.service';

/** Template IDs that the email-templates package can render locally. */
const LOCAL_TEMPLATE_MAP: Record<string, TemplateId> = {
    'universal-inbox-claim': 'inbox-claim',
    'guardian-approval': 'guardian-approval',
    'account-approved-email': 'account-approved',
    'embed-email-verification': 'embed-email-verification',
    'contact-method-verification': 'contact-method-verification',
};

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;

    constructor(apiKey: string) {
        this.client = new ServerClient(apiKey);
    }

    public async send(notification: Notification): Promise<void> {
        const from = process.env.POSTMARK_FROM_EMAIL || 'support@learningeconomy.io';

        const localTemplateId = LOCAL_TEMPLATE_MAP[notification.templateId];

        // If we can render locally, do so — fully branded, git-managed templates
        if (localTemplateId) {
            try {
                const branding = resolveBranding(notification.branding);

                const templateData = this.mapTemplateModel(
                    localTemplateId,
                    notification.templateModel,
                );

                const { html, text, subject } = await renderEmail(
                    localTemplateId,
                    branding,
                    templateData,
                );

                await this.client.sendEmail({
                    From: from,
                    To: notification.contactMethod.value,
                    Subject: subject,
                    HtmlBody: html,
                    TextBody: text,
                    MessageStream: notification.messageStream,
                });

                return;
            } catch (renderError) {
                console.error(
                    `[PostmarkAdapter] Local render failed for "${notification.templateId}", falling back to Postmark template:`,
                    renderError,
                );
            }
        }

        // Fallback: delegate to Postmark's template engine (legacy path)
        try {
            await this.client.sendEmailWithTemplate({
                From: from,
                To: notification.contactMethod.value,
                TemplateAlias: notification.templateId,
                TemplateModel: notification.templateModel,
                MessageStream: notification.messageStream,
            });
        } catch (error) {
            console.error('Postmark API Error:', error);
            throw new Error('Failed to send email via Postmark.');
        }
    }

    /**
     * Map the existing brain-service templateModel shape to the data shape
     * expected by @learncard/email-templates.
     */
    private mapTemplateModel(
        templateId: TemplateId,
        model: Record<string, any>,
    ): TemplateDataMap[TemplateId] {
        switch (templateId) {
            case 'inbox-claim':
                return {
                    claimUrl: model.claimUrl,
                    recipient: model.recipient,
                    issuer: model.issuer,
                    credential: model.credential,
                };

            case 'guardian-approval':
                return {
                    approvalUrl: model.approvalUrl,
                    approvalToken: model.approvalToken,
                    requester: model.requester,
                    guardian: model.guardian,
                };

            case 'account-approved':
                return { user: model.user };

            case 'embed-email-verification':
            case 'contact-method-verification':
            case 'login-verification-code':
            case 'recovery-email-code':
                return {
                    verificationCode: model.verificationCode ?? model.verificationToken,
                    verificationEmail: model.verificationEmail,
                };

            case 'recovery-key':
                return { recoveryKey: model.recoveryKey };

            case 'endorsement-request':
                return {
                    shareLink: model.shareLink,
                    recipient: model.recipient,
                    issuer: model.issuer,
                    credential: model.credential,
                    message: model.message,
                };

            default:
                return model as TemplateDataMap[TemplateId];
        }
    }
}
