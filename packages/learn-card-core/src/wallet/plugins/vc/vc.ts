import { recycleDependents } from '@helpers/wallet.helpers';

import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';
import { getBasicVc, getAchievementCredential } from './testVcs';

import { DependentMethods, VCPluginMethods } from './types';
import { Plugin, Wallet } from 'types/wallet';

export const getVCPlugin = async (
    wallet: Wallet<string, DependentMethods>
): Promise<Plugin<'VC', VCPluginMethods>> => {
    return {
        pluginMethods: {
            ...recycleDependents(wallet.pluginMethods),
            issueCredential: issueCredential(wallet),
            verifyCredential: verifyCredential(wallet),
            issuePresentation: issuePresentation(wallet),
            verifyPresentation: verifyPresentation(wallet),
            getTestVc: (_wallet, args = { type: 'basic' }) => {
                const defaults = {
                    did: _wallet.pluginMethods.getSubjectDid('key'),
                    subject: 'did:example:d23dd687a7dc6787646f2eb98d0',
                };

                const { type = 'basic', ...functionArgs } = args;

                if (type === 'basic') return getBasicVc({ ...defaults, ...functionArgs });

                if (type === 'achievement') {
                    return getAchievementCredential({
                        ...defaults,
                        ...functionArgs,
                    });
                }

                throw new Error('Invalid Test VC Type!');
            },
            getTestVp: async (_wallet, _credential) => {
                const credential =
                    _credential ||
                    (await _wallet.pluginMethods.issueCredential(
                        _wallet.pluginMethods.getTestVc()
                    ));

                const did = _wallet.pluginMethods.getSubjectDid('key');

                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiablePresentation'],
                    holder: did,
                    verifiableCredential: credential,
                };
            },
        },
    };
};
