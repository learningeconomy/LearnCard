import { generateWallet } from '@wallet/base';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { verifyCredential } from '@wallet/verify';

import { EmptyWallet } from 'types/LearnCard';

/**
 * Generates an empty wallet with no key material
 *
 * @group Init Functions
 */
export const emptyWallet = async ({ didkit, debug }: EmptyWallet['args'] = {}): Promise<
    EmptyWallet['returnValue']
> => {
    const didkitWallet = await (
        await generateWallet({ debug })
    ).addPlugin(await getDidKitPlugin(didkit));

    const expirationWallet = await didkitWallet.addPlugin(expirationPlugin(didkitWallet));

    const templatesWallet = await expirationWallet.addPlugin(getVCTemplatesPlugin());

    const wallet = await templatesWallet.addPlugin(await getCHAPIPlugin());

    return {
        _wallet: wallet,
        read: wallet.read,
        store: wallet.store,
        index: wallet.index,

        newCredential: wallet.pluginMethods.newCredential,
        newPresentation: wallet.pluginMethods.newPresentation,

        verifyCredential: verifyCredential(wallet),
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        resolveDid: wallet.pluginMethods.resolveDid,

        installChapiHandler: wallet.pluginMethods.installChapiHandler,
        activateChapiHandler: wallet.pluginMethods.activateChapiHandler,
        receiveChapiEvent: wallet.pluginMethods.receiveChapiEvent,
        storePresentationViaChapi: wallet.pluginMethods.storePresentationViaChapi,
        storeCredentialViaChapiDidAuth: wallet.pluginMethods.storeCredentialViaChapiDidAuth,
    };
};
