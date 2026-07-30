declare module 'gradient-string' {
    const gradient: (...args: any[]) => any;
    export default gradient;
}

declare module '@learncard/holder-continuity' {
    export type ExportLearnCardBundleOptions = any;
    export type LearnCardBundleWallet = any;
    export type RestoreLearnCardFromBundleOptions = any;
    export type RestoreLearnCardInit = any;

    export const createLearnCardBundle: any;
    export const exportLearnCardBundle: any;
    export const importLearnCardBundle: any;
    export const readLearnCardBundle: any;
    export const restoreLearnCardFromBundle: any;
}
