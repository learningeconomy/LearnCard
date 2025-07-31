import type { LCNClient } from '@learncard/network-brain-client';
import {
    LCNProfile,
    LCNProfileManager,
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
    PaginatedBoostRecipientsWithChildrenType,
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
    BoostPermissions,
    BoostQuery,
    LCNProfileQuery,
    LCNProfileManagerQuery,
    PaginatedLCNProfileManagers,
    PaginatedLCNProfilesAndManagers,
    DidDocument,
    ClaimHook,
    ClaimHookQuery,
    PaginatedClaimHooksType,
    ConsentFlowDataForDidQuery,
    PaginatedConsentFlowDataForDid,
    PaginatedContractCredentials,
    AutoBoostConfig,
    AuthGrantType,
    AuthGrantQuery,
    IssueInboxCredentialType,
    InboxCredentialType,
    PaginatedInboxCredentialsType,
    ContactMethodType,
    InboxCredentialQuery,
    IssueInboxCredentialResponseType,
} from '@learncard/types';
import { Plugin } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';
import { VerifyExtension } from '@learncard/vc-plugin';

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginDependentMethods = {
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    clearDidWebCache?: () => Promise<void>;
    createDagJwe: (cleartext: any, recipients: string[]) => Promise<JWE>;
    decryptDagJwe: (jwe: JWE, jwks: any[]) => Promise<any>;
};

/** @group LearnCardNetwork Plugin */
export type LearnCardNetworkPluginMethods = {
    createProfile: (profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>) => Promise<string>;
    createServiceProfile: (
        profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>
    ) => Promise<string>;
    createManagedProfile: (profile: Omit<LCNProfile, 'did'>) => Promise<string>;
    createProfileManager: (profile: Omit<LCNProfileManager, 'id' | 'created'>) => Promise<string>;
    createChildProfileManager: (
        parentUri: string,
        profile: Omit<LCNProfileManager, 'id' | 'created'>
    ) => Promise<string>;
    createManagedServiceProfile: (
        profile: Omit<LCNProfile, 'did' | 'isServiceProfile'>
    ) => Promise<string>;
    getAvailableProfiles: (
        options?: Partial<PaginationOptionsType> & { query?: LCNProfileQuery }
    ) => Promise<PaginatedLCNProfilesAndManagers>;
    getManagedProfiles: (
        options?: Partial<PaginationOptionsType> & { query?: LCNProfileQuery }
    ) => Promise<PaginatedLCNProfiles>;
    getManagedServiceProfiles: (
        options: Partial<PaginationOptionsType> & { id?: string }
    ) => Promise<PaginatedLCNProfiles>;
    updateProfile: (
        profile: Partial<Omit<LCNProfile, 'did' | 'isServiceProfile'>>
    ) => Promise<boolean>;
    updateProfileManagerProfile: (
        manager: Partial<Omit<LCNProfileManager, 'id' | 'created'>>
    ) => Promise<boolean>;
    deleteProfile: () => Promise<boolean>;
    getProfile: (profileId?: string) => Promise<LCNProfile | undefined>;
    getProfileManagerProfile: (id?: string) => Promise<LCNProfileManager | undefined>;
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
    acceptCredential: (
        uri: string,
        options?: {
            skipNotification?: boolean;
        }
    ) => Promise<boolean>;
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
    createChildBoost: (
        parentUri: string,
        credential: VC | UnsignedVC,
        metadata?: Partial<Omit<Boost, 'uri'>>
    ) => Promise<string>;
    getBoost: (uri: string) => Promise<Boost & { boost: UnsignedVC }>;
    /** @deprecated Use getPaginatedBoosts */
    getBoosts: (query?: BoostQuery) => Promise<{ name?: string; uri: string }[]>;
    getPaginatedBoosts: (
        options?: PaginationOptionsType & { query?: BoostQuery }
    ) => Promise<PaginatedBoostsType>;
    countBoosts: (query?: BoostQuery) => Promise<number>;
    getBoostChildren: (
        uri: string,
        options?: PaginationOptionsType & { query?: BoostQuery; numberOfGenerations?: number }
    ) => Promise<PaginatedBoostsType>;
    countBoostChildren: (
        uri: string,
        options?: { query?: BoostQuery; numberOfGenerations?: number }
    ) => Promise<number>;
    getBoostSiblings: (
        uri: string,
        options?: PaginationOptionsType & { query?: BoostQuery }
    ) => Promise<PaginatedBoostsType>;
    countBoostSiblings: (uri: string, options?: { query?: BoostQuery }) => Promise<number>;
    getFamilialBoosts: (
        uri: string,
        options?: PaginationOptionsType & {
            query?: BoostQuery;
            parentGenerations?: number;
            childGenerations?: number;
            includeExtendedFamily?: boolean;
        }
    ) => Promise<PaginatedBoostsType>;
    countFamilialBoosts: (
        uri: string,
        options?: {
            query?: BoostQuery;
            parentGenerations?: number;
            childGenerations?: number;
            includeExtendedFamily?: boolean;
        }
    ) => Promise<number>;
    getBoostParents: (
        uri: string,
        options?: PaginationOptionsType & {
            query?: BoostQuery;
            numberOfGenerations?: number;
        }
    ) => Promise<PaginatedBoostsType>;
    countBoostParents: (
        uri: string,
        options?: { query?: BoostQuery; numberOfGenerations?: number }
    ) => Promise<number>;
    makeBoostParent: (uris: { parentUri: string; childUri: string }) => Promise<boolean>;
    removeBoostParent: (uris: { parentUri: string; childUri: string }) => Promise<boolean>;
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
        includeUnacceptedBoosts?: boolean,
        query?: LCNProfileQuery
    ) => Promise<PaginatedBoostRecipientsType>;
    getPaginatedBoostRecipientsWithChildren: (
        uri: string,
        limit?: number,
        cursor?: string,
        includeUnacceptedBoosts?: boolean,
        boostQuery?: BoostQuery,
        profileQuery?: LCNProfileQuery,
        numberOfGenerations?: number
    ) => Promise<PaginatedBoostRecipientsWithChildrenType>;
    countBoostRecipients: (uri: string, includeUnacceptedBoosts?: boolean) => Promise<number>;
    getConnectedBoostRecipients: (
        uri: string,
        options?: {
            limit?: number;
            cursor?: string;
            includeUnacceptedBoosts?: boolean;
            query?: LCNProfileQuery;
        }
    ) => Promise<PaginatedBoostRecipientsType>;
    countConnectedBoostRecipients: (
        uri: string,
        includeUnacceptedBoosts?: boolean
    ) => Promise<number>;
    getBoostChildrenProfileManagers: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { query?: LCNProfileManagerQuery }
    ) => Promise<PaginatedLCNProfileManagers>;
    updateBoost: (
        uri: string,
        updates: Partial<Omit<Boost, 'uri'>>,
        credential?: UnsignedVC | VC
    ) => Promise<boolean>;
    deleteBoost: (uri: string) => Promise<boolean>;
    getBoostAdmins: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { includeSelf?: boolean }
    ) => Promise<PaginatedLCNProfiles>;
    getBoostPermissions: (uri: string, profileId?: string) => Promise<BoostPermissions>;
    updateBoostPermissions: (
        uri: string,
        updates: Partial<Omit<BoostPermissions, 'role'>>,
        profileId?: string
    ) => Promise<boolean>;
    addBoostAdmin: (uri: string, profileId: string) => Promise<boolean>;
    removeBoostAdmin: (uri: string, profileId: string) => Promise<boolean>;
    sendBoost: (
        profileId: string,
        boostUri: string,
        options?:
            | boolean
            | {
                  encrypt?: boolean;
                  overideFn?: (boost: UnsignedVC) => UnsignedVC;
                  skipNotification?: boolean;
              }
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
    setPrimaryRegisteredSigningAuthority: (endpoint: string, name: string) => Promise<boolean>;
    getPrimaryRegisteredSigningAuthority: () => Promise<LCNSigningAuthorityForUserType | undefined>;

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
        writers?: string[];
        autoboosts?: AutoBoostConfig[];
    }) => Promise<string>;
    addAutoBoostsToContract: (
        contractUri: string,
        autoboosts: AutoBoostConfig[]
    ) => Promise<boolean>;
    removeAutoBoostsFromContract: (contractUri: string, boostUris: string[]) => Promise<boolean>;
    getContract: (uri: string) => Promise<ConsentFlowContractDetails>;
    getContracts: (
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowContractQuery }
    ) => Promise<PaginatedConsentFlowContracts>;
    deleteContract: (uri: string) => Promise<boolean>;
    getConsentFlowData: (
        uri: string,
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowDataQuery }
    ) => Promise<PaginatedConsentFlowData>;
    getConsentFlowDataForDid: (
        did: string,
        options?: Partial<PaginationOptionsType> & { query?: ConsentFlowDataForDidQuery }
    ) => Promise<PaginatedConsentFlowDataForDid>;
    getAllConsentFlowData: (
        query?: ConsentFlowDataQuery,
        options?: Partial<PaginationOptionsType>
    ) => Promise<PaginatedConsentFlowData>;
    writeCredentialToContract: (
        did: string,
        contractUri: string,
        credential: VC | JWE,
        boostUri: string
    ) => Promise<string>;

    consentToContract: (
        uri: string,
        terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        },
        recipientToken?: string
    ) => Promise<{ termsUri: string; redirectUrl?: string }>;
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
    getCredentialsForContract: (
        termsUri: string,
        options?: Partial<PaginationOptionsType> & { includeReceived?: boolean }
    ) => Promise<PaginatedContractCredentials>;
    getConsentFlowCredentials: (
        options?: Partial<PaginationOptionsType> & { includeReceived?: boolean }
    ) => Promise<PaginatedContractCredentials>;

    verifyConsent: (uri: string, profileId: string) => Promise<boolean>;

    syncCredentialsToContract: (
        termsUri: string,
        categories: Record<string, string[]>
    ) => Promise<boolean>;

    addDidMetadata: (metadata: Partial<DidDocument>) => Promise<boolean>;
    getDidMetadata: (id: string) => Promise<Partial<DidDocument> | undefined>;
    getMyDidMetadata: () => Promise<Array<Partial<DidDocument> & { id: string }>>;
    updateDidMetadata: (id: string, updates: Partial<DidDocument>) => Promise<boolean>;
    deleteDidMetadata: (id: string) => Promise<boolean>;

    createClaimHook: (hook: ClaimHook) => Promise<string>;
    getClaimHooksForBoost: (
        options: Partial<PaginationOptionsType> & { uri: string; query?: ClaimHookQuery }
    ) => Promise<PaginatedClaimHooksType>;
    deleteClaimHook: (id: string) => Promise<boolean>;

    addAuthGrant: (authGrant: Partial<AuthGrantType>) => Promise<string>;
    getAuthGrant: (id: string) => Promise<Partial<AuthGrantType> | undefined>;
    getAuthGrants: (
        options?: Partial<PaginationOptionsType> & { query?: AuthGrantQuery }
    ) => Promise<Partial<AuthGrantType>[] | undefined>;
    deleteAuthGrant: (id: string) => Promise<boolean>;
    updateAuthGrant: (id: string, updates: Partial<AuthGrantType>) => Promise<boolean>;
    revokeAuthGrant: (id: string) => Promise<boolean>;
    getAPITokenForAuthGrant: (id: string) => Promise<string>;

    sendCredentialViaInbox: (
        issueInboxCredential: IssueInboxCredentialType
    ) => Promise<IssueInboxCredentialResponseType>;
    getMySentInboxCredentials: (
        options?: Partial<PaginationOptionsType> & { query?: InboxCredentialQuery }
    ) => Promise<PaginatedInboxCredentialsType>;

    getInboxCredential: (id: string) => Promise<InboxCredentialType | null>;

    addContactMethod: (
        contactMethod: ContactMethodType
    ) => Promise<{ message: string; contactMethodId: string; verificationRequired: boolean }>;
    getMyContactMethods: () => Promise<ContactMethodType[]>;

    setPrimaryContactMethod: (contactMethodId: string) => Promise<{ message: string }>;
    verifyContactMethod: (
        token: string
    ) => Promise<{ message: string; contactMethod: ContactMethodType }>;
    removeContactMethod: (contactMethodId: string) => Promise<{ message: string }>;

    resolveFromLCN: (
        uri: string
    ) => Promise<VC | UnsignedVC | VP | JWE | ConsentFlowContract | ConsentFlowTerms>;

    getLCNClient: () => LCNClient;
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
