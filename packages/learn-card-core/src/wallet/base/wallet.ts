import { Plugin, Wallet, GetPluginMethods } from 'types/wallet';
import { StoragePlane, WalletCaching, WalletCachingPlane, WalletStorage } from 'types/planes';

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
        get: () => {
            console.log('storage.all.get');
            return wallet.plugins.map(plugin => plugin.storage?.get()).filter(Boolean);
        },
        getMany: () => {
            console.log('storage.all.getMany');
            return wallet.plugins.map(plugin => plugin.storage?.getMany()).filter(Boolean);
        },
        upload: () => {
            console.log('storage.all.upload');
            return wallet.plugins.map(plugin => plugin.storage?.upload()).filter(Boolean);
        },
        set: () => {
            console.log('storage.all.set');
            return wallet.plugins.map(plugin => plugin.storage?.set()).filter(Boolean);
        },
        remove: () => {
            console.log('storage.all.remove');
            return wallet.plugins.map(plugin => plugin.storage?.remove()).filter(Boolean);
        },
    };

    return { ...individualPlanes, all } as WalletStorage<Plugins>;
};

const bindCachingPlane = <Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>>(
    wallet: Wallet<Plugins, PluginMethods>
): WalletCaching<Plugins> => {
    const individualPlanes = wallet.plugins.reduce<WalletCaching<Plugins>>((acc, cur) => {
        const { caching } = cur;

        if (caching) {
            // Have to index as 'all' because TS seems to hate it otherwise 🙃
            acc[cur.name as 'all'] = {
                get: () => {
                    if ('getLocal' in caching) caching.getLocal();
                    if ('getRemote' in caching) caching.getRemote();
                },
                set: () => {
                    if ('setLocal' in caching) caching.setLocal();
                    if ('setRemote' in caching) caching.setRemote();
                },
            };
        }

        return acc;
    }, {} as WalletCaching<Plugins>);

    const all: WalletCachingPlane = {
        get: () => {
            console.log('caching.all.get');
            return wallet.plugins
                .map(plugin => {
                    if (!plugin.caching) return;

                    if ('getLocal' in plugin.caching) return plugin.caching.getLocal();
                    if ('getRemote' in plugin.caching) return plugin.caching.getRemote();
                })
                .filter(Boolean);
        },

        set: () => {
            console.log('caching.all.set');
            return wallet.plugins
                .map(plugin => {
                    if (!plugin.caching) return;

                    if ('setLocal' in plugin.caching) return plugin.caching.setLocal();
                    if ('setRemote' in plugin.caching) return plugin.caching.setRemote();
                })
                .filter(Boolean);
        },
    };

    return { ...individualPlanes, all } as WalletCaching<Plugins>;
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
        caching: {} as WalletCaching<Plugins>,
        plugins: plugins as Plugins,
        pluginMethods,
        addPlugin: function (plugin) {
            return addPluginToWallet(this, plugin);
        },
    };

    wallet.storage = bindStoragePlane(wallet);
    wallet.caching = bindCachingPlane(wallet);

    if (pluginMethods) wallet.pluginMethods = bindMethods(wallet, pluginMethods);

    return wallet;
};
