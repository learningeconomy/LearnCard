import { UnsignedClrCredentialValidator } from '@learncard/types';
import type { CredentialFixture } from '../../types';

const CONTEXT = [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
];
const logo = (name: string, color: string): string =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="${color}"/><text x="48" y="62" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="white">${name.slice(0, 1)}</text></svg>`
    )}`;
const PROFILE = (id: string, name: string, url: string, image: string) => ({
    id,
    type: ['Profile'],
    name,
    url,
    image: { id: image, type: 'Image', caption: `${name} logo` },
});
const learner = 'did:example:clr-verification-learner';
const districtA = PROFILE(
    'did:example:district-a',
    'North Valley School District (Fictional)',
    'https://north-valley.example',
    logo('North Valley School District', '#315b8a')
);
const districtB = PROFILE(
    'did:example:district-b',
    'Pine Ridge School District (Fictional)',
    'https://pine-ridge.example',
    logo('Pine Ridge School District', '#467258')
);

/** Unsigned source blueprint. Signed test credentials are created only through real issuer callbacks. */
export const clrMultiIssuerVerification: CredentialFixture = {
    id: 'clr/multi-issuer-verification',
    name: 'Multi-Issuer Learner Record — Verification Scenario',
    description:
        'Unsigned source blueprint for independent district issuers, a revoked BitstringStatusList record, and nested-proof regression testing.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['nested-credentials', 'status'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['verification', 'lc-2408', 'multi-issuer'],
    credential: {
        '@context': CONTEXT,
        id: 'urn:uuid:clr-multi-issuer-verification',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'North Valley and Pine Ridge Learner Record',
        issuer: PROFILE(
            'did:example:state-registry',
            'State Education Records Office (Fictional)',
            'https://state-records.example',
            logo('State Education Records Office', '#5a477c')
        ),
        validFrom: '2026-01-01T00:00:00Z',
        credentialSubject: {
            id: learner,
            type: ['ClrSubject'],
            name: 'Avery Jordan (Fictional Learner)',
            verifiableCredential: [
                {
                    '@context': CONTEXT,
                    id: 'urn:uuid:clr-valid-record',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    issuer: districtA,
                    validFrom: '2026-01-01T00:00:00Z',
                    credentialSubject: {
                        id: learner,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:clr-valid-record#achievement',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'District A — Algebra I',
                        },
                    },
                },
                {
                    '@context': CONTEXT,
                    id: 'urn:uuid:clr-revoked-record',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    issuer: districtB,
                    validFrom: '2026-01-01T00:00:00Z',
                    credentialStatus: {
                        id: 'https://status.example/revocations#revoked-1',
                        type: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        statusListIndex: '1',
                        statusListCredential: 'https://status.example/revocations',
                    },
                    credentialSubject: {
                        id: learner,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:clr-revoked-record#achievement',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'District B — Biology I',
                        },
                    },
                },
                {
                    '@context': CONTEXT,
                    id: 'urn:uuid:clr-tampered-record',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    issuer: districtB,
                    validFrom: '2026-01-01T00:00:00Z',
                    credentialSubject: {
                        id: learner,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:clr-tampered-record#achievement',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'District B — Chemistry I',
                        },
                    },
                },
            ],
        },
    },
};
