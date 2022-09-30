// eslint-disable no-use-before-define

import { Plugin, Wallet } from 'types/wallet';

const addPluginToWallet = async <
    Name extends string,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    wallet: Wallet<PluginNames, PluginMethods>,
    plugin: Plugin<Name, Methods>
): Promise<
    Wallet<
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
    wallet: Wallet<PluginNames, PluginMethods>,
    content: any
): Promise<Wallet<PluginNames, PluginMethods>> => {
    return generateWallet([...wallet.contents, content], wallet);
};

const removeFromWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>
>(
    wallet: Wallet<PluginNames, PluginMethods>,
    contentId: string
): Promise<Wallet<PluginNames, PluginMethods>> => {
    const clonedContents = JSON.parse(JSON.stringify(wallet.contents));

    const content = clonedContents.find((c: any) => c.id === contentId);

    return generateWallet(
        clonedContents.filter((i: any) => i.id !== content.id),
        wallet
    );
};

const bindMethods = <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any>
>(
    wallet: Wallet<PluginNames, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods =>
    Object.fromEntries(
        Object.entries(pluginMethods).map(([key, method]) => [key, method.bind(wallet, wallet)])
    ) as PluginMethods;

/** @group Universal Wallets */
export const generateWallet = async <
    PluginNames extends string,
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    contents: any[] = [],
    _wallet: Partial<Wallet<any, PluginMethods>> = {}
): Promise<Wallet<PluginNames, PluginMethods>> => {
    const { plugins = [] } = _wallet;

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...cumulativePluginMethods, ...plugin.pluginMethods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const wallet: Wallet<PluginNames, PluginMethods> = {
        contents: [...contents],
        add: function (content: any) {
            return addToWallet(this, content);
        },
        remove: function (contentId: string) {
            return removeFromWallet(this, contentId);
        },
        plugins,
        pluginMethods,
        addPlugin: function (plugin) {
            return addPluginToWallet(this, plugin);
        },
    } as Wallet<PluginNames, PluginMethods>;

    if (pluginMethods) wallet.pluginMethods = bindMethods(wallet, pluginMethods);

    return wallet;
};
