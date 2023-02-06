import { LCNProfile, UnsignedVC, VC, VP } from '@learncard/types';
import { Plugin, ProofOptions } from '@learncard/core';

import { CeramicClient } from '@ceramicnetwork/http-client';

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginDependentMethods = {
    getCeramicClient: () => CeramicClient;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
};

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginMethods = {
    createProfile: (profile: LCNProfile) => Promise<string>;
    updateProfile: (profile: Partial<Omit<LCNProfile, 'did'>>) => Promise<boolean>;
    deleteProfile: () => Promise<boolean>;
    getProfile: (handle?: string) => Promise<LCNProfile | undefined>;
    searchProfiles: (handle?: string, limit?: number) => Promise<LCNProfile[]>;
    connectWith: (handle: string) => Promise<boolean>;
    acceptConnectionRequest: (id: string) => Promise<boolean>;
    getConnections: () => Promise<LCNProfile[]>;
    getPendingConnections: () => Promise<LCNProfile[]>;
    getConnectionRequests: () => Promise<LCNProfile[]>;
    sendCredential: (handle: string, vc: UnsignedVC | VC) => Promise<string>;
    acceptCredential: (handle: string, uri: string) => Promise<boolean>;
    registerSigningAuthority: (uri: string) => Promise<boolean>;
};

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPlugin = Plugin<
    'LearnCard Network',
    'id' | 'read' | 'store',
    LearnCardNetworkPluginMethods,
    'id',
    LearnCardNetworkPluginDependentMethods
>;
