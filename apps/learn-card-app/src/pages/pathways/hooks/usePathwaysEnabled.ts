/**
 * Single source of truth for whether the Pathways v2 feature is
 * available to the current user.
 *
 * Two layers, both must be on:
 *
 *   1. **Tenant kill switch** \u2014 `features.pathways` from the tenant
 *      config (`@/packages/learn-card-base/src/config/tenantConfigSchema.ts`).
 *      Off by default; flipped on per tenant in
 *      `apps/learn-card-app/environments/<tenant>/config.json`.
 *
 *   2. **Per-user rollout dial** — the `enableJourneys` LaunchDarkly
 *      flag. It lets us target individual accounts without flipping a
 *      whole tenant on and supports gradual percentage rollout.
 *
 * Used by:
 *   - `Routes.tsx` to conditionally mount the `/pathways` route.
 *   - `SideMenuSecondaryLinks.tsx` to conditionally render the
 *     "Journey" entry in the side menu.
 *
 * Centralizing the gate here means the route and the nav link can't
 * drift \u2014 we'll never ship a side-menu entry that points at a 404.
 */

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useFeatureConfig } from 'learn-card-base';

export const usePathwaysEnabled = (): boolean => {
    const features = useFeatureConfig();
    const flags = useFlags();

    return features.pathways === true && flags?.enableJourneys === true;
};
