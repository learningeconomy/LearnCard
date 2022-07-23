export type Plugin<
    Name extends string,
    PublicMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = {
    name?: Name;
    pluginMethods: {
        [Key in keyof PublicMethods]: <T extends Wallet<any, PublicMethods>>(
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

export type Wallet<
    PluginNames extends string = '',
    PluginMethods extends Record<string, (...args: any[]) => any> = Record<never, never>
> = PublicFieldsObj<PluginMethods> & {
    contents: any[];
    plugins: Plugin<PluginNames, Record<string, (...args: any[]) => any>>[];
    add: (content: any) => Promise<Wallet<PluginNames, PluginMethods>>;
    remove: (contentId: string) => Promise<Wallet<PluginNames, PluginMethods>>;
    addPlugin: <
        Name extends string,
        Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
    >(
        plugin: Plugin<Name, Methods>
    ) => Promise<
        Wallet<
            '' extends PluginNames ? Name : PluginNames | Name,
            Record<never, never> extends PluginMethods ? Methods : PluginMethods & Methods
        >
    >;
};
