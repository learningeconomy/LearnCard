import { generateLearnCard } from '@wallet/base';
import { CryptoPlugin } from '@wallet/plugins';
import { getDidKitPlugin } from '@wallet/plugins/didkit';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

import { EmptyLearnCard } from 'types/LearnCard';

/**
 * Generates an empty wallet with no key material
 *
 * @group Init Functions
 */
export const emptyLearnCard = async ({ didkit, debug }: EmptyLearnCard['args'] = {}): Promise<
    EmptyLearnCard['returnValue']
> => {
    const cryptoLc = await (await generateLearnCard({ debug })).addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit));

    const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

    const templatesLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

    const chapiLc = await templatesLc.addPlugin(await getCHAPIPlugin());

    return chapiLc.addPlugin(getLearnCardPlugin(chapiLc));
};
