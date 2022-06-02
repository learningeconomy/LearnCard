import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';

import { VCPluginMethods } from './types';
import { Plugin, UnlockedWallet } from 'types/wallet';

export const getVCPlugin = async (
    wallet: UnlockedWallet<
        any,
        {
            getSubjectDid: () => string;
            getSubjectKeypair: () => Record<string, string>;
        },
        any
    >
): Promise<Plugin<'VC', VCPluginMethods>> => {
    return {
        pluginMethods: {
            ...wallet.pluginMethods,
            issueCredential,
            verifyCredential: async (_wallet, credential) => verifyCredential(credential),
            issuePresentation,
            verifyPresentation: async (_wallet, presentation) => verifyPresentation(presentation),
            getTestVc: (_wallet, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                const did = _wallet.pluginMethods.getSubjectDid();

                return {
                    '@context': 'https://www.w3.org/2018/credentials/v1',
                    id: 'http://example.org/credentials/3731',
                    type: ['VerifiableCredential'],
                    issuer: did,
                    issuanceDate: '2020-08-19T21:41:50Z',
                    credentialSubject: { id: subject },
                };
            },
        },
        pluginConstants: {},
    };
};
