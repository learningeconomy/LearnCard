import { loadOnce } from 'credential-handler-polyfill';
import { installHandler, activateHandler, receiveCredentialEvent } from 'web-credential-handler';

import { CHAPIPluginMethods, CHAPIPluginDependentMethods } from './types';
import { Plugin } from 'types/wallet';

/**
 * @group Plugins
 */
export const getCHAPIPlugin = async (): Promise<
    Plugin<'CHAPI', CHAPIPluginMethods, CHAPIPluginDependentMethods>
> => {
    if (typeof window === 'undefined') {
        return {
            pluginMethods: {
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
        pluginMethods: {
            installChapiHandler: async () => installHandler(),
            activateChapiHandler: async (
                _wallet,
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
            storeCredentialViaChapiDidAuth: async (wallet, credential) => {
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

                const verification = await wallet.pluginMethods.verifyPresentation(
                    (res as any).data,
                    {
                        challenge,
                        domain,
                    }
                );

                if (verification.warnings.length > 0 || verification.errors.length > 0) {
                    return { success: false, reason: 'auth failed verification' };
                }

                const subject = (res as any).data?.proof?.verificationMethod?.split('#')[0];

                if (!Array.isArray(credential.credentialSubject)) {
                    credential.credentialSubject.id = subject;
                }

                const vp = await wallet.pluginMethods.issuePresentation(
                    await wallet.pluginMethods.getTestVp(
                        await wallet.pluginMethods.issueCredential(credential)
                    )
                );

                const success = await wallet.pluginMethods.storePresentationViaChapi(vp);

                if (success) return { success: true };

                return { success: false, reason: 'did not store' };
            },
            storePresentationViaChapi: async (_wallet, presentation) => {
                const wc = new WebCredential('VerifiablePresentation', presentation);

                return window.navigator.credentials.store(wc);
            },
        },
    };
};
