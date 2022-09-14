import { Plugin, Wallet, GetPluginMethods } from 'types/wallet';
import { StoragePlane, WalletCache, WalletCachePlane, WalletStorage } from 'types/planes';

const addPluginToWallet = async <NewPlugin extends Plugin, Plugins extends Plugin[]>(
    wallet: Wallet<Plugins>,
    plugin: NewPlugin
): Promise<Wallet<[...Plugins, NewPlugin]>> => {
    // eslint-disable-next-line
    return generateWallet({ plugins: [...wallet.plugins, plugin] });
};

const bindStoragePlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): WalletStorage<Plugins> => {
    const individualPlanes = wallet.plugins.reduce<Omit<WalletStorage<Plugins>, 'all'>>(
        (acc, cur) => {
            if (cur.storage) (acc as any)[cur.name] = cur.storage;

            return acc;
        },
        {} as Omit<WalletStorage<Plugins>, 'all'>
    );

    const all: StoragePlane = {
        get: query => {
            console.log('storage.all.get');
            return wallet.plugins
                .map(
                    plugin =>
                        wallet.cache.all.get({
                            name: plugin.name,
                            operation: 'get',
                            query,
                        }) ?? plugin.storage?.get(query)
                )
                .filter(Boolean);
        },
        getMany: query => {
            console.log('storage.all.getMany');
            return wallet.plugins
                .map(
                    plugin =>
                        wallet.cache.all.get({
                            name: plugin.name,
                            operation: 'getMany',
                            query,
                        }) ?? plugin.storage?.getMany(query)
                )
                .filter(Boolean);
        },
        upload: data => {
            console.log('storage.all.upload');
            return wallet.plugins.map(plugin => plugin.storage?.upload(data)).filter(Boolean);
        },
        set: (query, data) => {
            console.log('storage.all.set');
            wallet.cache.all.set({ name: 'all', operation: 'set', query, data });
            return wallet.plugins.map(plugin => plugin.storage?.set(query, data)).filter(Boolean);
        },
        remove: query => {
            console.log('storage.all.remove');
            wallet.cache.all.set({ name: 'all', operation: 'remove', query });
            return wallet.plugins.map(plugin => plugin.storage?.remove(query)).filter(Boolean);
        },
    };

    return { ...individualPlanes, all } as WalletStorage<Plugins>;
};

const bindCachingPlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): WalletCache<Plugins> => {
    const individualPlanes = wallet.plugins.reduce<WalletCache<Plugins>>((acc, cur) => {
        const { cache } = cur;

        if (cache) {
            // Have to index as 'all' because TS seems to hate it otherwise 🙃
            acc[cur.name as 'all'] = {
                get: args => cache.getLocal?.(args) ?? cache.getRemote?.(args),
                set: args => cache.setLocal?.(args) ?? cache.setRemote?.(args),
                flush: cache.flush,
            };
        }

        return acc;
    }, {} as WalletCache<Plugins>);

    const all: WalletCachePlane = {
        get: args => {
            console.log('caching.all.get');
            return wallet.plugins
                .map(plugin => plugin.cache?.getLocal?.(args) ?? plugin.cache?.getRemote?.(args))
                .filter(Boolean);
        },

        set: args => {
            console.log('caching.all.set');
            return wallet.plugins
                .map(plugin => plugin.cache?.setLocal?.(args) ?? plugin.cache?.setRemote?.(args))
                .filter(Boolean);
        },
        flush: () => {
            console.log('caching.all.flush');
            return wallet.plugins.map(plugin => plugin.cache?.flush());
        },
    };

    return { ...individualPlanes, all } as WalletCache<Plugins>;
};

const bindMethods = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods =>
    Object.fromEntries(
        Object.entries(pluginMethods).map(([key, method]) => [key, method.bind(wallet, wallet)])
    ) as PluginMethods;

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
        storage: {} as WalletStorage<Plugins>,
        cache: {} as WalletCache<Plugins>,
        plugins: plugins as Plugins,
        pluginMethods,
        addPlugin: function (plugin) {
            return addPluginToWallet(this, plugin);
        },
    };

    wallet.storage = bindStoragePlane(wallet);
    wallet.cache = bindCachingPlane(wallet);

    if (pluginMethods) wallet.pluginMethods = bindMethods(wallet, pluginMethods);

    return wallet;
};
