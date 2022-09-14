import { CachePlane, StoragePlane, WalletCache, WalletStorage } from './planes';
import { UnionToIntersection } from './utilities';

export type GetPluginMethods<Plugins extends Plugin[]> = UnionToIntersection<
    NonNullable<Plugins[number]['_methods']>
>;

export type Plugin<
    Name extends string = string,
    PublicMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name: Name;
    storage?: StoragePlane;
    cache?: CachePlane;
    pluginMethods: {
        [Key in keyof PublicMethods]: <T extends Wallet<[Plugin<Name, PublicMethods>]>>(
            wallet: T,
            ...args: Parameters<PublicMethods[Key]>
        ) => ReturnType<PublicMethods[Key]>;
    };
    _methods?: PublicMethods;
};

export type Wallet<Plugins extends Plugin[] = [], PluginMethods = GetPluginMethods<Plugins>> = {
    storage: WalletStorage<Plugins>;
    cache: WalletCache<Plugins>;
    plugins: Plugins;
    pluginMethods: PluginMethods;
    addPlugin: <NewPlugin extends Plugin>(
        plugin: NewPlugin
    ) => Promise<Wallet<[...Plugins, NewPlugin]>>;
};
