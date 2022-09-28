import { generateWallet } from '@wallet/base';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { ExpirationPlugin } from '@wallet/plugins/expiration';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { verifyCredential } from '@wallet/verify';

import { EmptyWallet } from 'types/LearnCard';

/**
 * Generates an empty wallet with no key material
 *
 * @group Init Functions
 */
export const emptyWallet = async ({ didkit }: EmptyWallet['args'] = {}): Promise<
    EmptyWallet['returnValue']
> => {
    const didkitWallet = await (await generateWallet()).addPlugin(await getDidKitPlugin(didkit));

    const expirationWallet = await didkitWallet.addPlugin(ExpirationPlugin(didkitWallet));

    const wallet = await expirationWallet.addPlugin(await getCHAPIPlugin());

    return {
        _wallet: wallet,

        verifyCredential: verifyCredential(wallet),
        verifyPresentation: wallet.pluginMethods.verifyPresentation,

        resolveDid: wallet.pluginMethods.resolveDid,

        installChapiHandler: wallet.pluginMethods.installChapiHandler,
        activateChapiHandler: wallet.pluginMethods.activateChapiHandler,
        receiveChapiEvent: wallet.pluginMethods.receiveChapiEvent,
        storePresentationViaChapi: wallet.pluginMethods.storePresentationViaChapi,
    };
};
