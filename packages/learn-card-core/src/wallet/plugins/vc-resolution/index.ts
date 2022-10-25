import { VCResolutionPluginType } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const VCResolutionPlugin: VCResolutionPluginType = {
    name: 'VC Resolution',
    displayName: 'VC Resolution',
    description: '[Deprecated] Allows for a fallback mechanism of resolving credentials',
    methods: {
        resolveCredential: async (_wallet, uri) => {
            throw new Error(`No Credential Resolution Plugins found that can resolve ${uri}`);
        },
    },
};
