import { generateWallet } from '@wallet/base';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

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

    const chapiWallet = await templatesWallet.addPlugin(await getCHAPIPlugin());

    return chapiWallet.addPlugin(getLearnCardPlugin(chapiWallet));
};
