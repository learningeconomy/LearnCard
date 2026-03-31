/**
 * Default TenantConfig for the LearnCard production deployment.
 *
 * This is the canonical baseline — all hardcoded values that were previously
 * scattered across firebase.ts, Networks.ts, web3AuthConfig.ts, launchDarkly.ts,
 * sentry.ts, etc. are consolidated here.
 *
 * The Zod schema in `tenantConfigSchema.ts` provides field-level `.default()`
 * values for partial configs coming from edge functions or cache. This object
 * provides the complete LearnCard-specific values (Firebase keys, API URLs, etc.)
 * as the final fallback in `resolveTenantConfig()`.
 *
 * This object is validated against `tenantConfigSchema` at import time to
 * guarantee it stays in sync with the schema.
 */

import type { TenantConfig } from './tenantConfig';
import { tenantConfigSchema, TENANT_CONFIG_SCHEMA_VERSION } from './tenantConfigSchema';

export const DEFAULT_LEARNCARD_TENANT_CONFIG: TenantConfig = {
    schemaVersion: TENANT_CONFIG_SCHEMA_VERSION,

    tenantId: 'learncard',

    domain: 'learncard.app',

    devDomain: 'localhost:3000',

    apis: {
        brainService: 'https://network.learncard.com/trpc',
        brainServiceApi: 'https://network.learncard.com/api',
        cloudService: 'https://cloud.learncard.com/trpc',
        lcaApi: 'https://api.learncard.app/trpc',
        xapi: undefined,
        aiService: 'https://api.learncloud.ai',
        corsProxyApiKey: undefined,
    },

    auth: {
        provider: 'firebase' as const,
        keyDerivation: 'sss',

        firebase: {
            apiKey: 'AIzaSyDQJcEDxhxdxRAVdIDBzcE1x6D-KOj6N4o',
            authDomain: 'learncard.firebaseapp.com',
            projectId: 'learncard',
            storageBucket: 'learncard.appspot.com',
            messagingSenderId: '776298253175',
            appId: '1:776298253175:web:dd996767bf1a2a37a2ef72',
            measurementId: 'G-XPHGSD6Q59',
            redirectDomain: 'learncard.app',
            dynamicLinkDomain: 'learncard.app',
        },

        sss: {
            serverUrl: 'https://api.learncard.app/trpc',
            enableEmailBackupShare: true,
            requireEmailForPhoneUsers: false,
        },
    },

    branding: {
        name: 'LearnCard',
        shortName: 'LC',
        defaultTheme: 'colorful',
        allowedThemes: ['colorful', 'formal'],
        loginRedirectPath: '/waitingsofa?loginCompleted=true',
        brandingKey: 'learncard',
        headerText: 'LEARNCARD',
        homeRoute: '/wallet',
        categoryLabels: {
            learningHistory: 'Study',
            workHistory: 'Experience',
            accommodation: 'Assistance',
            accomplishment: 'Portfolio',
            socialBadge: 'Boost',
        },
        deleteSuccessStyles: {
            containerClass: 'bg-white text-emerald-600',
            statusBarColor: 'light',
        },
    },

    features: {
        aiFeatures: true,
        appStore: true,
        analytics: true,
        themeSwitching: true,
        introSlides: true,
        launchPadQuickActions: true,
    },

    observability: {
        sentryDsn: 'https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704',
        sentryEnv: 'production',
        sentryTraceDomains: [
            'network.learncard.com',
            'api.learncard.app',
            'cloud.learncard.com',
        ],
        launchDarklyClientId: '63dabf3982caed12cac3e55c',
        userflowToken: 'ct_qq6z63mixbhyzbzsgmivgrftda',
        googleMapsApiKey: undefined,

        analyticsProvider: 'noop',
        posthogKey: undefined,
        posthogHost: undefined,
    },

    links: {
        appStoreUrl: 'https://apps.apple.com/us/app/learncard/id1635841898',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.learncard.app',
    },

    native: {
        bundleId: 'com.learncard.app',
        displayName: 'LearnCard',
        deepLinkDomains: [
            'learncard.app',
            'learncardapp.netlify.app',
            'learncardapp.netlify.com',
            'lcw.app'
        ],
        customSchemes: ['dccrequest', 'msprequest', 'asuprequest'],
        capgoChannel: '1.0.4',
    },
};

// -----------------------------------------------------------------
// Schema validation assertion
// -----------------------------------------------------------------
// Validate the defaults object against the Zod schema at module load time.
// If this fails, the default config has drifted out of sync with the schema.

const _defaultsValidation = tenantConfigSchema.safeParse(DEFAULT_LEARNCARD_TENANT_CONFIG);

if (!_defaultsValidation.success) {
    console.error(
        '[TenantConfig] DEFAULT_LEARNCARD_TENANT_CONFIG failed schema validation:',
        _defaultsValidation.error.issues
    );
}
