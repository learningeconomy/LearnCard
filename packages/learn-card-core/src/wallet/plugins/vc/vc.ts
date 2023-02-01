import { issueCredential } from './issueCredential';
import { verifyCredential } from './verifyCredential';
import { issuePresentation } from './issuePresentation';
import { verifyPresentation } from './verifyPresentation';

import { VCDependentLearnCard, VCPlugin } from './types';
import { UnsignedVP } from '@learncard/types';

/**
 * @group Plugins
 */
export const getVCPlugin = (learnCard: VCDependentLearnCard): VCPlugin => {
    return {
        name: 'VC',
        displayName: 'VC',
        description:
            'Handles the infrastructure needed to issue and verify credentials and presentations',
        methods: {
            issueCredential: issueCredential(learnCard),
            verifyCredential: verifyCredential(learnCard),
            issuePresentation: issuePresentation(learnCard),
            verifyPresentation: verifyPresentation(learnCard),
            getTestVc: (_learnCard, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                const did = _learnCard.invoke.getSubjectDid('key');

                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    id: 'http://example.org/credentials/3731',
                    type: ['VerifiableCredential'],
                    issuer: did,
                    issuanceDate: '2020-08-19T21:41:50Z',
                    credentialSubject: { id: subject },
                };
            },
            getTestVp: async (_learnCard, _credential) => {
                const credential =
                    _credential ||
                    (await _learnCard.invoke.issueCredential(_learnCard.invoke.getTestVc()));

                const did = _learnCard.invoke.getSubjectDid('key');

                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiablePresentation'],
                    holder: did,
                    verifiableCredential: credential,
                };
            },
            getDidAuthVp: async (_learnCard, options = {}) => {
                const did = _learnCard.invoke.getSubjectDid('key');
                const unsignedVP: UnsignedVP = {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiablePresentation'],
                    holder: did,
                };

                return _learnCard.invoke.issuePresentation(unsignedVP, {
                    proofPurpose: 'authentication',
                    ...options,
                });
            },
        },
    };
};
