import { createCredentialActivity } from '@accesslayer/credential-activity/create';
import {
    LogCredentialActivityParams,
    CredentialActivityEventType,
    CredentialActivityRecipientType,
    CredentialActivitySourceType,
} from 'types/activity';

export const logCredentialActivity = async (
    params: LogCredentialActivityParams
): Promise<string> => {
    try {
        const activityId = await createCredentialActivity(params);

        return activityId;
    } catch (error) {
        console.error('Failed to log credential activity:', error);
        throw error;
    }
};

export const logCredentialSent = async (params: {
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    recipientProfileId?: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    listingId?: string;
    source: CredentialActivitySourceType;
    metadata?: Record<string, unknown>;
}): Promise<string> => {
    const isInboxSend = params.recipientType === 'email' || params.recipientType === 'phone';

    return logCredentialActivity({
        ...params,
        eventType: isInboxSend ? 'CREATED' : 'DELIVERED',
        activityId: undefined,
    });
};

export const logCredentialDelivered = async (params: {
    activityId: string;
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    recipientProfileId?: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    source: CredentialActivitySourceType;
    metadata?: Record<string, unknown>;
}): Promise<string> => {
    return logCredentialActivity({
        ...params,
        eventType: 'DELIVERED',
    });
};

export const logCredentialClaimed = async (params: {
    activityId?: string;
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    recipientProfileId?: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    source: CredentialActivitySourceType;
    metadata?: Record<string, unknown>;
}): Promise<string> => {
    return logCredentialActivity({
        ...params,
        eventType: 'CLAIMED',
    });
};

export const logCredentialExpired = async (params: {
    activityId?: string;
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    boostUri?: string;
    inboxCredentialId?: string;
    source: CredentialActivitySourceType;
}): Promise<string> => {
    return logCredentialActivity({
        ...params,
        eventType: 'EXPIRED',
    });
};

export const logCredentialFailed = async (params: {
    activityId?: string;
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    recipientProfileId?: string;
    boostUri?: string;
    integrationId?: string;
    source: CredentialActivitySourceType;
    metadata?: Record<string, unknown>;
}): Promise<string> => {
    return logCredentialActivity({
        ...params,
        eventType: 'FAILED',
    });
};

export {
    CredentialActivityEventType,
    CredentialActivityRecipientType,
    CredentialActivitySourceType,
};
