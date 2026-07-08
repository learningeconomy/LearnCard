import {
    DEFAULT_LEARNCARD_TENANT_CONFIG,
    initNetworkStoreFromTenant,
    resolveTenantConfig,
    setAuthConfigFromTenant,
    getTenantBaseUrl,
    type TenantConfig,
    SCOUTPASS_NETWORK_URL,
    SCOUTPASS_NETWORK_API_URL,
    SCOUTCLOUD_URL,
    SCOUTPASS_API_ENDPOINT,
} from 'learn-card-base';

import { initializeFirebaseFromTenant } from '../firebase/firebase';

const SCOUTS_LAUNCH_DARKLY_CLIENT_ID = IS_PRODUCTION
    ? '64b59e8227d2d212ef8e8968'
    : '64b5aeeb41628613abcf2af0';

const SCOUTS_SENTRY_ENV = IS_PRODUCTION ? 'scouts-production' : 'scouts-development';

export const SCOUTS_TENANT_CONFIG: TenantConfig = {
    ...DEFAULT_LEARNCARD_TENANT_CONFIG,
    tenantId: 'scoutpass',
    domain: 'pass.scout.org',
    devDomain: 'localhost:3000',
    apis: {
        ...DEFAULT_LEARNCARD_TENANT_CONFIG.apis,
        brainService: SCOUTPASS_NETWORK_URL,
        brainServiceApi: SCOUTPASS_NETWORK_API_URL,
        cloudService: SCOUTCLOUD_URL,
        lcaApi: SCOUTPASS_API_ENDPOINT,
    },
    auth: {
        ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth,
        provider: 'firebase',
        keyDerivation: 'sss',
        firebase: {
            apiKey: 'AIzaSyCdh1fKaZgk3lKbMkzmiQ26k8aKRQQemjM',
            authDomain: 'scoutpass-9a67e.firebaseapp.com',
            projectId: 'scoutpass-9a67e',
            storageBucket: 'scoutpass-9a67e.appspot.com',
            messagingSenderId: '792471921493',
            appId: '1:792471921493:web:93ef24f3287ef63faec5dc',
            measurementId: 'G-BJR327CKF8',
            redirectDomain: 'pass.scout.org',
            dynamicLinkDomain: 'pass.scout.org',
        },
        sss: {
            ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth.sss,
            serverUrl: SCOUTPASS_API_ENDPOINT,
            enableEmailBackupShare: true,
            requireEmailForPhoneUsers: true,
        },
    },
    branding: {
        ...DEFAULT_LEARNCARD_TENANT_CONFIG.branding,
        name: 'ScoutPass',
        shortName: 'SP',
        logoUrl: 'https://pass.scout.org/assets/icon/icon.png',
        logoAlt: 'ScoutPass',
        defaultTheme: 'colorful',
        allowedThemes: ['colorful'],
        loginRedirectPath: '/campfire?loginCompleted=true',
        brandingKey: 'scoutpass',
        headerText: 'SCOUTPASS',
        homeRoute: '/campfire',
        brandMarkUrl: '/assets/icon/icon.png',
        appIconUrl: '/assets/icon/favicon.png',
    },
    features: {
        ...DEFAULT_LEARNCARD_TENANT_CONFIG.features,
        analytics: true,
        themeSwitching: false,
        introSlides: true,
        launchPadQuickActions: false,
        dashboardHome: false,
        useSeededSkillFrameworks: false,
    },
    observability: {
        ...DEFAULT_LEARNCARD_TENANT_CONFIG.observability,
        sentryDsn:
            'https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704',
        sentryEnv: SCOUTS_SENTRY_ENV,
        sentryTraceDomains: ['pass.scout.org', 'api.scoutnetwork.org', 'cloud.scoutnetwork.org'],
        launchDarklyClientId: SCOUTS_LAUNCH_DARKLY_CLIENT_ID,
        userflowToken: '',
        analyticsProvider: 'firebase',
        posthogKey: undefined,
        posthogHost: undefined,
    },
    links: {
        appStoreUrl: 'https://apps.apple.com/us/app/scoutpass/id6451271002',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.scoutpass.app',
        termsOfServiceUrl: 'https://www.scout.org/privacy',
        privacyPolicyUrl: 'https://www.scout.org/privacy',
        contactUrl: 'https://support.scout.org/hc/en-gb',
        websiteUrl: 'https://scout.org/scoutpass',
    },
    native: {
        bundleId: 'org.scoutpass.app',
        displayName: 'ScoutPass',
        deepLinkDomains: ['pass.scout.org', 'scout.org'],
        customSchemes: [
            'dccrequest',
            'msprequest',
            'asuprequest',
            'openid4vp',
            'openid-credential-offer',
        ],
    },
};

type BootstrapState = {
    resolvedConfig: TenantConfig | null;
    bootstrapPromise: Promise<TenantConfig> | null;
};

const BOOTSTRAP_STATE_KEY = '__scoutsTenantBootstrapState__';

const getBootstrapState = (): BootstrapState => {
    const globalScope = globalThis as typeof globalThis & {
        [BOOTSTRAP_STATE_KEY]?: BootstrapState;
    };

    if (!globalScope[BOOTSTRAP_STATE_KEY]) {
        globalScope[BOOTSTRAP_STATE_KEY] = {
            resolvedConfig: null,
            bootstrapPromise: null,
        };
    }

    return globalScope[BOOTSTRAP_STATE_KEY];
};

let _resolvedConfig: TenantConfig | null = getBootstrapState().resolvedConfig;

const setResolvedTenantConfig = (config: TenantConfig): void => {
    _resolvedConfig = config;
    getBootstrapState().resolvedConfig = config;
};

const initializeTenantSubsystems = (config: TenantConfig): void => {
    initializeFirebaseFromTenant(config.auth.firebase);
    setAuthConfigFromTenant(config);
    initNetworkStoreFromTenant(config.apis, config.tenantId);
};

export const getResolvedTenantConfig = (): TenantConfig => {
    const config = _resolvedConfig ?? getBootstrapState().resolvedConfig;

    if (!config) {
        throw new Error('TenantConfig not yet resolved. Call bootstrapTenantConfig() first.');
    }

    _resolvedConfig = config;

    return config;
};

export const getTenantHeaders = (): Record<string, string> => {
    const tenantId = _resolvedConfig?.tenantId;

    if (!tenantId) return {};

    return { 'X-Tenant-Id': tenantId };
};

export const getAppBaseUrl = (): string => {
    const url = getTenantBaseUrl(getResolvedTenantConfig());

    // Scouts local dev runs over HTTPS, so normalize the shared helper's HTTP localhost URL.
    if (url === 'http://localhost:3000') {
        return 'https://localhost:3000';
    }

    return url;
};

export const getFirebaseRedirectDomain = (): string => {
    const config = getResolvedTenantConfig();

    return config.auth.firebase?.redirectDomain ?? config.domain;
};

export const getFirebaseDynamicLinkDomain = (): string => {
    const config = getResolvedTenantConfig();

    return config.auth.firebase?.dynamicLinkDomain ?? config.domain;
};

export const getNativeBundleId = (): string => {
    const config = getResolvedTenantConfig();

    return config.native?.bundleId ?? 'com.learncard.app';
};

export const bootstrapTenantConfig = async (): Promise<TenantConfig> => {
    const bootstrapState = getBootstrapState();

    if (bootstrapState.bootstrapPromise) {
        return bootstrapState.bootstrapPromise;
    }

    bootstrapState.bootstrapPromise = (async () => {
        const config =
            bootstrapState.resolvedConfig ??
            (await resolveTenantConfig({ staticConfig: SCOUTS_TENANT_CONFIG }));

        setResolvedTenantConfig(config);
        initializeTenantSubsystems(config);

        return config;
    })();

    try {
        return await bootstrapState.bootstrapPromise;
    } finally {
        bootstrapState.bootstrapPromise = null;
    }
};
