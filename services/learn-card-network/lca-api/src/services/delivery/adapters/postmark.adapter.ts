/**
 * Postmark Adapter
 *
 * Sends emails via the Postmark API. Supports both plain-text and template-based emails.
 * When a known template alias is used and branding is provided, emails are rendered
 * locally via @learncard/email-templates instead of delegating to Postmark's template engine.
 */

import { ServerClient } from 'postmark';

import { renderEmail, resolveBranding } from '@learncard/email-templates';
import type { TemplateId, TemplateDataMap } from '@learncard/email-templates';

import {
    DeliveryService,
    Notification,
    isTemplateNotification,
} from '../delivery.service';

/**
 * Map env-driven Postmark template aliases to local template IDs.
 *
 * lca-api uses env vars for template aliases (e.g. POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS).
 * We detect the *purpose* from the templateModel shape since the alias string varies per deploy.
 *
 * The map is also pre-populated with sentinel aliases matching the local template IDs
 * themselves. Service routes can pass these sentinels directly as `templateAlias`
 * (e.g. `'recovery-key'`) when no Postmark alias is configured, guaranteeing the
 * correct local React Email template is rendered regardless of env var state.
 */
const LOCAL_TEMPLATE_ALIASES: Record<string, TemplateId> = {
    'login-verification-code': 'login-verification-code',
    'recovery-email-code': 'recovery-email-code',
    'recovery-key': 'recovery-key',
    'embed-email-verification': 'embed-email-verification',
    'endorsement-request': 'endorsement-request',
    'inbox-claim': 'inbox-claim',
    'guardian-approval': 'guardian-approval',
    'account-approved': 'account-approved',
    'contact-method-verification': 'contact-method-verification',
};

/** Whether the given alias is a sentinel we registered (vs. a real Postmark alias). */
const isLocalSentinelAlias = (alias: string): boolean =>
    LOCAL_TEMPLATE_ALIASES[alias] === alias;

/** Infer the local template ID from the template alias and model shape. */
function inferLocalTemplateId(
    alias: string,
    model: Record<string, unknown>,
): TemplateId | undefined {
    // Check the static map first (populated at startup if needed)
    if (LOCAL_TEMPLATE_ALIASES[alias]) return LOCAL_TEMPLATE_ALIASES[alias];

    // Heuristic: infer from template model keys
    if ('verificationCode' in model && 'verificationEmail' in model) {
        if ('recoveryKey' in model) return undefined; // not a verification code template
        // Could be login-verification-code, recovery-email-code, or embed-email-verification
        // Default to login since that's the most common lca-api use case
        return 'login-verification-code';
    }

    if ('recoveryKey' in model) return 'recovery-key';

    if ('shareLink' in model && 'recipient' in model) return 'endorsement-request';

    return undefined;
}

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;
    private readonly defaultFrom: string;

    constructor(apiKey: string, defaultFrom: string) {
        this.client = new ServerClient(apiKey);
        this.defaultFrom = defaultFrom;
    }

    async send(notification: Notification): Promise<void> {
        const from = notification.from ?? this.defaultFrom;

        if (isTemplateNotification(notification)) {
            const localId = inferLocalTemplateId(
                notification.templateAlias,
                notification.templateModel,
            );

            // Try local rendering for known templates
            if (localId) {
                try {
                    const branding = resolveBranding(notification.branding);

                    const templateData = this.mapTemplateModel(
                        localId,
                        notification.templateModel,
                    );

                    const { html, text, subject } = await renderEmail(localId, branding, templateData);

                    await this.client.sendEmail({
                        From: from,
                        To: notification.to,
                        Subject: subject,
                        HtmlBody: html,
                        TextBody: text,
                        MessageStream: notification.messageStream,
                    });

                    return;
                } catch (renderError) {
                    console.error(
                        `[PostmarkAdapter] Local render failed for "${notification.templateAlias}":`,
                        renderError,
                    );

                    // If the alias is one of our sentinels (e.g. 'recovery-key'),
                    // Postmark has no matching template — re-throw so callers see
                    // the real render error instead of a confusing "template not
                    // found" from Postmark.
                    if (isLocalSentinelAlias(notification.templateAlias)) {
                        throw renderError;
                    }
                }
            }

            // Fallback: Postmark template engine (real Postmark alias only)
            await this.client.sendEmailWithTemplate({
                From: from,
                To: notification.to,
                TemplateAlias: notification.templateAlias,
                TemplateModel: notification.templateModel,
                MessageStream: notification.messageStream,
            });
        } else {
            await this.client.sendEmail({
                From: from,
                To: notification.to,
                Subject: notification.subject,
                TextBody: notification.textBody,
                HtmlBody: notification.htmlBody,
                MessageStream: notification.messageStream,
            });
        }
    }

    /**
     * Map the existing lca-api templateModel shape to the data shape
     * expected by @learncard/email-templates.
     */
    private mapTemplateModel(
        templateId: TemplateId,
        model: Record<string, unknown>,
    ): TemplateDataMap[TemplateId] {
        switch (templateId) {
            case 'login-verification-code':
            case 'recovery-email-code':
            case 'embed-email-verification':
                return {
                    verificationCode: (model.verificationCode as string) ?? '',
                    verificationEmail: model.verificationEmail as string | undefined,
                };

            case 'contact-method-verification':
                return {
                    verificationToken: (model.verificationToken as string) ?? (model.verificationCode as string) ?? '',
                    recipient: model.recipient as { name?: string } | undefined,
                };

            case 'recovery-key':
                return {
                    recoveryKey: (model.recoveryKey as string) ?? '',
                };

            case 'endorsement-request':
                return {
                    shareLink: (model.shareLink as string) ?? '',
                    recipient: model.recipient as { name?: string } | undefined,
                    issuer: model.issuer as { name?: string } | undefined,
                    credential: model.credential as { name?: string } | undefined,
                    message: model.message as string | undefined,
                };

            case 'inbox-claim':
                return {
                    claimUrl: (model.claimUrl as string) ?? '',
                    recipient: model.recipient as { name?: string } | undefined,
                    issuer: model.issuer as { name?: string } | undefined,
                    credential: model.credential as { name?: string } | undefined,
                };

            case 'guardian-approval':
                return {
                    approvalUrl: (model.approvalUrl as string) ?? '',
                    approvalToken: (model.approvalToken as string) ?? '',
                    requester: model.requester as { displayName?: string } | undefined,
                    guardian: model.guardian as { email?: string } | undefined,
                };

            case 'account-approved':
                return {
                    user: model.user as { displayName?: string } | undefined,
                };

            default:
                return model as TemplateDataMap[TemplateId];
        }
    }
}
