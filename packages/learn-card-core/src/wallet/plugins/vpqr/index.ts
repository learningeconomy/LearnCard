import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import { VpqrPlugin, VpqrPluginDependentMethods, VpqrPluginMethods } from './types';
import { Wallet, Plugin } from 'types/wallet';

export * from './types';

/**
 * @group Plugins
 */
export const getVpqrPlugin = (wallet: Wallet<any, VpqrPluginDependentMethods>): VpqrPlugin => {
    return {
        name: 'Vpqr',
        pluginMethods: {
            vpFromQrCode: async (_wallet, text) => {
                return (
                    await fromQrCode({
                        text,
                        documentLoader: async (url: string) => ({
                            document: await wallet.pluginMethods.contextLoader(url),
                        }),
                    })
                )?.vp;
            },
            vpToQrCode: async (_wallet, vp) => {
                return (
                    await toQrCode({
                        vp,
                        documentLoader: async (url: string) => ({
                            document: await wallet.pluginMethods.contextLoader(url),
                        }),
                    })
                )?.imageDataUrl;
            },
        },
    };
};
