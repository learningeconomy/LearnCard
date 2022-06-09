export type Plugin<
    Name extends string,
    PublicMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name?: Name;
    pluginMethods: {
        [Key in keyof PublicMethods]: <T extends UnlockedWallet<any, PublicMethods>>(
            wallet: T,
            ...args: Parameters<PublicMethods[Key]>
        ) => ReturnType<PublicMethods[Key]>;
    };
};

export type PublicFieldsObj<
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    pluginMethods: PluginMethods;
};

export enum WalletStatus {
    Locked = 'LOCKED',
    Unlocked = 'UNLOCKED',
}

export type BaseWallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = PublicFieldsObj<PluginMethods> & {
    contents: any[];
    plugins: Plugin<PluginNames, Record<string, (...args: any[]) => any>>[];
};

export type LockedWallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = BaseWallet<PluginNames, PluginMethods> & {
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
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = BaseWallet<PluginNames, PluginMethods> & {
    status: WalletStatus.Unlocked;
    add: (content: any) => Promise<UnlockedWallet<PluginNames, PluginMethods>>;
    remove: (contentId: string) => Promise<UnlockedWallet<PluginNames, PluginMethods>>;
    /* lock: (password: string) => Promise<LockedWallet<PluginNames, PluginMethods, PluginConstants>>;
    export: (password: string) => Promise<any>;
    import: (
        encryptedWalletCredential: any,
        password: string
    ) => Promise<UnlockedWallet<PluginNames, PluginMethods, PluginConstants>>; */
    addPlugin: <
        Name extends string,
        Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
    >(
        plugin: Plugin<Name, Methods>
    ) => Promise<
        UnlockedWallet<
            '' extends PluginNames ? Name : PluginNames | Name,
            Record<never, never> extends PluginMethods ? Methods : PluginMethods & Methods
        >
    >;
};

export type Wallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = LockedWallet<PluginNames, PluginMethods> | UnlockedWallet<PluginNames, PluginMethods>;
