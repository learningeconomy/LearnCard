import {
    clrUniversityTranscript,
    clrMilitaryComprehensiveRecord,
    clrMilitaryTrainingRecord,
    clrMixedCareerRecord,
    clrTrainingProviderRecord,
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

/** Source-backed examples for all CLR layouts. */
export const CLR_TRANSCRIPT_DEMO_FIXTURES = {
    military: {
        label: 'Military — Comprehensive',
        credential: clrMilitaryComprehensiveRecord.credential,
    },
    militaryTraining: {
        label: 'Military — Training Record',
        credential: clrMilitaryTrainingRecord.credential,
    },
    mixedCareer: { label: 'General — Mixed Career', credential: clrMixedCareerRecord.credential },
    trainingProvider: {
        label: 'General — Training Provider',
        credential: clrTrainingProviderRecord.credential,
    },
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
