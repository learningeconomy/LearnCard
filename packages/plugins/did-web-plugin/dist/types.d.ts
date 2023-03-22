import type { DID } from 'dids';
import { UnsignedVC, VC, VP } from '@learncard/types';
import { Plugin, ProofOptions } from '@learncard/core';
/** @group DID Web Plugin */
export type DidWebPluginDependentMethods = {
    getDIDObject: () => DID;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (credential: UnsignedVC, signingOptions?: Partial<ProofOptions>) => Promise<VC>;
};
/** @group DID Web Plugin */
export type DidWebPluginMethods = {};
/** @group DID Web Plugin */
export type DidWebPlugin = Plugin<'DID Web', 'id', DidWebPluginMethods, 'id', DidWebPluginDependentMethods>;
