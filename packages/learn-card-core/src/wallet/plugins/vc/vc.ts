import { recycleDependents } from '@helpers/wallet.helpers';

import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';

import { DependentMethods, VCPluginMethods } from './types';
import { Plugin, UnlockedWallet } from 'types/wallet';

export const getVCPlugin = async (
    wallet: UnlockedWallet<string, DependentMethods>
): Promise<Plugin<'VC', VCPluginMethods>> => {
    return {
        pluginMethods: {
            ...recycleDependents(wallet.pluginMethods),
            issueCredential: issueCredential(wallet),
            verifyCredential: verifyCredential(wallet),
            issuePresentation: issuePresentation(wallet),
            verifyPresentation: verifyPresentation(wallet),
            getTestVc: (_wallet, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                const did = _wallet.pluginMethods.getSubjectDid();

                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    id: 'http://example.org/credentials/3731',
                    type: ['VerifiableCredential'],
                    issuer: did,
                    issuanceDate: '2020-08-19T21:41:50Z',
                    credentialSubject: { id: subject },
                };
            },
        },
    };
};
