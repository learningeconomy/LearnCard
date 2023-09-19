import {
    ControlPlane,
    GetPlanesForPlugins,
    PluginReadPlane,
    PluginStorePlane,
    PluginIndexPlane,
    PluginCachePlane,
    PluginIdPlane,
    PluginContextPlane,
    LearnCardReadPlane,
    LearnCardStorePlane,
    LearnCardIndexPlane,
    LearnCardCachePlane,
    LearnCardIdPlane,
    LearnCardContextPlane,
} from './planes';
import { UnionToIntersection, MergeObjects } from './utilities';

export type GenerateLearnCard<
    NewControlPlanes extends ControlPlane = never,
    NewMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = LearnCard<
    any,
    [ControlPlanes] extends [1 & ControlPlanes]
        ? NewControlPlanes
        : [NewControlPlanes] extends [1 & NewControlPlanes]
        ? ControlPlanes
        : ControlPlanes | NewControlPlanes,
    NewMethods & Methods
>;

export type AddImplicitLearnCardArgument<
    Functions extends Record<string, (...args: any[]) => any> = Record<never, never>,
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    [Key in keyof Functions]: <
        T extends GenerateLearnCard<
            ControlPlanes,
            Methods,
            DependentControlPlanes,
            DependentMethods
        >
    >(
        learnCard: T,
        ...args: Parameters<Functions[Key]>
    ) => ReturnType<Functions[Key]>;
};

/** @group Universal Wallets */
export type GetPluginMethods<Plugins extends Plugin[]> = undefined extends Plugins[1]
    ? NonNullable<Plugins[0]['_methods']>
    : UnionToIntersection<
          NonNullable<
              MergeObjects<{ [Key in keyof Plugins]: NonNullable<Plugins[Key]['_methods']> }>
          >
      >;

/** @group Universal Wallets */
export type Plugin<
    Name extends string = string,
    ControlPlanes extends ControlPlane = any,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name: Name;
    displayName?: string;
    description?: string;
    methods: AddImplicitLearnCardArgument<
        Methods,
        ControlPlanes,
        Methods,
        DependentControlPlanes,
        DependentMethods
    >;
    _methods?: Methods;
    read?: {};
    store?: {};
    index?: {};
    cache?: {};
    id?: {};
    context?: {};
} & ([ControlPlanes] extends [1 & ControlPlanes] // Check for any/never and prevent it from requiring all planes
    ? {}
    : ('read' extends ControlPlanes
          ? {
                read: AddImplicitLearnCardArgument<
                    PluginReadPlane,
                    ControlPlanes,
                    Methods,
                    DependentControlPlanes,
                    DependentMethods
                >;
            }
          : {}) &
          ('store' extends ControlPlanes
              ? {
                    store: AddImplicitLearnCardArgument<
                        PluginStorePlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('index' extends ControlPlanes
              ? {
                    index: AddImplicitLearnCardArgument<
                        PluginIndexPlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('cache' extends ControlPlanes
              ? {
                    cache: AddImplicitLearnCardArgument<
                        PluginCachePlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('id' extends ControlPlanes
              ? {
                    id: AddImplicitLearnCardArgument<
                        PluginIdPlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('context' extends ControlPlanes
              ? {
                    context: AddImplicitLearnCardArgument<
                        PluginContextPlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}));

/** @group Universal Wallets */
export type LearnCard<
    Plugins extends Plugin[] = [],
    ControlPlanes extends ControlPlane = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
> = {
    plugins: Plugins;
    invoke: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<LearnCard<[...Plugins, NewPlugin]>>;
    debug?: typeof console.log;
} & ([ControlPlanes] extends [1 & ControlPlanes] // Check for any/never and prevent it from requiring all planes
    ? {}
    : ('read' extends ControlPlanes ? { read: LearnCardReadPlane<Plugins> } : {}) &
          ('store' extends ControlPlanes ? { store: LearnCardStorePlane<Plugins> } : {}) &
          ('index' extends ControlPlanes ? { index: LearnCardIndexPlane<Plugins> } : {}) &
          ('cache' extends ControlPlanes ? { cache: LearnCardCachePlane<Plugins> } : {}) &
          ('id' extends ControlPlanes ? { id: LearnCardIdPlane<Plugins> } : {}) &
          ('context' extends ControlPlanes ? { context: LearnCardContextPlane<Plugins> } : {}));
