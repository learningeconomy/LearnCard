import type { TenantConfig, TenantStorageConfig } from '../../config/tenantConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../config/tenantDefaults';
import {
    getRegisteredImageUploadProviders,
    registerImageUploadProviderFactory,
    resolveImageUploadProvider,
} from './providerRegistry';
import { createFilestackProvider } from './providers/filestackProvider';
import { createS3Provider } from './providers/s3Provider';
import type { ImageUploadProvider } from './types';

let activeStorageConfig = DEFAULT_LEARNCARD_TENANT_CONFIG.storage;
let activeProvider: ImageUploadProvider | undefined;
let builtInProvidersRegistered = false;

const ensureBuiltInProvidersRegistered = (): void => {
    if (builtInProvidersRegistered) return;

    const registeredProviders = new Set(getRegisteredImageUploadProviders());

    if (!registeredProviders.has('filestack')) {
        registerImageUploadProviderFactory('filestack', createFilestackProvider);
    }

    if (!registeredProviders.has('s3')) {
        registerImageUploadProviderFactory('s3', createS3Provider);
    }

    builtInProvidersRegistered = true;
};

export const setImageUploadConfigFromTenant = (tenant: TenantConfig): void => {
    activeStorageConfig = tenant.storage ?? DEFAULT_LEARNCARD_TENANT_CONFIG.storage;
    activeProvider = undefined;
};

export const getImageUploadProvider = (
    storageConfig?: TenantStorageConfig
): ImageUploadProvider => {
    ensureBuiltInProvidersRegistered();

    if (storageConfig) return resolveImageUploadProvider(storageConfig);

    activeProvider ??= resolveImageUploadProvider(activeStorageConfig);

    return activeProvider;
};

const getUrlHost = (url?: string): string | undefined => {
    if (!url) return;

    try {
        return new URL(url).host;
    } catch {
        return;
    }
};

export const isKnownImageUploadUrl = (url?: string): boolean => {
    if (getImageUploadProvider().ownsUrl(url)) return true;

    return getUrlHost(url) === DEFAULT_LEARNCARD_TENANT_CONFIG.storage.cdnDomain;
};
