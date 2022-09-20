import { Wallet } from 'types/wallet';

/**
 * Type helper to allow a plugin to depend on methods without re-exporting them
 *
 * E.g. {
 *     pluginMethods: {
 *         ...recycleDependents(wallet.pluginMethods), // instead of ...wallet.pluginMethods
 *         method: () => {},
 *     }
 * }
 *
 * Using this method allows you to recycle dependents with arguments, and is more optimized
 * than simply spreading the original pluginMethods object because this is purely a type helper and
 * returns an empty object!
 *
 * @group Helper Functions
 */
export const recycleDependents = <
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    _methods: Methods
): {
    [Key in keyof Methods]: <T extends Wallet<any, Methods>>(
        wallet: T,
        ...args: Parameters<Methods[Key]>
    ) => ReturnType<Methods[Key]>;
} => ({} as any);
