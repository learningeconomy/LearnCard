import { generateWallet } from '@wallet/base';
import { getVCAPIPlugin } from '@wallet/plugins/vc-api';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

import { WalletFromVcApi } from 'types/LearnCard';

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

    const chapiWallet = await templateWallet.addPlugin(await getCHAPIPlugin());

    return chapiWallet.addPlugin(getLearnCardPlugin(chapiWallet));
};
