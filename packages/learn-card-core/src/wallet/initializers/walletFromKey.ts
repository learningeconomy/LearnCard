import { generateWallet } from '@wallet/base';
import { getCeramicPlugin } from '@wallet/plugins/ceramic';
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
        debug,
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCard> => {
    const didkitWallet = await (
        await generateWallet({ debug })
    ).addPlugin(await getDidKitPlugin(didkit));

    const didkeyWallet = await didkitWallet.addPlugin(await getDidKeyPlugin(didkitWallet, key));

    const didkeyAndVCWallet = await didkeyWallet.addPlugin(getVCPlugin(didkeyWallet));

    const templateWallet = await didkeyAndVCWallet.addPlugin(getVCTemplatesPlugin());

    const resolutionWallet = await templateWallet.addPlugin(VCResolutionPlugin);

    const ceramicWallet = await resolutionWallet.addPlugin(
        await getCeramicPlugin(resolutionWallet, ceramicIdx)
    );

    const idxWallet = await ceramicWallet.addPlugin(await getIDXPlugin(ceramicWallet, ceramicIdx));
    const expirationWallet = await idxWallet.addPlugin(expirationPlugin(idxWallet));

    const ethWallet = await expirationWallet.addPlugin(
        getEthereumPlugin(expirationWallet, ethereumConfig)
    );

    const vpqrWallet = await ethWallet.addPlugin(getVpqrPlugin(ethWallet));

    const wallet = await vpqrWallet.addPlugin(await getCHAPIPlugin());

    return {
        _wallet: wallet,
        read: wallet.read,
        store: wallet.store,
        index: wallet.index,

        did: (type = 'key') => wallet.invoke.getSubjectDid(type),
        keypair: (type = 'ed25519') => wallet.invoke.getSubjectKeypair(type),

        newCredential: wallet.invoke.newCredential,
        newPresentation: wallet.invoke.newPresentation,

        issueCredential: wallet.invoke.issueCredential,
        verifyCredential: verifyCredential(wallet),
        issuePresentation: wallet.invoke.issuePresentation,
        verifyPresentation: wallet.invoke.verifyPresentation,

        getCredential: wallet.invoke.getVerifiableCredentialFromIdx,
        getCredentials: wallet.invoke.getVerifiableCredentialsFromIdx,
        getCredentialsList: async <
            Metadata extends Record<string, any> = Record<never, never>
        >() => {
            return (await wallet.invoke.getCredentialsListFromIdx<Metadata>()).credentials;
        },
        publishCredential: wallet.invoke.publishContentToCeramic,
        addCredential: async credential => {
            await wallet.invoke.addVerifiableCredentialInIdx(credential);
        },
        removeCredential: async title => {
            await wallet.invoke.removeVerifiableCredentialInIdx(title);
        },

        resolveDid: wallet.invoke.resolveDid,

        readFromCeramic: wallet.invoke.readContentFromCeramic,
        resolveCredential: wallet.invoke.resolveCredential,

        getTestVc: wallet.invoke.getTestVc,
        getTestVp: wallet.invoke.getTestVp,

        vpFromQrCode: wallet.invoke.vpFromQrCode,
        vpToQrCode: wallet.invoke.vpToQrCode,

        getEthereumAddress: wallet.invoke.getEthereumAddress,
        getBalance: wallet.invoke.getBalance,
        getBalanceForAddress: wallet.invoke.getBalanceForAddress,
        transferTokens: wallet.invoke.transferTokens,
        getCurrentNetwork: wallet.invoke.getCurrentNetwork,
        changeNetwork: wallet.invoke.changeNetwork,
        addInfuraProjectId: wallet.invoke.addInfuraProjectId,

        installChapiHandler: wallet.invoke.installChapiHandler,
        activateChapiHandler: wallet.invoke.activateChapiHandler,
        receiveChapiEvent: wallet.invoke.receiveChapiEvent,
        storePresentationViaChapi: wallet.invoke.storePresentationViaChapi,
        storeCredentialViaChapiDidAuth: wallet.invoke.storeCredentialViaChapiDidAuth,
    };
};
