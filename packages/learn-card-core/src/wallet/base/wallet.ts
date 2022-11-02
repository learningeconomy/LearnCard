import { CredentialRecord } from '@learncard/types';

import { Plugin, LearnCard, GetPluginMethods, AddImplicitLearnCardArgument } from 'types/wallet';
import {
    ControlPlane,
    GetPlanesForPlugins,
    GetPlaneProviders,
    IndexPlane,
    LearnCardReadPlane,
    LearnCardStorePlane,
    LearnCardIndexPlane,
    LearnCardCachePlane,
    LearnCardIdPlane,
    StorePlane,
    PlaneOptions,
} from 'types/planes';
import {
    findFirstResult,
    pluginImplementsPlane,
    learnCardImplementsPlane,
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

const bindLearnCardToFunctionsObject = (
    learnCard: LearnCard<any, any, any>,
    obj: Record<string, (...args: any[]) => any>
) => mapObject(obj, method => method.bind(learnCard, learnCard));

const addPluginToLearnCard = async <NewPlugin extends Plugin, Plugins extends Plugin[]>(
    learnCard: LearnCard<Plugins>,
    plugin: NewPlugin
): Promise<LearnCard<[...Plugins, NewPlugin]>> => {
    learnCard.debug?.('Adding plugin', plugin.name);
    // eslint-disable-next-line
    return (generateLearnCard as any)({
        plugins: [...learnCard.plugins, plugin],
        debug: learnCard.debug,
    });
};

const generateReadPlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    learnCard:
        | LearnCard<Plugins, ControlPlanes, PluginMethods>
        | LearnCard<Plugins, 'cache', PluginMethods>
): LearnCardReadPlane<Plugins> => {
    return {
        get: async (uri, { cache = 'cache-first' } = {}) => {
            learnCard.debug?.('learnCard.read.get', uri);

            if (!uri) return undefined;

            if (cache === 'cache-only' && !learnCardImplementsPlane(learnCard, 'cache')) {
                throw new Error('Cannot read from cache. Cache Plane is not implemented!');
            }

            if (learnCardImplementsPlane(learnCard, 'cache') && cache !== 'skip-cache') {
                const cachedResponse = await learnCard.cache.getVc(uri);

                if (cachedResponse) {
                    if (cache === 'cache-first' && learnCardImplementsPlane(learnCard, 'read')) {
                        learnCard.read
                            .get(uri, { cache: 'skip-cache' })
                            .then(res => learnCard.cache.setVc(uri, res));
                    }

                    return cachedResponse;
                }
            }

            const vc = await Promise.any(
                learnCard.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'read')) {
                        throw new Error('Plugin is not a Read Plugin');
                    }

                    return plugin.read.get(learnCard as any, uri);
                })
            );

            if (vc && learnCardImplementsPlane(learnCard, 'cache') && cache !== 'skip-cache') {
                await learnCard.cache.setVc(uri, vc);
            }

            return vc;
        },
        providers: getPlaneProviders(learnCard.plugins, 'read'),
    };
};

const addCachingToStorePlane = <
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    plane: AddImplicitLearnCardArgument<
        StorePlane,
        ControlPlanes,
        Methods,
        DependentControlPlanes,
        DependentMethods
    >
): AddImplicitLearnCardArgument<
    StorePlane,
    ControlPlanes,
    Methods,
    DependentControlPlanes,
    DependentMethods
> => ({
    upload: async (_learnCard, vc, { cache = 'cache-first' } = {}) => {
        const uri = await plane.upload(_learnCard, vc);

        if (cache !== 'skip-cache' && learnCardImplementsPlane(_learnCard, 'cache')) {
            await _learnCard.cache.setVc(uri, vc);
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
    learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods>
): LearnCardStorePlane<Plugins> => {
    const pluginPlanes = learnCard.plugins.reduce((planes, plugin) => {
        if (pluginImplementsPlane(plugin, 'store')) {
            planes[plugin.name as keyof typeof planes] = bindLearnCardToFunctionsObject(
                learnCard,
                addCachingToStorePlane(plugin.store)
            ) as any;
        }

        return planes;
    }, {} as LearnCardStorePlane<Plugins>);

    return { ...pluginPlanes, providers: getPlaneProviders(learnCard.plugins, 'store') };
};

const addCachingToIndexPlane = <
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    plane: AddImplicitLearnCardArgument<
        IndexPlane,
        ControlPlanes,
        Methods,
        DependentControlPlanes,
        DependentMethods
    >,
    name: string
): AddImplicitLearnCardArgument<
    IndexPlane,
    ControlPlanes,
    Methods,
    DependentControlPlanes,
    DependentMethods
> => ({
    get: async (_learnCard, query, { cache = 'cache-first' } = {}) => {
        if (cache === 'cache-only' && !learnCardImplementsPlane(_learnCard, 'cache')) {
            throw new Error('Cannot read from cache. Cache Plane is not implemented!');
        }

        if (learnCardImplementsPlane(_learnCard, 'cache') && cache !== 'skip-cache') {
            const cachedResponse = await _learnCard.cache.getIndex(name, query ?? {});

            if (cachedResponse) {
                if (cache === 'cache-first') {
                    plane
                        .get(_learnCard, query, { cache: 'skip-cache' })
                        .then(res => _learnCard.cache.setIndex(name, query ?? {}, res));
                }

                return cachedResponse;
            }
        }

        const list = await plane.get(_learnCard, query);

        if (list && learnCardImplementsPlane(_learnCard, 'cache') && cache !== 'skip-cache') {
            await _learnCard.cache.setIndex(name, query ?? {}, list);
        }

        return list;
    },
    add: async (_learnCard, record, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && learnCardImplementsPlane(_learnCard, 'cache')) {
            await _learnCard.cache.flushIndex();
        }

        return plane.add(_learnCard, record);
    },
    update: async (_learnCard, id, update, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && learnCardImplementsPlane(_learnCard, 'cache')) {
            await _learnCard.cache.flushIndex();
        }

        return plane.update(_learnCard, id, update);
    },
    remove: async (_learnCard, id, { cache = 'cache-first' } = {}) => {
        if (cache !== 'skip-cache' && learnCardImplementsPlane(_learnCard, 'cache')) {
            await _learnCard.cache.flushIndex();
        }

        return plane.remove(_learnCard, id);
    },
    ...(plane.removeAll
        ? {
              removeAll: async (_learnCard, { cache = 'cache-first' } = {}) => {
                  if (cache !== 'skip-cache' && learnCardImplementsPlane(_learnCard, 'cache')) {
                      await _learnCard.cache.flushIndex();
                  }

                  return plane.removeAll?.(_learnCard);
              },
          }
        : {}),
});

const generateIndexPlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods>
): LearnCardIndexPlane<Plugins> => {
    const individualPlanes = learnCard.plugins.reduce<LearnCardIndexPlane<Plugins>>(
        (planes, plugin) => {
            if (pluginImplementsPlane(plugin, 'index')) {
                planes[plugin.name as keyof typeof planes] = bindLearnCardToFunctionsObject(
                    learnCard,
                    addCachingToIndexPlane(plugin.index, plugin.name)
                ) as any;
            }

            return planes;
        },
        {} as LearnCardIndexPlane<Plugins>
    );

    const all: Pick<IndexPlane, 'get'> = {
        get: async <Metadata extends Record<string, any> = Record<never, never>>(
            query?: Record<string, any>,
            { cache = 'cache-first' }: PlaneOptions = {}
        ) => {
            learnCard.debug?.('learnCard.index.all.get');

            if (cache === 'cache-only' && !learnCardImplementsPlane(learnCard, 'cache')) {
                throw new Error('Cannot read from cache. Cache Plane is not implemented!');
            }

            if (learnCardImplementsPlane(learnCard, 'cache') && cache !== 'skip-cache') {
                const cachedResponse = await learnCard.cache.getIndex<Metadata>('all', query ?? {});

                if (cachedResponse) {
                    if (cache === 'cache-first' && learnCardImplementsPlane(learnCard, 'index')) {
                        learnCard.index.all
                            .get(query, { cache: 'skip-cache' })
                            .then(res => learnCard.cache.setIndex('all', query ?? {}, res));
                    }

                    return cachedResponse;
                }
            }

            const resultsWithDuplicates = (
                await Promise.all(
                    learnCard.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'index')) return [];

                        return plugin.index.get(learnCard as any, query) as Promise<
                            CredentialRecord<Metadata>[]
                        >;
                    })
                )
            ).flat();

            const results = [...new Set(resultsWithDuplicates)];

            if (results && learnCardImplementsPlane(learnCard, 'cache') && cache !== 'skip-cache') {
                await learnCard.cache.setIndex('all', query ?? {}, results);
            }

            return results;
        },
    };

    return { ...individualPlanes, all, providers: getPlaneProviders(learnCard.plugins, 'index') };
};

const generateCachePlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods>
): LearnCardCachePlane<Plugins> => {
    return {
        getIndex: async <Metadata extends Record<string, any> = Record<never, never>>(
            name: string,
            query: Record<string, any>
        ) => {
            learnCard.debug?.('learnCard.cache.getIndex');

            try {
                const index = await Promise.any(
                    learnCard.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'cache')) {
                            throw new Error('Plugin is not a Cache Plugin');
                        }

                        return plugin.cache.getIndex(learnCard as any, name, query) as Promise<
                            CredentialRecord<Metadata>[]
                        >;
                    })
                );

                return index;
            } catch (error) {
                return undefined;
            }
        },
        setIndex: async (name, query, value) => {
            learnCard.debug?.('learnCard.cache.setIndex');

            const result = await Promise.allSettled(
                learnCard.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.setIndex(learnCard as any, name, query, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        flushIndex: async () => {
            learnCard.debug?.('learnCard.cache.flushIndex');

            const result = await Promise.allSettled(
                learnCard.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.flushIndex(learnCard as any);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        getVc: async uri => {
            learnCard.debug?.('learnCard.cache.getVc');

            try {
                const vc = await Promise.any(
                    learnCard.plugins.map(async plugin => {
                        if (!pluginImplementsPlane(plugin, 'cache')) {
                            throw new Error('Plugin is not a Cache Plugin');
                        }

                        return plugin.cache.getVc(learnCard as any, uri);
                    })
                );

                return vc;
            } catch (error) {
                return undefined;
            }
        },
        setVc: async (uri, value) => {
            learnCard.debug?.('learnCard.cache.setVc');

            const result = await Promise.allSettled(
                learnCard.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.setVc(learnCard as any, uri, value);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        flushVc: async () => {
            learnCard.debug?.('learnCard.cache.flushVc');

            const result = await Promise.allSettled(
                learnCard.plugins.map(async plugin => {
                    if (!pluginImplementsPlane(plugin, 'cache')) {
                        throw new Error('Plugin is not a Cache Plugin');
                    }

                    return plugin.cache.flushVc(learnCard as any);
                })
            );

            return result.some(promiseResult => promiseResult.status === 'fulfilled');
        },
        providers: getPlaneProviders(learnCard.plugins, 'cache'),
    };
};

const generateIdPlane = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
>(
    learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods>
): LearnCardIdPlane<Plugins> => {
    return {
        did: method => {
            learnCard.debug?.('learnCard.id.did', method);

            const result = findFirstResult(learnCard.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.did(learnCard as any, method);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports did method ${method}`);

            return result;
        },
        keypair: algorithm => {
            learnCard.debug?.('learnCard.id.keypair', algorithm);

            const result = findFirstResult(learnCard.plugins, plugin => {
                try {
                    if (!pluginImplementsPlane(plugin, 'id')) return undefined;

                    return plugin.id.keypair(learnCard as any, algorithm);
                } catch (error) {
                    return undefined;
                }
            });

            if (!result) throw new Error(`No plugin supports keypair type ${algorithm}`);

            return result;
        },
        providers: getPlaneProviders(learnCard.plugins, 'id'),
    };
};

const bindMethods = <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>
>(
    learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods>,
    pluginMethods: PluginMethods
): PluginMethods => bindLearnCardToFunctionsObject(learnCard, pluginMethods as any) as any;

/** @group Universal Wallets */
export const generateLearnCard = async <
    Plugins extends Plugin[] = [],
    ControlPlanes extends GetPlanesForPlugins<Plugins> = GetPlanesForPlugins<Plugins>,
    PluginMethods extends GetPluginMethods<Plugins> = GetPluginMethods<Plugins>
>(
    _learnCard: Partial<LearnCard<Plugins, ControlPlanes, PluginMethods>> = {}
): Promise<LearnCard<Plugins, ControlPlanes, PluginMethods>> => {
    const { plugins = [] as unknown as Plugins } = _learnCard;

    const pluginMethods = plugins.reduce<PluginMethods>((cumulativePluginMethods, plugin) => {
        const newPluginMethods = { ...(cumulativePluginMethods as any), ...plugin.methods };

        return newPluginMethods;
    }, {} as PluginMethods);

    const learnCard: LearnCard<Plugins, ControlPlanes, PluginMethods> = {
        read: {} as LearnCardReadPlane<Plugins>,
        store: {} as LearnCardStorePlane<Plugins>,
        index: {} as LearnCardIndexPlane<Plugins>,
        cache: {} as LearnCardCachePlane<Plugins>,
        id: {} as LearnCardIdPlane<Plugins>,
        plugins: plugins as Plugins,
        invoke: pluginMethods,
        addPlugin: function(plugin) {
            return addPluginToLearnCard(this as any, plugin);
        },
        debug: _learnCard.debug,
    };

    (learnCard as any).read = generateReadPlane(learnCard);
    (learnCard as any).store = generateStorePlane(learnCard);
    (learnCard as any).index = generateIndexPlane(learnCard);
    (learnCard as any).cache = generateCachePlane(learnCard);
    (learnCard as any).id = generateIdPlane(learnCard);

    if (pluginMethods) learnCard.invoke = bindMethods(learnCard, pluginMethods);

    return learnCard;
};
