import { toQrCode, fromQrCode } from '@digitalbazaar/vpqr';

import type { VpqrPlugin, VpqrPluginDependentMethods } from './types';
import type { LearnCard } from '@learncard/core';

export * from './types';

/**
 * @group Plugins
 */
export const getVpqrPlugin = (
    learnCard: LearnCard<any, any, VpqrPluginDependentMethods>
): VpqrPlugin => {
    return {
        name: 'Vpqr',
        displayName: 'VP QR',
        description: 'Allows reading and creating QR codes with Verifiable Presentations in them',
        methods: {
            vpFromQrCode: async (_learnCard, text) => {
                return (
                    await fromQrCode({
                        text,
                        documentLoader: async (url: string) => ({
                            document: await learnCard.invoke.contextLoader(url),
                        }),
                    })
                )?.vp;
            },
            vpToQrCode: async (_learnCard, vp) => {
                return (
                    await toQrCode({
                        vp,
                        documentLoader: async (url: string) => ({
                            document: await learnCard.invoke.contextLoader(url),
                        }),
                    })
                )?.imageDataUrl;
            },
        },
    };
};
