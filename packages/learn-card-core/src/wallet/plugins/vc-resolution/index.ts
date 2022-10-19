import { VCResolutionPluginMethods } from './types';
import { Plugin } from 'types/wallet';

export * from './types';

/**
 * @group Plugins
 */
export const VCResolutionPlugin: Plugin<'VC Resolution', VCResolutionPluginMethods> = {
    pluginMethods: {
        resolveCredential: async (_wallet, uri) => {
            throw new Error(`No Credential Resolution Plugins found that can resolve ${uri}`);
        },
    },
};
