import { VC } from '@learncard/types';

/** @group VC Resolution Plugin */
export type LC_URI<URI extends string = ''> = '' | URI;

/** @group VC Resolution Plugin */
export type VCResolutionPluginMethods = {
    resolveCredential: (uri: LC_URI) => Promise<VC>;
};

/** @group VC Resolution Plugin */
export type ResolutionExtension<URI extends string> = {
    resolveCredential: (uri: LC_URI<URI>) => Promise<VC>;
};
