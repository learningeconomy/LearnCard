import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const customCourseEnrollment: CredentialFixture = {
    id: 'custom/course-enrollment',
    name: 'Course Enrollment',
    description:
        'Administrative course enrollment claim without completion, assessment, or skill attainment.',
    spec: 'custom',
    profile: 'generic',
    features: ['expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,
    tags: ['enrollment', 'administrative', 'non-achievement'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            {
                designation: 'https://fixtures.example.org/frenchfry/vocab/designation',
                claimScope: 'https://fixtures.example.org/frenchfry/vocab/claimScope',
                claimRole: 'https://fixtures.example.org/frenchfry/vocab/claimRole',
                Profile: 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Profile',
                url: {
                    '@id': 'https://schema.org/url',
                    '@type': 'https://www.w3.org/2001/XMLSchema#anyURI',
                },
                CourseEnrollmentCredential:
                    'https://fixtures.example.org/frenchfry/vocab/CourseEnrollmentCredential',
            },
        ],
        id: 'urn:uuid:6ea43ad2-3fb5-55dd-aee8-6380b7ec0725',
        type: ['VerifiableCredential', 'CourseEnrollmentCredential'],
        issuer: {
            id: 'did:web:registrar.metropolis-university-example.edu',
            type: ['Profile'],
            name: 'Metropolis University – Office of the Registrar',
            url: 'https://metropolis-university-example.edu',
        },
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2027-09-01T00:00:00Z',
        name: 'Course Enrollment',
        description:
            'Administrative course enrollment claim without completion, assessment, or skill attainment.',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/admin-5',
            designation: 'Course enrollment',
            claimRole: 'student',
            claimScope: 'Enrollment in a fictional database course',
        },
    },
};
