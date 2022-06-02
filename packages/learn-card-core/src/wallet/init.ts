import { toUint8Array } from 'hex-lite';
import init from '@src/didkit';

import { generateWallet } from './base';
import { getIDXPlugin } from './plugins/idx';
import { DidKeyPlugin } from './plugins/didkey';
import { ExpirationPlugin } from './plugins/expiration';
import { getVCPlugin } from './plugins/vc';

import { LearnCardConfig, LearnCardWallet } from 'types/LearnCard';
import { defaultCeramicIDXArgs } from './defaults';

export const createWallet = async (
    defaultContents: any[],
    { ceramicIdx = defaultCeramicIDXArgs, didkit }: Partial<LearnCardConfig> = {}
): Promise<LearnCardWallet> => {
    await init(didkit);

    const didkeyWallet = await (await generateWallet(defaultContents)).addPlugin(DidKeyPlugin);
    const didkeyAndVCWallet = await didkeyWallet.addPlugin(await getVCPlugin(didkeyWallet));
    const idxWallet = await didkeyAndVCWallet.addPlugin(
        await getIDXPlugin(didkeyAndVCWallet, ceramicIdx)
    );
    const wallet = await idxWallet.addPlugin(ExpirationPlugin(idxWallet));

    return {
        _wallet: wallet,

        get did() {
            return wallet.pluginMethods.getSubjectDid();
        },
        get keypair() {
            return wallet.pluginMethods.getSubjectKeypair();
        },

        issueCredential: wallet.pluginMethods.issueCredential,
        verifyCredential: wallet.pluginMethods.verifyCredential,
        issuePresentation: wallet.pluginMethods.issuePresentation,
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        getCredential: wallet.pluginMethods.getVerifiableCredentialFromIndex,
        getCredentials: wallet.pluginMethods.getVerifiableCredentialsFromIndex,
        publishCredential: wallet.pluginMethods.publishContentToCeramic,
        addCredential: async credential => {
            await wallet.pluginMethods.addVerifiableCredentialInIdx(credential);
        },

        readFromCeramic: wallet.pluginMethods.readContentFromCeramic,

        getTestVc: wallet.pluginMethods.getTestVc,
    };
};

/** Generates did documents from key and returns default wallet */
export const walletFromKey = async (
    key: string,
    { ceramicIdx = defaultCeramicIDXArgs, didkit }: Partial<LearnCardConfig> = {}
) => {
    await init(didkit);

    const didDocuments = await DidKeyPlugin.pluginConstants.generateContentFromSeed(
        toUint8Array(key.padStart(64, '0'))
    );

    return createWallet(didDocuments, { ceramicIdx, didkit });
};
