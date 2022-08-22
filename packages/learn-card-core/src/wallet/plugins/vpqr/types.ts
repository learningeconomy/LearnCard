import { VP } from '@learncard/types';

export type VpqrPluginMethods = {
    VPfromQrCode: (text: string) => Promise<VP>;
    VPtoQrCode: (vp: VP) => Promise<string>;
};

export type DependentMethods = {
    contextLoader: (url: string) => Promise<Record<string, any>>;
};
