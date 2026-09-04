import type {
    IssuerContext,
    IssuerTrustProfile,
    LCNIssuerRelationshipContext,
} from '@learncard/types';

export type RegistrySource = 'trusted' | 'untrusted' | 'unknown';

export type ResolveIssuerContextInput = {
    issuerDid: string;
    holderDid?: string;
    trustProfile: IssuerTrustProfile;
    registrySource?: RegistrySource;
    isAppIssuer: boolean;
    relationship?: LCNIssuerRelationshipContext;
};

const relationshipFields = (
    relationship?: LCNIssuerRelationshipContext
): Pick<
    IssuerContext,
    'profile' | 'connectionStatus' | 'mutualConnectionCount' | 'hasVerifiedContactMethod'
> => ({
    ...(relationship?.profile ? { profile: relationship.profile } : {}),
    connectionStatus: relationship?.connectionStatus ?? 'NOT_CONNECTED',
    mutualConnectionCount: relationship?.mutualConnectionCount ?? 0,
    hasVerifiedContactMethod: relationship?.hasVerifiedContactMethod ?? false,
});

export const resolveIssuerContext = (input: ResolveIssuerContextInput): IssuerContext => {
    const context = {
        issuerDid: input.issuerDid,
        trustProfile: input.trustProfile,
        ...relationshipFields(input.relationship),
    };

    if (input.registrySource === 'untrusted') return { ...context, state: 'denied' };
    if (
        input.issuerDid &&
        input.issuerDid !== 'did:example:123' &&
        input.issuerDid === input.holderDid
    ) {
        return { ...context, state: 'self' };
    }
    if (input.registrySource === 'trusted') return { ...context, state: 'trusted' };
    if (input.isAppIssuer) return { ...context, state: 'app' };
    if (input.trustProfile === 'credential') return { ...context, state: 'unresolvable' };

    if (input.relationship?.profile) {
        if (input.relationship.connectionStatus === 'CONNECTED') {
            return { ...context, state: 'connection' };
        }
        if (input.relationship.mutualConnectionCount > 0) {
            return { ...context, state: 'mutuals' };
        }
        if (input.relationship.hasVerifiedContactMethod) {
            return { ...context, state: 'identified' };
        }
        return { ...context, state: 'unclaimed' };
    }

    return { ...context, state: 'unresolvable' };
};

/**
 * Returns the exact issuer name used when interpolating an issuer-context label.
 */
export const getIssuerContextName = (
    context: IssuerContext,
    issuerNameOverride?: string
): string | undefined =>
    issuerNameOverride ?? context.profile?.displayName ?? context.profile?.profileId;

export const getIssuerContextLabel = (
    context: IssuerContext,
    t: (key: string, params?: Record<string, unknown>) => string,
    issuerNameOverride?: string,
    labelOverride?: string
): string => {
    if (
        labelOverride &&
        (context.state === 'identified' ||
            (context.state === 'unresolvable' && context.trustProfile === 'credential'))
    ) {
        return labelOverride;
    }

    const issuerName = getIssuerContextName(context, issuerNameOverride);

    switch (context.state) {
        case 'denied':
            return t('verification.untrustedIssuer');
        case 'self':
            return context.trustProfile === 'social'
                ? t('verification.youCreatedThis')
                : t('verification.selfIssued');
        case 'trusted':
            return t('verification.trustedIssuer');
        case 'app':
            return issuerName
                ? t('verification.issuedVia', { name: issuerName })
                : t('verification.appIssuer');
        case 'connection':
            return t('verification.fromConnection', { name: issuerName ?? '' });
        case 'mutuals':
            return t('verification.knownByConnections', {
                count: context.mutualConnectionCount,
            });
        case 'identified':
            return t('verification.verifiedProfile', { name: issuerName ?? '' });
        case 'unclaimed':
            return t('verification.unverifiedProfile', { name: issuerName ?? '' });
        case 'unresolvable':
            return context.trustProfile === 'social'
                ? t('verification.issuerUnidentified')
                : t('verification.unknownIssuer');
    }
};
