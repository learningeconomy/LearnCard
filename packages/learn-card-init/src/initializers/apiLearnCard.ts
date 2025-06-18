import { generateLearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { getVCAPIPlugin } from '@learncard/vc-api-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';

import type { LearnCardFromVcApi } from '../types/LearnCard';

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
