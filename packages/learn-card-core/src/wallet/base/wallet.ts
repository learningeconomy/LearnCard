import { Plugin, Wallet, GetPluginMethods } from 'types/wallet';
import {
    ControlPlane,
    GetPlanesForPlugins,
    GetPlaneProviders,
    IndexPlane,
    WalletReadPlane,
    WalletStorePlane,
    WalletIndexPlane,
    WalletCachePlane,
    WalletIdPlane,
} from 'types/planes';
import { findFirstResult, pluginImplementsPlane } from './helpers';

const getPlaneProviders = <Plugins extends Plugin[], Plane extends ControlPlane>(
    plugins: Plugins,
    plane: Plane
): GetPlaneProviders<Plugins, Plane> => {
    return plugins.reduce((providers, plugin) => {
        if (plane in plugin) {
            providers[plugin.name as keyof typeof providers] = {
                name: plugin.name,
                displayName: plugin.displayName,
                description: plugin.description,
            } as any;
        }

        return providers;
    }, {} as GetPlaneProviders<Plugins, Plane>);
};

const bindWalletToFunctionsObject = (
    wallet: Wallet<any, any, any>,
    obj: Record<string, (...args: any[]) => any>
) =>
    Object.fromEntries(
        Object.entries(obj).map(([key, method]) => [key, method.bind(wallet, wallet)])
    ) as any;

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
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods> | Wallet<Plugins, 'cache', PluginMethods>
): WalletReadPlane<Plugins> => {
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
                    if (!pluginImplementsPlane(plugin, 'read')) {
                        throw new Error('Plugin is not a Read Plugin');
                    }

                    return plugin.read.get(wallet as any, uri);
                })
            );

            if (vc && 'cache' in wallet) await wallet.cache.setVc(uri, vc);

            return vc;
        },
        providers: getPlaneProviders(wallet.plugins, 'read'),
    };
};

const generateStorePlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>
): WalletStorePlane<Plugins> => {
    const pluginPlanes = wallet.plugins.reduce((planes, plugin) => {
        if (pluginImplementsPlane(plugin, 'store')) {
            planes[plugin.name as keyof typeof planes] = bindWalletToFunctionsObject(
                wallet,
                plugin.store
            );
        }

        return planes;
    }, {} as WalletStorePlane<Plugins>);

    return { ...pluginPlanes, providers: getPlaneProviders(wallet.plugins, 'store') };
};

const generateIndexPlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>
): WalletIndexPlane<Plugins> => {
    const individualPlanes = wallet.plugins.reduce<WalletIndexPlane<Plugins>>((planes, plugin) => {
        if (pluginImplementsPlane(plugin, 'index')) {
            planes[plugin.name as keyof typeof planes] = bindWalletToFunctionsObject(
                wallet,
                plugin.index
            );
        }

        return planes;
    }, {} as WalletIndexPlane<Plugins>);

    const all: Pick<IndexPlane, 'get'> = {
        get: async query => {
            wallet.debug?.('wallet.index.all.get');

            const resultsWithDuplicates = (
                await Promise.all(
                    wallet.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'index')) return [];

                        return plugin.index.get(wallet as any, query);
                    })
                )
            ).flat();

            return [...new Set(resultsWithDuplicates)];
        },
    };

    return { ...individualPlanes, all, providers: getPlaneProviders(wallet.plugins, 'index') };
};

const generateCachePlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>
): WalletCachePlane<Plugins> => {
    return {
        getIndex: async query => {
            wallet.debug?.('wallet.cache.getIndex');

            try {
                const index = await Promise.any(
                    wallet.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'cache')) {
                            throw new Error('Plugin is not a Cache Plugin');
                        }

                        return plugin.cache.getIndex(wallet as any, query);
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
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.setIndex(wallet as any, query, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        getVc: async uri => {
            wallet.debug?.('wallet.cache.getVc');

            try {
                const vc = await Promise.any(
                    wallet.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'cache')) {
                            throw new Error('Plugin is not a Cache Plugin');
                        }

                        return plugin.cache.getVc(wallet as any, uri);
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
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.setVc(wallet as any, uri, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        providers: getPlaneProviders(wallet.plugins, 'cache'),
    };
};

const generateIdPlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>
): WalletIdPlane<Plugins> => {
    return {
        did: (method: any) => {
            wallet.debug?.('wallet.id.did', method);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.did(method);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports did method ${method}`);

            return result;
        },
        keypair: (algorithm: any) => {
            wallet.debug?.('wallet.id.keypair', algorithm);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.keypair(algorithm);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports keypair type ${algorithm}`);

            return result;
        },
        providers: getPlaneProviders(wallet.plugins, 'id'),
    };
};

const bindMethods = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods => bindWalletToFunctionsObject(wallet, pluginMethods as any);

/** @group Universal Wallets */
export const generateWallet = async <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>
>(
    _wallet: Partial<Wallet<Plugins, ControlPlanes, PluginMethods>> = {}
): Promise<Wallet<Plugins, ControlPlanes, PluginMethods>> => {
    const { plugins = [] as unknown as Plugins } = _wallet;

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...(cumulativePluginMethods as any), ...plugin.methods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const wallet: Wallet<Plugins, ControlPlanes, PluginMethods> = {
        read: {} as WalletReadPlane<Plugins>,
        store: {} as WalletStorePlane<Plugins>,
        index: {} as WalletIndexPlane<Plugins>,
        cache: {} as WalletCachePlane<Plugins>,
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
