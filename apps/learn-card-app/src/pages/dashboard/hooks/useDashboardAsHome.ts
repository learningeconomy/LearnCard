/**
 * Single source of truth for whether the Dashboard is the app's home —
 * i.e. the post-login landing route and the first side-menu entry, in
 * place of the Passport (`/wallet`) home.
 *
 * Two layers, both must be on:
 *
 *   1. **Tenant kill switch** — `features.dashboardHome` from the tenant
 *      config (`@/packages/learn-card-base/src/config/tenantConfigSchema.ts`).
 *      Off by default; flipped on per tenant in
 *      `apps/learn-card-app/environments/<tenant>/config.json`.
 *
 *   2. **Per-user rollout dial** — the `enableDashboardHome` LaunchDarkly
 *      flag. Lets us target individual accounts (yourself, internal QA)
 *      without flipping a whole tenant on, and supports gradual
 *      percentage rollout when we're ready to widen access.
 *
 * Used by:
 *   - `Routes.tsx` for the `/` post-login redirect target and to mount
 *     the `/dashboard` route.
 *   - `SideMenuSecondaryLinks.tsx` to render the "Dashboard" entry first.
 *
 * Centralizing the gate here means the landing route and the nav link
 * can't drift — flag-off users land on `/wallet` and never see a
 * Dashboard entry, flag-on users land on `/dashboard` and see it first.
 */

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useFeatureConfig } from 'learn-card-base';

export const useDashboardAsHome = (): boolean => {
    const features = useFeatureConfig();
    const flags = useFlags();

    return features.dashboardHome === true && flags?.enableDashboardHome === true;
};
