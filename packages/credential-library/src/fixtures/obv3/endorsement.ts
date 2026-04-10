import type { CredentialFixture } from '../../types';

export const obv3EndorsementCredential: CredentialFixture = {
    id: 'obv3/endorsement-credential',
    name: 'Program Accreditation Endorsement',
    description:
        'An OBv3 EndorsementCredential where an accrediting body endorses a university program. Represents the real-world accreditation pattern in higher education.',
    spec: 'obv3',
    profile: 'endorsement',
    features: ['endorsement', 'expiration', 'credential-schema', 'status'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['endorsement', 'accreditation', 'higher-education', 'quality-assurance'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        type: ['VerifiableCredential', 'EndorsementCredential'],
        name: 'ABET Accreditation – Computer Science Program',
        description:
            'Endorsement certifying that the Computer Science program at Pacific Coast University meets the quality standards set by the Accreditation Board for Engineering and Technology (ABET).',
        credentialSubject: {
            id: 'https://pcu-example.edu/programs/bs-cs',
            type: ['EndorsementSubject'],
            endorsementComment:
                'The Computer Science program at Pacific Coast University has been evaluated and found to meet or exceed all criteria for accreditation. The program demonstrates strong student outcomes, qualified faculty, continuous improvement processes, and adequate institutional support.',
        },
        issuer: {
            id: 'did:web:abet-example.org',
            type: ['Profile'],
            name: 'Accreditation Board for Engineering and Technology (ABET)',
            url: 'https://abet-example.org',
            description:
                'ABET accredits college and university programs in the disciplines of applied and natural science, computing, engineering, and engineering technology.',
            image: {
                id: 'https://abet-example.org/logo.png',
                type: 'Image',
                caption: 'ABET logo',
            },
        },
        validFrom: '2023-10-01T00:00:00Z',
        validUntil: '2029-10-01T00:00:00Z',
        credentialSchema: [
            {
                id: 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_endorsementcredential_schema.json',
                type: '1EdTechJsonSchemaValidator2019',
            },
        ],
        credentialStatus: {
            id: 'https://abet-example.org/credentials/status/2023/1',
            type: '1EdTechRevocationList',
        },
    },
};
