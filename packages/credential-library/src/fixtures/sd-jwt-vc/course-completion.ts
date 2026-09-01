import type { SdJwtVcFixture } from '../../types';

export const sdJwtVcCourseCompletion: SdJwtVcFixture = {
    kind: 'sd-jwt-vc',
    id: 'sd-jwt-vc/course-completion',
    name: 'SD-JWT VC Course Completion',
    description:
        'Synthetic holder-bound course completion credential for Digital Credentials API testing',
    spec: 'sd-jwt-vc',
    profile: 'course',
    features: ['skills', 'selective-disclosure', 'holder-binding'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['sd-jwt', 'dcql', 'android-digital-credentials', 'holder-bound'],
    template: {
        format: 'dc+sd-jwt',
        vct: 'https://credentials.learncard.com/vct/course-completion',
        claims: {
            learner_name: 'Ada Lovelace',
            course_name: 'Introduction to Verifiable Credentials',
            completion_date: '2026-08-25',
            skills: ['Digital Identity', 'Verifiable Credentials'],
        },
        selectivelyDisclosable: ['learner_name', 'course_name', 'completion_date', 'skills'],
    },
};
