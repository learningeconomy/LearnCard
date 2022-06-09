// eslint-disable no-use-before-define

/* import {
    lockContents,
    unlockContents,
    exportContentsAsCredential,
    contentsFromEncryptedWalletCredential,
} from './functions'; */

import { Plugin, WalletStatus, UnlockedWallet } from 'types/wallet';

const addPluginToWallet = async <
    Name extends string,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    wallet: UnlockedWallet<PluginNames, PluginMethods>,
    plugin: Plugin<Name, Methods>
): Promise<
    UnlockedWallet<
        '' extends PluginNames ? Name : PluginNames | Name,
        Record<never, never> extends PluginMethods ? Methods : PluginMethods & Methods
    >
> => {
    return generateWallet<
        '' extends PluginNames ? Name : PluginNames | Name,
        Record<never, never> extends PluginMethods ? Methods : PluginMethods & Methods
    >(wallet.contents, {
        plugins: [...wallet.plugins, plugin as Plugin<any, any>],
    });
};

const addToWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>
>(
    wallet: UnlockedWallet<PluginNames, PluginMethods>,
    content: any
): Promise<UnlockedWallet<PluginNames, PluginMethods>> => {
    return generateWallet([...wallet.contents, content], wallet);
};

const removeFromWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>
>(
    wallet: UnlockedWallet<PluginNames, PluginMethods>,
    contentId: string
): Promise<UnlockedWallet<PluginNames, PluginMethods>> => {
    const clonedContents = JSON.parse(JSON.stringify(wallet.contents));

    const content = clonedContents.find((c: any) => c.id === contentId);

    return generateWallet(
        clonedContents.filter((i: any) => i.id !== content.id),
        wallet
    );
};

/* const lockWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>,
    PluginConstants extends Record<string, any>
>(
    wallet: UnlockedWallet<PluginNames, PluginMethods, PluginConstants>,
    password: string
): Promise<LockedWallet<PluginNames, PluginMethods, PluginConstants>> => {
    const {
        add,
        remove,
        lock,
        export: e,
        import: i,
        addPlugin,
        contents,
        ...lockedFields
    } = wallet;
    const lockedContents = await lockContents(password, contents);

    return {
        ...lockedFields,
        contents: lockedContents,
        status: WalletStatus.Locked,
        unlock: async function (_password: string) {
            try {
                return {
                    success: true,
                    wallet: generateWallet(await unlockContents(_password, this.contents), wallet),
                };
            } catch (error) {
                return { success: false, wallet: this };
            }
        },
    } as LockedWallet<PluginNames, PluginMethods, PluginConstants>;
}; */

const bindMethods = <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>
>(
    wallet: UnlockedWallet<PluginNames, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods =>
    Object.fromEntries(
        Object.entries(pluginMethods).map(([key, method]) => [key, method.bind(wallet, wallet)])
    ) as PluginMethods;

export const generateWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    contents: any[] = [],
    _wallet: Partial<UnlockedWallet<any, PluginMethods>> = {}
): Promise<UnlockedWallet<PluginNames, PluginMethods>> => {
    const { plugins = [] } = _wallet;

    /* const exportFunction = async (password: string): Promise<any> => {
        return exportContentsAsCredential(password, contents);
    };

    const importFunction = async (encryptedWalletCredential: any, password: string) => {
        if (contents.length > 0) throw new Error('Cannot import over existing wallet content.');

        return generateWallet(
            await contentsFromEncryptedWalletCredential(password, encryptedWalletCredential),
            _wallet
        );
    }; */

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...cumulativePluginMethods, ...plugin.pluginMethods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const wallet: UnlockedWallet<PluginNames, PluginMethods> = {
        contents: [...contents],
        add: function (content: any) {
            return addToWallet(this, content);
        },
        remove: function (contentId: string) {
            return removeFromWallet(this, contentId);
        },
        /* lock: async function (password: string) {
            return lockWallet(this, password);
        },
        export: exportFunction,
        import: importFunction, */
        status: WalletStatus.Unlocked,
        plugins,
        pluginMethods,
        addPlugin: function (plugin) {
            return addPluginToWallet(this, plugin);
        },
    } as UnlockedWallet<PluginNames, PluginMethods>;

    if (pluginMethods) wallet.pluginMethods = bindMethods(wallet, pluginMethods);

    return wallet;
};
