export interface ContactMethod {
    type: 'email' | 'phone';
    value: string;
}

export interface Notification {
    contactMethod: ContactMethod;
    templateId: string; // e.g., 'universal-inbox-claim'
    templateModel: Record<string, any>; // Data for the template
}

export interface DeliveryService {
    send(notification: Notification): Promise<void>;
}
