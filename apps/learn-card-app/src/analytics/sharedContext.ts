/**
 * Shared event context — enforced properties attached to EVERY analytics
 * event (product analytics hygiene, LC funnel taxonomy).
 *
 * Why: ~75% of captured activity was non-production (local, preview,
 * staging, bot/e2e traffic) with no way to filter it at query time.
 * Every event now carries an enforced `environment` property so
 * ingestion/dashboards can discard non-production events, plus
 * `app_version` / `tenant_id` / `platform` for cohorting.
 *
 * Automated (webdriver/e2e) traffic is dropped client-side entirely —
 * see `shouldDropEvents()`.
 */

import { Capacitor } from '@capacitor/core';
import type { TenantConfig } from 'learn-card-base';

import { getResolvedTenantConfig } from '../config/tenantConfigState';
import { environment } from '../config/environment';

export type AnalyticsEnvironment = 'production' | 'staging' | 'preview' | 'development' | 'test';

/** Shared context bag merged into every tracked event. */
export interface SharedEventContext {
    environment: AnalyticsEnvironment;
    app_version?: string;
    tenant_id?: string;
    platform: 'web' | 'ios' | 'android';
    [key: string]: unknown;
}

const getTenantConfig = (): TenantConfig | undefined => {
    try {
        return getResolvedTenantConfig();
    } catch {
        return undefined;
    }
};

const isAutomatedAgent = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    // Playwright/Selenium/etc. set `navigator.webdriver`. Headless
    // Chrome also advertises itself in the UA.
    return navigator.webdriver === true || /HeadlessChrome/i.test(navigator.userAgent ?? '');
};

const getBuildAnalyticsEnvironment = (): Exclude<AnalyticsEnvironment, 'test'> => {
    if (environment.MODE === 'production') return 'production';
    if (environment.MODE === 'staging') return 'staging';
    if (environment.MODE === 'preview') return 'preview';
    return 'development';
};

const getTenantAnalyticsEnvironment = (
    config: TenantConfig | undefined
): Exclude<AnalyticsEnvironment, 'test'> | undefined => {
    if (!config) return undefined;

    const identity = `${config.observability.sentryEnv ?? ''} ${config.domain}`.toLowerCase();

    if (identity.includes('staging') || identity.includes('stage.')) return 'staging';
    if (identity.includes('preview') || identity.includes('alpha')) return 'preview';
    if (identity.includes('development') || identity.includes('localhost')) return 'development';
    if (identity.includes('production')) return 'production';
    return undefined;
};

/**
 * Classify the runtime environment. Ordering matters:
 * automation → resolved tenant stage → hostname heuristics → build-mode fallback.
 * Native builds use the baked tenant stage because Vite always builds them in
 * production mode, including staging releases.
 */
export const detectAnalyticsEnvironment = (): AnalyticsEnvironment => {
    if (isAutomatedAgent()) return 'test';
    if (environment.MODE === 'test') return 'test';

    const config = getTenantConfig();
    const tenantEnvironment = getTenantAnalyticsEnvironment(config);

    if (Capacitor.isNativePlatform()) {
        return tenantEnvironment ?? getBuildAnalyticsEnvironment();
    }

    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const prodDomain = config?.domain;
    const devDomain = config?.devDomain;

    if (prodDomain && (hostname === prodDomain || hostname === `www.${prodDomain}`)) {
        return tenantEnvironment ?? 'production';
    }

    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local') ||
        (devDomain && devDomain.split(':')[0] === hostname)
    ) {
        return 'development';
    }

    // Netlify deploy previews / branch deploys.
    if (hostname.endsWith('.netlify.app') || hostname.includes('deploy-preview')) {
        return 'preview';
    }

    if (hostname.includes('staging') || hostname.startsWith('stage.')) {
        return 'staging';
    }

    return tenantEnvironment ?? getBuildAnalyticsEnvironment();
};

/**
 * Whether events should be dropped entirely (never sent to the
 * provider). Only automation/e2e traffic is dropped client-side —
 * humans on staging/preview still send events (tagged with
 * `environment`) so pre-release QA remains observable.
 */
export const shouldDropEvents = (): boolean => detectAnalyticsEnvironment() === 'test';

const getPlatform = (): SharedEventContext['platform'] => {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') return platform;
    return 'web';
};

/**
 * Build the shared context bag. Computed per-call (cheap) rather than
 * cached so late TenantConfig resolution self-heals.
 */
export const getSharedEventContext = (): SharedEventContext => {
    const tenantId = getTenantConfig()?.tenantId;
    const version = environment.VITE_APP_VERSION ?? __APP_VERSION__;

    return {
        environment: detectAnalyticsEnvironment(),
        app_version: version.length > 0 ? version : undefined,
        tenant_id: tenantId,
        platform: getPlatform(),
    };
};

/**
 * Generate a flow/exchange correlation id. Use the SAME id from a
 * `*_started` event through its terminal `*_succeeded` / `*_failed` /
 * `*_cancelled` event so concurrent flows can be reconstructed.
 */
export const newFlowId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
