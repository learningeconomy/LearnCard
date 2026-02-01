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
    BoostQuery,
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
    SendInput,
    SendResponse,
    AuthGrantType,
    AuthGrantQuery,
    IssueInboxCredentialType,
    InboxCredentialType,
    PaginatedInboxCredentialsType,
    PaginatedSkillFrameworksType,
    ContactMethodQueryType,
    ContactMethodType,
    InboxCredentialQuery,
    IssueInboxCredentialResponseType,
    // Shared Skills/Frameworks/Tags (non-flat)
    TagType,
    SkillFrameworkType,
    SkillFrameworkQuery,
    SkillType,
    SkillQuery,
    PaginatedSkillTree,
    FrameworkWithSkills,
    SyncFrameworkInput,
    AddTagInput,
    LinkProviderFrameworkInputType,
    CreateManagedSkillFrameworkInput,
    CreateManagedSkillFrameworkBatchInput,
    UpdateSkillFrameworkInput,
    CreateSkillInput,
    CreateSkillsBatchInput,
    UpdateSkillInput,
    DeleteSkillInput,
    ReplaceSkillFrameworkSkillsInput,
    ReplaceSkillFrameworkSkillsResult,
    CountSkillsInput,
    CountSkillsResult,
    GetFullSkillTreeInput,
    GetFullSkillTreeResult,
    GetSkillPathInput,
    GetSkillPathResult,
    // Integrations
    LCNIntegration,
    LCNIntegrationCreateType,
    LCNIntegrationUpdateType,
    LCNIntegrationQueryType,
    PaginatedLCNIntegrationsType,
    // App Store
    AppStoreListing,
    AppStoreListingCreateType,
    AppStoreListingUpdateType,
    AppListingStatus,
    PromotionLevel,
    PaginatedAppStoreListings,
    PaginatedInstalledApps,
    AppEvent,
    AppEventResponse,
    // Activity
    CredentialActivityEventType,
    CredentialActivityRecord,
    PaginatedCredentialActivities,
    CredentialActivityStats,
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
    connectWithExpiredInvite: (profileId: string) => Promise<boolean>;
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
        expiration?: number,
        maxUses?: number
    ) => Promise<{ profileId: string; challenge: string; expiresIn: number | null }>;

    listInvites: () => Promise<
        {
            challenge: string;
            expiresIn: number | null;
            usesRemaining: number | null;
            maxUses: number | null;
        }[]
    >;

    invalidateInvite: (challenge: string) => Promise<boolean>;

    blockProfile: (profileId: string) => Promise<boolean>;
    unblockProfile: (profileId: string) => Promise<boolean>;
    getBlockedProfiles: () => Promise<LCNProfile[]>;

    sendCredential: (
        profileId: string,
        vc: UnsignedVC | VC,
        metadataOrEncrypt?: Record<string, unknown> | boolean,
        encrypt?: boolean
    ) => Promise<string>;
    acceptCredential: (
        uri: string,
        options?: {
            skipNotification?: boolean;
            metadata?: Record<string, unknown>;
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
        metadata?: Partial<Omit<Boost, 'uri'>> & {
            skills?: { frameworkId: string; id: string }[];
        }
    ) => Promise<string>;
    createChildBoost: (
        parentUri: string,
        credential: VC | UnsignedVC,
        metadata?: Partial<Omit<Boost, 'uri'>> & {
            skills?: { frameworkId: string; id: string }[];
        }
    ) => Promise<string>;
    getBoost: (uri: string) => Promise<Boost & { boost: UnsignedVC }>;
    getBoostFrameworks: (
        uri: string,
        options?: { limit?: number; cursor?: string | null; query?: SkillFrameworkQuery }
    ) => Promise<PaginatedSkillFrameworksType>;
    getSkillsAvailableForBoost: (uri: string) => Promise<
        {
            framework: SkillFrameworkType;
            skills: Omit<SkillType, 'createdAt' | 'updatedAt'>[];
        }[]
    >;
    searchSkillsAvailableForBoost: (
        uri: string,
        query: SkillQuery,
        options?: { limit?: number; cursor?: string | null }
    ) => Promise<{ records: SkillType[]; hasMore: boolean; cursor: string | null }>;
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
    countBoostRecipientsWithChildren: (
        uri: string,
        includeUnacceptedBoosts?: boolean,
        boostQuery?: BoostQuery,
        profileQuery?: LCNProfileQuery,
        numberOfGenerations?: number
    ) => Promise<number>;
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
    attachFrameworkToBoost: (boostUri: string, frameworkId: string) => Promise<boolean>;
    detachFrameworkFromBoost: (boostUri: string, frameworkId: string) => Promise<boolean>;
    alignBoostSkills: (
        boostUri: string,
        skills: { frameworkId: string; id: string }[]
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
                  templateData?: Record<string, unknown>;
              }
    ) => Promise<string>;

    registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    getRegisteredSigningAuthorities: () => Promise<LCNSigningAuthorityForUserType[]>;
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

    send: (input: SendInput) => Promise<SendResponse>;

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

    sendAiInsightsContractRequest: (
        contractUri: string,
        targetProfileId: string,
        shareLink: string
    ) => Promise<boolean>;

    sendAiInsightShareRequest: (
        targetProfileId: string,
        shareLink: string,
        childProfileId?: string
    ) => Promise<boolean>;

    getContractSentRequests: (contractUri: string) => Promise<
        {
            profile: LCNProfile;
            status: 'pending' | 'accepted' | 'denied' | null;
            readStatus?: 'unseen' | 'seen' | null;
        }[]
    >;

    getRequestStatusForProfile: (
        targetProfileId: string,
        contractId?: string | undefined,
        contractUri?: string | undefined
    ) => Promise<{
        profile: LCNProfile;
        status: 'pending' | 'accepted' | 'denied' | null;
        readStatus?: 'unseen' | 'seen' | null;
    } | null>;

    getAllContractRequestsForProfile: (targetProfileId: string) => Promise<
        {
            contract: ConsentFlowContract & { uri: string };
            profile: LCNProfile;
            status: 'pending' | 'accepted' | 'denied' | null;
            readStatus?: 'unseen' | 'seen' | null;
        }[]
    >;

    forwardContractRequestToProfile: (
        parentProfileId: string,
        targetProfileId: string,
        contractUri?: string
    ) => Promise<boolean>;

    markContractRequestAsSeen: (contractUri: string, targetProfileId: string) => Promise<boolean>;
    cancelContractRequest: (contractUri: string, targetProfileId: string) => Promise<boolean>;

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
    finalizeInboxCredentials: () => Promise<{
        processed: number;
        claimed: number;
        errors: number;
        verifiableCredentials: VC[];
    }>;

    // Guardian Approval
    sendGuardianApprovalEmail: (options: {
        guardianEmail: string;
        ttlHours?: number;
        template?: { id?: string; model?: Record<string, unknown> };
    }) => Promise<{ message: string; approvalUrl: string }>;
    approveGuardianRequest: (token: string) => Promise<{ message: string }>;
    approveGuardianRequestByPath: (token: string) => Promise<{ message: string }>;
    addContactMethod: (
        contactMethod: ContactMethodQueryType
    ) => Promise<{ message: string; contactMethodId: string; verificationRequired: boolean }>;
    getMyContactMethods: () => Promise<ContactMethodType[]>;

    setPrimaryContactMethod: (contactMethodId: string) => Promise<{ message: string }>;
    verifyContactMethod: (
        token: string
    ) => Promise<{ message: string; contactMethod: ContactMethodType }>;
    verifyContactMethodWithCredential: (
        proofOfLoginJwt: string
    ) => Promise<{ message: string; contactMethod: ContactMethodType }>;
    removeContactMethod: (contactMethodId: string) => Promise<{ message: string }>;

    // Skills & Skill Frameworks
    syncFrameworkSkills: (input: SyncFrameworkInput) => Promise<FrameworkWithSkills>;
    listSkillTags: (frameworkId: string, skillId: string) => Promise<TagType[]>;
    addSkillTag: (frameworkId: string, skillId: string, tag: AddTagInput) => Promise<TagType[]>;
    removeSkillTag: (
        frameworkId: string,
        skillId: string,
        slug: string
    ) => Promise<{ success: boolean }>;

    createManagedSkillFramework: (
        input: CreateManagedSkillFrameworkInput
    ) => Promise<SkillFrameworkType>;
    createManagedSkillFrameworks: (
        input: CreateManagedSkillFrameworkBatchInput
    ) => Promise<SkillFrameworkType[]>;
    createSkillFramework: (input: LinkProviderFrameworkInputType) => Promise<SkillFrameworkType>;
    listMySkillFrameworks: () => Promise<SkillFrameworkType[]>;
    getSkillFrameworkById: (
        id: string,
        options?: { limit?: number; childrenLimit?: number; cursor?: string | null }
    ) => Promise<FrameworkWithSkills>;
    getBoostsThatUseFramework: (
        frameworkId: string,
        options?: { limit?: number; cursor?: string | null; query?: BoostQuery }
    ) => Promise<PaginatedBoostsType>;
    countBoostsThatUseFramework: (
        frameworkId: string,
        options?: { query?: BoostQuery }
    ) => Promise<{ count: number }>;
    getFrameworkSkillTree: (
        frameworkId: string,
        options?: { rootsLimit?: number; childrenLimit?: number; cursor?: string | null }
    ) => Promise<PaginatedSkillTree>;
    getSkillChildren: (
        frameworkId: string,
        skillId: string,
        options?: { limit?: number; cursor?: string | null }
    ) => Promise<PaginatedSkillTree>;
    searchFrameworkSkills: (
        frameworkId: string,
        query: SkillQuery,
        options?: { limit?: number; cursor?: string | null }
    ) => Promise<{ records: SkillType[]; hasMore: boolean; cursor: string | null }>;
    updateSkillFramework: (input: UpdateSkillFrameworkInput) => Promise<SkillFrameworkType>;
    deleteSkillFramework: (id: string) => Promise<{ success: boolean }>;
    replaceSkillFrameworkSkills: (
        input: ReplaceSkillFrameworkSkillsInput
    ) => Promise<ReplaceSkillFrameworkSkillsResult>;
    countSkills: (input: CountSkillsInput) => Promise<CountSkillsResult>;
    getFullSkillTree: (input: GetFullSkillTreeInput) => Promise<GetFullSkillTreeResult>;
    getSkillPath: (input: GetSkillPathInput) => Promise<GetSkillPathResult>;
    getSkillFrameworkAdmins: (frameworkId: string) => Promise<LCNProfile[]>;
    addSkillFrameworkAdmin: (
        frameworkId: string,
        profileId: string
    ) => Promise<{ success: boolean }>;
    removeSkillFrameworkAdmin: (
        frameworkId: string,
        profileId: string
    ) => Promise<{ success: boolean }>;

    getSkill: (frameworkId: string, skillId: string) => Promise<SkillType>;
    createSkill: (input: CreateSkillInput) => Promise<SkillType>;
    createSkills: (input: CreateSkillsBatchInput) => Promise<SkillType[]>;
    updateSkill: (input: UpdateSkillInput) => Promise<SkillType>;
    deleteSkill: (input: DeleteSkillInput) => Promise<{ success: boolean }>;

    // Integrations
    addIntegration: (integration: LCNIntegrationCreateType) => Promise<string>;
    getIntegration: (id: string) => Promise<LCNIntegration | undefined>;
    getIntegrations: (
        options?: Partial<PaginationOptionsType> & { query?: LCNIntegrationQueryType }
    ) => Promise<PaginatedLCNIntegrationsType>;
    countIntegrations: (options?: { query?: LCNIntegrationQueryType }) => Promise<number>;
    updateIntegration: (id: string, updates: LCNIntegrationUpdateType) => Promise<boolean>;
    deleteIntegration: (id: string) => Promise<boolean>;
    associateIntegrationWithSigningAuthority: (
        integrationId: string,
        endpoint: string,
        name: string,
        did: string,
        isPrimary?: boolean
    ) => Promise<boolean>;

    // App Store
    createAppStoreListing: (
        integrationId: string,
        listing: AppStoreListingCreateType
    ) => Promise<string>;
    getAppStoreListing: (listingId: string) => Promise<AppStoreListing | undefined>;
    updateAppStoreListing: (
        listingId: string,
        updates: AppStoreListingUpdateType
    ) => Promise<boolean>;
    deleteAppStoreListing: (listingId: string) => Promise<boolean>;
    submitAppStoreListingForReview: (listingId: string) => Promise<boolean>;
    getListingsForIntegration: (
        integrationId: string,
        options?: Partial<PaginationOptionsType>
    ) => Promise<PaginatedAppStoreListings>;
    countListingsForIntegration: (integrationId: string) => Promise<number>;

    browseAppStore: (options?: {
        limit?: number;
        cursor?: string;
        category?: string;
        promotionLevel?: PromotionLevel;
    }) => Promise<PaginatedAppStoreListings>;
    getPublicAppStoreListing: (listingId: string) => Promise<AppStoreListing | undefined>;
    getAppStoreListingInstallCount: (listingId: string) => Promise<number>;

    installApp: (listingId: string) => Promise<boolean>;
    uninstallApp: (listingId: string) => Promise<boolean>;
    getInstalledApps: (options?: Partial<PaginationOptionsType>) => Promise<PaginatedInstalledApps>;
    countInstalledApps: () => Promise<number>;
    isAppInstalled: (listingId: string) => Promise<boolean>;

    isAppStoreAdmin: () => Promise<boolean>;
    adminUpdateListingStatus: (listingId: string, status: AppListingStatus) => Promise<boolean>;
    adminUpdatePromotionLevel: (
        listingId: string,
        promotionLevel: PromotionLevel
    ) => Promise<boolean>;
    adminGetAllListings: (options?: {
        limit?: number;
        cursor?: string;
        status?: AppListingStatus;
    }) => Promise<PaginatedAppStoreListings>;

    // App Store Boost Management
    addBoostToApp: (listingId: string, boostUri: string, templateAlias: string) => Promise<boolean>;
    removeBoostFromApp: (listingId: string, templateAlias: string) => Promise<boolean>;
    getAppBoosts: (
        listingId: string
    ) => Promise<Array<{ templateAlias: string; boostUri: string }>>;

    // App Events (discriminated union)
    sendAppEvent: (listingId: string, event: AppEvent) => Promise<AppEventResponse>;

    resolveFromLCN: (
        uri: string
    ) => Promise<VC | UnsignedVC | VP | JWE | ConsentFlowContract | ConsentFlowTerms>;

    getLCNClient: () => LCNClient;

    // Activity
    getMyActivities: (options?: {
        limit?: number;
        cursor?: string;
        boostUri?: string;
        eventType?: CredentialActivityEventType;
        integrationId?: string;
    }) => Promise<PaginatedCredentialActivities>;

    getActivityStats: (options?: {
        boostUris?: string[];
        integrationId?: string;
    }) => Promise<CredentialActivityStats>;

    getActivity: (options: { activityId: string }) => Promise<CredentialActivityRecord | null>;

    getActivityChain: (options: { activityId: string }) => Promise<CredentialActivityRecord[]>;
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
