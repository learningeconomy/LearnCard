import { describe, expect, it } from 'vitest';

import { getIssuerContextLabel } from 'learn-card-base/helpers/issuerContext.helpers';
import { createPreviewIssuerContext } from './previewIssuerContext';

const issuerProfile = {
    profileId: 'alex',
    displayName: 'Alex Rivera',
    shortBio: '',
};

const translate = (key: string, params?: Record<string, unknown>): string => {
    const labels: Record<string, string> = {
        'verification.youCreatedThis': 'You created this',
        'verification.fromConnection': `From your connection ${params?.name ?? ''}`,
        'verification.unverifiedProfile': `${params?.name ?? ''} · Unverified profile`,
        'verification.trustedIssuer': 'Trusted Issuer',
    };

    return labels[key] ?? key;
};

const profileRecipient = (profileId: string) => ({
    kind: 'profile' as const,
    profileId,
    displayName: profileId,
});

describe('createPreviewIssuerContext', () => {
    it('previews a Just Me badge as created by the viewer', () => {
        const context = createPreviewIssuerContext({
            issuerDid: 'did:web:example.com:users:alex',
            issuerProfile,
            trustProfile: 'social',
            registrySource: 'unknown',
            recipientMode: 'self',
            recipients: [],
            connections: [],
        });

        expect(getIssuerContextLabel(context, translate, issuerProfile.displayName)).toBe(
            'You created this'
        );
    });

    it('previews the issuer as a connection when any selected recipient is connected', () => {
        const context = createPreviewIssuerContext({
            issuerDid: 'did:web:example.com:users:alex',
            issuerProfile,
            trustProfile: 'social',
            registrySource: 'unknown',
            recipientMode: 'people',
            recipients: [profileRecipient('sam'), profileRecipient('taylor')],
            connections: [{ profileId: 'TAYLOR' }],
        });

        expect(getIssuerContextLabel(context, translate, issuerProfile.displayName)).toBe(
            'From your connection Alex Rivera'
        );
    });

    it('previews an unknown social issuer as an unverified profile', () => {
        const context = createPreviewIssuerContext({
            issuerDid: 'did:web:example.com:users:alex',
            issuerProfile,
            trustProfile: 'social',
            registrySource: 'unknown',
            recipientMode: 'people',
            recipients: [profileRecipient('sam')],
            connections: [],
        });

        expect(getIssuerContextLabel(context, translate, issuerProfile.displayName)).toBe(
            'Alex Rivera · Unverified profile'
        );
    });

    it('preserves registry trust when no selected recipient is connected', () => {
        const context = createPreviewIssuerContext({
            issuerDid: 'did:web:example.com:users:alex',
            issuerProfile,
            trustProfile: 'social',
            registrySource: 'trusted',
            recipientMode: 'people',
            recipients: [profileRecipient('sam')],
            connections: [],
        });

        expect(getIssuerContextLabel(context, translate, issuerProfile.displayName)).toBe(
            'Trusted Issuer'
        );
    });
});
