import { CachePlane, StoragePlane, WalletCache, WalletStorage } from './planes';
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
    PublicMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    DependentMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name: Name;
    storage?: StoragePlane;
    cache?: CachePlane;
    pluginMethods: {
        [Key in keyof PublicMethods]: <T extends Wallet<any, PublicMethods & DependentMethods>>(
            wallet: T,
            ...args: Parameters<PublicMethods[Key]>
        ) => ReturnType<PublicMethods[Key]>;
    };
    _methods?: PublicMethods;
};

/** @group Universal Wallets */
export type PublicFieldsObj<
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    pluginMethods: PluginMethods;
};

/** @group Universal Wallets */
export type Wallet<Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>> = {
    storage: WalletStorage<Plugins>;
    cache: WalletCache<Plugins>;
    plugins: Plugins;
    pluginMethods: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<Wallet<[...Plugins, NewPlugin]>>;
};
