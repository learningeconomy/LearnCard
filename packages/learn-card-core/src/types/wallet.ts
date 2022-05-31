export type Plugin<
    Name extends string,
    PublicMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PublicConstants extends Record<string, any> = Record<never, never>
> = {
    name?: Name;
    pluginMethods: {
        [Key in keyof PublicMethods]: <
            T extends UnlockedWallet<any, PublicMethods, PublicConstants>
        >(
            wallet: T,
            ...args: Parameters<PublicMethods[Key]>
        ) => ReturnType<PublicMethods[Key]>;
    };
    pluginConstants: PublicConstants;
};

export type PublicFieldsObj<
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginConstants extends Record<string, any> = Record<never, never>
> = {
    pluginMethods: PluginMethods;
    pluginConstants: PluginConstants;
};

export enum WalletStatus {
    Locked = 'LOCKED',
    Unlocked = 'UNLOCKED',
}

export type BaseWallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginConstants extends Record<string, any> = Record<never, never>
> = PublicFieldsObj<PluginMethods, PluginConstants> & {
    contents: any[];
    plugins: Plugin<PluginNames, Record<string, (...args: any[]) => any>, Record<string, any>>[];
};

export type LockedWallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginConstants extends Record<string, any> = Record<never, never>
> = BaseWallet<PluginNames, PluginMethods, PluginConstants> & {
    status: WalletStatus.Locked;
    /* unlock: (
        password: string
    ) => Promise<
        | { success: true; wallet: UnlockedWallet<PluginNames, PluginMethods> }
        | { success: false; wallet: LockedWallet<PluginNames, PluginMethods> }
    >; */
};

export type UnlockedWallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginConstants extends Record<string, any> = Record<never, never>
> = BaseWallet<PluginNames, PluginMethods, PluginConstants> & {
    status: WalletStatus.Unlocked;
    add: (content: any) => Promise<UnlockedWallet<PluginNames, PluginMethods, PluginConstants>>;
    remove: (
        contentId: string
    ) => Promise<UnlockedWallet<PluginNames, PluginMethods, PluginConstants>>;
    /* lock: (password: string) => Promise<LockedWallet<PluginNames, PluginMethods, PluginConstants>>;
    export: (password: string) => Promise<any>;
    import: (
        encryptedWalletCredential: any,
        password: string
    ) => Promise<UnlockedWallet<PluginNames, PluginMethods, PluginConstants>>; */
    addPlugin: <
        Name extends string,
        Methods extends Record<string, (...args: any[]) => any> = Record<never, never>,
        Constants extends Record<string, any> = Record<never, never>
    >(
        plugin: Plugin<Name, Methods, Constants>
    ) => Promise<
        UnlockedWallet<
            '' extends PluginNames ? Name : PluginNames | Name,
            Record<never, never> extends PluginMethods ? Methods : PluginMethods & Methods,
            Record<never, never> extends PluginConstants ? Constants : PluginConstants & Constants
        >
    >;
};

export type Wallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>,
    PluginConstants extends Record<string, any> = Record<never, never>
> =
    | LockedWallet<PluginNames, PluginMethods, PluginConstants>
    | UnlockedWallet<PluginNames, PluginMethods, PluginConstants>;

// Wallet<'IDX', Record<never, never>>
// const idxWallet = wallet.addPlugin(getIDXPlugin(wallet))
//
// Wallet<'IDX' | 'IPFS', Record<never, never>>
// const fallbackWallet = wallet.addPlugin(getIDXPlugin(wallet)).addPlugin(getIPFSPlugin(wallet));
// const fallbackWallet = wallet.addPlugins([getIDXPlugin(wallet), getIPFSPlugin(wallet)]);
//
// Wallet<Plugin<Fallback<'IDX' | 'IPFS'>, Record<never, never>>
// const fallbackWallet = wallet.addPlugin(new FallbackPlugin(getIDXPlugin(wallet), getIPFSPlugin(wallet)))

// issue -> DidKit Signing
// earn -> DidKit Validation
// share -> DidKit Validation
