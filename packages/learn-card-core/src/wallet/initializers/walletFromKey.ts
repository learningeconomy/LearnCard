import { generateWallet } from '@wallet/base';
import { getIDXPlugin } from '@wallet/plugins/idx';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { getDidKeyPlugin } from '@wallet/plugins/didkey';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getVCPlugin } from '@wallet/plugins/vc';
import { getEthereumPlugin } from '@wallet/plugins/EthereumPlugin';
import { getVpqrPlugin } from '@wallet/plugins/vpqr';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { verifyCredential } from '@wallet/verify';

import { LearnCardConfig, LearnCard } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from '@wallet/defaults';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { VCResolutionPlugin } from '@wallet/plugins/vc-resolution';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const walletFromKey = async (
    key: string,
    {
        ceramicIdx = defaultCeramicIDXArgs,
        didkit,
        ethereumConfig = defaultEthereumArgs,
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCard> => {
    const didkitWallet = await (await generateWallet()).addPlugin(await getDidKitPlugin(didkit));

    const didkeyWallet = await didkitWallet.addPlugin(await getDidKeyPlugin(didkitWallet, key));

    const didkeyAndVCWallet = await didkeyWallet.addPlugin(getVCPlugin(didkeyWallet));

    const templateWallet = await didkeyAndVCWallet.addPlugin(getVCTemplatesPlugin());

    const resolutionWallet = await templateWallet.addPlugin(VCResolutionPlugin);

    const idxWallet = await resolutionWallet.addPlugin(
        await getIDXPlugin(resolutionWallet, ceramicIdx)
    );
    const expirationWallet = await idxWallet.addPlugin(expirationPlugin(idxWallet));

    const ethWallet = await expirationWallet.addPlugin(
        getEthereumPlugin(expirationWallet, ethereumConfig)
    );

    const vpqrWallet = await ethWallet.addPlugin(getVpqrPlugin(ethWallet));

    const wallet = await vpqrWallet.addPlugin(await getCHAPIPlugin());

    return {
        _wallet: wallet,

        did: (type = 'key') => wallet.pluginMethods.getSubjectDid(type),
        keypair: (type = 'ed25519') => wallet.pluginMethods.getSubjectKeypair(type),

        newCredential: wallet.pluginMethods.newCredential,
        newPresentation: wallet.pluginMethods.newPresentation,

        issueCredential: wallet.pluginMethods.issueCredential,
        verifyCredential: verifyCredential(wallet),
        issuePresentation: wallet.pluginMethods.issuePresentation,
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        getCredential: wallet.pluginMethods.getVerifiableCredentialFromIdx,
        getCredentials: wallet.pluginMethods.getVerifiableCredentialsFromIdx,
        getCredentialsList: async <
            Metadata extends Record<string, any> = Record<never, never>
        >() => {
            return (await wallet.pluginMethods.getCredentialsListFromIdx<Metadata>()).credentials;
        },
        publishCredential: wallet.pluginMethods.publishContentToCeramic,
        addCredential: async credential => {
            await wallet.pluginMethods.addVerifiableCredentialInIdx(credential);
        },
        removeCredential: async title => {
            await wallet.pluginMethods.removeVerifiableCredentialInIdx(title);
        },

        resolveDid: wallet.pluginMethods.resolveDid,

        readFromCeramic: wallet.pluginMethods.readContentFromCeramic,
        resolveCredential: wallet.pluginMethods.resolveCredential,

        getTestVc: wallet.pluginMethods.getTestVc,
        getTestVp: wallet.pluginMethods.getTestVp,

        vpFromQrCode: wallet.pluginMethods.vpFromQrCode,
        vpToQrCode: wallet.pluginMethods.vpToQrCode,

        getEthereumAddress: wallet.pluginMethods.getEthereumAddress,
        getBalance: wallet.pluginMethods.getBalance,
        getBalanceForAddress: wallet.pluginMethods.getBalanceForAddress,
        transferTokens: wallet.pluginMethods.transferTokens,
        getCurrentNetwork: wallet.pluginMethods.getCurrentNetwork,
        changeNetwork: wallet.pluginMethods.changeNetwork,
        addInfuraProjectId: wallet.pluginMethods.addInfuraProjectId,

        installChapiHandler: wallet.pluginMethods.installChapiHandler,
        activateChapiHandler: wallet.pluginMethods.activateChapiHandler,
        receiveChapiEvent: wallet.pluginMethods.receiveChapiEvent,
        storePresentationViaChapi: wallet.pluginMethods.storePresentationViaChapi,
        storeCredentialViaChapiDidAuth: wallet.pluginMethods.storeCredentialViaChapiDidAuth,
    };
};
