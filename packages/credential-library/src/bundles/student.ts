import type { CredentialBundle, CredentialBundleIssuer } from './types';

const ISSUERS = {
    hillValleyHigh: {
        profileId: 'sample-hill-valley-high',
        displayName: 'Hill Valley High School',
        image: 'https://cdn.filestackcontent.com/rko7HmtCQ5aI5gfS3r1o',
    },
    worldScouting: {
        profileId: 'sample-world-scouting',
        displayName: 'World Scouting',
        image: 'https://cdn.filestackcontent.com/tY9KCX5T4mQK9GERTGhf',
    },
    royCharleston: {
        profileId: 'sample-roy-charleston',
        displayName: 'Roy Charleston',
    },
    toefl: {
        profileId: 'sample-toefl',
        displayName: 'TOEFL',
        image: 'https://cdn.filestackcontent.com/s6P4u2TVSaeHDVS64UKw',
    },
    collegeBoard: {
        profileId: 'sample-college-board',
        displayName: 'College Board',
        image: 'https://cdn.filestackcontent.com/TMTJ1xuKSKWuPOxMc2fQ',
    },
    arcadiaMediaLabs: {
        profileId: 'sample-arcadia-media-labs',
        displayName: 'Arcadia Media Labs',
        image: 'https://cdn.filestackcontent.com/bfPLw9dQfWhpVYorZVfA',
    },
    codeRiseAcademy: {
        profileId: 'sample-code-rise-academy',
        displayName: 'CodeRise Academy',
        image: 'https://cdn.filestackcontent.com/nHMhLsvFQmKU2TGKYzHK',
    },
    redwoodValleyUniversity: {
        profileId: 'sample-redwood-valley-university',
        displayName: 'Redwood Valley University',
        image: 'https://cdn.filestackcontent.com/kok4oellRhKa2mWRllZS',
    },
    learningEconomy: {
        profileId: 'sample-learning-economy',
        displayName: 'Learning Economy',
        image: 'https://cdn.filestackcontent.com/iLpqAJWYTDCxARqo6LN4',
    },
    oliviaTrujillo: {
        profileId: 'sample-olivia-trujillo',
        displayName: 'Olivia Trujillo',
        image: 'https://cdn.filestackcontent.com/OKefWUSvTnuHELTSGH0z',
    },
    summitAccessibilityOffice: {
        profileId: 'sample-summit-accessibility-office',
        displayName: 'Summit Accessibility Office',
        image: 'https://cdn.filestackcontent.com/JEAA9HfUSNa8SPp8nQiU',
    },
    kikuhanaInternationalUniversity: {
        profileId: 'sample-kikuhana-international-university',
        displayName: 'Kikuhana International University',
        image: 'https://cdn.filestackcontent.com/HLQCIyRMQgSnxZtKmevv',
    },
    campTallPines: {
        profileId: 'sample-camp-tall-pines',
        displayName: 'Camp Tall Pines',
        image: 'https://cdn.filestackcontent.com/frBHDn7SV2f8HKcxkGrj',
    },
    summitMarketing: {
        profileId: 'sample-summit-marketing',
        displayName: 'Summit Marketing',
        image: 'https://cdn.filestackcontent.com/Q5BWlBiRJevkBlBlYaN2',
    },
    motlowStateCollege: {
        profileId: 'sample-motlow-state-college',
        displayName: 'Motlow State College',
        image: 'https://cdn.filestackcontent.com/rjXzVVEjRVu0RSb8gYPZ',
    },
} as const satisfies Record<string, CredentialBundleIssuer>;

export const studentBundle: CredentialBundle = {
    id: 'student',
    displayName: 'Student',
    blurb: 'Explore academic, creative, leadership, service, and work credentials in a LearnCard.',
    entries: [
        {
            fixtureId: 'obv3/student-afterschool-program-mentor',
            validFromOffsetDays: -79,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-environment-badge',
            validFromOffsetDays: -79,
            issuer: ISSUERS.worldScouting,
        },
        {
            fixtureId: 'obv3/student-rock-climbing-mentor',
            validFromOffsetDays: -79,
            issuer: ISSUERS.royCharleston,
        },
        {
            fixtureId: 'obv3/student-park-cleanup-helper',
            validFromOffsetDays: -79,
            issuer: ISSUERS.royCharleston,
        },
        {
            fixtureId: 'obv3/student-first-place-science-fair',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-toefl-certification',
            validFromOffsetDays: -80,
            issuer: ISSUERS.toefl,
        },
        {
            fixtureId: 'obv3/student-senior-capstone-project',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-sat-score',
            validFromOffsetDays: -80,
            issuer: ISSUERS.collegeBoard,
        },
        {
            fixtureId: 'obv3/student-hill-valley-high-school-diploma',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-biology-101',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-ai-fundamentals',
            validFromOffsetDays: -80,
            issuer: ISSUERS.arcadiaMediaLabs,
        },
        {
            fixtureId: 'obv3/student-technical-bootcamp',
            validFromOffsetDays: -80,
            issuer: ISSUERS.codeRiseAcademy,
        },
        {
            fixtureId: 'clr/student-official-academic-transcript',
            validFromOffsetDays: -494,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-ba-interactive-media-design',
            validFromOffsetDays: -80,
            issuer: ISSUERS.redwoodValleyUniversity,
        },
        {
            fixtureId: 'obv3/student-ap-math-course',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-animated-short',
            validFromOffsetDays: -80,
            issuer: ISSUERS.learningEconomy,
        },
        {
            fixtureId: 'obv3/student-capstone-project',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-skyway-magazine',
            validFromOffsetDays: -80,
            issuer: ISSUERS.learningEconomy,
        },
        {
            fixtureId: 'obv3/student-photo-contest-award',
            validFromOffsetDays: -80,
            issuer: ISSUERS.oliviaTrujillo,
        },
        {
            fixtureId: 'obv3/student-design-portfolio',
            validFromOffsetDays: -80,
            issuer: ISSUERS.oliviaTrujillo,
        },
        {
            fixtureId: 'obv3/student-workplace-ergonomic-assessment',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitAccessibilityOffice,
        },
        {
            fixtureId: 'obv3/student-iep-documentation',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitAccessibilityOffice,
        },
        {
            fixtureId: 'obv3/student-accessibility-services-registration',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitAccessibilityOffice,
        },
        {
            fixtureId: 'obv3/student-extended-time-on-exams-approval',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitAccessibilityOffice,
        },
        {
            fixtureId: 'obv3/student-mental-health-accommodation-letter',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitAccessibilityOffice,
        },
        {
            fixtureId: 'obv3/student-study-abroad-program',
            validFromOffsetDays: -80,
            issuer: ISSUERS.kikuhanaInternationalUniversity,
        },
        {
            fixtureId: 'obv3/student-camp-counselor',
            validFromOffsetDays: -80,
            issuer: ISSUERS.campTallPines,
        },
        {
            fixtureId: 'obv3/student-president-of-class',
            validFromOffsetDays: -80,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-resume',
            validFromOffsetDays: -80,
            issuer: ISSUERS.oliviaTrujillo,
        },
        {
            fixtureId: 'obv3/student-internship',
            validFromOffsetDays: -80,
            issuer: ISSUERS.summitMarketing,
        },
        {
            fixtureId: 'obv3/student-world-scouting-troop-id',
            validFromOffsetDays: -431,
            issuer: ISSUERS.worldScouting,
        },
        {
            fixtureId: 'obv3/student-hill-valley-high-school-student-id',
            validFromOffsetDays: -431,
            issuer: ISSUERS.hillValleyHigh,
        },
        {
            fixtureId: 'obv3/student-motlow-college-id',
            validFromOffsetDays: -431,
            issuer: ISSUERS.motlowStateCollege,
        },
    ],
};
