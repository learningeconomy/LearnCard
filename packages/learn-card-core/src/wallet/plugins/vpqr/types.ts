import { VP } from '@learncard/types';
import { Plugin } from 'types/wallet';

export type VpqrPluginMethods = {
    vpFromQrCode: (text: string) => Promise<VP>;
    vpToQrCode: (vp: VP) => Promise<string>;
};

export type DependentMethods = {
    contextLoader: (url: string) => Promise<Record<string, any>>;
};

export type VpqrPlugin = Plugin<'Vpqr', VpqrPluginMethods>;
