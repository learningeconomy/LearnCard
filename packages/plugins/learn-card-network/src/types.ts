import { LCNProfile, UnsignedVC, VC, VP, SentCredentialInfo } from '@learncard/types';
import { Plugin, ProofOptions } from '@learncard/core';

import { CeramicClient } from '@ceramicnetwork/http-client';

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginDependentMethods = {
    getCeramicClient: () => CeramicClient;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
};

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginMethods = {
    createProfile: (profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>) => Promise<string>;
    createServiceProfile: (
        profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>
    ) => Promise<string>;
    updateProfile: (
        profile: Partial<Omit<LCNProfile, 'did' | 'isServiceProfile'>>
    ) => Promise<boolean>;
    deleteProfile: () => Promise<boolean>;
    getProfile: (handle?: string) => Promise<LCNProfile | undefined>;
    searchProfiles: (handle?: string, limit?: number) => Promise<LCNProfile[]>;
    connectWith: (handle: string) => Promise<boolean>;
    connectWithInvite: (handle: string, challenge: string) => Promise<boolean>;
    acceptConnectionRequest: (id: string) => Promise<boolean>;
    getConnections: () => Promise<LCNProfile[]>;
    getPendingConnections: () => Promise<LCNProfile[]>;
    getConnectionRequests: () => Promise<LCNProfile[]>;
    generateInvite: (challenge?: string) => Promise<{ handle: string; challenge: string }>;
    sendCredential: (handle: string, vc: UnsignedVC | VC) => Promise<string>;
    acceptCredential: (handle: string, uri: string) => Promise<boolean>;
    getReceivedCredentials: () => Promise<SentCredentialInfo[]>;
    getSentCredentials: () => Promise<SentCredentialInfo[]>;
    getIncomingCredentials: () => Promise<SentCredentialInfo[]>;
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
