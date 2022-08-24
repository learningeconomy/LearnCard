import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import { DependentMethods, VpqrPluginMethods } from './types';
import { Wallet, Plugin } from 'types/wallet';

export const getVpqrPlugin = (
    wallet: Wallet<string, DependentMethods>
): Plugin<'Vpqr', VpqrPluginMethods> => {
    return {
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
