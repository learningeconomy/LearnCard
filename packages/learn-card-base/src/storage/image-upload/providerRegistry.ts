import type { TenantStorageConfig } from '../../config/tenantConfig';
import type { ImageUploadProvider } from './types';

export type ImageUploadProviderFactory = (config: TenantStorageConfig) => ImageUploadProvider;

const imageUploadProviderFactories = new Map<string, ImageUploadProviderFactory>();

export const registerImageUploadProviderFactory = (
    name: string,
    factory: ImageUploadProviderFactory
): void => {
    imageUploadProviderFactories.set(name, factory);
};

export const getRegisteredImageUploadProviders = (): string[] => [
    ...imageUploadProviderFactories.keys(),
];

export const resolveImageUploadProvider = (config: TenantStorageConfig): ImageUploadProvider => {
    const factory = imageUploadProviderFactories.get(config.provider);

    if (!factory) {
        const registered = getRegisteredImageUploadProviders().join(', ') || 'none';

        throw new Error(
            `No image upload provider registered for "${config.provider}". ` +
                `Registered: ${registered}. ` +
                'Set tenant storage.provider or register an image upload provider factory.'
        );
    }

    return factory(config);
};
