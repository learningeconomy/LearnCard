import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import { VpqrPlugin, VpqrPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export * from './types';

/**
 * @group Plugins
 */
export const getVpqrPlugin = (wallet: Wallet<any, any, VpqrPluginDependentMethods>): VpqrPlugin => {
    return {
        name: 'Vpqr',
        displayName: 'VP QR',
        description: 'Allows reading and creating QR codes with Verifiable Presentations in them',
        methods: {
            vpFromQrCode: async (_wallet, text) => {
                return (
                    await fromQrCode({
                        text,
                        documentLoader: async (url: string) => ({
                            document: await wallet.invoke.contextLoader(url),
                        }),
                    })
                )?.vp;
            },
            vpToQrCode: async (_wallet, vp) => {
                return (
                    await toQrCode({
                        vp,
                        documentLoader: async (url: string) => ({
                            document: await wallet.invoke.contextLoader(url),
                        }),
                    })
                )?.imageDataUrl;
            },
        },
    };
};
