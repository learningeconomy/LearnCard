import { loadOnce } from 'credential-handler-polyfill';
import { installHandler, activateHandler, receiveCredentialEvent } from 'web-credential-handler';

import { CHAPIPluginMethods } from './types';
import { Plugin } from 'types/wallet';

/**
 * @group Plugins
 */
export const getCHAPIPlugin = async (): Promise<Plugin<'CHAPI', CHAPIPluginMethods>> => {
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
            storePresentationViaChapi: async (_wallet, presentation) => {
                const wc = new WebCredential('VerifiablePresentation', presentation);

                return window.navigator.credentials.store(wc);
            },
        },
    };
};
