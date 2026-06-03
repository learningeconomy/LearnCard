import type {
    ExportLearnCardBundleOptions,
    LearnCardBundleWallet,
    RestoreLearnCardFromBundleOptions,
    RestoreLearnCardInit,
} from '@learncard/holder-continuity';

type ExportLearnCardBundleFn = typeof import('@learncard/holder-continuity').exportLearnCardBundle;
type RestoreLearnCardFromBundleFn = typeof import('@learncard/holder-continuity').restoreLearnCardFromBundle;

export const createExportLearnCardBundleHelper = (
    exportBundle: ExportLearnCardBundleFn,
    defaultWallet: LearnCardBundleWallet
) => {
    return (
        walletOrOptions: LearnCardBundleWallet | ExportLearnCardBundleOptions,
        maybeOptions?: ExportLearnCardBundleOptions
    ) => {
        if (maybeOptions) return exportBundle(walletOrOptions as LearnCardBundleWallet, maybeOptions);

        return exportBundle(defaultWallet, walletOrOptions as ExportLearnCardBundleOptions);
    };
};

export const createRestoreLearnCardFromBundleHelper = (
    restoreBundle: RestoreLearnCardFromBundleFn,
    defaultInit: RestoreLearnCardInit
) => {
    return (
        path: string,
        options: (Omit<RestoreLearnCardFromBundleOptions, 'init'> & {
            init?: Partial<RestoreLearnCardInit>;
        }) = {}
    ) => {
        return restoreBundle(path, {
            ...options,
            init: {
                ...defaultInit,
                ...(options.init ?? {}),
            } as RestoreLearnCardInit,
        });
    };
};
