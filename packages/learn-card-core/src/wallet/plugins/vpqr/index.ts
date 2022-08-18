import { toQrCode, fromQrCode } from '@digitalcredentials/vpqr';
import fetch from 'cross-fetch';
import { documentLoaderFactory } from '@transmute/jsonld-document-loader';

import { VpqrPluginMethods } from './types';
import { Plugin } from 'types/wallet';

export const getVpqrPlugin = async (): Promise<Plugin<'Vpqr', VpqrPluginMethods>> => {
    const documentLoader = documentLoaderFactory.build({
        ['//www.w3.org/2018/credentials/v1']: async (iri: URL) => {
            const res = await fetch(iri);
            return res.json;
        },
    });
    return {
        pluginMethods: {
            VPfromQrCode: async text => {
                return (await fromQrCode({ text, documentLoader }))?.vp;
            },
            VPtoQrCode: async vp => {
                return (await toQrCode({ vp, documentLoader, diagnose: console.log }))
                    ?.imageDataUrl;
            },
        },
    };
};
