import { generateLearnCard } from '@wallet/base';
import { CryptoPlugin } from '@wallet/plugins';
import { getVCAPIPlugin } from '@wallet/plugins/vc-api';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

import { LearnCardFromVcApi } from 'types/LearnCard';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const learnCardFromApiUrl = async ({
    url,
    did,
    debug,
}: {
    url: string;
    did?: string;
    debug?: typeof console.log;
}): Promise<LearnCardFromVcApi['returnValue']> => {
    const cryptoLc = await (await generateLearnCard({ debug })).addPlugin(CryptoPlugin);

    const apiLc = await cryptoLc.addPlugin(await getVCAPIPlugin({ url, did }));

    const expirationLc = await apiLc.addPlugin(expirationPlugin(apiLc));

    const templateLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

    const chapiLc = await templateLc.addPlugin(await getCHAPIPlugin());

    return chapiLc.addPlugin(getLearnCardPlugin(chapiLc));
};
