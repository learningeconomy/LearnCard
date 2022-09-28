import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';

import { VCPluginDependentMethods, VCPluginMethods } from './types';
import { Plugin, Wallet } from 'types/wallet';

/**
 * @group Plugins
 */
export const getVCPlugin = (
    wallet: Wallet<string, VCPluginDependentMethods>
): Plugin<'VC', VCPluginMethods, VCPluginDependentMethods> => {
    return {
        pluginMethods: {
            issueCredential: issueCredential(wallet),
            verifyCredential: verifyCredential(wallet),
            issuePresentation: issuePresentation(wallet),
            verifyPresentation: verifyPresentation(wallet),
            getTestVc: (_wallet, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                const did = _wallet.pluginMethods.getSubjectDid('key');

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
