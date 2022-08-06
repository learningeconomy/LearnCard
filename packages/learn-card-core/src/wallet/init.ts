import { generateWallet } from './base';
import { getIDXPlugin } from './plugins/idx';
import { getDidKeyPlugin } from './plugins/didkey';
import { ExpirationPlugin } from './plugins/expiration';
import { getVCPlugin } from './plugins/vc';
import { getEthereumPlugin } from './plugins/EthereumPlugin';
import { verifyCredential } from './verify';

import { LearnCardConfig, LearnCardWallet } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from './defaults';
import { getDidKitPlugin } from './plugins/didkit';

/** Generates a LearnCard Wallet from a 64 character seed string */
export const walletFromKey = async (
    key: string,
    {
        ceramicIdx = defaultCeramicIDXArgs,
        didkit,
        defaultContents = [],
        ethereumConfig = defaultEthereumArgs,
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCardWallet> => {
    const didkitWallet = await (
        await generateWallet(defaultContents)
    ).addPlugin(await getDidKitPlugin(didkit));

    const didkeyWallet = await didkitWallet.addPlugin(await getDidKeyPlugin(didkitWallet, key));

    const didkeyAndVCWallet = await didkeyWallet.addPlugin(await getVCPlugin(didkeyWallet));

    const idxWallet = await didkeyAndVCWallet.addPlugin(
        await getIDXPlugin(didkeyAndVCWallet, ceramicIdx)
    );
    const expirationWallet = await idxWallet.addPlugin(ExpirationPlugin(idxWallet));

    const wallet = await expirationWallet.addPlugin(
        getEthereumPlugin(expirationWallet, ethereumConfig)
    );

    return {
        _wallet: wallet,

        did: (type = 'key') => wallet.pluginMethods.getSubjectDid(type),
        keypair: (type = 'ed25519') => wallet.pluginMethods.getSubjectKeypair(type),

        issueCredential: wallet.pluginMethods.issueCredential,
        verifyCredential: verifyCredential(wallet),
        issuePresentation: wallet.pluginMethods.issuePresentation,
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        getCredential: wallet.pluginMethods.getVerifiableCredentialFromIdx,
        getCredentials: wallet.pluginMethods.getVerifiableCredentialsFromIdx,
        getCredentialsList: async () => {
            return (await wallet.pluginMethods.getCredentialsListFromIdx()).credentials;
        },
        publishCredential: wallet.pluginMethods.publishContentToCeramic,
        addCredential: async credential => {
            await wallet.pluginMethods.addVerifiableCredentialInIdx(credential);
        },
        removeCredential: async title => {
            await wallet.pluginMethods.removeVerifiableCredentialInIdx(title);
        },

        readFromCeramic: wallet.pluginMethods.readContentFromCeramic,

        getTestVc: wallet.pluginMethods.getTestVc,

        checkMyEth: wallet.pluginMethods.checkMyEth,
        checkMyDai: wallet.pluginMethods.checkMyDai,
        checkMyUsdc: wallet.pluginMethods.checkMyUsdc,
    };
};
