/**
 * Delivery Service Interface
 *
 * Provider-agnostic interface for sending notifications (email, SMS, etc.).
 * Adapters implement this interface for specific providers (Postmark, SendGrid, etc.).
 */

import type { TenantBranding } from '@learncard/email-templates';

export interface EmailNotification {
    to: string;
    subject: string;
    textBody: string;
    htmlBody?: string;
    from?: string;
    messageStream?: string;
}

export interface TemplateNotification {
    to: string;
    templateAlias: string;
    templateModel: Record<string, unknown>;
    from?: string;
    messageStream?: string;
    /** Optional tenant branding. When present, emails are rendered locally via @learncard/email-templates. */
    branding?: Partial<TenantBranding>;
    /** Recipient locale (BCP-47), resolved via resolveRecipientLocale. Defaults to English at render time. */
    locale?: string;
}

export type Notification = EmailNotification | TemplateNotification;

export const isTemplateNotification = (n: Notification): n is TemplateNotification =>
    'templateAlias' in n;

export interface DeliveryService {
    send(notification: Notification): Promise<void>;
}
