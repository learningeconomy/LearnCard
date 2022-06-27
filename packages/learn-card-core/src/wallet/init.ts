import init from 'didkit';

import { generateWallet } from './base';
import { getIDXPlugin } from './plugins/idx';
import { getDidKeyPlugin } from './plugins/didkey';
import { ExpirationPlugin } from './plugins/expiration';
import { getVCPlugin } from './plugins/vc';
import { getEthereumPlugin } from './plugins/EthereumPlugin';
import { verifyCredential } from './verify';

import { LearnCardConfig, LearnCardWallet } from 'types/LearnCard';
import { defaultCeramicIDXArgs } from './defaults';

/** Generates a LearnCard Wallet from a 64 character seed string */
export const walletFromKey = async (
    key: string,
    {
        ceramicIdx = defaultCeramicIDXArgs,
        didkit,
        defaultContents = [],
        ethereumAddress = '',
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCardWallet> => {
    await init(didkit);

    const didkeyWallet = await (
        await generateWallet(defaultContents)
    ).addPlugin(await getDidKeyPlugin(key));

    const didkeyAndVCWallet = await didkeyWallet.addPlugin(await getVCPlugin(didkeyWallet));

    const idxWallet = await didkeyAndVCWallet.addPlugin(
        await getIDXPlugin(didkeyAndVCWallet, ceramicIdx)
    );
    const expirationWallet = await idxWallet.addPlugin(ExpirationPlugin(idxWallet));

    const wallet = await expirationWallet.addPlugin(
        getEthereumPlugin(expirationWallet, ethereumAddress)
    );

    return {
        _wallet: wallet,

        get did() {
            return wallet.pluginMethods.getSubjectDid();
        },
        get keypair() {
            return wallet.pluginMethods.getSubjectKeypair();
        },

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

        checkMyEth: wallet.pluginMethods.checkMyEth,
    };
};
