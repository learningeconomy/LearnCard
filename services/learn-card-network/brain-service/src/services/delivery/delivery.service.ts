import { z } from 'zod';

export interface ContactMethod {
    type: 'email' | 'phone';
    value: string;
}

export interface Notification {
    contactMethod: ContactMethod;
    templateId: string; // e.g., 'universal-inbox-claim'
    templateModel: Record<string, any>; // Data for the template
    messageStream?: string;
}

export const NotificationSchema = z.object({
    contactMethod: z.object({
        type: z.enum(['email', 'phone']),
        value: z.string(),
    }),
    templateId: z.string(),
    templateModel: z.record(z.string(), z.any()),
    messageStream: z.string().optional(),
});

export interface DeliveryService {
    send(notification: Notification): Promise<void>;
}