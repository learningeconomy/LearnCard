import { VP } from '@learncard/types';

export type VpqrPluginMethods = {
    vpFromQrCode: (text: string) => Promise<VP>;
    vpToQrCode: (vp: VP) => Promise<string>;
};

export type DependentMethods = {
    contextLoader: (url: string) => Promise<Record<string, any>>;
};
