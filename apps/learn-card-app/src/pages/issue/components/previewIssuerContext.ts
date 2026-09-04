import type { IssuerContext, IssuerTrustProfile } from '@learncard/types';

import type { Recipient, RecipientMode } from './recipientTypes';

export type PreviewRegistrySource = 'trusted' | 'untrusted' | 'unknown';

type PreviewConnection = {
    profileId: string;
};

type PreviewIssuerContextInput = {
    issuerDid: string;
    issuerProfile?: IssuerContext['profile'];
    trustProfile: IssuerTrustProfile;
    registrySource?: PreviewRegistrySource;
    recipientMode: RecipientMode;
    recipients: Recipient[];
    connections: PreviewConnection[];
};

/**
 * Approximates the relationship label each recipient will see after issuance.
 * A multi-recipient preview uses the connected state when at least one selected
 * profile is connected to the issuer.
 */
export const createPreviewIssuerContext = ({
    issuerDid,
    issuerProfile,
    trustProfile,
    registrySource,
    recipientMode,
    recipients,
    connections,
}: PreviewIssuerContextInput): IssuerContext => {
    const baseContext = {
        issuerDid,
        trustProfile,
        ...(issuerProfile ? { profile: issuerProfile } : {}),
        connectionStatus: 'NOT_CONNECTED' as const,
        mutualConnectionCount: 0,
        hasVerifiedContactMethod: false,
    };

    if (recipientMode === 'self') return { ...baseContext, state: 'self' };

    const selectedProfileIds = new Set(
        recipients.flatMap(recipient =>
            recipient.kind === 'profile' ? [recipient.profileId.toLowerCase()] : []
        )
    );
    const hasConnectedRecipient = connections.some(connection =>
        selectedProfileIds.has(connection.profileId.toLowerCase())
    );

    if (hasConnectedRecipient) {
        return {
            ...baseContext,
            state: 'connection',
            connectionStatus: 'CONNECTED',
        };
    }
    if (registrySource === 'untrusted') return { ...baseContext, state: 'denied' };
    if (registrySource === 'trusted') return { ...baseContext, state: 'trusted' };
    if (trustProfile === 'social' && issuerProfile) {
        return { ...baseContext, state: 'unclaimed' };
    }

    return { ...baseContext, state: 'unresolvable' };
};
