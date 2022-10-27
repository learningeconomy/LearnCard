import {
    UnsignedVCValidator,
    VCValidator,
    UnsignedVPValidator,
    VPValidator,
    VerificationCheckValidator,
} from '@learncard/types';

import { VCAPIPlugin } from './types';
import { isSuccessful, post } from './helpers';

/**
 * @group Plugins
 */
export const getVCAPIPlugin = async ({
    url: _url,
    did: _did,
}: {
    url: string;
    did?: string;
}): Promise<VCAPIPlugin> => {
    const url = _url.endsWith('/') ? _url.slice(0, -1) : _url;
    let did = _did;

    if (!did) {
        const res = await fetch(`${url}/did`);

        if (res.status === 200) did = await res.text();
    }

    if (!did) throw new Error('Could not retrieve did from VC API! Please suppy a did.');

    return {
        name: 'VC API',
        displayName: 'VC API',
        description:
            'Handles issuing and signing credentials/presentations using an external VC API',
        id: {
            did: () => did!,
            keypair: () => {
                throw new Error('Cannot get keypair when using VC API');
            },
        },
        methods: {
            getSubjectDid: () => did!,
            issueCredential: async (_learnCard, credential, options) => {
                await UnsignedVCValidator.parseAsync(credential);

                const response = await post(`${url}/credentials/issue`, { credential, options });

                if (!isSuccessful(response.status)) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                return VCValidator.parseAsync(await response.json());
            },
            verifyCredential: async (_learnCard, verifiableCredential, options) => {
                await VCValidator.parseAsync(verifiableCredential);

                const response = await post(`${url}/credentials/verify`, {
                    verifiableCredential,
                    options,
                });

                if (!isSuccessful(response.status)) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                return VerificationCheckValidator.parseAsync(await response.json());
            },
            issuePresentation: async (_learnCard, presentation, options) => {
                await UnsignedVPValidator.parseAsync(presentation);

                const response = await post(`${url}/presentations/issue`, {
                    presentation,
                    options,
                });

                if (!isSuccessful(response.status)) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                return VPValidator.parseAsync(await response.json());
            },
            verifyPresentation: async (_learnCard, verifiablePresentation, options) => {
                await VPValidator.parseAsync(verifiablePresentation);

                const response = await post(`${url}/presentations/verify`, {
                    verifiablePresentation,
                    options,
                });

                if (!isSuccessful(response.status)) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                return VerificationCheckValidator.parseAsync(await response.json());
            },
            getTestVc: (_learnCard, subject = 'did:example:d23dd687a7dc6787646f2eb98d0') => {
                return {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    id: 'http://example.org/credentials/3731',
                    type: ['VerifiableCredential'],
                    issuer: did!,
                    issuanceDate: '2020-08-19T21:41:50Z',
                    credentialSubject: { id: subject },
                };
            },
            getTestVp: async (_learnCard, _credential) => {
                const credential =
                    _credential ||
                    (await _learnCard.invoke.issueCredential(_learnCard.invoke.getTestVc()));

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
