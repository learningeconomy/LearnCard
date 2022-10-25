import { Wallet } from 'types/wallet';
import { LearnCardPluginDependentMethods, LearnCardPlugin } from './types';
import { verifyCredential } from './verify';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardPlugin = (
    wallet: Wallet<any, any, LearnCardPluginDependentMethods>
): LearnCardPlugin => ({
    name: 'LearnCard',
    displayName: 'LearnCard',
    description: 'Adds opinionated LearnCard logic to a wallet',
    methods: {
        verifyCredential: verifyCredential(wallet) as any,
    },
});
