import type { DID } from 'dids';
import type { LCNClient } from '@learncard/network-brain-client';
import {
    LCNProfile,
    UnsignedVC,
    VC,
    VP,
    SentCredentialInfo,
    JWE,
    Boost,
    LCNSigningAuthorityForUserType,
    LCNBoostClaimLinkSigningAuthorityType,
    LCNBoostClaimLinkOptionsType,
    PaginationOptionsType,
    PaginatedBoostsType,
    PaginatedBoostRecipientsType,
    PaginatedLCNProfiles,
    ConsentFlowContract,
    ConsentFlowContractQuery,
    ConsentFlowTerms,
    ConsentFlowTermsQuery,
    PaginatedConsentFlowContracts,
    PaginatedConsentFlowTerms,
    ConsentFlowContractDetails,
    PaginatedConsentFlowTransactions,
    ConsentFlowTransactionsQuery,
    PaginatedConsentFlowData,
    ConsentFlowDataQuery,
    BoostRecipientInfo,
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
    createManagedServiceProfile: (
        profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>
    ) => Promise<string>;
    getManagedServiceProfiles: (
        options: Partial<PaginationOptionsType> & { id?: string }
    ) => Promise<PaginatedLCNProfiles>;
    updateProfile: (
        profile: Partial<Omit<LCNProfile, 'did' | 'isServiceProfile'>>
    ) => Promise<boolean>;
    deleteProfile: () => Promise<boolean>;
    getProfile: (profileId?: string) => Promise<LCNProfile | undefined>;
    searchProfiles: (
        profileId?: string,
        options?: {
            limit?: number;
            includeSelf?: boolean;
            includeConnectionStatus?: boolean;
            includeServiceProfiles?: boolean;
        }
    ) => Promise<LCNProfile[]>;
    connectWith: (profileId: string) => Promise<boolean>;
    connectWithInvite: (profileId: string, challenge: string) => Promise<boolean>;
    cancelConnectionRequest: (profileId: string) => Promise<boolean>;
    disconnectWith: (profileId: string) => Promise<boolean>;
    acceptConnectionRequest: (id: string) => Promise<boolean>;
    /** @deprecated Use getPaginatedConnections */
    getConnections: () => Promise<LCNProfile[]>;
    getPaginatedConnections: (options?: PaginationOptionsType) => Promise<PaginatedLCNProfiles>;
    /** @deprecated Use getPaginatedPendingConnections */
    getPendingConnections: () => Promise<LCNProfile[]>;
    getPaginatedPendingConnections: (
        options?: PaginationOptionsType
    ) => Promise<PaginatedLCNProfiles>;
    /** @deprecated Use getPaginatedConnectionRequests */
    getConnectionRequests: () => Promise<LCNProfile[]>;
    getPaginatedConnectionRequests: (
        options?: PaginationOptionsType
    ) => Promise<PaginatedLCNProfiles>;
    generateInvite: (
        challenge?: string,
        expiration?: number
    ) => Promise<{ profileId: string; challenge: string; experiesIn?: number | null }>;

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
    /** @deprecated Use getPaginatedBoosts */
    getBoosts: () => Promise<{ name?: string; uri: string }[]>;
    getPaginatedBoosts: (options?: PaginationOptionsType) => Promise<PaginatedBoostsType>;
    /** @deprecated Use getPaginatedBoostRecipients */
    getBoostRecipients: (
        uri: string,
        limit?: number,
        skip?: number,
        includeUnacceptedBoosts?: boolean
    ) => Promise<BoostRecipientInfo[]>;
    getPaginatedBoostRecipients: (
        uri: string,
        limit?: number,
        cursor?: string,
        includeUnacceptedBoosts?: boolean
    ) => Promise<PaginatedBoostRecipientsType>;
    countBoostRecipients: (uri: string, includeUnacceptedBoosts?: boolean) => Promise<number>;
    updateBoost: (
        uri: string,
        updates: Partial<Omit<Boost, 'uri'>>,
        credential: UnsignedVC | VC
    ) => Promise<boolean>;
    deleteBoost: (uri: string) => Promise<boolean>;
    getBoostAdmins: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { includeSelf?: boolean }
    ) => Promise<PaginatedLCNProfiles>;
    addBoostAdmin: (uri: string, profileId: string) => Promise<boolean>;
    removeBoostAdmin: (uri: string, profileId: string) => Promise<boolean>;
    sendBoost: (
        profileId: string,
        boostUri: string,
        options?: boolean | { encrypt?: boolean; overideFn?: (boost: UnsignedVC) => UnsignedVC }
    ) => Promise<string>;

    registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    getRegisteredSigningAuthorities: (
        endpoint: string,
        name: string,
        did: string
    ) => Promise<LCNSigningAuthorityForUserType[]>;
    getRegisteredSigningAuthority: (
        endpoint: string,
        name: string
    ) => Promise<LCNSigningAuthorityForUserType | undefined>;

    generateClaimLink: (
        boostUri: string,
        claimLinkSA: LCNBoostClaimLinkSigningAuthorityType,
        options?: LCNBoostClaimLinkOptionsType,
        challenge?: string
    ) => Promise<{ boostUri: string; challenge: string }>;
    claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;

    createContract: (contract: {
        contract: ConsentFlowContract;
        name: string;
        subtitle?: string;
        description?: string;
        image?: string;
        expiresAt?: string;
    }) => Promise<string>;
    getContract: (uri: string) => Promise<ConsentFlowContractDetails>;
    getContracts: (
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowContractQuery }
    ) => Promise<PaginatedConsentFlowContracts>;
    deleteContract: (uri: string) => Promise<boolean>;
    getConsentFlowData: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowDataQuery }
    ) => Promise<PaginatedConsentFlowData>;
    getAllConsentFlowData: (
        query?: ConsentFlowDataQuery,
        options?: Partial<PaginationOptionsType>
    ) => Promise<PaginatedConsentFlowData>;
    consentToContract: (
        uri: string,
        terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        }
    ) => Promise<string>;
    getConsentedContracts: (
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowTermsQuery }
    ) => Promise<PaginatedConsentFlowTerms>;
    updateContractTerms: (
        uri: string,
        terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        }
    ) => Promise<boolean>;
    withdrawConsent: (uri: string) => Promise<boolean>;
    getConsentFlowTransactions: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowTransactionsQuery }
    ) => Promise<PaginatedConsentFlowTransactions>;
    verifyConsent: (uri: string, profileId: string) => Promise<boolean>;

    resolveFromLCN: (
        uri: string
    ) => Promise<VC | UnsignedVC | VP | JWE | ConsentFlowContract | ConsentFlowTerms>;

    getLCNClient: () => LCNClient;
    countBoosts: () => Promise<number>;
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
