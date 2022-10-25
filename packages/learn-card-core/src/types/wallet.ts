import {
    ControlPlane,
    GetPlanesForPlugins,
    ReadPlane,
    StorePlane,
    IndexPlane,
    CachePlane,
    IdPlane,
    WalletReadPlane,
    WalletStorePlane,
    WalletIndexPlane,
    WalletCachePlane,
    WalletIdPlane,
} from './planes';
import { UnionToIntersection, MergeObjects } from './utilities';

export type GenerateWallet<
    NewControlPlanes extends ControlPlane = never,
    NewMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = Wallet<
    any,
    [ControlPlanes] extends [1 & ControlPlanes]
        ? NewControlPlanes
        : [NewControlPlanes] extends [1 & NewControlPlanes]
        ? ControlPlanes
        : ControlPlanes | NewControlPlanes,
    NewMethods & Methods
>;

export type AddImplicitWalletArgument<
    Functions extends Record<string, (...args: any[]) => any> = Record<never, never>,
    ControlPlanes extends ControlPlane = never,
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentControlPlanes extends ControlPlane = never,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    [Key in keyof Functions]: <
        T extends GenerateWallet<ControlPlanes, Methods, DependentControlPlanes, DependentMethods>
    >(
        wallet: T,
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
    methods: AddImplicitWalletArgument<
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
} & ([ControlPlanes] extends [1 & ControlPlanes] // Check for any/never and prevent it from requiring all planes
    ? {}
    : ('read' extends ControlPlanes
          ? {
                read: AddImplicitWalletArgument<
                    ReadPlane,
                    ControlPlanes,
                    Methods,
                    DependentControlPlanes,
                    DependentMethods
                >;
            }
          : {}) &
          ('store' extends ControlPlanes
              ? {
                    store: AddImplicitWalletArgument<
                        StorePlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('index' extends ControlPlanes
              ? {
                    index: AddImplicitWalletArgument<
                        IndexPlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('cache' extends ControlPlanes
              ? {
                    cache: AddImplicitWalletArgument<
                        CachePlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}) &
          ('id' extends ControlPlanes
              ? {
                    id: AddImplicitWalletArgument<
                        IdPlane,
                        ControlPlanes,
                        Methods,
                        DependentControlPlanes,
                        DependentMethods
                    >;
                }
              : {}));

/** @group Universal Wallets */
export type Wallet<
    Plugins extends Plugin[] = [],
    ControlPlanes extends ControlPlane = GetPlanesForPlugins<Plugins>,
    PluginMethods = GetPluginMethods<Plugins>
> = {
    plugins: Plugins;
    invoke: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<Wallet<[...Plugins, NewPlugin]>>;
    debug?: typeof console.log;
} & ([ControlPlanes] extends [1 & ControlPlanes] // Check for any/never and prevent it from requiring all planes
    ? {}
    : ('read' extends ControlPlanes ? { read: WalletReadPlane<Plugins> } : {}) &
          ('store' extends ControlPlanes ? { store: WalletStorePlane<Plugins> } : {}) &
          ('index' extends ControlPlanes ? { index: WalletIndexPlane<Plugins> } : {}) &
          ('cache' extends ControlPlanes ? { cache: WalletCachePlane<Plugins> } : {}) &
          ('id' extends ControlPlanes ? { id: WalletIdPlane<Plugins> } : {}));
