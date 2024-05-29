import { loadOnce } from 'credential-handler-polyfill';
import { installHandler, activateHandler, receiveCredentialEvent } from 'web-credential-handler';

import { CHAPIPlugin } from './types';

/**
 * @group Plugins
 */
export const getCHAPIPlugin = async (): Promise<CHAPIPlugin> => {
    if (typeof window === 'undefined') {
        return {
            name: 'CHAPI',
            methods: {
                installChapiHandler: async () => {
                    throw new Error('CHAPI is only available inside of a browser!');
                },
                activateChapiHandler: async () => {
                    throw new Error('CHAPI is only available inside of a browser!');
                },
                receiveChapiEvent: async () => {
                    throw new Error('CHAPI is only available inside of a browser!');
                },
                storeCredentialViaChapiDidAuth: async () => {
                    throw new Error('CHAPI is only available inside of a browser!');
                },
                storePresentationViaChapi: async () => {
                    throw new Error('CHAPI is only available inside of a browser!');
                },
            },
        };
    }

    await loadOnce();

    return {
        name: 'CHAPI',
        displayName: 'CHAPI',
        description:
            'Credential Handler API. Allows sending/retrieving credentials across wallets and issuers',
        methods: {
            installChapiHandler: async () => installHandler(),
            activateChapiHandler: async (
                _learnCard,
                {
                    mediatorOrigin = `https://authn.io/mediator?${encodeURIComponent(
                        window.location.origin
                    )}`,
                    get,
                    store,
                }
            ) => {
                return activateHandler({ mediatorOrigin, get, store });
            },
            receiveChapiEvent: async () => receiveCredentialEvent(),
            storeCredentialViaChapiDidAuth: async (_learnCard, credential) => {
                const challenge = crypto.randomUUID();
                const domain = window.location.origin;

                const vpr = {
                    web: {
                        VerifiablePresentation: {
                            query: { type: 'DIDAuthentication' },
                            challenge,
                            domain,
                        },
                    },
                };

                const res = await navigator.credentials.get(vpr as any);

                if (!res) return { success: false, reason: 'did not auth' };

                const verification = await _learnCard.invoke.verifyPresentation((res as any).data, {
                    challenge,
                    domain,
                    proofPurpose: 'authentication',
                });

                if (verification.warnings.length > 0 || verification.errors.length > 0) {
                    return { success: false, reason: 'auth failed verification' };
                }

                const subject = (res as any).data?.proof?.verificationMethod?.split('#')[0];

                let issuedCredentials = [];

                // If sending multiple credentials through CHAPI
                if (Array.isArray(credential)) {
                    for (let x = 0; x < credential.length; x++) {
                        const cred = credential[x];
                        if (!Array.isArray(cred.credentialSubject)) {
                            cred.credentialSubject.id = subject;
                        }

                        issuedCredentials.push(await _learnCard.invoke.issueCredential(cred));
                    }
                } else {
                    // If sending one single credential through CHAPI
                    if (!Array.isArray(credential.credentialSubject)) {
                        credential.credentialSubject.id = subject;
                    }
                    issuedCredentials.push(await _learnCard.invoke.issueCredential(credential));
                }

                const vp = await _learnCard.invoke.getTestVp();
                vp.verifiableCredential = issuedCredentials;

                const success = await _learnCard.invoke.storePresentationViaChapi(vp);

                if (success) return { success: true };

                return { success: false, reason: 'did not store' };
            },
            storePresentationViaChapi: async (_learnCard, presentation) => {
                const wc = new WebCredential('VerifiablePresentation', presentation);

                return window.navigator.credentials.store(wc);
            },
        },
    };
};