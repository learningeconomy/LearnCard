import type { InitLearnCard } from '@learncard/init';
import type { ReadLearnCardBundleOptions } from './types';
type SeededInitConfig = Extract<InitLearnCard['args'], {
    seed: string;
}>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type RestoreLearnCardInit = DistributiveOmit<SeededInitConfig, 'seed'>;
export type RestoreLearnCardFromBundleOptions = ReadLearnCardBundleOptions & {
    init: RestoreLearnCardInit;
};
export declare const readLearnCardBundleSeedData: (data: Buffer, options?: ReadLearnCardBundleOptions) => Promise<string>;
export declare const readLearnCardBundleSeed: (path: string, options?: ReadLearnCardBundleOptions) => Promise<string>;
export declare const restoreLearnCardFromBundleData: (data: Buffer, options: RestoreLearnCardFromBundleOptions) => Promise<InitLearnCard["returnValue"]>;
export declare const restoreLearnCardFromBundle: (path: string, options: RestoreLearnCardFromBundleOptions) => Promise<InitLearnCard["returnValue"]>;
export {};
//# sourceMappingURL=restoreBundle.d.ts.map