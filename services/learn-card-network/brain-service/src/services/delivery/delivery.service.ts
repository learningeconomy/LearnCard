import { z } from 'zod';

import type { TenantBranding } from '@learncard/email-templates';

export interface ContactMethod {
    type: 'email' | 'phone';
    value: string;
}

export interface Notification {
    contactMethod: ContactMethod;
    templateId: string; // e.g., 'universal-inbox-claim'
    templateModel: Record<string, any>; // Data for the template
    messageStream?: string;
    /** Optional tenant branding. When present, emails are rendered locally via @learncard/email-templates. */
    branding?: Partial<TenantBranding>;
    /** Recipient locale (BCP-47), resolved via resolveRecipientLocale. Defaults to English at render time. */
    locale?: string;
}

export const NotificationSchema = z.object({
    contactMethod: z.object({
        type: z.enum(['email', 'phone']),
        value: z.string(),
    }),
    templateId: z.string(),
    templateModel: z.record(z.string(), z.any()),
    messageStream: z.string().optional(),
    branding: z.record(z.string(), z.any()).optional(),
    locale: z.string().optional(),
});

export interface DeliveryService {
    send(notification: Notification): Promise<void>;
}
