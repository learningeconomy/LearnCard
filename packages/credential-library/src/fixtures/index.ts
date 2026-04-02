import { registerFixtures } from '../registry';

import type { CredentialFixture } from '../types';

// VC v1
import { vcV1Basic } from './vc-v1/basic';
import { vcV1WithStatus } from './vc-v1/with-status';

// VC v2
import { vcV2Basic } from './vc-v2/basic';
import { vcV2WithEvidence } from './vc-v2/with-evidence';
import { vcV2MultipleSubjects } from './vc-v2/multiple-subjects';

// OBv3
import { obv3MinimalBadge } from './obv3/minimal-badge';
import { obv3FullBadge } from './obv3/full-badge';
import { obv3WithAlignment } from './obv3/with-alignment';
import { obv3WithEndorsement } from './obv3/with-endorsement';
import { obv3PlugfestJff2 } from './obv3/plugfest-jff2';
import { obv3OneedtechFull } from './obv3/1edtech-full';
import { obv3ProfessionalCert } from './obv3/professional-cert';
import { obv3MicroCredential } from './obv3/micro-credential';
import { obv3CourseCompletion } from './obv3/course-completion';
import { obv3K12Diploma } from './obv3/k12-diploma';
import { obv3EndorsementCredential } from './obv3/endorsement';

// CLR v2
import { clrMinimal } from './clr/minimal';
import { clrMultiAchievement } from './clr/multi-achievement';
import { clrUniversityTranscript } from './clr/university-transcript';

// LearnCard Boosts
import { boostBasic } from './boost/basic';
import { boostId } from './boost/boost-id';
import { boostWithSkills } from './boost/with-skills';
import { boostCommunityAward } from './boost/community-award';
import { boostDelegate } from './boost/delegate';

// Invalid / negative test fixtures
import { invalidMissingContext } from './invalid/missing-context';
import { invalidEmptyType } from './invalid/empty-type';
import { invalidMissingIssuer } from './invalid/missing-issuer';

import { clrNdStudentTranscript } from './clr/nd-student-transcript';

// VC v1 (additional)
import { vcV1AlumniCredential } from './vc-v1/alumni-credential';

// VC v2 (additional)
import { vcV2EmploymentCredential } from './vc-v2/employment-credential';
import { vcV2EducationDegree } from './vc-v2/education-degree';
import { vcV2DigitalId } from './vc-v2/digital-id';
import { vcV2MembershipCredential } from './vc-v2/membership-credential';
import { vcV2LicenseCredential } from './vc-v2/license-credential';

import { clrGreatPlainsFull } from './clr/great-plains-full';

// ---------------------------------------------------------------------------
// All fixtures — collected for auto-registration
// ---------------------------------------------------------------------------

export const ALL_FIXTURES: CredentialFixture[] = [
    // VC v1
    vcV1Basic,
    vcV1WithStatus,

    // VC v2
    vcV2Basic,
    vcV2WithEvidence,
    vcV2MultipleSubjects,

    // OBv3
    obv3MinimalBadge,
    obv3FullBadge,
    obv3WithAlignment,
    obv3WithEndorsement,
    obv3PlugfestJff2,
    obv3OneedtechFull,
    obv3ProfessionalCert,
    obv3MicroCredential,
    obv3CourseCompletion,
    obv3K12Diploma,
    obv3EndorsementCredential,

    // CLR v2
    clrMinimal,
    clrMultiAchievement,
    clrUniversityTranscript,

    // Boosts
    boostBasic,
    boostId,
    boostWithSkills,
    boostCommunityAward,
    boostDelegate,

    // Invalid
    invalidMissingContext,
    invalidEmptyType,
    invalidMissingIssuer,
    clrNdStudentTranscript,

    // VC v1 (additional)
    vcV1AlumniCredential,

    // VC v2 (additional)
    vcV2EmploymentCredential,
    vcV2EducationDegree,
    vcV2DigitalId,
    vcV2MembershipCredential,
    vcV2LicenseCredential,
    clrGreatPlainsFull,
];

// Register all fixtures on import
registerFixtures(ALL_FIXTURES);

// Re-export individual fixtures for direct import
export {
    vcV1Basic,
    vcV1WithStatus,
    vcV2Basic,
    vcV2WithEvidence,
    vcV2MultipleSubjects,
    obv3MinimalBadge,
    obv3FullBadge,
    obv3WithAlignment,
    obv3WithEndorsement,
    obv3PlugfestJff2,
    clrMinimal,
    clrMultiAchievement,
    boostBasic,
    boostId,
    boostWithSkills,
    invalidMissingContext,
    invalidEmptyType,
    invalidMissingIssuer,
    clrNdStudentTranscript,
    obv3OneedtechFull,
    obv3ProfessionalCert,
    obv3MicroCredential,
    obv3CourseCompletion,
    obv3K12Diploma,
    obv3EndorsementCredential,
    clrUniversityTranscript,
    boostCommunityAward,
    boostDelegate,
    vcV1AlumniCredential,
    vcV2EmploymentCredential,
    vcV2EducationDegree,
    vcV2DigitalId,
    vcV2MembershipCredential,
    vcV2LicenseCredential,
    clrGreatPlainsFull,
};
