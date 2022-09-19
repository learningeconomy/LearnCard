import { generateWallet } from '@wallet/base';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { ExpirationPlugin } from '@wallet/plugins/expiration';
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

    const wallet = await didkitWallet.addPlugin(ExpirationPlugin(didkitWallet));

    return {
        _wallet: wallet,

        verifyCredential: verifyCredential(wallet),
        verifyPresentation: wallet.pluginMethods.verifyPresentation,
    };
};
