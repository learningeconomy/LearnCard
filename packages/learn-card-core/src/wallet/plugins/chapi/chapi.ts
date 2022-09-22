import { loadOnce } from 'credential-handler-polyfill';
import { installHandler, activateHandler, receiveCredentialEvent } from 'web-credential-handler';

import { recycleDependents } from '@helpers/wallet.helpers';

import { CHAPIPluginMethods } from './types';
import { Plugin, Wallet } from 'types/wallet';

/**
 * @group Plugins
 */
export const getCHAPIPlugin = async (
    wallet: Wallet<string, any>
): Promise<Plugin<'CHAPI', CHAPIPluginMethods>> => {
    if (typeof window === 'undefined') {
        return {
            ...recycleDependents(wallet.pluginMethods),
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
            },
        };
    }

    await loadOnce();

    return {
        ...recycleDependents(wallet.pluginMethods),
        pluginMethods: {
            installChapiHandler: async () => installHandler(),
            activateChapiHandler: async (_wallet, { mediatorOrigin, get, store }) => {
                return activateHandler({ mediatorOrigin, get, store });
            },
            receiveChapiEvent: async () => receiveCredentialEvent(),
        },
    };
};
