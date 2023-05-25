import type { DID } from 'dids';
import {
    LCNProfile,
    UnsignedVC,
    VC,
    VP,
    SentCredentialInfo,
    JWE,
    Boost,
    BoostRecipientInfo,
    LCNSigningAuthorityForUserType,
    LCNBoostClaimLinkSigningAuthorityType,
    LCNBoostClaimLinkOptionsType,
} from '@learncard/types';
import { Plugin } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';
import { VerifyExtension } from '@learncard/vc-plugin';

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginDependentMethods = {
    getDIDObject: () => DID;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
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
        options?: { limit?: number; includeSelf?: boolean; includeConnectionStatus?: boolean }
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

    blockProfile: (profileId: string) => Promise<boolean>;
    unblockProfile: (profileId: string) => Promise<boolean>;
    getBlockedProfiles: () => Promise<LCNProfile[]>;

    sendCredential: (profileId: string, vc: UnsignedVC | VC, encrypt?: boolean) => Promise<string>;
    acceptCredential: (uri: string) => Promise<boolean>;
    getReceivedCredentials: (from?: string) => Promise<SentCredentialInfo[]>;
    getSentCredentials: (to?: string) => Promise<SentCredentialInfo[]>;
    getIncomingCredentials: (from?: string) => Promise<SentCredentialInfo[]>;
    deleteCredential: (uri: string) => Promise<boolean>;

    sendPresentation: (profileId: string, vp: VP, encrypt?: boolean) => Promise<string>;
    acceptPresentation: (uri: string) => Promise<boolean>;
    getReceivedPresentations: (from?: string) => Promise<SentCredentialInfo[]>;
    getSentPresentations: (to?: string) => Promise<SentCredentialInfo[]>;
    getIncomingPresentations: (from?: string) => Promise<SentCredentialInfo[]>;
    deletePresentation: (uri: string) => Promise<boolean>;

    createBoost: (
        credential: VC | UnsignedVC,
        metadata?: Partial<Omit<Boost, 'uri'>>
    ) => Promise<string>;
    getBoost: (uri: string) => Promise<Boost & { boost: UnsignedVC }>;
    getBoosts: () => Promise<{ name?: string; uri: string }[]>;
    getBoostRecipients: (
        uri: string,
        limit?: number,
        skip?: number,
        includeUnacceptedBoosts?: boolean
    ) => Promise<BoostRecipientInfo[]>;
    updateBoost: (
        uri: string,
        updates: Partial<Omit<Boost, 'uri'>>,
        credential: UnsignedVC | VC
    ) => Promise<boolean>;
    deleteBoost: (uri: string) => Promise<boolean>;
    sendBoost: (profileId: string, boostUri: string, encrypt?: boolean) => Promise<string>;

    registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    getRegisteredSigningAuthorities: (
        endpoint: string,
        name: string,
        did: string
    ) => Promise<LCNSigningAuthorityForUserType[]>;
    getRegisteredSigningAuthority: (
        endpoint: string,
        name: string
    ) => Promise<LCNSigningAuthorityForUserType>;

    generateClaimLink: (
        boostUri: string,
        claimLinkSA: LCNBoostClaimLinkSigningAuthorityType,
        options?: LCNBoostClaimLinkOptionsType,
        challenge?: string
    ) => Promise<{ boostUri: string; challenge: string }>;
    claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;

    resolveFromLCN: (uri: string) => Promise<VC | UnsignedVC | VP | JWE>;
};

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPlugin = Plugin<
    'LearnCard Network',
    'id' | 'read' | 'store',
    LearnCardNetworkPluginMethods,
    'id',
    LearnCardNetworkPluginDependentMethods
>;

/** @group VerifyBoostPlugin Plugin */
export type VerifyBoostPlugin = Plugin<'VerifyBoost', any, VerifyExtension>;

/** @group VerifyBoostPlugin Plugin */
export type TrustedBoostRegistryEntry = {
    id: string;
    url: string;
    did: string;
};
