/**
 * Static catalog of `learnCard.invoke.*` methods for `learncard call`, plus the read/write
 * classification `call` uses to gate writes.
 *
 * The method list mirrors the plugins `initLearnCard({ seed, network })` installs
 * (packages/plugins/learn-card-network, vc, didkit, didkey, encryption, learn-cloud,
 * vc-templates, vpqr, ethereum, chapi, sd-jwt-vc, openid4vc, crypto, learn-card). It is only the offline fallback for `call --list` and a
 * hint in `call --dry-run`: with an identity, `call --list` enumerates the live wallet,
 * and `call <method>` accepts any method the live wallet exposes. `call.test.ts` fails
 * if a name here no longer exists in those plugins' type definitions.
 */

/** Every `learnCard.invoke` method a network wallet from a seed exposes (sorted). */
export const STATIC_INVOKE_METHODS: readonly string[] = [
    'acceptAndStoreCredentialOffer',
    'acceptConnectionRequest',
    'acceptContractUpdate',
    'acceptCredential',
    'acceptCredentialOffer',
    'acceptPresentation',
    'acknowledgeShareLinkView',
    'actAs',
    'activateChapiHandler',
    'addAuthGrant',
    'addBoostAdmin',
    'addBoostToApp',
    'addContactMethod',
    'addContractRecipient',
    'addDidMetadata',
    'addInfuraProjectId',
    'addIntegration',
    'addSkillFrameworkAdmin',
    'addSkillTag',
    'adminGetAllListings',
    'adminReviewListingUpdate',
    'adminUpdateListingStatus',
    'adminUpdatePromotionLevel',
    'alignBoostSkills',
    'allocateCredentialRefresh',
    'allocateCredentialStatus',
    'applyManifestVersion',
    'approveGuardianCredential',
    'approveGuardianCredentialInApp',
    'approveGuardianRequest',
    'approveGuardianRequestByPath',
    'associateBoostWithListing',
    'associateListingWithSigningAuthority',
    'attachFrameworkToBoost',
    'beginCredentialOfferAuthCode',
    'blockProfile',
    'browseAppStore',
    'buildPresentation',
    'campaignsAddAudience',
    'campaignsCreate',
    'campaignsDelete',
    'campaignsDispatch',
    'campaignsGet',
    'campaignsGetStats',
    'campaignsIsAdmin',
    'campaignsList',
    'campaignsPageAudience',
    'campaignsPreviewAudience',
    'campaignsPreviewDispatch',
    'campaignsSendTestToMe',
    'campaignsSetStatus',
    'campaignsUpdate',
    'cancelConnectionRequest',
    'cancelContractRequest',
    'categorizeSdJwtVct',
    'changeNetwork',
    'claimBoostWithLink',
    'claimPendingGuardianLinks',
    'clearDidWebCache',
    'completeCredentialOfferAuthCode',
    'connectWith',
    'connectWithConnectionPrompt',
    'connectWithExpiredInvite',
    'connectWithInvite',
    'consentToContract',
    'contextLoader',
    'countBoostChildren',
    'countBoostParents',
    'countBoostRecipients',
    'countBoostRecipientsWithChildren',
    'countBoostSiblings',
    'countBoosts',
    'countBoostsThatUseFramework',
    'countConnectedBoostRecipients',
    'countFamilialBoosts',
    'countInstalledApps',
    'countIntegrations',
    'countListingsForIntegration',
    'countSkills',
    'createAppStoreListing',
    'createBoost',
    'createChildBoost',
    'createChildProfileManager',
    'createClaimHook',
    'createContract',
    'createDagJwe',
    'createDcApiResponse',
    'createJwe',
    'createManagedProfile',
    'createManagedServiceProfile',
    'createManagedSkillFramework',
    'createManagedSkillFrameworks',
    'createProfile',
    'createProfileManager',
    'createServiceProfile',
    'createShareLink',
    'createSkill',
    'createSkillFramework',
    'createSkills',
    'crypto',
    'decodeSdJwtClaims',
    'decryptDagJwe',
    'decryptJwe',
    'deleteAppStoreListing',
    'deleteAuthGrant',
    'deleteBoost',
    'deleteClaimHook',
    'deleteContract',
    'deleteCredential',
    'deleteCredentialFromAllContracts',
    'deleteCredentialSharePreview',
    'deleteDidMetadata',
    'deleteIntegration',
    'deletePresentation',
    'deleteProfile',
    'deleteShareLinkAttachmentChunks',
    'deleteSkill',
    'deleteSkillFramework',
    'denyContractRequest',
    'detachFrameworkFromBoost',
    'didResolver',
    'didToVerificationMethod',
    'discardAppStoreListingUpdate',
    'disconnectWith',
    'enrollInCampaign',
    'exchangeAuthCodeForToken',
    'exchangePreAuthCodeForToken',
    'finalizeInboxCredentials',
    'forwardContractRequestToProfile',
    'generateClaimLink',
    'generateEd25519KeyFromBytes',
    'generateInvite',
    'generateSecp256k1KeyFromBytes',
    'getAPITokenForAuthGrant',
    'getActivity',
    'getActivityChain',
    'getActivityStats',
    'getAllAvailableFrameworks',
    'getAllConsentFlowData',
    'getAllContractRequestsForProfile',
    'getAnnouncementPreferences',
    'getAppBoosts',
    'getAppStoreListing',
    'getAppStoreListingInstallCount',
    'getAuthGrant',
    'getAuthGrants',
    'getAvailableProfiles',
    'getBalance',
    'getBalanceForAddress',
    'getBlockedProfiles',
    'getBoost',
    'getBoostAdmins',
    'getBoostChildren',
    'getBoostChildrenProfileManagers',
    'getBoostFrameworks',
    'getBoostParents',
    'getBoostPermissions',
    'getBoostRecipients',
    'getBoostSiblings',
    'getBoostSkills',
    'getBoosts',
    'getBoostsThatUseFramework',
    'getClaimHooksForBoost',
    'getConnectedBoostRecipients',
    'getConnectionPromptStatus',
    'getConnectionRequests',
    'getConnections',
    'getConsentFlowCredentials',
    'getConsentFlowData',
    'getConsentFlowDataForDid',
    'getConsentFlowTransactions',
    'getConsentStatus',
    'getConsentedContracts',
    'getContract',
    'getContractSentRequests',
    'getContractVersions',
    'getContracts',
    'getCredentialRefreshHistory',
    'getCredentialsForContract',
    'getCurrentNetwork',
    'getDidAuthVp',
    'getDidMetadata',
    'getEthereumAddress',
    'getFamilialBoosts',
    'getFrameworkSkillTree',
    'getFullSkillTree',
    'getGasPrice',
    'getGuardianPendingCredential',
    'getHolderExportMetadata',
    'getInboxCredential',
    'getInboxCredentialBatch',
    'getIncomingCredentials',
    'getIncomingPresentations',
    'getInstalledApps',
    'getIntegration',
    'getIntegrationForListing',
    'getIntegrations',
    'getKey',
    'getLCNClient',
    'getListingSigningAuthority',
    'getListingsForIntegration',
    'getManagedProfiles',
    'getManagedServiceProfiles',
    'getManifestDiff',
    'getManifestVersion',
    'getManifestVersions',
    'getMyActivities',
    'getMyCampaigns',
    'getMyContactMethods',
    'getMyCredentialLifecycleStatuses',
    'getMyCredentialsFromApp',
    'getMyDidMetadata',
    'getMyGuardians',
    'getMyManagedChildren',
    'getMySentInboxCredentials',
    'getPaginatedBoostRecipients',
    'getPaginatedBoostRecipientsWithChildren',
    'getPaginatedBoosts',
    'getPaginatedConnectionRequests',
    'getPaginatedConnections',
    'getPaginatedPendingConnections',
    'getPendingConnectionPrompts',
    'getPendingConnections',
    'getPrimaryRegisteredSigningAuthority',
    'getProfile',
    'getProfileManagerProfile',
    'getPublicAppStoreListing',
    'getPublicAppStoreListingBySlug',
    'getReceivedCredentials',
    'getReceivedPresentations',
    'getRegisteredSigningAuthorities',
    'getRegisteredSigningAuthority',
    'getRequestStatusForProfile',
    'getRevokedCredentials',
    'getSentCredentials',
    'getSentPresentations',
    'getShareLink',
    'getShareLinkAttachmentChunk',
    'getShareLinkContent',
    'getShareLinkOperationStatus',
    'getShareLinkOwnerContent',
    'getShareLinkRecovery',
    'getSharedInsightsRequestsForProfile',
    'getSkill',
    'getSkillChildren',
    'getSkillFrameworkAdmins',
    'getSkillFrameworkById',
    'getSkillPath',
    'getSkillsAvailableForBoost',
    'getSubjectDid',
    'getSubjectKeypair',
    'getTestVc',
    'getTestVp',
    'getTrustedServices',
    'installApp',
    'installChapiHandler',
    'invalidateInvite',
    'isAppInstalled',
    'isAppStoreAdmin',
    'isServiceTrusted',
    'issueCredential',
    'issuePresentation',
    'keyToDid',
    'keyToVerificationMethod',
    'learnCloudBatchResolve',
    'learnCloudCount',
    'learnCloudCreate',
    'learnCloudCreateMany',
    'learnCloudDelete',
    'learnCloudRead',
    'learnCloudReadPage',
    'learnCloudUpdate',
    'listInvites',
    'listMySkillFrameworks',
    'listShareLinks',
    'listSkillTags',
    'makeBoostParent',
    'markContractRequestAsSeen',
    'newCredential',
    'newPresentation',
    'parseAuthorizationRequest',
    'parseCredentialOffer',
    'parseSdJwtVc',
    'prepareVerifiablePresentation',
    'presentCredentials',
    'presentSdJwtVc',
    'publishCredentialRefresh',
    'publishCredentialSharePreview',
    'putShareLinkAttachmentChunk',
    'receiveChapiEvent',
    'recordCampaignEvent',
    'recoverInboxCredentials',
    'refreshCredential',
    'registerSigningAuthority',
    'rejectGuardianCredential',
    'rejectGuardianCredentialInApp',
    'removeBoostAdmin',
    'removeBoostFromApp',
    'removeBoostParent',
    'removeContactMethod',
    'removeContractRecipient',
    'removeManagesRelationship',
    'removeSkillFrameworkAdmin',
    'removeSkillTag',
    'replaceSkillFrameworkSkills',
    'requestCredentialsFromAuthCodeToken',
    'requestCredentialsFromPreAuthToken',
    'resolveAuthorizationRequest',
    'resolveCredentialOffer',
    'resolveDid',
    'resolveFromLCN',
    'resolveShareLink',
    'retryShareLinkOperation',
    'revokeAuthGrant',
    'revokeBoostRecipient',
    'revokeShareLink',
    'searchFrameworkSkills',
    'searchProfiles',
    'searchSkillsAvailableForBoost',
    'semanticSearchSkills',
    'send',
    'sendAiInsightShareRequest',
    'sendAiInsightsContractRequest',
    'sendAppEvent',
    'sendBoost',
    'sendContractRequest',
    'sendCredential',
    'sendCredentialBatchViaInbox',
    'sendCredentialViaInbox',
    'sendCredentialsViaInbox',
    'sendCredentialsViaInboxAndWait',
    'sendGuardianApprovalEmail',
    'sendGuardianChallenge',
    'sendPresentation',
    'sendRefreshableCredential',
    'setPrimaryContactMethod',
    'setPrimaryRegisteredSigningAuthority',
    'signIdToken',
    'signPresentation',
    'skipConnectionPrompt',
    'storeCredentialViaChapiDidAuth',
    'storePresentationViaChapi',
    'submitAppManifest',
    'submitAppStoreListingForReview',
    'submitAppStoreListingUpdate',
    'submitPresentation',
    'suspendBoostRecipient',
    'syncCredentialsToContract',
    'syncFrameworkSkills',
    'toSdJwtDisplayViewModel',
    'transferTokens',
    'unblockProfile',
    'uninstallApp',
    'unsubmitAppStoreListing',
    'unsubscribeFromAnnouncements',
    'unsuspendBoostRecipient',
    'updateAnnouncementPreferences',
    'updateAppStoreListing',
    'updateAuthGrant',
    'updateBoost',
    'updateBoostPermissions',
    'updateContract',
    'updateContractTerms',
    'updateDidMetadata',
    'updateIntegration',
    'updateProfile',
    'updateProfileManagerProfile',
    'updateShareLink',
    'updateSkill',
    'updateSkillFramework',
    'verifyConsent',
    'verifyContactMethod',
    'verifyContactMethodWithCredential',
    'verifyCredential',
    'verifyPresentation',
    'verifySdJwtVc',
    'vpFromQrCode',
    'vpToQrCode',
    'waitForInboxCredentialBatch',
    'withdrawAppStoreListingUpdate',
    'withdrawConsent',
    'writeCredentialToContract',
];

/**
 * Names that start with one of these verbs (as a whole camelCase word, so `issueCredential`
 * is not `is…`) only read. Exceptions are listed in WRITE_OVERRIDES.
 */
export const READ_PREFIX =
    /^(?:get|list|read|resolve|verify|count|search|check|is|has|find|query|fetch|validate|lookup|describe)(?=[A-Z0-9_$]|$)/;

/** Read-only or purely local methods whose names do not match READ_PREFIX. */
export const READ_ALLOWLIST: ReadonlySet<string> = new Set([
    'browseAppStore',
    'buildPresentation',
    'campaignsGet',
    'campaignsGetStats',
    'campaignsIsAdmin',
    'campaignsList',
    'campaignsPageAudience',
    'campaignsPreviewAudience',
    'campaignsPreviewDispatch',
    'categorizeSdJwtVct',
    'contextLoader',
    'decodeSdJwtClaims',
    'didResolver',
    'didToVerificationMethod',
    'keyToDid',
    'keyToVerificationMethod',
    'learnCloudBatchResolve',
    'learnCloudCount',
    'learnCloudRead',
    'learnCloudReadPage',
    'newCredential',
    'newPresentation',
    'parseAuthorizationRequest',
    'parseCredentialOffer',
    'parseSdJwtVc',
    'semanticSearchSkills',
    'toSdJwtDisplayViewModel',
    'vpFromQrCode',
    'vpToQrCode',
]);

/**
 * Read-looking names that change state on the network: they are tRPC mutations
 * (public share-link views and chunks are metered) or they consume a one-time code.
 */
export const WRITE_OVERRIDES: ReadonlySet<string> = new Set([
    'getShareLinkAttachmentChunk',
    'getShareLinkContent',
    'resolveShareLink',
    'verifyContactMethod',
    'verifyContactMethodWithCredential',
]);

/**
 * Methods whose result is a secret (a private key, an API token, an OAuth/PKCE secret,
 * or a signed presentation / ID token that can authenticate as this identity). `call`
 * refuses them unless `--show-secret` is passed. Generic presentation signers are
 * included because `getAPITokenForAuthGrant` and `getDidAuthVp` are thin wrappers around
 * `issuePresentation` (proofPurpose 'authentication'), so gating only the wrappers
 * would be trivially bypassed.
 */
export const SECRET_METHODS: ReadonlySet<string> = new Set([
    // OpenID4VCI: the flow handle carries the PKCE verifier that redeems the auth code.
    'beginCredentialOfferAuthCode',
    // DC API responses contain a signed, holder-bound vp_token.
    'createDcApiResponse',
    // OpenID4VCI access tokens.
    'exchangeAuthCodeForToken',
    'exchangePreAuthCodeForToken',
    // Private-key JWKs derived from caller-supplied bytes.
    'generateEd25519KeyFromBytes',
    'generateSecp256k1KeyFromBytes',
    'getAPITokenForAuthGrant',
    'getDidAuthVp',
    'getKey',
    'getSubjectKeypair',
    'issuePresentation',
    // OpenID4VP end to end: returns the signed vp_token and, when requested, the SIOPv2 id_token.
    'presentCredentials',
    'presentSdJwtVc',
    'signIdToken',
    'signPresentation',
]);

/** The chain the Ethereum plugin uses unless told otherwise, independent of `--network`. */
export const ETHEREUM_DEFAULT_CHAIN = 'mainnet';

/**
 * Methods that submit an on-chain transaction signed with this identity's key (the
 * Ethereum plugin's `transferTokens` moves real ETH/ERC-20 on mainnet). `call` requires
 * an explicit `--chain` for them and checks the plugin's effective chain before invoking.
 */
export const CHAIN_METHODS: ReadonlySet<string> = new Set(['transferTokens']);

export type MethodEffect = 'read' | 'write';

export interface MethodClassification {
    effect: MethodEffect;
    /** The result is a secret; printing it needs `--show-secret`. */
    secret: boolean;
}

/** Classify an invoke method by name: read (no `--write` needed) or write, and secret. */
export const classifyMethod = (method: string): MethodClassification => ({
    effect:
        !WRITE_OVERRIDES.has(method) && (READ_ALLOWLIST.has(method) || READ_PREFIX.test(method))
            ? 'read'
            : 'write',
    secret: SECRET_METHODS.has(method),
});

const editDistance = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
        let diagonal = row[0]!;
        row[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const above = row[j]!;
            row[j] = Math.min(
                above + 1,
                row[j - 1]! + 1,
                diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            diagonal = above;
        }
    }
    return row[b.length]!;
};

/**
 * Up to `limit` names from `candidates` closest to `name`: case-insensitive matches and
 * substrings first, then small edit distances.
 */
export const suggestMethods = (
    name: string,
    candidates: readonly string[],
    limit = 3
): string[] => {
    const lower = name.toLowerCase();
    const maxDistance = Math.max(2, Math.floor(name.length / 3));
    return candidates
        .map(candidate => {
            const other = candidate.toLowerCase();
            const score =
                other === lower
                    ? 0
                    : other.includes(lower) || lower.includes(other)
                      ? 1
                      : 1 + editDistance(lower, other);
            return { candidate, score };
        })
        .filter(({ score }) => score <= maxDistance + 1)
        .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
        .slice(0, limit)
        .map(({ candidate }) => candidate);
};
