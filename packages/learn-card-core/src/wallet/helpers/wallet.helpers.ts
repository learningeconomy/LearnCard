import { UnlockedWallet } from 'types/wallet';
export const recycleDependents = <
    Methods extends Record<string, (...args: any[]) => any> = Record<never, never>
>(
    _methods: Methods
): {
    [Key in keyof Methods]: <T extends UnlockedWallet<any, Methods>>(
        wallet: T,
        ...args: Parameters<Methods[Key]>
    ) => ReturnType<Methods[Key]>;
} => ({} as any);
