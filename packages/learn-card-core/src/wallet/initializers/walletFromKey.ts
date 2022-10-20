import { generateWallet } from '@wallet/base';
import { DidMethod, getDidKitPlugin } from '@wallet/plugins/didkit';
import { getDidKeyPlugin } from '@wallet/plugins/didkey';
import { getVCPlugin } from '@wallet/plugins/vc';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { VCResolutionPlugin } from '@wallet/plugins/vc-resolution';
import { getCeramicPlugin } from '@wallet/plugins/ceramic';
import { getIDXPlugin } from '@wallet/plugins/idx';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getEthereumPlugin } from '@wallet/plugins/EthereumPlugin';
import { getVpqrPlugin } from '@wallet/plugins/vpqr';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

import { LearnCardConfig, LearnCardFromKey } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from '@wallet/defaults';

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
): Promise<LearnCardFromKey> => {
    const didkitWallet = await (
        await generateWallet({ debug })
    ).addPlugin(await getDidKitPlugin(didkit));

    const didkeyWallet = await didkitWallet.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitWallet, key, 'key')
    );

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

    const chapiWallet = await vpqrWallet.addPlugin(await getCHAPIPlugin());

    return chapiWallet.addPlugin(getLearnCardPlugin(chapiWallet));
};
