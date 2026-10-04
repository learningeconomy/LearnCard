import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const customExamAccommodation: CredentialFixture = {
    id: 'custom/exam-accommodation',
    name: 'Extended Exam Time',
    description:
        'Administrative exam accommodation claim without a diagnosis or assessed achievement.',
    spec: 'custom',
    profile: 'generic',
    features: ['expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,
    tags: ['accommodation', 'administrative', 'non-achievement'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            {
                designation: 'https://fixtures.example.org/frenchfry/vocab/designation',
                claimScope: 'https://fixtures.example.org/frenchfry/vocab/claimScope',
                claimRole: 'https://fixtures.example.org/frenchfry/vocab/claimRole',
                ExamAccommodationCredential:
                    'https://fixtures.example.org/frenchfry/vocab/ExamAccommodationCredential',
            },
        ],
        id: 'urn:uuid:0e341ee2-6006-51b9-a559-62d7ac21a4e1',
        type: ['VerifiableCredential', 'ExamAccommodationCredential'],
        issuer: 'https://fixtures.example.org/frenchfry/issuers/accommodations',
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2027-09-01T00:00:00Z',
        name: 'Extended Exam Time',
        description:
            'Administrative exam accommodation claim without a diagnosis or assessed achievement.',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/admin-20',
            designation: 'Extended exam time',
            claimRole: 'recipient',
            claimScope: 'Fictional extra time provision; no diagnosis included',
        },
    },
};
