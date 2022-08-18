import { generateWallet } from '@wallet/base';
import { getIDXPlugin } from '@wallet/plugins/idx';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { getDidKeyPlugin } from '@wallet/plugins/didkey';
import { ExpirationPlugin } from '@wallet/plugins/expiration';
import { getVCPlugin } from '@wallet/plugins/vc';
import { getEthereumPlugin } from '@wallet/plugins/EthereumPlugin';
import { verifyCredential } from '@wallet/verify';
import { getVpqrPlugin } from '@wallet/plugins/vpqr';

import { LearnCardConfig, LearnCard, EmptyLearnCard } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from '@wallet/defaults';

/** Generates an empty wallet with no key material */
export const emptyWallet = async ({
    didkit,
}: Partial<Pick<LearnCardConfig, 'didkit'>> = {}): Promise<EmptyLearnCard> => {
    const didkitWallet = await (await generateWallet()).addPlugin(await getDidKitPlugin(didkit));

    const wallet = await didkitWallet.addPlugin(ExpirationPlugin(didkitWallet));

    return {
        _wallet: wallet,

        verifyCredential: verifyCredential(wallet),
        verifyPresentation: wallet.pluginMethods.verifyPresentation,
    };
};

/** Generates a LearnCard Wallet from a 64 character seed string */
export const walletFromKey = async (
    key: string,
    {
        ceramicIdx = defaultCeramicIDXArgs,
        didkit,
        defaultContents = [],
        ethereumConfig = defaultEthereumArgs,
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCard> => {
    const didkitWallet = await (
        await generateWallet(defaultContents)
    ).addPlugin(await getDidKitPlugin(didkit));

    const didkeyWallet = await didkitWallet.addPlugin(await getDidKeyPlugin(didkitWallet, key));

    const didkeyAndVCWallet = await didkeyWallet.addPlugin(await getVCPlugin(didkeyWallet));

    const idxWallet = await didkeyAndVCWallet.addPlugin(
        await getIDXPlugin(didkeyAndVCWallet, ceramicIdx)
    );
    const expirationWallet = await idxWallet.addPlugin(ExpirationPlugin(idxWallet));

    const ethWallet = await expirationWallet.addPlugin(
        getEthereumPlugin(expirationWallet, ethereumConfig)
    );

    const wallet = await ethWallet.addPlugin(await getVpqrPlugin());

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
        getTestVp: wallet.pluginMethods.getTestVp,

        checkMyEth: wallet.pluginMethods.checkMyEth,
        checkMyDai: wallet.pluginMethods.checkMyDai,
        checkMyUsdc: wallet.pluginMethods.checkMyUsdc,

        VPfromQrCode: wallet.pluginMethods.VPfromQrCode,
        VPtoQrCode: wallet.pluginMethods.VPtoQrCode,
    };
};
