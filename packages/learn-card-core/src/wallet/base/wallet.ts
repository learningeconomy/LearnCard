import { Plugin, Wallet, GetPluginMethods, AddImplicitWalletArgument } from 'types/wallet';
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
    StorePlane,
} from 'types/planes';
import {
    findFirstResult,
    pluginImplementsPlane,
    walletImplementsPlane,
    mapObject,
} from './helpers';

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
) => mapObject(obj, method => method.bind(wallet, wallet));

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
        get: async (uri, { cache = 'cache-first' } = {}) => {
            wallet.debug?.('wallet.read.get', uri);

            if (!uri) return undefined;

            if (cache === 'cache-only' && !walletImplementsPlane(wallet, 'cache')) {
                throw new Error('Cannot read from cache. Cache Plane is not implemented!');
            }

            if (walletImplementsPlane(wallet, 'cache') && cache !== 'skip-cache') {
                const cachedResponse = await wallet.cache.getVc(uri);

                if (cachedResponse) {
                    if (cache === 'cache-first' && walletImplementsPlane(wallet, 'read')) {
                        wallet.read
                            .get(uri, { cache: 'skip-cache' })
                            .then(res => wallet.cache.setVc(uri, res));
                    }

                    return cachedResponse;
                }
            }

            const vc = await Promise.any(
                wallet.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'read')) {
                        throw new Error('Plugin is not a Read Plugin');
                    }

                    return plugin.read.get(wallet as any, uri);
                })
            );

            if (vc && walletImplementsPlane(wallet, 'cache') && cache !== 'skip-cache') {
                await wallet.cache.setVc(uri, vc);
            }

            return vc;
        },
        providers: getPlaneProviders(wallet.plugins, 'read'),
    };
};

const addCachingToStorePlane = <
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    plane: AddImplicitWalletArgument<
        StorePlane,
        ControlPlanes,
        Methods,
        DependentControlPlanes,
        DependentMethods
    >
): AddImplicitWalletArgument<
    StorePlane,
    ControlPlanes,
    Methods,
    DependentControlPlanes,
    DependentMethods
> => ({
    upload: async (_wallet, vc, { cache = 'cache-first' } = {}) => {
        const uri = await plane.upload(_wallet, vc);

        if (cache !== 'skip-cache' && walletImplementsPlane(_wallet, 'cache')) {
            await _wallet.cache.setVc(uri, vc);
        }

        return uri;
    },
    // TODO: Add caching to uploadMany
    ...('uploadMany' in plane ? { uploadMany: plane.uploadMany } : {}),
});

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
                addCachingToStorePlane(plugin.store)
            ) as any;
        }

        return planes;
    }, {} as WalletStorePlane<Plugins>);

    return { ...pluginPlanes, providers: getPlaneProviders(wallet.plugins, 'store') };
};

const addCachingToIndexPlane = <
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    plane: AddImplicitWalletArgument<
        IndexPlane,
        ControlPlanes,
        Methods,
        DependentControlPlanes,
        DependentMethods
    >
): AddImplicitWalletArgument<
    IndexPlane,
    ControlPlanes,
    Methods,
    DependentControlPlanes,
    DependentMethods
> => ({
    get: async (_wallet, query, { cache = 'cache-first' } = {}) => {
        if (cache === 'cache-only' && !walletImplementsPlane(_wallet, 'cache')) {
            throw new Error('Cannot read from cache. Cache Plane is not implemented!');
        }

        if (walletImplementsPlane(_wallet, 'cache') && cache !== 'skip-cache') {
            const cachedResponse = await _wallet.cache.getIndex(query ?? {});

            if (cachedResponse) {
                if (cache === 'cache-first') {
                    plane
                        .get(_wallet, query, { cache: 'skip-cache' })
                        .then(res => _wallet.cache.setIndex(query ?? {}, res));
                }

                return cachedResponse;
            }
        }

        const list = await plane.get(_wallet, query);

        if (list && walletImplementsPlane(_wallet, 'cache') && cache !== 'skip-cache') {
            await _wallet.cache.setIndex(query ?? {}, list);
        }

        return list;
    },
    add: async (_wallet, record, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && walletImplementsPlane(_wallet, 'cache')) {
            await _wallet.cache.flushIndex();
        }

        return plane.add(_wallet, record);
    },
    update: async (_wallet, id, update, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && walletImplementsPlane(_wallet, 'cache')) {
            await _wallet.cache.flushIndex();
        }

        return plane.update(_wallet, id, update);
    },
    remove: async (_wallet, id, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && walletImplementsPlane(_wallet, 'cache')) {
            await _wallet.cache.flushIndex();
        }

        return plane.remove(_wallet, id);
    },
});

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
                addCachingToIndexPlane(plugin.index)
            ) as any;
        }

        return planes;
    }, {} as WalletIndexPlane<Plugins>);

    const all: Pick<IndexPlane, 'get'> = {
        get: async (query, { cache = 'cache-first' } = {}) => {
            wallet.debug?.('wallet.index.all.get');

            if (cache === 'cache-only' && !walletImplementsPlane(wallet, 'cache')) {
                throw new Error('Cannot read from cache. Cache Plane is not implemented!');
            }

            if (walletImplementsPlane(wallet, 'cache') && cache !== 'skip-cache') {
                const cachedResponse = await wallet.cache.getIndex(query ?? {});

                if (cachedResponse) {
                    if (cache === 'cache-first' && walletImplementsPlane(wallet, 'index')) {
                        wallet.index.all
                            .get(query, { cache: 'skip-cache' })
                            .then(res => wallet.cache.setIndex(query ?? {}, res));
                    }

                    return cachedResponse;
                }
            }

            const resultsWithDuplicates = (
                await Promise.all(
                    wallet.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'index')) return [];

                        return plugin.index.get(wallet as any, query);
                    })
                )
            ).flat();

            const results = [...new Set(resultsWithDuplicates)];

            if (results && walletImplementsPlane(wallet, 'cache') && cache !== 'skip-cache') {
                await wallet.cache.setIndex(query ?? {}, results);
            }

            return results;
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
        flushIndex: async () => {
            wallet.debug?.('wallet.cache.flushIndex');

            const result = await Promise.allSettled(
                wallet.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.flushIndex(wallet as any);
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
            wallet.debug?.('wallet.cache.setVc');

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
        flushVc: async () => {
            wallet.debug?.('wallet.cache.flushVc');

            const result = await Promise.allSettled(
                wallet.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.flushVc(wallet as any);
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
        did: method => {
            wallet.debug?.('wallet.id.did', method);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.did(wallet as any, method);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports did method ${method}`);

            return result;
        },
        keypair: algorithm => {
            wallet.debug?.('wallet.id.keypair', algorithm);

            const result = findFirstResult(wallet.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.keypair(wallet as any, algorithm);
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
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>
>(
    wallet: Wallet<Plugins, ControlPlanes, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods => bindWalletToFunctionsObject(wallet, pluginMethods as any) as any;

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
