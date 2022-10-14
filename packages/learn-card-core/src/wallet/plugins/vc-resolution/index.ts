import { VCResolutionPluginType } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const VCResolutionPlugin: VCResolutionPluginType = {
    name: 'VC Resolution',
    pluginMethods: {
        resolveCredential: async (_wallet, uri) => {
            throw new Error(`No Credential Resolution Plugins found that can resolve ${uri}`);
        },
    },
};
