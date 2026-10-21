/**
 * Single source of truth for whether the Dashboard is the app's home:
 * the post-login landing route and first side-menu entry in place of
 * the Passport (`/wallet`) home.
 *
 * Tenant config remains the durable boundary because this behavior differs
 * across branded deployments. Centralizing it here keeps the landing route
 * and navigation entry in sync.
 */

import { useFeatureConfig } from 'learn-card-base';

export const useDashboardAsHome = (): boolean => {
    const features = useFeatureConfig();

    return features.dashboardHome === true;
};
