import type { CredentialFixture } from '../../types';

export const vcV2MembershipCredential: CredentialFixture = {
    id: 'vc-v2/membership-credential',
    name: 'Professional Association Membership',
    description:
        'A W3C VC v2.0 membership credential for a professional association, with annual expiration and status checking. Modeled after IEEE, ACM, and similar professional body memberships.',
    spec: 'vc-v2',
    profile: 'membership',
    features: ['expiration', 'status'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['membership', 'professional', 'association'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:f9a2e3c4-7b58-4d1a-bc06-2e9f1d8a7b34',
        type: ['VerifiableCredential'],
        name: 'Association of Computing Professionals – Senior Member',
        description:
            'Certifies that the holder is a Senior Member in good standing of the Association of Computing Professionals for the 2025 membership year.',
        credentialSubject: {
            id: 'did:example:member-acp-44210',
            type: ['Person'],
            name: 'Dr. Priya Ramanathan',
            memberOf: {
                type: ['Organization'],
                name: 'Association of Computing Professionals',
                url: 'https://acp-example.org',
            },
            membershipId: 'ACP-44210',
            membershipLevel: 'Senior Member',
            memberSince: '2018-01-01',
            specialInterestGroups: [
                'Software Engineering',
                'Artificial Intelligence',
                'Human-Computer Interaction',
            ],
        },
        issuer: {
            id: 'did:web:acp-example.org',
            type: ['Profile'],
            name: 'Association of Computing Professionals',
            url: 'https://acp-example.org',
            description:
                'The world\'s largest educational and scientific computing society, delivering resources that advance computing as a science and a profession.',
        },
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2025-12-31T23:59:59Z',
        credentialStatus: {
            id: 'https://acp-example.org/credentials/status/2025/1',
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: '44210',
            statusListCredential: 'https://acp-example.org/credentials/status/2025/1',
        },
    },
};
