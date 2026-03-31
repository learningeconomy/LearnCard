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

// CLR v2
import { clrMinimal } from './clr/minimal';
import { clrMultiAchievement } from './clr/multi-achievement';

// LearnCard Boosts
import { boostBasic } from './boost/basic';
import { boostId } from './boost/boost-id';
import { boostWithSkills } from './boost/with-skills';

// Invalid / negative test fixtures
import { invalidMissingContext } from './invalid/missing-context';
import { invalidEmptyType } from './invalid/empty-type';
import { invalidMissingIssuer } from './invalid/missing-issuer';

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

    // CLR v2
    clrMinimal,
    clrMultiAchievement,

    // Boosts
    boostBasic,
    boostId,
    boostWithSkills,

    // Invalid
    invalidMissingContext,
    invalidEmptyType,
    invalidMissingIssuer,
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
};
