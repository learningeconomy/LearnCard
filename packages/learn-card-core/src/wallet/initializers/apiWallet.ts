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
        read: wallet.read,
        store: wallet.store,
        index: wallet.index,

        did: (type = 'key') => wallet.invoke.getSubjectDid(type),

        newCredential: wallet.invoke.newCredential,
        newPresentation: wallet.invoke.newPresentation,

        issueCredential: wallet.invoke.issueCredential,
        verifyCredential: verifyCredential(wallet),
        issuePresentation: wallet.invoke.issuePresentation,
        verifyPresentation: wallet.invoke.verifyPresentation,

        getTestVc: wallet.invoke.getTestVc,
        getTestVp: wallet.invoke.getTestVp,

        installChapiHandler: wallet.invoke.installChapiHandler,
        activateChapiHandler: wallet.invoke.activateChapiHandler,
        receiveChapiEvent: wallet.invoke.receiveChapiEvent,
        storePresentationViaChapi: wallet.invoke.storePresentationViaChapi,
        storeCredentialViaChapiDidAuth: wallet.invoke.storeCredentialViaChapiDidAuth,
    };
};
