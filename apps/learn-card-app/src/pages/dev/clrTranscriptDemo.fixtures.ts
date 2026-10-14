import {
    clrUniversityTranscript,
    clrNdStudentTranscript,
    clrGreatPlainsFull,
    clrMinimal,
    clrWestbridgeFull,
    clrCompetencyAligned,
    clrAchievementIdAssociations,
    clrProvisionalTranscript,
    clrMultiAchievement,
    clrDemoIsdDiplomaAssessments,
    clrStudentOfficialAcademicTranscript,
} from '@learncard/credential-library';

import { clrAcademicProvenanceDemo } from './clrAcademicProvenance.fixture';

/** Academic examples available in the transcript-only developer demo. */
export const CLR_TRANSCRIPT_DEMO_FIXTURES = {
    westbridge: { label: 'Westbridge (Full)', credential: clrWestbridgeFull.credential },
    university: { label: 'University', credential: clrUniversityTranscript.credential },
    nd: { label: 'North Dakota', credential: clrNdStudentTranscript.credential },
    greatPlains: { label: 'Great Plains', credential: clrGreatPlainsFull.credential },
    minimal: { label: 'Minimal', credential: clrMinimal.credential },
    competencyAligned: { label: 'Competency Aligned', credential: clrCompetencyAligned.credential },
    relationships: {
        label: 'Relationships and Scales',
        credential: clrAchievementIdAssociations.credential,
    },
    provisional: {
        label: 'Provisional Transcript',
        credential: clrProvisionalTranscript.credential,
    },
    multiAchievement: { label: 'Multi-Achievement', credential: clrMultiAchievement.credential },
    demoIsd: { label: 'Demo ISD', credential: clrDemoIsdDiplomaAssessments.credential },
    officialAcademic: {
        label: 'Official Academic Transcript',
        credential: clrStudentOfficialAcademicTranscript.credential,
    },
    syntheticAcademic: {
        label: 'Synthetic Academic — Rubric & Attribution',
        credential: clrAcademicProvenanceDemo,
    },
};
