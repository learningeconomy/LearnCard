import {
    ControlPlane,
    GetPlanesForPlugins,
    ReadPlane,
    StorePlane,
    IndexPlane,
    CachePlane,
    IdPlane,
    WalletStorePlane,
    WalletIndexPlane,
    WalletIdPlane,
} from './planes';
import { UnionToIntersection, MergeObjects } from './utilities';

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
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentPlanes extends ControlPlane = never
> = {
    name: Name;
    read?: ReadPlane;
    store?: StorePlane;
    index?: IndexPlane;
    cache?: CachePlane;
    id?: IdPlane<never, never>;
    methods: {
        [Key in keyof Methods]: <
            T extends Wallet<any, Methods & DependentMethods, DependentPlanes>
        >(
            wallet: T,
            ...args: Parameters<Methods[Key]>
        ) => ReturnType<Methods[Key]>;
    };
    _methods?: Methods;
};

/** @group Universal Wallets */
export type Wallet<
    Plugins extends Plugin[] = [],
    PluginMethods = GetPluginMethods<Plugins>,
    Planes extends ControlPlane = GetPlanesForPlugins<Plugins>
> = {
    plugins: Plugins;
    invoke: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<Wallet<[...Plugins, NewPlugin]>>;
    debug?: typeof console.log;
} & ('read' extends Planes ? { read: ReadPlane } : {}) &
    ('store' extends Planes ? { store: WalletStorePlane<Plugins> } : {}) &
    ('index' extends Planes ? { index: WalletIndexPlane<Plugins> } : {}) &
    ('cache' extends Planes ? { cache: CachePlane } : {}) &
    ('id' extends Planes ? { id: WalletIdPlane<Plugins> } : {});
