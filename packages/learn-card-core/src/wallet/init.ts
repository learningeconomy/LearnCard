import { toUint8Array } from 'hex-lite';
import { ModelAliases } from '@glazed/types';

import { generateWallet } from './base';
import { getIDXPlugin } from './plugins/idx';
import { DidKeyPlugin } from './plugins/didkey';
import { VCPlugin } from './plugins/vc';

import { LearnCardWallet } from 'types/LearnCard';

export const createWallet = async (
    defaultContents: any[],
    modelData: any,
    credentialAlias: string,
    ceramicEndpoint: string,
    defaultContentFamily: string
): Promise<LearnCardWallet> => {
    const baseWallet = await (
        await (await generateWallet(defaultContents)).addPlugin(DidKeyPlugin)
    ).addPlugin(VCPlugin);

    return baseWallet.addPlugin(
        await getIDXPlugin(
            baseWallet,
            modelData,
            credentialAlias,
            ceramicEndpoint,
            defaultContentFamily
        )
    );
};

/** Generates did documents from key and returns default wallet */
export const walletFromKey = async (
    key: string,
    modelData: any,
    credentialAlias: string,
    ceramicEndpoint: string,
    defaultContentFamily: string
) => {
    const didDocuments = await DidKeyPlugin.pluginConstants.generateContentFromSeed(
        toUint8Array(key.padStart(64, '0'))
    );

    return createWallet(
        didDocuments,
        modelData,
        credentialAlias,
        ceramicEndpoint,
        defaultContentFamily
    );
};
