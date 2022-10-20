import {
    ReadPlane,
    StorePlane,
    IndexPlane,
    CachePlane,
    WalletStorePlane,
    WalletIndexPlane,
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
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name: Name;
    read?: ReadPlane;
    store?: StorePlane;
    index?: IndexPlane;
    cache?: CachePlane;
    methods: {
        [Key in keyof Methods]: <T extends Wallet<any, Methods & DependentMethods>>(
            wallet: T,
            ...args: Parameters<Methods[Key]>
        ) => ReturnType<Methods[Key]>;
    };
    _methods?: Methods;
};

/** @group Universal Wallets */
export type Wallet<Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>> = {
    read: ReadPlane;
    store: WalletStorePlane<Plugins>;
    index: WalletIndexPlane<Plugins>;
    cache: CachePlane;
    plugins: Plugins;
    invoke: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<Wallet<[...Plugins, NewPlugin]>>;
    debug?: typeof console.log;
};
