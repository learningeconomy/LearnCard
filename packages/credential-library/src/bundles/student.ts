import type { CredentialBundle } from './types';

export const studentBundle: CredentialBundle = {
    id: 'student',
    displayName: 'Student',
    blurb: 'See how mentoring and community service can appear in a LearnCard.',
    entries: [
        {
            fixtureId: 'obv3/student-afterschool-program-mentor',
            validFromOffsetDays: -79,
        },
    ],
};
