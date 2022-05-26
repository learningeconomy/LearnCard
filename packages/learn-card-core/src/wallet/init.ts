import { toUint8Array } from 'hex-lite';
import init from 'didkit';

import { generateWallet } from './base';
import { getIDXPlugin } from './plugins/idx';
import { DidKeyPlugin } from './plugins/didkey';
import { getVCPlugin } from './plugins/vc';

import { LearnCardWallet } from 'types/LearnCard';
import { defaultCeramicIDXArgs } from './defaults';

export const createWallet = async (
    defaultContents: any[],
    ceramicIDXArgs = defaultCeramicIDXArgs
): Promise<LearnCardWallet> => {
    const didkeyWallet = await (await generateWallet(defaultContents)).addPlugin(DidKeyPlugin);
    const baseWallet = await didkeyWallet.addPlugin(await getVCPlugin(didkeyWallet));

    return baseWallet.addPlugin(await getIDXPlugin(baseWallet, ceramicIDXArgs));
};

/** Generates did documents from key and returns default wallet */
export const walletFromKey = async (key: string, ceramicIDXArgs = defaultCeramicIDXArgs) => {
    await init();

    const didDocuments = await DidKeyPlugin.pluginConstants.generateContentFromSeed(
        toUint8Array(key.padStart(64, '0'))
    );

    return createWallet(didDocuments, ceramicIDXArgs);
};
