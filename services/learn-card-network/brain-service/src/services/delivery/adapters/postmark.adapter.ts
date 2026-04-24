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
    'credential-awaiting-guardian': 'credential-awaiting-guardian',
    'guardian-approved-claim': 'guardian-approved-claim',
    'guardian-credential-approval': 'guardian-credential-approval',
    'guardian-email-otp': 'guardian-email-otp',
    'guardian-rejected-credential': 'guardian-rejected-credential',
};

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;

    constructor(apiKey: string) {
        this.client = new ServerClient(apiKey);
    }

    public async send(notification: Notification): Promise<void> {
        const defaultFrom = process.env.POSTMARK_FROM_EMAIL || 'support@learningeconomy.io';
        const defaultBrandName = process.env.POSTMARK_BRAND_NAME || 'LearnCard';

        // Use tenant branding for the "From" name and domain when available
        const brandName = notification.branding?.brandName || defaultBrandName;
        const from = notification.branding?.fromDomain
            ? `${brandName} <support@${notification.branding.fromDomain}>`
            : `${defaultBrandName} <${defaultFrom}>`;

        const localTemplateId = LOCAL_TEMPLATE_MAP[notification.templateId];

        // If we can render locally, do so — fully branded, git-managed templates
        if (localTemplateId) {
            let rendered: { html: string; text: string; subject: string } | undefined;

            try {
                const branding = resolveBranding(notification.branding);

                const templateData = this.mapTemplateModel(
                    localTemplateId,
                    notification.templateModel,
                );

                rendered = await renderEmail(
                    localTemplateId,
                    branding,
                    templateData,
                );
            } catch (renderError) {
                console.error(
                    `[PostmarkAdapter] Local render failed for "${notification.templateId}":`,
                    renderError,
                );
            }

            if (rendered) {
                try {
                    await this.client.sendEmail({
                        From: from,
                        To: notification.contactMethod.value,
                        Subject: rendered.subject,
                        HtmlBody: rendered.html,
                        TextBody: rendered.text,
                        MessageStream: notification.messageStream,
                    });

                    return;
                } catch (sendError) {
                    console.error(
                        `[PostmarkAdapter] sendEmail API failed for "${notification.templateId}":`,
                        sendError,
                    );
                }
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
            const detail = error instanceof Error ? error.message : String(error);

            console.error(`[PostmarkAdapter] Fallback sendEmailWithTemplate also failed for "${notification.templateId}":`, error);

            throw new Error(`Failed to send email via Postmark: ${detail}`);
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
            case 'login-verification-code':
            case 'recovery-email-code':
                return {
                    verificationCode: model.verificationCode ?? model.verificationToken,
                    verificationEmail: model.verificationEmail,
                };

            case 'contact-method-verification':
                return {
                    verificationToken: model.verificationToken ?? model.verificationCode,
                    recipient: model.recipient,
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

            case 'credential-awaiting-guardian':
                return {
                    issuer: model.issuer,
                    credential: model.credential,
                    recipient: model.recipient,
                };

            case 'guardian-approved-claim':
                return {
                    issuer: model.issuer,
                    credential: model.credential,
                };

            case 'guardian-credential-approval':
                return {
                    approvalUrl: model.approvalUrl,
                    approvalToken: model.approvalToken,
                    issuer: model.issuer,
                    credential: model.credential,
                    recipient: model.recipient,
                };

            case 'guardian-email-otp':
                return {
                    verificationCode: model.verificationCode,
                };

            case 'guardian-rejected-credential':
                return {
                    issuer: model.issuer,
                    credential: model.credential,
                    recipient: model.recipient,
                };

            default:
                return model as TemplateDataMap[TemplateId];
        }
    }
}
