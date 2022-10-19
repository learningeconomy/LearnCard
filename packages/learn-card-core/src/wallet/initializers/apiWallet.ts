import { generateWallet } from '@wallet/base';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { verifyCredential } from '@wallet/verify';

import { WalletFromVcApi } from 'types/LearnCard';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { getVCAPIPlugin } from '@wallet/plugins/vc-api';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const walletFromApiUrl = async ({
    url,
    did,
    debug,
}: {
    url: string;
    did?: string;
    debug?: typeof console.log;
}): Promise<WalletFromVcApi['returnValue']> => {
    const apiWallet = await (
        await generateWallet({ debug })
    ).addPlugin(await getVCAPIPlugin({ url, did }));

    const expirationWallet = await apiWallet.addPlugin(expirationPlugin(apiWallet));

    const templateWallet = await expirationWallet.addPlugin(getVCTemplatesPlugin());

    const wallet = await templateWallet.addPlugin(await getCHAPIPlugin());

    return {
        _wallet: wallet,

        did: (type = 'key') => wallet.pluginMethods.getSubjectDid(type),

        newCredential: wallet.pluginMethods.newCredential,
        newPresentation: wallet.pluginMethods.newPresentation,

        issueCredential: wallet.pluginMethods.issueCredential,
        verifyCredential: verifyCredential(wallet),
        issuePresentation: wallet.pluginMethods.issuePresentation,
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        getTestVc: wallet.pluginMethods.getTestVc,
        getTestVp: wallet.pluginMethods.getTestVp,

        installChapiHandler: wallet.pluginMethods.installChapiHandler,
        activateChapiHandler: wallet.pluginMethods.activateChapiHandler,
        receiveChapiEvent: wallet.pluginMethods.receiveChapiEvent,
        storePresentationViaChapi: wallet.pluginMethods.storePresentationViaChapi,
        storeCredentialViaChapiDidAuth: wallet.pluginMethods.storeCredentialViaChapiDidAuth,
    };
};
