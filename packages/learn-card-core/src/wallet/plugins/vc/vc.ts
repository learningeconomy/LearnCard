import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';

import { VCPlugin, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

/**
 * @group Plugins
 */
export const getVCPlugin = (wallet: Wallet<any, VCPluginDependentMethods>): VCPlugin => {
    return {
        name: 'VC',
        methods: {
            issueCredential: issueCredential(wallet),
            verifyCredential: verifyCredential(wallet),
            issuePresentation: issuePresentation(wallet),
            verifyPresentation: verifyPresentation(wallet),
            getTestVc: (_wallet, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                const did = _wallet.invoke.getSubjectDid('key');

                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    id: 'http://example.org/credentials/3731',
                    type: ['VerifiableCredential'],
                    issuer: did,
                    issuanceDate: '2020-08-19T21:41:50Z',
                    credentialSubject: { id: subject },
                };
            },
            getTestVp: async (_wallet, _credential) => {
                const credential =
                    _credential ||
                    (await _wallet.invoke.issueCredential(_wallet.invoke.getTestVc()));

                const did = _wallet.invoke.getSubjectDid('key');

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
