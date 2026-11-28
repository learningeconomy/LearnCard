import React from 'react';

import { usePathwaysEnabled } from '../../pages/pathways/hooks/usePathwaysEnabled';
import PathwaysShell from '../../pages/pathways/PathwaysShell';

/**
 * `/pathways/*`: Pathways v2, greenfield alongside `/ai/pathways`. Gated by `usePathwaysEnabled`
 * (tenant `features.pathways` AND LaunchDarkly `enableJourneys`, both default off), the same hook
 * the side menu uses so the route and the nav link can't drift. See pages/pathways/docs/architecture.md.
 */
export const PathwaysRoute: React.FC = () => (usePathwaysEnabled() ? <PathwaysShell /> : null);
