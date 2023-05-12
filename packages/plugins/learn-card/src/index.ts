import { LearnCard } from '@learncard/core';
import { LearnCardPluginDependentMethods, LearnCardPlugin } from './types';
import { verifyCredential } from './verify';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardPlugin = (
    learnCard: LearnCard<any, any, LearnCardPluginDependentMethods>
): LearnCardPlugin => ({
    name: 'LearnCard',
    displayName: 'LearnCard',
    description: 'Adds opinionated logic to a LearnCard',
    methods: {
        verifyCredential: verifyCredential(learnCard) as any,
    },
});
