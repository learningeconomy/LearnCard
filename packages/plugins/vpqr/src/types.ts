import { VP } from '@learncard/types';
import { Plugin } from '@learncard/core';

/** @group VPQR Plugin */
export type VpqrPluginMethods = {
    vpFromQrCode: (text: string) => Promise<VP>;
    vpToQrCode: (vp: VP) => Promise<string>;
};

/** @group VPQR Plugin */
export type VpqrPluginDependentMethods = {
    contextLoader: (url: string) => Promise<Record<string, any>>;
};

export type VpqrPlugin = Plugin<'Vpqr', any, VpqrPluginMethods, any, VpqrPluginDependentMethods>;
