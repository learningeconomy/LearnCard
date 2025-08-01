import { VC_TEMPLATES } from './templates';

import { VCTemplatePlugin } from './types';

/**
 * @group Plugins
 */
export const getVCTemplatesPlugin = (): VCTemplatePlugin => {
    return {
        name: 'VC Templates',
        displayName: 'VC Templates',
        description: 'Allows for the easy creation of VCs and VPs based on predefined templates',
        methods: {
            newCredential: (_learnCard, args = { type: 'basic' }) => {
                const did = args.did || _learnCard.id.did();

                if (!did) throw new Error('Could not get issuer did!');

                const defaults = {
                    did,
                    subject: 'did:example:d23dd687a7dc6787646f2eb98d0',
                    issuanceDate: new Date().toISOString(),
                };

                const { type = 'basic', ...functionArgs } = args;

                if (!(type in VC_TEMPLATES)) throw new Error('Invalid Test VC Type!');

                return VC_TEMPLATES[type](
                    { ...defaults, ...functionArgs },
                    _learnCard.invoke.crypto()
                );
            },
            newPresentation: async (_learnCard, credential, args = {}) => {
                const did = args?.did || _learnCard.id.did();

                if (!did) throw new Error('Could not get issuer did!');

                return {
                    '@context': ['https://www.w3.org/ns/credentials/v2'],
                    type: ['VerifiablePresentation'],
                    holder: did,
                    verifiableCredential: credential,
                };
            },
        },
    };
};
