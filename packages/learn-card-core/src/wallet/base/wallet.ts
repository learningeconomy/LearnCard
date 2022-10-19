import { Plugin, Wallet, GetPluginMethods } from 'types/wallet';
import {
    ReadPlane,
    CachePlane,
    IndexPlane,
    WalletStorePlane,
    WalletIndexPlane,
} from 'types/planes';

const addPluginToWallet = async <NewPlugin extends Plugin, Plugins extends Plugin[]>(
    wallet: Wallet<Plugins>,
    plugin: NewPlugin
): Promise<Wallet<[...Plugins, NewPlugin]>> => {
    // eslint-disable-next-line
    return generateWallet({ plugins: [...wallet.plugins, plugin] });
};

const bindReadPlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): ReadPlane => {
    return {
        get: async uri => {
            console.debug('wallet.read.get', uri);

            const cachedResponse = await wallet.cache.getVc(uri);

            if (cachedResponse) return cachedResponse;

            const vc = await Promise.any(
                wallet.plugins.map(async plugin => {
                    if (!plugin.read) throw new Error('Plugin is not a Read Plugin');

                    return plugin.read.get(uri);
                })
            );

            if (vc) await wallet.cache.setVc?.(uri, vc);

            return vc;
        },
    };
};

const bindStorePlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): WalletStorePlane<Plugins> => {
    return wallet.plugins.reduce((acc, cur) => {
        if (cur.store) acc[cur.name as keyof typeof acc] = cur.store;

        return acc;
    }, {} as WalletStorePlane<Plugins>);
};

const bindIndexPlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): WalletIndexPlane<Plugins> => {
    const individualPlanes = wallet.plugins.reduce<Omit<WalletIndexPlane<Plugins>, 'all'>>(
        (acc, cur) => {
            if (cur.index) (acc as any)[cur.name] = cur.index;

            return acc;
        },
        {} as Omit<WalletIndexPlane<Plugins>, 'all'>
    );

    const all: Pick<IndexPlane, 'get'> = {
        get: async query => {
            console.debug('wallet.index.all.get');

            const resultsWithDuplicates = (
                await Promise.all(
                    wallet.plugins.map(async plugin => {
                        if (!plugin.index) return [];

                        return plugin.index.get(query);
                    })
                )
            ).flat();

            return [...new Set(resultsWithDuplicates)];
        },
    };

    return { ...individualPlanes, all } as WalletIndexPlane<Plugins>;
};

const bindCachePlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): CachePlane => {
    return {
        getIndex: async query => {
            console.debug('wallet.cache.getIndex');

            try {
                const index = await Promise.any(
                    wallet.plugins.map(async plugin => {
                        if (!plugin.cache) throw new Error('Plugin is not a Cache Plugin');

                        return plugin.cache.getIndex(query);
                    })
                );

                return index;
            } catch (error) {
                return undefined;
            }
        },
        setIndex: async (query, value) => {
            console.debug('wallet.cache.setIndex');

            const result = await Promise.allSettled(
                wallet.plugins.map(async plugin => {
                    if (!plugin.cache) throw new Error('Plugin is not a Cache Plugin');

                    return plugin.cache.setIndex(query, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        getVc: async uri => {
            console.debug('wallet.cache.getVc');

            try {
                const vc = await Promise.any(
                    wallet.plugins.map(async plugin => {
                        if (!plugin.cache) throw new Error('Plugin is not a Cache Plugin');

                        return plugin.cache.getVc(uri);
                    })
                );

                return vc;
            } catch (error) {
                return undefined;
            }
        },
        setVc: async (uri, value) => {
            console.debug('wallet.cache.setIndex');

            const result = await Promise.allSettled(
                wallet.plugins.map(async plugin => {
                    if (!plugin.cache) throw new Error('Plugin is not a Cache Plugin');

                    return plugin.cache.setVc(uri, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
    };
};

const bindMethods = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods =>
    Object.fromEntries(
        Object.entries(pluginMethods as any).map(([key, method]: any) => [
            key,
            method.bind(wallet, wallet),
        ])
    ) as any as PluginMethods;

/** @group Universal Wallets */
export const generateWallet = async <
    Plugins extends Plugin[] = [],
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>
>(
    _wallet: Partial<Wallet<Plugins, PluginMethods>> = {}
): Promise<Wallet<Plugins, PluginMethods>> => {
    const { plugins = [] as unknown as Plugins } = _wallet;

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...(cumulativePluginMethods as any), ...plugin.pluginMethods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const wallet: Wallet<Plugins, PluginMethods> = {
        read: {} as ReadPlane,
        store: {} as WalletStorePlane<Plugins>,
        index: {} as WalletIndexPlane<Plugins>,
        cache: {} as CachePlane,
        plugins: plugins as Plugins,
        pluginMethods,
        addPlugin: function(plugin) {
            return addPluginToWallet(this, plugin);
        },
    };

    wallet.read = bindReadPlane(wallet);
    wallet.store = bindStorePlane(wallet);
    wallet.index = bindIndexPlane(wallet);
    wallet.cache = bindCachePlane(wallet);

    if (pluginMethods) wallet.pluginMethods = bindMethods(wallet, pluginMethods);

    return wallet;
};
