import { Wallet } from 'types/wallet';
import { LearnCardPluginDependentMethods, LearnCardPlugin } from './types';
import { verifyCredential } from './verify';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardPlugin = (
    wallet: Wallet<any, LearnCardPluginDependentMethods>
): LearnCardPlugin => ({
    name: 'Learn Card',
    methods: {
        verifyCredential: verifyCredential(wallet) as any,
    },
});
