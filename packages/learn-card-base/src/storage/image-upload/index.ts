import { registerImageUploadProviderFactory } from './providerRegistry';
import { createFilestackProvider } from './providers/filestackProvider';
import { createS3Provider } from './providers/s3Provider';

registerImageUploadProviderFactory('filestack', createFilestackProvider);
registerImageUploadProviderFactory('s3', createS3Provider);

export type {
    ImageTransformOptions,
    ImageUploadOptions,
    ImageUploadProgressEvent,
    ImageUploadProvider,
    UploadRes,
} from './types';

export {
    getRegisteredImageUploadProviders,
    registerImageUploadProviderFactory,
    resolveImageUploadProvider,
} from './providerRegistry';

export type { ImageUploadProviderFactory } from './providerRegistry';

export {
    getImageUploadProvider,
    isKnownImageUploadUrl,
    setImageUploadConfigFromTenant,
} from './config';
export { useImageUpload } from './useImageUpload';
