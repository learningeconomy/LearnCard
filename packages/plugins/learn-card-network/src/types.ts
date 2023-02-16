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
    getProfile: (profileId?: string) => Promise<LCNProfile | undefined>;
    searchProfiles: (
        profileId?: string,
        options?: { limit?: number; includeSelf?: boolean }
    ) => Promise<LCNProfile[]>;
    connectWith: (profileId: string) => Promise<boolean>;
    connectWithInvite: (profileId: string, challenge: string) => Promise<boolean>;
    cancelConnectionRequest: (profileId: string) => Promise<boolean>;
    disconnectWith: (profileId: string) => Promise<boolean>;
    acceptConnectionRequest: (id: string) => Promise<boolean>;
    getConnections: () => Promise<LCNProfile[]>;
    getPendingConnections: () => Promise<LCNProfile[]>;
    getConnectionRequests: () => Promise<LCNProfile[]>;
    generateInvite: (challenge?: string) => Promise<{ profileId: string; challenge: string }>;
    sendCredential: (profileId: string, vc: UnsignedVC | VC) => Promise<string>;
    acceptCredential: (profileId: string, uri: string) => Promise<boolean>;
    getReceivedCredentials: () => Promise<SentCredentialInfo[]>;
    getSentCredentials: () => Promise<SentCredentialInfo[]>;
    getIncomingCredentials: () => Promise<SentCredentialInfo[]>;
    sendPresentation: (profileId: string, vp: VP) => Promise<string>;
    acceptPresentation: (profileId: string, uri: string) => Promise<boolean>;
    getReceivedPresentations: () => Promise<SentCredentialInfo[]>;
    getSentPresentations: () => Promise<SentCredentialInfo[]>;
    getIncomingPresentations: () => Promise<SentCredentialInfo[]>;
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
