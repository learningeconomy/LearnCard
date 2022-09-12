import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import { DependentMethods, VpqrPlugin } from './types';
import { Wallet } from 'types/wallet';

export const getVpqrPlugin = (wallet: Wallet<any, DependentMethods>): VpqrPlugin => {
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
