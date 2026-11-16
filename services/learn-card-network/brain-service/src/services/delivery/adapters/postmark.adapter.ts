import { environment } from '@environment';
import { ServerClient } from 'postmark';

import { renderEmail, resolveBranding } from '@learncard/email-templates';
import type { TemplateId, TemplateDataMap } from '@learncard/email-templates';

import { DeliveryService, Notification } from '../delivery.service';

/**
 * Build a Postmark-compatible "From" header from a brand name and a raw
 * address value. The raw value may be:
 *   - a bare email (`inbox@learncard.com`)
 *   - an already-formatted address (`LearnCard <inbox@learncard.com>`)
 *   - a bare domain (`learncard.com`)
 *
 * We must avoid double-wrapping (`Brand <Brand <addr>>`), which Postmark
 * rejects with "Illegal email mailbox ... in address ...".
 */
const buildFromAddress = (brandName: string, rawAddress: string): string => {
    const trimmed = rawAddress.trim();

    // Already formatted as "Name <addr>" — use as-is, do not re-wrap.
    if (trimmed.includes('<') || trimmed.includes('>')) return trimmed;

    // Bare email (contains `@`) — wrap with brand.
    if (trimmed.includes('@')) return `${brandName} <${trimmed}>`;

    // Bare domain — assume a `support@` mailbox.
    return `${brandName} <support@${trimmed}>`;
};

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
    'credential-updated': 'credential-updated',
    'campaign-announcement': 'announcement',
};

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;

    constructor(apiKey: string) {
        this.client = new ServerClient(apiKey);
    }

    private readonly broadcastStreams = new Map<string, Promise<void>>();

    /** Validate once per adapter/wave; failed checks are never cached. */
    public async assertBroadcastStream(streamId?: string): Promise<void> {
        if (!streamId || streamId.toLowerCase() === 'outbound')
            throw new Error('Campaign email requires a broadcast stream');
        let check = this.broadcastStreams.get(streamId);
        if (!check) {
            check = this.client.getMessageStream(streamId).then(stream => {
                if (stream.MessageStreamType !== 'Broadcasts')
                    throw new Error('Campaign email requires a Postmark Broadcast stream');
            });
            this.broadcastStreams.set(streamId, check);
        }
        try {
            await check;
        } catch {
            this.broadcastStreams.delete(streamId);
            throw new Error('Campaign Postmark Broadcast stream validation failed');
        }
    }

    /** Prepare without sending, so callers can render before reserving a recipient. */
    public async prepareCampaignEmail(notification: Notification): Promise<() => Promise<void>> {
        await this.assertBroadcastStream(notification.messageStream);
        const branding = resolveBranding(notification.branding);
        const rendered = await renderEmail(
            'announcement',
            branding,
            notification.templateModel as TemplateDataMap['announcement'],
            notification.locale
        );
        const brandName =
            notification.branding?.brandName || environment.POSTMARK_BRAND_NAME || 'LearnCard';
        const from = notification.branding?.fromDomain
            ? buildFromAddress(brandName, `support@${notification.branding.fromDomain}`)
            : buildFromAddress(
                  brandName,
                  environment.POSTMARK_FROM_EMAIL || 'support@learningeconomy.io'
              );
        return async () => {
            await this.client.sendEmail({
                From: from,
                To: notification.contactMethod.value,
                Subject: notification.subject ?? rendered.subject,
                HtmlBody: rendered.html,
                TextBody: rendered.text,
                MessageStream: notification.messageStream,
                Headers: notification.headers,
            });
        };
    }

    public async send(notification: Notification): Promise<void> {
        if (notification.templateId === 'campaign-announcement') {
            const deliver = await this.prepareCampaignEmail(notification);
            await deliver();
            return;
        }
        const defaultFrom = environment.POSTMARK_FROM_EMAIL || 'support@learningeconomy.io';
        const defaultBrandName = environment.POSTMARK_BRAND_NAME || 'LearnCard';

        // Use tenant branding for the "From" name and domain when available
        const brandName = notification.branding?.brandName || defaultBrandName;
        const from = notification.branding?.fromDomain
            ? buildFromAddress(brandName, `support@${notification.branding.fromDomain}`)
            : buildFromAddress(brandName, defaultFrom);

        const localTemplateId = LOCAL_TEMPLATE_MAP[notification.templateId];

        // If we can render locally, do so — fully branded, git-managed templates
        if (localTemplateId) {
            let rendered: { html: string; text: string; subject: string } | undefined;

            try {
                const branding = resolveBranding(notification.branding);

                const templateData = this.mapTemplateModel(
                    localTemplateId,
                    notification.templateModel
                );

                rendered = await renderEmail(
                    localTemplateId,
                    branding,
                    templateData,
                    notification.locale
                );
            } catch (renderError) {
                if (notification.templateId !== 'campaign-announcement')
                    console.error(
                        `[PostmarkAdapter] Local render failed for "${notification.templateId}":`,
                        renderError
                    );
                // This template is owned locally; there is no legacy provider alias.
                if (
                    ['credential-updated', 'campaign-announcement'].includes(
                        notification.templateId
                    )
                )
                    throw renderError;
            }

            if (rendered) {
                try {
                    await this.client.sendEmail({
                        From: from,
                        To: notification.contactMethod.value,
                        Subject: notification.subject ?? rendered.subject,
                        HtmlBody: rendered.html,
                        TextBody: rendered.text,
                        MessageStream: notification.messageStream,
                        Headers: notification.headers,
                    });

                    return;
                } catch (sendError) {
                    if (notification.templateId !== 'campaign-announcement')
                        console.error(
                            `[PostmarkAdapter] sendEmail API failed for "${notification.templateId}":`,
                            sendError
                        );
                    // A lost provider acknowledgement may already have sent the email.
                    // Do not bypass the refresh delivery claim with a second attempt.
                    if (
                        ['credential-updated', 'campaign-announcement'].includes(
                            notification.templateId
                        )
                    )
                        throw sendError;
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
                Headers: notification.headers,
            });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);

            console.error(
                `[PostmarkAdapter] Fallback sendEmailWithTemplate also failed for "${notification.templateId}":`,
                error
            );

            throw new Error(`Failed to send email via Postmark: ${detail}`);
        }
    }

    /**
     * Map the existing brain-service templateModel shape to the data shape
     * expected by @learncard/email-templates.
     */
    private mapTemplateModel(
        templateId: TemplateId,
        model: Record<string, any>
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
                return {
                    recoveryKey: model.recoveryKey,
                    confirmationCode: model.confirmationCode,
                };

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

            case 'credential-updated':
                return {
                    issuer: model.issuer,
                    credential: model.credential,
                };

            default:
                return model as TemplateDataMap[TemplateId];
        }
    }
}
