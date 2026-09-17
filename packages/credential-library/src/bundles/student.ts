import type { CredentialBundle } from './types';

export const studentBundle: CredentialBundle = {
    id: 'student',
    displayName: 'Student',
    blurb: 'Explore a learner record with coursework, skills, leadership, and community impact.',
    entries: [
        {
            fixtureId: 'obv3/student-civic-leadership',
            validFromOffsetDays: -120,
        },
        {
            fixtureId: 'obv3/student-web-development',
            validFromOffsetDays: -60,
        },
        {
            fixtureId: 'obv3/student-community-impact',
            validFromOffsetDays: -30,
        },
        {
            fixtureId: 'clr/student-transcript',
            validFromOffsetDays: -14,
            name: 'Jordan Lee — Demo School Student Transcript',
        },
    ],
};
