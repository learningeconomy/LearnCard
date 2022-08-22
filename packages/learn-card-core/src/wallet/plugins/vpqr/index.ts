import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import { DependentMethods, VpqrPluginMethods } from './types';
import { Wallet, Plugin } from 'types/wallet';

export const getVpqrPlugin = (
    wallet: Wallet<string, DependentMethods>
): Plugin<'Vpqr', VpqrPluginMethods> => {
    return {
        pluginMethods: {
            VPfromQrCode: async (_wallet, text) => {
                return (
                    await fromQrCode({
                        text,
                        documentLoader: wallet.pluginMethods.contextLoader,
                    })
                )?.vp;
            },
            VPtoQrCode: async (_wallet, vp) => {
                return (
                    await toQrCode({
                        vp,
                        documentLoader: wallet.pluginMethods.contextLoader,
                    })
                )?.imageDataUrl;
            },
        },
    };
};
