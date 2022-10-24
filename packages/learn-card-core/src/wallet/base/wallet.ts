import { Plugin, Wallet, GetPluginMethods } from 'types/wallet';
import {
    GetPlanesForPlugins,
    ReadPlane,
    CachePlane,
    IndexPlane,
    WalletStorePlane,
    WalletIndexPlane,
    WalletIdPlane,
} from 'types/planes';
import { findFirstResult } from './helpers';

const addPluginToWallet = async <NewPlugin extends Plugin, Plugins extends Plugin[]>(
    wallet: Wallet<Plugins>,
    plugin: NewPlugin
): Promise<Wallet<[...Plugins, NewPlugin]>> => {
    wallet.debug?.('Adding plugin', plugin.name);
    // eslint-disable-next-line
    return (generateWallet as any)({ plugins: [...wallet.plugins, plugin], debug: wallet.debug });
};

const generateReadPlane = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes> | Wallet<Plugins, PluginMethods, 'cache'>
): ReadPlane => {
    return {
        get: async uri => {
            wallet.debug?.('wallet.read.get', uri);

            if (!uri) return undefined;

            if ('cache' in wallet) {
                const cachedResponse = await wallet.cache.getVc(uri);

                if (cachedResponse) return cachedResponse;
            }

            const vc = await Promise.any(
                wallet.plugins.map(async plugin => {
                    if (!plugin.read) throw new Error('Plugin is not a Read Plugin');

                    return plugin.read.get(uri);
                })
            );

            if (vc && 'cache' in wallet) await wallet.cache.setVc(uri, vc);

            return vc;
        },
    };
};

const generateStorePlane = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes>
): WalletStorePlane<Plugins> => {
    return wallet.plugins.reduce((acc, cur) => {
        if (cur.store) acc[cur.name as keyof typeof acc] = cur.store;

        return acc;
    }, {} as WalletStorePlane<Plugins>);
};

const generateIndexPlane = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes>
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
            wallet.debug?.('wallet.index.all.get');

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

const generateCachePlane = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes>
): CachePlane => {
    return {
        getIndex: async query => {
            wallet.debug?.('wallet.cache.getIndex');

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
            wallet.debug?.('wallet.cache.setIndex');

            const result = await Promise.allSettled(
                wallet.plugins.map(async plugin => {
                    if (!plugin.cache) throw new Error('Plugin is not a Cache Plugin');

                    return plugin.cache.setIndex(query, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        getVc: async uri => {
            wallet.debug?.('wallet.cache.getVc');

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
            wallet.debug?.('wallet.cache.setIndex');

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

const generateIdPlane = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes>
): WalletIdPlane<Plugins> => {
    return {
        did: method => {
            wallet.debug?.('wallet.id.did', method);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!plugin.id) return undefined;

                    return plugin.id.did(method);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports did method ${method}`);

            return result;
        },
        keypair: type => {
            wallet.debug?.('wallet.id.keypair', type);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!plugin.id) return undefined;

                    return plugin.id.keypair(type);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports keypair type ${type}`);

            return result;
        },
    };
};

const bindMethods = <
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    wallet: Wallet<Plugins, PluginMethods, ControlPlanes>,
    pluginMethods: PluginMethods
): PluginMethods =>
    Object.fromEntries(
        Object.entries(pluginMethods as any).map(([key, method]: any) => [
            key,
            method.bind(wallet, wallet),
        ])
    );

/** @group Universal Wallets */
export const generateWallet = async <
    Plugins extends Plugin[] = [],
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>,
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>
>(
    _wallet: Partial<Wallet<Plugins, PluginMethods, ControlPlanes>> = {}
): Promise<Wallet<Plugins, PluginMethods, ControlPlanes>> => {
    const { plugins = [] as unknown as Plugins } = _wallet;

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...(cumulativePluginMethods as any), ...plugin.methods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const wallet: Wallet<Plugins, PluginMethods, ControlPlanes> = {
        read: {} as ReadPlane,
        store: {} as WalletStorePlane<Plugins>,
        index: {} as WalletIndexPlane<Plugins>,
        cache: {} as CachePlane,
        id: {} as WalletIdPlane<Plugins>,
        plugins: plugins as Plugins,
        invoke: pluginMethods,
        addPlugin: function(plugin) {
            return addPluginToWallet(this as any, plugin);
        },
        debug: _wallet.debug,
    };

    (wallet as any).read = generateReadPlane(wallet);
    (wallet as any).store = generateStorePlane(wallet);
    (wallet as any).index = generateIndexPlane(wallet);
    (wallet as any).cache = generateCachePlane(wallet);
    (wallet as any).id = generateIdPlane(wallet);

    if (pluginMethods) wallet.invoke = bindMethods(wallet, pluginMethods);

    return wallet;
};
