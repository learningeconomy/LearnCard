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

        getCredential: wallet.pluginMethods.getVerifiableCredentialFromIndex,
        getCredentials: wallet.pluginMethods.getVerifiableCredentialsFromIndex,
        publishCredential: wallet.pluginMethods.publishContentToCeramic,
        addCredential: async credential => {
            await wallet.pluginMethods.addVerifiableCredentialInIdx(credential);
        },

        readFromCeramic: wallet.pluginMethods.readContentFromCeramic,

        getTestVc: wallet.pluginMethods.getTestVc,

        getEthereumAddress: wallet.pluginMethods.getEthereumAddress,
        getBalance: wallet.pluginMethods.getBalance,
        checkMyEth: wallet.pluginMethods.checkMyEth,
        checkMyDai: wallet.pluginMethods.checkMyDai,
        checkMyUsdc: wallet.pluginMethods.checkMyUsdc,
        checkEthForAddress: wallet.pluginMethods.checkEthForAddress,
        transferEth: wallet.pluginMethods.transferEth,
        getCurrentEthereumNetwork: wallet.pluginMethods.getCurrentEthereumNetwork,
        changeEthereumNetwork: wallet.pluginMethods.changeEthereumNetwork,
        addInfuraProjectId: wallet.pluginMethods.addInfuraProjectId,
        test: wallet.pluginMethods.test,
    };
};
