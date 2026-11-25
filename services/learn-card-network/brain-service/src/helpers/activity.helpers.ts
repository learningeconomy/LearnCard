import { createCredentialActivity } from '@accesslayer/credential-activity/create';
import type {
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
    onBehalfOf?: string;
    actorProfileId?: string;
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
    // Callers can supply a correlation ID for related graph writes. Finish
    // activity writes before delivery writes touch the same profile/listing;
    // sharing an ID does not make parallel auto-commit transactions independent.
    activityId?: string;
}): Promise<string> => {
    const isInboxSend = params.recipientType === 'email' || params.recipientType === 'phone';

    return logCredentialActivity({
        ...params,
        eventType: isInboxSend ? 'CREATED' : 'DELIVERED',
    });
};

export const logCredentialDelivered = async (params: {
    onBehalfOf?: string;
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
    onBehalfOf?: string;
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
    onBehalfOf?: string;
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

export type {
    CredentialActivityEventType,
    CredentialActivityRecipientType,
    CredentialActivitySourceType,
};
