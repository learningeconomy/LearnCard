import {
    assertInboxRefreshEnabled,
    inboxRefreshRequestDigest,
    getInboxRefreshReplay,
    getInboxRefreshReceipt,
    resumeInboxRefreshDelivery,
} from '@helpers/inbox-refresh.helpers';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { trace, traceDb, traceInternal } from '@tracing';

import {
    BoostValidator as ConsumerBoostValidator,
    UnsignedVCValidator,
    VCValidator,
    JWEValidator,
    BoostRecipientValidator,
    BoostPermissionsValidator,
    PaginatedBoostRecipientsValidator,
    PaginatedBoostsValidator,
    PaginationOptionsValidator,
    PaginatedVisibleLCNProfilesValidator,
    PaginatedSkillFrameworksValidator,
    BoostPermissions,
    BoostQueryValidator,
    SkillFrameworkQueryValidator,
    LCNProfileQueryValidator,
    LCNProfileManagerQueryValidator,
    PaginatedLCNProfileManagersValidator,
    UnsignedVC,
    JWE,
    VC,
    PaginatedBoostRecipientsWithChildrenValidator,
    SkillQueryValidator,
    SendBoostInputValidator,
    SendBoostTemplateValidator,
    SendBoostResponseValidator,
    PrepareRefreshableSendInputValidator,
    PrepareRefreshableSendResultValidator,
    PrepareRefreshableSendResult,
    AllocateCredentialStatusInputValidator,
    AllocatedBitstringStatusListEntryValidator,
} from '@learncard/types';
import {
    isVC2Format,
    injectManagedRefreshService,
    getCredentialIssuerId,
} from '@learncard/helpers';
import {
    renderBoostTemplate,
    parseRenderedTemplate,
    shouldAutoAppendTemplateEvidence,
} from '@helpers/template.helpers';
import {
    logCredentialSent,
    logCredentialClaimed,
    logCredentialFailed,
} from '@helpers/activity.helpers';

import { t, profileRoute } from '@routes';

import {
    getBoostByUri,
    getBoostById,
    getBoostsForProfile,
    countBoostsForProfile,
    getBoostsByUri,
    getChildrenBoosts,
    countBoostChildren,
    getParentBoosts,
    countBoostParents,
    getSiblingBoosts,
    countBoostSiblings,
    getFamilialBoosts,
    countFamilialBoosts,
    getChildrenProfileManagers,
} from '@accesslayer/boost/read';
import {
    getBoostRecipientsSkipLimit,
    getBoostAdmins,
    getBoostRecipients,
    getBoostRecipientsWithChildren,
    getConnectedBoostRecipients,
    countConnectedBoostRecipients,
    isProfileBoostAdmin,
    countBoostRecipients,
    countBoostRecipientsWithChildren,
    isBoostParent,
    getBoostPermissions,
    canManageBoostPermissions,
    canProfileIssueBoost,
    canProfileEditBoost,
    canProfileCreateChildBoost,
    canProfileViewBoost,
    getBoostByUriWithDefaultClaimPermissions,
    getBoostSkillsWithProficiency,
    getFrameworkSkillsAvailableForBoost,
    getFrameworksForBoostPaged,
    searchSkillsAvailableForBoost,
} from '@accesslayer/boost/relationships/read';

import { deleteStorageForUri, setStorageForUri } from '@cache/storage';

import {
    getBoostUri,
    isProfileBoostOwner,
    sendBoost,
    issueClaimLinkBoost,
    isDraftBoost,
    isEditableBoost,
    isBoostViewableByClaimLink,
    convertCredentialToBoostTemplateJSON,
    isInboxRecipient,
    prepareCredentialFromBoost,
    appendTemplateEvidenceToCredential,
} from '@helpers/boost.helpers';
import {
    BoostValidator,
    BoostGenerateClaimLinkInput,
    BoostStatus,
    BoostType,
    BoostWithClaimPermissionsValidator,
    getBoostOwnerProfile,
} from 'types/boost';
import { ProfileType } from 'types/profile';
import { SkillFrameworkValidator } from 'types/skill-framework';
import { SkillValidator } from 'types/skill';
import { deleteBoost } from '@accesslayer/boost/delete';
import {
    injectObv3AlignmentsIntoCredentialForBoost,
    buildObv3AlignmentsForBoost,
    normalizeCredentialAlignments,
} from '@services/skills-provider/inject';
import { createBoost } from '@accesslayer/boost/create';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { BoostInstance } from '@models';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    getContactMethodByValue,
    getProfileByContactMethod,
} from '@accesslayer/contact-method/read';
import {
    getSigningAuthorityForUserByName,
    getPrimarySigningAuthorityForUser,
} from '@accesslayer/signing-authority/relationships/read';
import {
    getContractDetailsByUri,
    getContractTermsForProfile,
    getWritersForContract,
} from '@accesslayer/consentflowcontract/relationships/read';
import { setRelatedBoostForContract } from '@accesslayer/consentflowcontract/relationships/create';

import {
    isClaimLinkAlreadySetForBoost,
    setValidClaimLinkForBoost,
    getClaimLinkSAInfoForBoost,
    getClaimLinkGeneratorProfileId,
    useClaimLinkForBoost,
} from '@cache/claim-links';
import { getBlockedAndBlockedByIds, isRelationshipBlocked } from '@helpers/connection.helpers';
import { getDidWeb, getManagedDidWeb, getProfileIdFromString } from '@helpers/did.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getNotificationMessage } from '@helpers/notificationMessages';
import { resolveRecipientLocale } from '@helpers/getRecipientLocale.helpers';
import {
    setBoostAsParent,
    setProfileAsBoostAdmin,
    setBoostUsesFramework,
    addAlignedSkillsToBoost,
    replaceAlignedSkillsForBoost,
} from '@accesslayer/boost/relationships/create';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import { neogma } from '@instance';
import {
    removeBoostAsParent,
    removeProfileAsBoostAdmin,
    removeBoostUsesFramework,
} from '@accesslayer/boost/relationships/delete';
import { constructUri, getDomainFromUri, getIdFromUri, getUriParts } from '@helpers/uri.helpers';
import { updateBoostPermissions } from '@accesslayer/boost/relationships/update';
import {
    EMPTY_PERMISSIONS,
    DEFAULT_BOOST_PERMISSIONS,
    QUERYABLE_PERMISSIONS,
} from 'src/constants/permissions';
import { updateBoost } from '@accesslayer/boost/update';
import {
    addClaimPermissionsForBoost,
    addDefaultPermissionsForBoost,
} from '@accesslayer/role/relationships/create';
import { updateDefaultPermissionsForBoost } from '@accesslayer/role/relationships/update';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import type { IssuedCredential } from '../types/credential';
import {
    allocateCredentialRefresh,
    extractManagedRefreshHandoff,
    getBoundRefreshBoostId,
    getCredentialRefreshServiceUrl,
    peekCredentialRefreshInitialBinding,
    sendRefreshableCredential,
} from '@helpers/credential-refresh.helpers';
import {
    claimRefreshSendIntent,
    computeRefreshSendRequestDigest,
    getRefreshSendIntent,
    markRefreshSendIntentDelivered,
    reconcileBoundRefreshSendIntent,
    recordRefreshSendIntent,
    recordRefreshSendIntentPending,
    type RefreshSendIntent,
} from '@helpers/refresh-send-intent.helpers';
import { getCredentialRefreshRuntimeEnvironment } from '@environment';
import { ensureCredentialRefreshConstraints } from '../models/credential-refresh-constraints';
import { userHasRequiredScopes } from '@helpers/auth-grant.helpers';
import { AUTH_GRANT_NO_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { removeConnectionsForBoost } from '@helpers/connection.helpers';
import { issueToInbox } from '@helpers/inbox.helpers';
import { findInboxServiceEndpoint } from '@helpers/federation.helpers';
import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import { buildInboxConfig } from '@helpers/send-inbox-config.helpers';
import {
    canViewerSeeFullBoostRecipientList,
    sanitizeBoostRecipientRecords,
    resolveProfileTier,
    sanitizeProfileForTier,
    stripSensitiveProfileListFields,
} from '@helpers/profile-privacy.helpers';
import {
    allocateStatusListEntry,
    appendBitstringStatusListEntries,
} from '@helpers/status-list.helpers';

/**
 * Resolve the credential instance to act on for a boost-recipient lifecycle action
 * (revoke / suspend / unsuspend).
 *
 * If `credentialUri` is provided, resolves that specific instance and verifies it is an
 * INSTANCE_OF the boost (throws NOT_FOUND otherwise). When omitted, falls back to the
 * most-recent (non-revoked) instance for the boost + recipient, which may be null.
 */
const resolveBoostCredentialInstance = async ({
    boostId,
    recipientProfileId,
    credentialUri,
}: {
    boostId: string;
    recipientProfileId: string;
    credentialUri?: string;
}) => {
    const {
        getCredentialByUri,
        getCredentialInstanceForBoostAndProfile,
        isCredentialInstanceOfBoost,
    } = await import('@accesslayer/credential/read');

    if (credentialUri) {
        const resolvedCredential = await getCredentialByUri(decodeURIComponent(credentialUri));

        if (!resolvedCredential) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No credential found for the provided credentialUri',
            });
        }

        const isInstance = await isCredentialInstanceOfBoost(resolvedCredential.id, boostId);

        if (!isInstance) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Credential is not an instance of the specified boost',
            });
        }

        return resolvedCredential;
    }

    return getCredentialInstanceForBoostAndProfile(boostId, recipientProfileId);
};

/**
 * Resolves the approved consent-flow contract terms for a unified send, and links a
 * newly created boost to the contract. Shared by the normal and managed-refresh send
 * paths so contract linkage semantics stay identical.
 */
const resolveContractForSend = async (params: {
    profile: ProfileType;
    targetProfile: ProfileType;
    boost: BoostInstance;
    boostCreated: boolean;
    contractUri?: string;
}) => {
    const { profile, targetProfile, boost, boostCreated, contractUri } = params;

    let contractTerms = null as Awaited<ReturnType<typeof getContractTermsForProfile>> | null;
    let contractDetails: Awaited<ReturnType<typeof getContractDetailsByUri>> | null = null;

    if (contractUri) {
        const decodedContractUri = decodeURIComponent(contractUri);
        contractDetails = await traceDb('getContractDetailsByUri', () =>
            getContractDetailsByUri(decodedContractUri)
        );

        if (!contractDetails) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Could not find contract',
            });
        }

        const terms = await traceDb('getContractTermsForProfile', () =>
            getContractTermsForProfile(targetProfile, contractDetails!.contract)
        );

        const writers = await traceDb('getWritersForContract', () =>
            getWritersForContract(contractDetails!.contract)
        );
        const isWriter = writers.some(writer => writer.profileId === profile.profileId);
        const isDenied = terms?.terms.deniedWriters?.includes(profile.profileId) ?? false;
        const categoryAllowed = boost.category
            ? terms?.terms.write?.credentials?.categories?.[boost.category] === true
            : true;

        if (terms && isWriter && !isDenied && categoryAllowed) {
            contractTerms = terms;
        }
    }

    if (boostCreated && contractDetails) {
        await traceDb('setRelatedBoostForContract', () =>
            setRelatedBoostForContract(contractDetails!.contract, boost)
        );
    }

    return contractTerms;
};

/** Validate managed send support and recipient before creating any send state. */
const validateRefreshSendRecipient = async ({
    profile,
    scope,
    recipient,
    domain,
}: {
    profile: ProfileType;
    scope?: string;
    recipient: string;
    domain: string;
}): Promise<ProfileType> => {
    if (!getCredentialRefreshRuntimeEnvironment().CREDENTIAL_REFRESH_ENABLED) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credential refresh is not available',
        });
    }

    await ensureCredentialRefreshConstraints();

    // The route itself requires boosts:write; managed refresh additionally
    // requires the same credentials:write scope as the dedicated
    // /credential-refresh routes.
    if (!userHasRequiredScopes(scope ?? AUTH_GRANT_NO_ACCESS_SCOPE, 'credentials:write')) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This operation requires credentials:write scope',
        });
    }

    if (isInboxRecipient(recipient)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Managed credential refresh requires a profile or DID recipient; email and phone recipients cannot request refresh.',
        });
    }

    // Recipients must resolve to local profiles before anything is
    // created; remote or unresolvable DIDs are rejected here instead of
    // entering the federation/inbox flows.
    const refreshRecipientProfileId = await traceInternal('getProfileIdFromString:refresh', () =>
        getProfileIdFromString(recipient, domain)
    );
    const refreshTargetProfile = refreshRecipientProfileId
        ? await traceDb('getProfileByProfileId:refresh', () =>
              getProfileByProfileId(refreshRecipientProfileId)
          )
        : null;

    if (!refreshTargetProfile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message:
                'Managed credential refresh requires a recipient resolvable to a local profile. Remote or unresolvable DIDs are not supported.',
        });
    }

    const refreshTarget = refreshTargetProfile;

    if (
        await traceDb('isRelationshipBlocked:refresh', () =>
            isRelationshipBlocked(profile, refreshTarget)
        )
    ) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Are you sure this person exists?',
        });
    }

    return refreshTargetProfile;
};

/** Preserve the inline send template's metadata, skills and claim permissions. */
const createInlineBoostForSend = async (
    template: z.infer<typeof SendBoostTemplateValidator>,
    profile: ProfileType,
    domain: string
): Promise<BoostInstance> => {
    const { credential, claimPermissions, skills, ...metadata } = template;
    const boost = await traceDb('createBoost', () =>
        createBoost(credential, profile, metadata, domain)
    );
    if (Array.isArray(skills) && skills.length > 0) {
        await traceDb('addAlignedSkillsToBoost', () => addAlignedSkillsToBoost(boost, skills));
    }
    if (claimPermissions) {
        await traceDb('addClaimPermissionsForBoost', () =>
            addClaimPermissionsForBoost(boost, { ...EMPTY_PERMISSIONS, ...claimPermissions })
        );
    }
    return boost;
};

const managedRefreshServiceFor = (refreshId: string, domain: string) => ({
    id: getCredentialRefreshServiceUrl(refreshId, domain),
    type: 'LearnCardCredentialRefresh2026' as const,
    authorization: { type: 'LearnCardDIDAuth' as const },
});

/**
 * The single server preparation step for a managed refresh send (SDK and signing
 * authority paths): after recipient validation, create/reuse the boost and allocate
 * the refresh. With an idempotencyKey, progress is recorded on a RefreshSendIntent so a
 * retried call reuses the same boost/allocation, or returns the completed result.
 */
const prepareManagedRefreshSend = async (params: {
    profile: ProfileType;
    /** Returned by validateRefreshSendRecipient in this request, before any mutation. */
    targetProfile: ProfileType;
    domain: string;
    templateUri?: string;
    template?: z.infer<typeof SendBoostTemplateValidator>;
    contractUri?: string;
    credentialId?: string;
    templateData?: Record<string, unknown>;
    integrationId?: string;
    idempotencyKey?: string;
}): Promise<PrepareRefreshableSendResult & { intent?: RefreshSendIntent }> => {
    const { profile, targetProfile, domain, templateUri, template, contractUri } = params;
    // Local recipients authenticate refresh requests as their network profile DID,
    // including when the caller addressed them by their controller did:key.
    const holderDid = getDidWeb(domain, targetProfile.profileId);

    let intent: RefreshSendIntent | undefined;

    if (params.idempotencyKey) {
        const claim = await claimRefreshSendIntent({
            issuerProfileId: profile.profileId,
            idempotencyKey: params.idempotencyKey,
            requestDigest: computeRefreshSendRequestDigest({
                recipientProfileId: targetProfile.profileId,
                holderDid,
                templateUri,
                template,
                contractUri,
                templateData: params.templateData,
                integrationId: params.integrationId,
                credentialId: params.credentialId,
            }),
        });

        intent = claim.intent;

        if (claim.kind !== 'owned') {
            const prepared = {
                boostUri: intent.boostUri!,
                credentialId: intent.credentialId!,
                refreshId: intent.refreshId!,
                refreshService: managedRefreshServiceFor(intent.refreshId!, domain),
                holderDid: intent.holderDid!,
                intent,
            };
            const completed =
                claim.kind === 'delivered'
                    ? intent.result
                    : await reconcileBoundRefreshSendIntent(intent, domain);

            return completed ? { ...prepared, completed } : prepared;
        }
    }

    if (template?.status === 'DRAFT') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
        });
    }

    let boostUri = intent?.boostUri ?? templateUri;
    let boost: BoostInstance | null;

    if (boostUri) {
        boost = await traceDb('getBoostByUri:prepareRefresh', () => getBoostByUri(boostUri!));

        if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
    } else {
        boost = await createInlineBoostForSend(template!, profile, domain);
        boostUri = getBoostUri(boost.id, domain);

        if (intent) intent = await recordRefreshSendIntent(intent, { boostUri });

        await resolveContractForSend({
            profile,
            targetProfile,
            boost,
            boostCreated: true,
            contractUri,
        });
    }

    if (
        !(await traceDb('canProfileIssueBoost:prepareRefresh', () =>
            canProfileIssueBoost(profile, boost!)
        ))
    ) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Profile does not have permissions to issue boost',
        });
    }

    if (isDraftBoost(boost)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
        });
    }

    const credentialId = intent?.credentialId ?? params.credentialId ?? `urn:uuid:${uuid()}`;
    let refreshId = intent?.refreshId;

    if (!refreshId) {
        const allocation = await traceInternal('allocateCredentialRefresh:prepare', () =>
            allocateCredentialRefresh({
                issuerProfile: profile,
                holderProfile: targetProfile,
                holderDid,
                credentialId,
                domain,
            })
        );

        refreshId = allocation.refreshId;
    }

    if (intent) {
        intent = await recordRefreshSendIntent(intent, {
            boostUri,
            credentialId,
            refreshId,
            holderDid,
            state: 'prepared',
        });
    }

    return {
        boostUri,
        credentialId,
        refreshId,
        refreshService: managedRefreshServiceFor(refreshId, domain),
        holderDid,
        ...(intent ? { intent } : {}),
    };
};

export const boostsRouter = t.router({
    // SDK preparation only: guards, boost anchor and refresh allocation. Never signs or
    // delivers. With an idempotencyKey a retried call reuses the same boost/allocation,
    // or returns `completed` when that key already delivered.
    prepareRefreshableSend: profileRoute
        .meta({ requiredScope: 'boosts:write' })
        .input(PrepareRefreshableSendInputValidator)
        .output(PrepareRefreshableSendResultValidator)
        .mutation(async ({ ctx, input }) => {
            const targetProfile = await validateRefreshSendRecipient({
                profile: ctx.user.profile,
                scope: ctx.user.scope,
                recipient: input.recipient,
                domain: ctx.domain,
            });
            const { intent: _intent, ...prepared } = await prepareManagedRefreshSend({
                ...input,
                profile: ctx.user.profile,
                targetProfile,
                domain: ctx.domain,
            });

            return prepared;
        }),

    getBoostAlignments: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/alignments',
                tags: ['Boosts'],
                summary: 'Get OBv3 alignments for a boost',
                description:
                    "Returns OBv3 alignment entries based on the boost's linked framework and aligned skills. Requires issue permission.",
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(
            z
                .object({
                    targetCode: z.string().optional(),
                    targetName: z.string().optional(),
                    targetDescription: z.string().optional(),
                    targetUrl: z.string().optional(),
                    targetFramework: z.string().optional(),
                })
                .array()
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            return buildObv3AlignmentsForBoost(boost, ctx.domain);
        }),

    getBoostSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/skills',
                tags: ['Boosts'],
                summary: 'Get aligned skills for a boost',
                description:
                    'Returns skills aligned to a boost via ALIGNED_TO, including proficiencyLevel stored on the relationship.',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.array(SkillValidator.extend({ proficiencyLevel: z.number().optional() })))
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const decodedUri = decodeURIComponent(input.uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            // For now, require admin to view aligned skills (consistent with other boost-skill endpoints)
            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const skills = await getBoostSkillsWithProficiency(boost);

            // Ensure we only return fields that match SkillValidator (+ proficiencyLevel)
            return skills.map(skill => ({
                id: skill.id,
                statement: skill.statement,
                description: skill.description ?? undefined,
                code: skill.code ?? undefined,
                icon: (skill as any).icon ?? undefined,
                type: (skill as any).type ?? 'competency',
                status: (skill as any).status ?? 'active',
                createdAt: (skill as any).createdAt,
                updatedAt: (skill as any).updatedAt,
                frameworkId: (skill as any).frameworkId,
                proficiencyLevel: (skill as any).proficiencyLevel,
            }));
        }),
    attachFrameworkToBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/attach-framework',
                tags: ['Boosts'],
                summary: 'Attach framework to boost',
                description:
                    'Ensures a USES_FRAMEWORK relationship from a boost to a SkillFramework. Requires boost admin.',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ boostUri: z.string(), frameworkId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, frameworkId } = input;

            const boost = await getBoostByUri(boostUri);
            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const framework = await getSkillFrameworkById(frameworkId);
            if (!framework)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });

            await setBoostUsesFramework(boost, frameworkId);

            return true;
        }),
    detachFrameworkFromBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/detach-framework',
                tags: ['Boosts'],
                summary: 'Detach framework from boost',
                description:
                    'Removes a USES_FRAMEWORK relationship from a boost to a SkillFramework. Requires boost admin.',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ boostUri: z.string(), frameworkId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, frameworkId } = input;

            const boost = await getBoostByUri(boostUri);
            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const framework = await getSkillFrameworkById(frameworkId);
            if (!framework)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });

            return removeBoostUsesFramework(boost, frameworkId);
        }),

    alignBoostSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/align-skills',
                tags: ['Boosts'],
                summary: 'Align skills to boost',
                description:
                    'Ensures ALIGNED_TO relationships from a boost to Skill nodes. Requires boost admin.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                boostUri: z.string(),
                skills: z
                    .array(
                        z.object({
                            frameworkId: z.string(),
                            id: z.string(),
                            proficiencyLevel: z.number().optional(),
                        })
                    )
                    .min(1),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, skills } = input;

            const boost = await getBoostByUri(boostUri);
            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            // Verify all framework+id pairs exist
            const verify = await neogma.queryRunner.run(
                `UNWIND $refs AS sr
                 MATCH (f:SkillFramework { id: sr.frameworkId })-[:CONTAINS]->(s:Skill { id: sr.id })
                 RETURN collect({ frameworkId: f.id, id: s.id }) AS found`,
                { refs: skills }
            );
            const foundPairs =
                (verify.records[0]?.get('found') as Array<{ frameworkId?: string; id?: string }>) ||
                [];
            const foundSet = new Set(foundPairs.map(p => `${p.frameworkId}:${p.id}`));
            const missingPairs = skills.filter(sr => !foundSet.has(`${sr.frameworkId}:${sr.id}`));
            if (missingPairs.length > 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Skill(s) not found: ${missingPairs
                        .map(p => `${p.frameworkId}:${p.id}`)
                        .join(', ')}`,
                });
            }

            await addAlignedSkillsToBoost(boost, skills);

            return true;
        }),
    getSkillsAvailableForBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/skills/available',
                tags: ['Boosts'],
                summary: 'List available skills for a boost',
                description:
                    'Returns skills from frameworks attached to the boost or any of its ancestors. Requires boost admin.',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(
            z
                .object({
                    framework: SkillFrameworkValidator,
                    skills: z.array(SkillValidator.omit({ createdAt: true, updatedAt: true })),
                })
                .array()
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const decodedUri = decodeURIComponent(input.uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const data = await getFrameworkSkillsAvailableForBoost(boost);

            return data.map(({ framework, skills }) => ({
                framework: {
                    id: framework.id,
                    name: framework.name,
                    description: framework.description,
                    sourceURI: framework.sourceURI,
                    isPublic: (framework as any).isPublic ?? false,
                    status: (framework.status as any) ?? 'active',
                    createdAt: (framework as any).createdAt,
                    updatedAt: (framework as any).updatedAt,
                },
                skills: skills.map(skill => ({
                    id: skill.id,
                    statement: skill.statement,
                    description: skill.description ?? undefined,
                    code: skill.code ?? undefined,
                    type: skill.type ?? 'skill',
                    status: (skill.status as any) ?? 'active',
                })),
            }));
        }),

    searchSkillsAvailableForBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/skills/search',
                tags: ['Boosts'],
                summary: 'Search available skills for a boost',
                description:
                    'Returns a flattened, paginated list of skills matching the search query. Supports $regex and $in operators. Searches skills from frameworks attached to the boost or any of its ancestors. Requires boost admin.',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: SkillQueryValidator,
                limit: z.number().int().min(1).max(200).default(50),
                cursor: z.string().nullable().optional(),
            })
        )
        .output(
            z.object({
                records: z.array(SkillValidator.omit({ createdAt: true, updatedAt: true })),
                hasMore: z.boolean(),
                cursor: z.string().nullable(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, query, limit, cursor } = input;
            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const result = await searchSkillsAvailableForBoost(boost, query, limit, cursor ?? null);

            return {
                records: result.records.map(skill => ({
                    id: skill.id,
                    statement: skill.statement,
                    description: skill.description ?? undefined,
                    code: skill.code ?? undefined,
                    type: skill.type ?? 'skill',
                    status: (skill.status as any) ?? 'active',
                    frameworkId: skill.frameworkId,
                })),
                hasMore: result.hasMore,
                cursor: result.cursor,
            };
        }),

    allocateCredentialStatus: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/status/allocate',
                tags: ['Boosts'],
                summary: 'Allocate Bitstring credential status entries',
                description:
                    'Allocates Bitstring Status List entries for a credential before it is signed.',
            },
            requiredScope: 'boosts:write',
        })
        .input(AllocateCredentialStatusInputValidator)
        .output(z.array(AllocatedBitstringStatusListEntryValidator))
        .mutation(async ({ ctx, input }) => {
            const statusPurposes = input.statusPurposes ?? ['revocation'];

            return Promise.all(
                statusPurposes.map(statusPurpose =>
                    allocateStatusListEntry(
                        ctx.user.profile.profileId,
                        ctx.domain,
                        statusPurpose,
                        input.listSize
                    )
                )
            );
        }),

    sendBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/send/{profileId}',
                tags: ['Boosts'],
                summary: 'Send a Boost',
                description: 'This endpoint sends a boost to a profile',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                profileId: z.string(),
                uri: z.string(),
                credential: VCValidator.or(JWEValidator),
                options: z
                    .object({
                        skipNotification: z.boolean().default(false).optional(),
                    })
                    .optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, credential, uri, options } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const targetProfile = await getProfileByProfileId(resolvedProfileId);
            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            let skipNotification = profile.profileId === targetProfile.profileId;
            if (options?.skipNotification) skipNotification = options?.skipNotification;

            // Log credential activity FIRST to get activityId for chaining
            const activityId = await logCredentialSent({
                actorProfileId: profile.profileId,
                onBehalfOf: ctx.user.onBehalfOf,
                recipientType: 'profile',
                recipientIdentifier: targetProfile.profileId,
                recipientProfileId: targetProfile.profileId,
                boostUri: uri,
                source: 'sendBoost',
            });

            const credentialUri = await sendBoost({
                from: { type: 'profile', profile },
                to: targetProfile,
                boost,
                credential,
                domain: ctx.domain,
                skipNotification,
                activityId,
            });

            return credentialUri;
        }),

    send: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/send',
                tags: ['Send'],
                summary: 'Send data to a recipient',
                description:
                    'Sends data to a recipient. For boosts: creates a boost if needed, auto-issues a credential from its template, and sends it. If a contractUri is provided and the recipient has consent with write permission for the boost category, the credential is sent through the contract; otherwise it is sent normally.',
            },
            requiredScope: 'boosts:write',
        })
        .input(SendBoostInputValidator)
        .output(SendBoostResponseValidator)
        .mutation(async ({ ctx, input }) => {
            return trace(
                'route',
                'send',
                async () => {
                    const { profile } = ctx.user;
                    const { contractUri } = input;
                    const { domain } = ctx;

                    // LC-2198: managed refresh requests are validated in full BEFORE any
                    // mutation — an unsupported refresh send must not create a boost,
                    // allocation, inbox entry, activity, or delivery.
                    const inboxRefreshRequested =
                        input.refresh === true && !!isInboxRecipient(input.recipient);
                    const refreshRequested = input.refresh === true && !inboxRefreshRequested;
                    let inboxIntent: RefreshSendIntent | undefined;
                    const inboxDigest = inboxRefreshRequested
                        ? inboxRefreshRequestDigest(input)
                        : undefined;
                    const inboxKey = input.idempotencyKey
                        ? `send:${input.idempotencyKey}`
                        : undefined;
                    if (inboxRefreshRequested) {
                        await assertInboxRefreshEnabled(ctx.user.scope);
                        if (input.signedCredential || input.contractUri)
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message:
                                    'Inbox refresh requires unsigned content and does not support a consent contract before holder binding.',
                            });
                        if (input.idempotencyKey) {
                            const claim = await claimRefreshSendIntent({
                                issuerProfileId: profile.profileId,
                                idempotencyKey: input.idempotencyKey,
                                requestDigest: inboxDigest!,
                            });
                            if (claim.kind === 'delivered' && claim.intent.result)
                                return claim.intent.result;
                            inboxIntent = claim.intent;
                            const replay = await getInboxRefreshReplay(
                                profile.profileId,
                                inboxKey,
                                inboxDigest!
                            );
                            if (
                                replay &&
                                (replay.claimUrl || replay.inbox.currentStatus !== 'PENDING')
                            ) {
                                await resumeInboxRefreshDelivery(replay.inbox.refreshId!, domain);
                                const result = {
                                    type: 'boost' as const,
                                    uri: inboxIntent.boostUri!,
                                    credentialUri: '',
                                    activityId: replay.inbox.activityId ?? '',
                                    inbox: {
                                        issuanceId: replay.inbox.id,
                                        status: replay.inbox.currentStatus,
                                        claimUrl: replay.claimUrl,
                                        guardianStatus: replay.inbox.guardianStatus,
                                        refresh: await getInboxRefreshReceipt(
                                            replay.inbox.refreshId!,
                                            domain
                                        ),
                                    },
                                };
                                await markRefreshSendIntentDelivered(inboxIntent, result);
                                return result;
                            }
                        }
                    }
                    let refreshTargetProfile: ProfileType | null = null;

                    if (input.idempotencyKey && !input.refresh) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'idempotencyKey is only supported with refresh: true.',
                        });
                    }

                    if (refreshRequested) {
                        refreshTargetProfile = await validateRefreshSendRecipient({
                            profile,
                            scope: ctx.user.scope,
                            recipient: input.recipient,
                            domain,
                        });

                        if (input.signedCredential) {
                            // Reject signed credentials without a local managed allocation
                            // before any mutation (e.g. boost auto-creation). No unsigned
                            // fallback and no second allocation (plan decision 6).
                            const handoff = extractManagedRefreshHandoff(
                                input.signedCredential,
                                domain
                            );

                            if (!handoff) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message:
                                        'A signed credential sent with refresh must already contain its allocated managed refresh service.',
                                });
                            }

                            if (input.idempotencyKey) {
                                const intent = await getRefreshSendIntent(
                                    profile.profileId,
                                    input.idempotencyKey
                                );
                                if (!intent) {
                                    throw new TRPCError({
                                        code: 'BAD_REQUEST',
                                        message:
                                            'idempotencyKey with a pre-signed credential requires a prior boost.prepareRefreshableSend call (tRPC only). For a directly signed REST send, omit idempotencyKey and retry the same signed credential and templateUri.',
                                    });
                                }
                                if (
                                    intent.refreshId !== handoff.refreshId ||
                                    (input.templateUri && intent.boostUri !== input.templateUri)
                                ) {
                                    throw new TRPCError({
                                        code: 'CONFLICT',
                                        message:
                                            'This idempotencyKey does not match the prepared refresh send for this credential.',
                                    });
                                }
                            }
                        }
                    }

                    // Keyed managed send without a pre-signed credential: preparation (boost +
                    // allocation) goes through the idempotency intent instead of the generic
                    // boost creation below.
                    const keyedPrepared =
                        refreshRequested && input.idempotencyKey && !input.signedCredential
                            ? await prepareManagedRefreshSend({
                                  profile,
                                  targetProfile: refreshTargetProfile!,
                                  domain,
                                  templateUri: input.templateUri,
                                  template: input.templateUri ? undefined : input.template,
                                  contractUri,
                                  templateData: input.templateData,
                                  integrationId: input.integrationId,
                                  idempotencyKey: input.idempotencyKey,
                              })
                            : undefined;

                    if (keyedPrepared?.completed) return keyedPrepared.completed;

                    // Check if recipient is email/phone (routes to Universal Inbox)
                    const inboxRecipient = isInboxRecipient(input.recipient);

                    // Resolve boost first (needed for both flows)
                    let boost = null as BoostInstance | null;
                    let boostUri = '';
                    let boostCreated = false;

                    if (inboxIntent?.boostUri) {
                        boost = await getBoostByUri(inboxIntent.boostUri);
                        boostUri = inboxIntent.boostUri;
                    } else if (keyedPrepared) {
                        const resolved = await traceDb('getBoostByUri', () =>
                            getBoostByUri(keyedPrepared.boostUri)
                        );
                        if (!resolved) {
                            throw new TRPCError({
                                code: 'NOT_FOUND',
                                message: 'Could not find boost',
                            });
                        }
                        boost = resolved;
                        boostUri = keyedPrepared.boostUri;
                    } else if (input.templateUri) {
                        const resolved = await traceDb('getBoostByUri', () =>
                            getBoostByUri(input.templateUri!)
                        );
                        if (!resolved) {
                            throw new TRPCError({
                                code: 'NOT_FOUND',
                                message: 'Could not find boost',
                            });
                        }
                        boost = resolved;
                        boostUri = input.templateUri;
                    } else if (input.template) {
                        boost = await createInlineBoostForSend(input.template, profile, domain);

                        boostUri = getBoostUri(boost.id, domain);
                        boostCreated = true;
                    } else if (input.signedCredential) {
                        // A replayed managed handoff reuses the boost its refresh is already
                        // bound to (the pre-mutation guard validated the handoff above).
                        const boundBoostId = refreshRequested
                            ? await traceDb('getBoundRefreshBoostId', () =>
                                  getBoundRefreshBoostId(
                                      extractManagedRefreshHandoff(input.signedCredential!, domain)!
                                          .refreshId
                                  )
                              )
                            : undefined;
                        const boundBoost = boundBoostId
                            ? await traceDb('getBoostById:boundRefresh', () =>
                                  getBoostById(boundBoostId)
                              )
                            : null;
                        // A keyed handoff whose preparation already created/resolved a
                        // boost (but never delivered) reuses that prepared boost.
                        const preparedBoostUri =
                            !boundBoost && refreshRequested && input.idempotencyKey
                                ? (
                                      await traceDb('getRefreshSendIntent:signedCredential', () =>
                                          getRefreshSendIntent(
                                              profile.profileId,
                                              input.idempotencyKey!
                                          )
                                      )
                                  )?.boostUri
                                : undefined;
                        const preparedBoost = preparedBoostUri
                            ? await traceDb('getBoostByUri:preparedRefresh', () =>
                                  getBoostByUri(preparedBoostUri)
                              )
                            : null;

                        if (boundBoost) {
                            boost = boundBoost;
                            boostUri = getBoostUri(boundBoost.id, domain);
                        } else if (preparedBoost && preparedBoostUri) {
                            boost = preparedBoost;
                            boostUri = preparedBoostUri;
                        } else {
                            // Auto-create boost from the signed credential. A managed refresh
                            // service belongs to one holder's credential, never to a reusable
                            // template, so it is not stored on the boost.
                            const { refreshService: _refreshService, ...templateCredential } =
                                input.signedCredential as Record<string, unknown>;
                            const name =
                                typeof templateCredential.name === 'string'
                                    ? templateCredential.name
                                    : undefined;

                            boost = await traceDb('createBoost:fromSignedCredential', () =>
                                createBoost(
                                    (refreshRequested
                                        ? templateCredential
                                        : input.signedCredential!) as typeof input.signedCredential &
                                        object,
                                    profile,
                                    { ...(name ? { name } : {}) },
                                    domain
                                )
                            );

                            boostUri = getBoostUri(boost.id, domain);
                            boostCreated = true;
                        }
                    }

                    if (!boost) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message:
                                'A templateUri, template, or signedCredential must be provided.',
                        });
                    }

                    if (
                        !(await traceDb('canProfileIssueBoost', () =>
                            canProfileIssueBoost(profile, boost!)
                        ))
                    ) {
                        throw new TRPCError({
                            code: 'UNAUTHORIZED',
                            message: 'Profile does not have permissions to issue boost',
                        });
                    }

                    if (isDraftBoost(boost)) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message:
                                'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                        });
                    }

                    if (inboxIntent?.state === 'preparing')
                        inboxIntent = await recordRefreshSendIntent(inboxIntent, {
                            boostUri,
                            state: 'prepared',
                        });

                    // LC-2198: managed refresh delivery. The recipient was fully validated
                    // in the pre-mutation guard above (feature, scope, supported recipient,
                    // blocklist); the boost passed the same issue-permission and draft
                    // checks as a normal send.
                    if (refreshRequested) {
                        return trace('route', 'sendRefreshable', async () => {
                            const targetProfile = refreshTargetProfile!;
                            let intent: RefreshSendIntent | undefined = keyedPrepared?.intent;

                            const contractTerms = await resolveContractForSend({
                                profile,
                                targetProfile,
                                boost: boost!,
                                boostCreated,
                                contractUri,
                            });

                            // Matches the unified send's self-send notification behavior.
                            const skipNotification = profile.profileId === targetProfile.profileId;

                            let signedVc: VC;
                            let refreshId: string;

                            if (input.signedCredential) {
                                // Preallocated handoff (plan decision 6): the caller already
                                // allocated and embedded the managed service before signing.
                                // Ownership, holder, ID, boost anchor, proof, and descriptor
                                // are enforced by the managed send helper.
                                const handoff = extractManagedRefreshHandoff(
                                    input.signedCredential,
                                    domain
                                )!;
                                signedVc = input.signedCredential;
                                refreshId = handoff.refreshId;

                                if (input.idempotencyKey) {
                                    const existing = await getRefreshSendIntent(
                                        profile.profileId,
                                        input.idempotencyKey
                                    );

                                    if (
                                        !existing ||
                                        existing.refreshId !== refreshId ||
                                        existing.boostUri !== boostUri
                                    ) {
                                        throw new TRPCError({
                                            code: 'CONFLICT',
                                            message:
                                                'This idempotencyKey does not match the prepared refresh send for this credential.',
                                        });
                                    }

                                    if (existing.state === 'delivered' && existing.result) {
                                        return existing.result;
                                    }

                                    intent = existing;
                                    const reconciled = await reconcileBoundRefreshSendIntent(
                                        existing,
                                        domain
                                    );
                                    if (reconciled) return reconciled;
                                }

                                // Resume detection: reuse the original delivery activity
                                // instead of duplicating issuance or activity when the exact
                                // same credential is redelivered (e.g. a network retry after
                                // binding already succeeded).
                                const binding = await traceInternal(
                                    'peekCredentialRefreshInitialBinding',
                                    () =>
                                        peekCredentialRefreshInitialBinding({
                                            refreshId,
                                            credential: signedVc,
                                            boostId: boost!.id,
                                        })
                                );

                                if (binding.bound) {
                                    const { uri, receipt } = await sendRefreshableCredential({
                                        issuerProfile: profile,
                                        refreshId,
                                        credential: signedVc,
                                        boostUri,
                                        skipNotification,
                                        domain,
                                        activityId: binding.activityId,
                                        integrationId: input.integrationId,
                                        contractTerms: contractTerms ?? undefined,
                                    });

                                    const response = {
                                        type: 'boost' as const,
                                        credentialUri: uri,
                                        uri: boostUri,
                                        activityId: binding.activityId ?? '',
                                        refresh: receipt,
                                    };

                                    if (intent)
                                        await markRefreshSendIntentDelivered(intent, response);

                                    return response;
                                }
                            } else {
                                if (keyedPrepared && intent) {
                                    const reconciled = await reconcileBoundRefreshSendIntent(
                                        intent,
                                        domain
                                    );

                                    if (reconciled) return reconciled;
                                }

                                const signingAuthority = await traceDb(
                                    'getPrimarySigningAuthorityForUser:refresh',
                                    () => getPrimarySigningAuthorityForUser(profile)
                                );

                                if (!signingAuthority) {
                                    throw new TRPCError({
                                        code: 'PRECONDITION_FAILED',
                                        message:
                                            'You must register a signing authority before using send without a pre-signed credential. Please register one via registerSigningAuthority or sign the credential client-side.',
                                    });
                                }

                                let unsignedVc: UnsignedVC;

                                try {
                                    unsignedVc = await traceInternal(
                                        'prepareCredentialFromBoost:refresh',
                                        () =>
                                            prepareCredentialFromBoost(boost!, boostUri, domain, {
                                                templateData: input.templateData as Record<
                                                    string,
                                                    unknown
                                                >,
                                                issuerDid: signingAuthority.relationship.did,
                                                recipientDid:
                                                    keyedPrepared?.holderDid ??
                                                    getDidWeb(domain, targetProfile.profileId),
                                                recipientName: targetProfile.displayName,
                                            })
                                    );
                                } catch (e) {
                                    console.error('Failed to prepare boost credential', e);
                                    throw new TRPCError({
                                        code: 'INTERNAL_SERVER_ERROR',
                                        message: 'Failed to prepare boost credential',
                                    });
                                }

                                // A stable credential ID must exist before allocation: the
                                // refresh aggregate is permanently bound to it.
                                unsignedVc.id =
                                    keyedPrepared?.credentialId ??
                                    unsignedVc.id ??
                                    `urn:uuid:${uuid()}`;

                                // A keyed send already allocated its refresh during preparation;
                                // otherwise allocate once, then inject the managed service +
                                // inline JSON-LD context so both become part of the signed payload.
                                const allocation = keyedPrepared
                                    ? {
                                          refreshId: keyedPrepared.refreshId,
                                          refreshService: keyedPrepared.refreshService,
                                      }
                                    : await traceInternal('allocateCredentialRefresh:send', () =>
                                          allocateCredentialRefresh({
                                              issuerProfile: profile,
                                              holderProfile: targetProfile,
                                              holderDid: getDidWeb(domain, targetProfile.profileId),
                                              credentialId: unsignedVc.id!,
                                              domain,
                                          })
                                      );

                                refreshId = allocation.refreshId;

                                const prepared = injectManagedRefreshService(
                                    unsignedVc,
                                    allocation.refreshService
                                );

                                signedVc = await traceInternal(
                                    'issueCredentialWithSigningAuthority:refresh',
                                    async () =>
                                        (
                                            await issueCredentialWithSigningAuthority(
                                                { type: 'profile', profile },
                                                prepared,
                                                signingAuthority,
                                                domain,
                                                false
                                            )
                                        ).credential as VC
                                );
                            }

                            // Plaintext templateData is intentionally omitted from refresh
                            // activity metadata: refresh records never persist claim content.
                            const activityId = await traceDb('logCredentialSent:refresh', () =>
                                logCredentialSent({
                                    actorProfileId: profile.profileId,
                                    onBehalfOf: ctx.user.onBehalfOf,
                                    recipientType: 'profile',
                                    recipientIdentifier: targetProfile.profileId,
                                    recipientProfileId: targetProfile.profileId,
                                    boostUri,
                                    source: 'send',
                                    integrationId: input.integrationId,
                                })
                            );

                            if (intent) {
                                await recordRefreshSendIntentPending(
                                    intent,
                                    {
                                        refreshId,
                                        refreshService: managedRefreshServiceFor(refreshId, domain),
                                        credentialId: signedVc.id as string,
                                        issuerDid:
                                            getCredentialIssuerId(signedVc) ??
                                            getDidWeb(domain, profile.profileId),
                                        holderDid:
                                            intent.holderDid ??
                                            getDidWeb(domain, targetProfile.profileId),
                                        ...(signedVc.credentialStatus
                                            ? { credentialStatus: signedVc.credentialStatus }
                                            : {}),
                                    },
                                    activityId
                                );
                            }

                            try {
                                const { uri, receipt } = await sendRefreshableCredential({
                                    issuerProfile: profile,
                                    refreshId,
                                    credential: signedVc,
                                    boostUri,
                                    skipNotification,
                                    domain,
                                    activityId,
                                    integrationId: input.integrationId,
                                    contractTerms: contractTerms ?? undefined,
                                });

                                const response = {
                                    type: 'boost' as const,
                                    credentialUri: uri,
                                    uri: boostUri,
                                    activityId,
                                    refresh: receipt,
                                };

                                if (intent) await markRefreshSendIntentDelivered(intent, response);

                                return response;
                            } catch (error) {
                                await traceDb('logCredentialFailed:refresh', () =>
                                    logCredentialFailed({
                                        activityId,
                                        actorProfileId: profile.profileId,
                                        onBehalfOf: ctx.user.onBehalfOf,
                                        recipientType: 'profile',
                                        recipientIdentifier: targetProfile.profileId,
                                        recipientProfileId: targetProfile.profileId,
                                        boostUri,
                                        integrationId: input.integrationId,
                                        source: 'send',
                                        metadata: {
                                            error:
                                                error instanceof Error
                                                    ? error.message
                                                    : 'Unknown error',
                                        },
                                    })
                                );
                                throw error;
                            }
                        });
                    }

                    // Route to Universal Inbox for email/phone recipients
                    if (inboxRecipient) {
                        // Try to resolve recipient profile for auto-populating template variables + recipient DID
                        let inboxRecipientName: string | undefined;
                        let inboxRecipientDid: string | undefined;
                        if (inboxRecipient.type === 'email' || inboxRecipient.type === 'phone') {
                            const contactMethod = await traceDb(
                                'getContactMethodByValue:inbox',
                                () =>
                                    getContactMethodByValue(
                                        inboxRecipient.type as 'email' | 'phone',
                                        inboxRecipient.value
                                    )
                            );
                            if (contactMethod) {
                                const recipientProfile = await traceDb(
                                    'getProfileByContactMethod:inbox',
                                    () => getProfileByContactMethod(contactMethod.id)
                                );
                                inboxRecipientName = recipientProfile?.displayName;
                                if (recipientProfile?.profileId) {
                                    inboxRecipientDid = getDidWeb(
                                        domain,
                                        recipientProfile.profileId
                                    );
                                }
                            }
                        }

                        // Prepare the credential - use signedCredential if provided, otherwise from boost template
                        let credential: VC | UnsignedVC;

                        if (input.signedCredential) {
                            credential = input.signedCredential;
                        } else {
                            try {
                                credential = await traceInternal(
                                    'prepareCredentialFromBoost:inbox',
                                    () =>
                                        prepareCredentialFromBoost(boost!, boostUri, domain, {
                                            templateData: input.templateData as Record<
                                                string,
                                                unknown
                                            >,
                                            recipientDid: inboxRecipientDid,
                                            recipientName: inboxRecipientName,
                                        })
                                );
                            } catch (e) {
                                console.error('Failed to prepare boost credential for inbox', e);
                                throw new TRPCError({
                                    code: 'INTERNAL_SERVER_ERROR',
                                    message: 'Failed to prepare boost credential',
                                });
                            }

                            if (!inboxRefreshRequested)
                                credential = await appendBitstringStatusListEntries(
                                    credential,
                                    profile.profileId,
                                    domain
                                );
                        }

                        // Build inbox configuration from SendOptions
                        // Log credential activity FIRST to get activityId for chaining
                        const activityId = await traceDb('logCredentialSent:inbox', () =>
                            logCredentialSent({
                                actorProfileId: profile.profileId,
                                onBehalfOf: ctx.user.onBehalfOf,
                                recipientType: inboxRecipient.type,
                                recipientIdentifier: inboxRecipient.value,
                                boostUri,
                                source: 'send',
                                integrationId: input.integrationId,
                                metadata: { templateData: input.templateData },
                            })
                        );

                        const inboxConfig = buildInboxConfig(input.options, boostUri);

                        try {
                            const inboxResult = await traceInternal('issueToInbox', () =>
                                issueToInbox(
                                    profile,
                                    inboxRecipient,
                                    credential,
                                    {
                                        ...inboxConfig,
                                        refresh: inboxRefreshRequested,
                                        idempotencyKey: inboxKey,
                                        refreshRequestDigest: inboxDigest,
                                        activityId,
                                        integrationId: input.integrationId,
                                    },
                                    ctx
                                )
                            );

                            const result = {
                                type: 'boost' as const,
                                credentialUri: '',
                                uri: boostUri,
                                activityId: inboxResult.inboxCredential.activityId ?? activityId,
                                inbox: {
                                    ...(inboxResult.refresh
                                        ? { refresh: inboxResult.refresh }
                                        : {}),
                                    issuanceId: inboxResult.inboxCredential.id,
                                    status: inboxResult.status,
                                    claimUrl: inboxResult.claimUrl,
                                    ...(inboxResult.guardianStatus
                                        ? { guardianStatus: inboxResult.guardianStatus }
                                        : {}),
                                },
                            };
                            if (inboxIntent)
                                await markRefreshSendIntentDelivered(inboxIntent, result);
                            return result;
                        } catch (error) {
                            // Log FAILED activity when issueToInbox fails
                            await traceDb('logCredentialFailed:inbox', () =>
                                logCredentialFailed({
                                    activityId,
                                    actorProfileId: profile.profileId,
                                    onBehalfOf: ctx.user.onBehalfOf,
                                    recipientType: inboxRecipient.type,
                                    recipientIdentifier: inboxRecipient.value,
                                    boostUri,
                                    integrationId: input.integrationId,
                                    source: 'send',
                                    metadata: {
                                        error:
                                            error instanceof Error
                                                ? error.message
                                                : 'Unknown error',
                                    },
                                })
                            );
                            throw error;
                        }
                    }

                    // Existing flow for DID/profileId recipients
                    const remoteInboxResult = input.recipient.startsWith('did:web:')
                        ? await traceInternal('findInboxServiceEndpoint', () =>
                              findInboxServiceEndpoint(input.recipient, domain)
                          )
                        : null;

                    if (remoteInboxResult?.type === 'remote') {
                        let signedVc: VC | JWE;

                        if (input.signedCredential) {
                            signedVc = input.signedCredential;
                        } else {
                            const signingAuthority = await traceDb(
                                'getPrimarySigningAuthorityForUser:remoteInbox',
                                () => getPrimarySigningAuthorityForUser(profile)
                            );

                            if (!signingAuthority) {
                                throw new TRPCError({
                                    code: 'PRECONDITION_FAILED',
                                    message:
                                        'You must register a signing authority before using send without a pre-signed credential. Please register one via registerSigningAuthority or sign the credential client-side.',
                                });
                            }

                            let unsignedVc: UnsignedVC;

                            try {
                                unsignedVc = await traceInternal(
                                    'prepareCredentialFromBoost:remoteInbox',
                                    () =>
                                        prepareCredentialFromBoost(boost!, boostUri, domain, {
                                            templateData: input.templateData as Record<
                                                string,
                                                unknown
                                            >,
                                            issuerDid: signingAuthority.relationship.did,
                                            recipientDid: input.recipient,
                                        })
                                );
                            } catch (e) {
                                console.error('Failed to prepare boost credential', e);
                                throw new TRPCError({
                                    code: 'INTERNAL_SERVER_ERROR',
                                    message: 'Failed to prepare boost credential',
                                });
                            }

                            signedVc = await traceInternal(
                                'issueCredentialWithSigningAuthority:remoteInbox',
                                async () =>
                                    (
                                        await issueCredentialWithSigningAuthority(
                                            { type: 'profile', profile },
                                            await appendBitstringStatusListEntries(
                                                unsignedVc,
                                                profile.profileId,
                                                domain
                                            ),
                                            signingAuthority,
                                            domain,
                                            false
                                        )
                                    ).credential
                            );
                        }

                        const activityId = await traceDb('logCredentialSent:remoteInbox', () =>
                            logCredentialSent({
                                actorProfileId: profile.profileId,
                                onBehalfOf: ctx.user.onBehalfOf,
                                recipientType: 'profile',
                                recipientIdentifier: input.recipient,
                                boostUri,
                                source: 'send',
                                integrationId: input.integrationId,
                                metadata: { templateData: input.templateData },
                            })
                        );

                        const learnCard = await getDidWebLearnCard();
                        const didAuthJwt = await learnCard.invoke.getDidAuthVp({
                            proofFormat: 'jwt',
                            challenge: `inbox-federation-${uuid()}`,
                        });

                        const response = await fetch(remoteInboxResult.endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${didAuthJwt}`,
                            },
                            body: JSON.stringify({
                                recipientDid: input.recipient,
                                credential: signedVc,
                                issuerDid: profile.did,
                                issuerDisplayName: profile.displayName,
                                configuration: {
                                    boostUri,
                                    activityId,
                                    integrationId: input.integrationId,
                                    federatedFrom: profile.did,
                                },
                            }),
                            signal: AbortSignal.timeout(10000),
                        });

                        if (!response.ok) {
                            const error = await response.text();
                            await traceDb('logCredentialFailed:remoteInbox', () =>
                                logCredentialFailed({
                                    activityId,
                                    actorProfileId: profile.profileId,
                                    onBehalfOf: ctx.user.onBehalfOf,
                                    recipientType: 'profile',
                                    recipientIdentifier: input.recipient,
                                    boostUri,
                                    integrationId: input.integrationId,
                                    source: 'send',
                                    metadata: { error },
                                })
                            );
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: error,
                            });
                        }

                        const inboxResult = (await response.json()) as {
                            issuanceId: string;
                            claimUrl?: string;
                        };

                        return {
                            type: 'boost' as const,
                            credentialUri: '',
                            uri: boostUri,
                            activityId,
                            inbox: {
                                issuanceId: inboxResult.issuanceId,
                                status: 'PENDING',
                                claimUrl: inboxResult.claimUrl,
                            },
                        };
                    }

                    const recipientProfileId = await traceInternal('getProfileIdFromString', () =>
                        getProfileIdFromString(input.recipient, domain)
                    );

                    const targetProfile = recipientProfileId
                        ? await traceDb('getProfileByProfileId', () =>
                              getProfileByProfileId(recipientProfileId)
                          )
                        : null;

                    if (!targetProfile) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Profile not found. Are you sure this person exists?',
                        });
                    }

                    const isBlocked = await traceDb('isRelationshipBlocked', () =>
                        isRelationshipBlocked(profile, targetProfile)
                    );
                    if (isBlocked) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: 'Profile not found. Are you sure this person exists?',
                        });
                    }

                    const contractTerms = await resolveContractForSend({
                        profile,
                        targetProfile: targetProfile!,
                        boost: boost!,
                        boostCreated,
                        contractUri,
                    });

                    let signedVc: VC | JWE;

                    if (input.signedCredential) {
                        signedVc = input.signedCredential;
                    } else {
                        const signingAuthority = await traceDb(
                            'getPrimarySigningAuthorityForUser',
                            () => getPrimarySigningAuthorityForUser(profile)
                        );

                        if (!signingAuthority) {
                            throw new TRPCError({
                                code: 'PRECONDITION_FAILED',
                                message:
                                    'You must register a signing authority before using send without a pre-signed credential. Please register one via registerSigningAuthority or sign the credential client-side.',
                            });
                        }

                        let unsignedVc: UnsignedVC;

                        try {
                            unsignedVc = await traceInternal('prepareCredentialFromBoost', () =>
                                prepareCredentialFromBoost(boost!, boostUri, domain, {
                                    templateData: input.templateData as Record<string, unknown>,
                                    issuerDid: signingAuthority.relationship.did,
                                    recipientDid: getDidWeb(domain, targetProfile.profileId),
                                    recipientName: targetProfile.displayName,
                                })
                            );
                        } catch (e) {
                            console.error('Failed to prepare boost credential', e);
                            throw new TRPCError({
                                code: 'INTERNAL_SERVER_ERROR',
                                message: 'Failed to prepare boost credential',
                            });
                        }

                        signedVc = await traceInternal(
                            'issueCredentialWithSigningAuthority',
                            async () =>
                                (
                                    await issueCredentialWithSigningAuthority(
                                        { type: 'profile', profile },
                                        await appendBitstringStatusListEntries(
                                            unsignedVc,
                                            profile.profileId,
                                            domain
                                        ),
                                        signingAuthority,
                                        domain,
                                        false
                                    )
                                ).credential
                        );
                    }

                    let skipNotification = profile.profileId === targetProfile.profileId;

                    // Log credential activity FIRST to get activityId for chaining
                    const activityId = await traceDb('logCredentialSent', () =>
                        logCredentialSent({
                            actorProfileId: profile.profileId,
                            onBehalfOf: ctx.user.onBehalfOf,
                            recipientType: 'profile',
                            recipientIdentifier: targetProfile.profileId,
                            recipientProfileId: targetProfile.profileId,
                            boostUri,
                            source: 'send',
                            integrationId: input.integrationId,
                            metadata: { templateData: input.templateData },
                        })
                    );

                    try {
                        const credentialUri = await sendBoost({
                            from: { type: 'profile', profile },
                            to: targetProfile,
                            boost,
                            credential: signedVc,
                            domain,
                            skipNotification,
                            contractTerms: contractTerms ?? undefined,
                            activityId,
                            integrationId: input.integrationId,
                        });

                        return { type: 'boost' as const, credentialUri, uri: boostUri, activityId };
                    } catch (error) {
                        // Log FAILED activity when sendBoost fails
                        await traceDb('logCredentialFailed', () =>
                            logCredentialFailed({
                                activityId,
                                actorProfileId: profile.profileId,
                                onBehalfOf: ctx.user.onBehalfOf,
                                recipientType: 'profile',
                                recipientIdentifier: targetProfile.profileId,
                                recipientProfileId: targetProfile.profileId,
                                boostUri,
                                integrationId: input.integrationId,
                                source: 'send',
                                metadata: {
                                    error: error instanceof Error ? error.message : 'Unknown error',
                                },
                            })
                        );
                        throw error;
                    }
                },
                { recipient: input.recipient }
            );
        }),

    createBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/create',
                tags: ['Boosts'],
                summary: 'Creates a boost',
                description: 'This route creates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            ConsumerBoostValidator.partial()
                .omit({ uri: true, claimPermissions: true, defaultPermissions: true })
                .extend({
                    credential: VCValidator.or(UnsignedVCValidator),
                    claimPermissions: BoostPermissionsValidator.partial().optional(),
                    defaultPermissions: BoostPermissionsValidator.partial().optional(),
                    skills: z
                        .array(
                            z.object({
                                frameworkId: z.string(),
                                id: z.string(),
                                proficiencyLevel: z.number().optional(),
                            })
                        )
                        .min(1)
                        .optional(),
                })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { credential, claimPermissions, defaultPermissions, skills, ...metadata } = input;

            const boost = await createBoost(credential, profile, metadata, ctx.domain);

            if (Array.isArray(skills) && skills.length > 0) {
                await addAlignedSkillsToBoost(boost, skills);
            }

            if (claimPermissions) {
                await addClaimPermissionsForBoost(boost, {
                    ...EMPTY_PERMISSIONS,
                    ...claimPermissions,
                });
            }

            await addDefaultPermissionsForBoost(boost, {
                ...EMPTY_PERMISSIONS,
                ...DEFAULT_BOOST_PERMISSIONS,
                ...defaultPermissions,
            });

            return getBoostUri(boost.id, ctx.domain);
        }),

    createChildBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/create/child',
                tags: ['Boosts'],
                summary: 'Creates a boost',
                description: 'This route creates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                parentUri: z.string(),
                boost: ConsumerBoostValidator.partial()
                    .omit({ uri: true, claimPermissions: true, defaultPermissions: true })
                    .extend({
                        credential: VCValidator.or(UnsignedVCValidator),
                        claimPermissions: BoostPermissionsValidator.partial().optional(),
                        defaultPermissions: BoostPermissionsValidator.partial().optional(),
                    }),
                skills: z
                    .array(
                        z.object({
                            frameworkId: z.string(),
                            id: z.string(),
                            proficiencyLevel: z.number().optional(),
                        })
                    )
                    .optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const {
                parentUri,
                boost: { credential, claimPermissions, defaultPermissions, ...metadata },
                skills,
            } = input;

            const parentBoost = await getBoostByUri(parentUri);

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (
                !(await canProfileCreateChildBoost(profile, parentBoost, {
                    status: BoostStatus.enum.LIVE,
                    ...metadata,
                }))
            ) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own parent boost',
                });
            }

            const childBoost = await createBoost(credential, profile, metadata, ctx.domain);

            await setBoostAsParent(parentBoost, childBoost);

            if (Array.isArray(skills) && skills.length > 0) {
                await addAlignedSkillsToBoost(childBoost, skills);
            }

            if (claimPermissions) {
                await addClaimPermissionsForBoost(childBoost, {
                    ...EMPTY_PERMISSIONS,
                    ...claimPermissions,
                });
            }

            await addDefaultPermissionsForBoost(childBoost, {
                ...EMPTY_PERMISSIONS,
                ...DEFAULT_BOOST_PERMISSIONS,
                ...defaultPermissions,
            });

            return getBoostUri(childBoost.id, ctx.domain);
        }),

    getBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boost',
                description: 'This endpoint gets metadata about a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(
            BoostWithClaimPermissionsValidator.omit({ id: true, boost: true }).extend({
                uri: z.string(),
                boost: UnsignedVCValidator,
            })
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const { domain: uriDomain } = getUriParts(decodedUri, true);
            // Use the bare domain so alignment targetUrls match issuance-time injection.
            const alignmentsDomain = getDomainFromUri(decodedUri);
            const [boost, boostInstance] = await Promise.all([
                getBoostByUriWithDefaultClaimPermissions(decodedUri),
                getBoostByUri(decodedUri),
            ]);

            if (!boost || !boostInstance)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileViewBoost(profile, boostInstance))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to view this boost',
                });
            }

            const { id, boost: _boost, ...remaining } = boost;
            const parsedBoost = JSON.parse(_boost);
            await injectObv3AlignmentsIntoCredentialForBoost(
                parsedBoost,
                boostInstance,
                alignmentsDomain
            );

            return { ...remaining, boost: parsedBoost, uri: getBoostUri(id, uriDomain) };
        }),

    getBoostFrameworks: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/frameworks',
                tags: ['Boosts'],
                summary: 'List frameworks used by a boost (paginated)',
                description:
                    'Returns frameworks aligned to a boost via USES_FRAMEWORK with pagination and optional query filtering. Requires boost admin.',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                limit: z.number().int().min(1).max(200).default(50),
                cursor: z.string().nullable().optional(),
                query: SkillFrameworkQueryValidator.optional(),
            })
        )
        .output(PaginatedSkillFrameworksValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, limit, cursor, query } = input;
            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile is not a boost admin',
                });
            }

            const page = await getFrameworksForBoostPaged(
                boost,
                query ?? null,
                limit,
                cursor ?? null
            );

            const response = {
                records: page.records.map(framework => ({
                    id: framework.id,
                    name: framework.name,
                    description: framework.description ?? undefined,
                    sourceURI: framework.sourceURI ?? undefined,
                    isPublic: (framework as any).isPublic ?? false,
                    status: framework.status ?? 'active',
                    createdAt: framework.createdAt,
                    updatedAt: framework.updatedAt,
                })),
                hasMore: page.hasMore,
            };

            if (page.cursor) (response as any).cursor = page.cursor;

            return response;
        }),

    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/all',
                tags: ['Boosts'],
                summary: 'Get boosts',
                deprecated: true,
                description:
                    "This endpoint gets the current user's boosts.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoosts instead",
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ query: BoostQueryValidator.optional() }).default({}))
        .output(BoostValidator.omit({ id: true, boost: true }).extend({ uri: z.string() }).array())
        .query(async ({ ctx, input }) => {
            const { query } = input;
            const { profile } = ctx.user;

            const boosts = await getBoostsForProfile(profile, { limit: 50, query });

            return boosts.map(boost => {
                const { id, boost: _boost, ...remaining } = boost;
                return { ...remaining, uri: getBoostUri(id, ctx.domain) };
            });
        }),

    countBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/count',
                tags: ['Boosts'],
                summary: 'Count managed boosts',
                description: "This endpoint counts the current user's managed boosts.",
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ query: BoostQueryValidator.optional() }).default({}))
        .output(z.number())
        .query(async ({ ctx, input }) => {
            const { query } = input;
            const { profile } = ctx.user;

            const count = await countBoostsForProfile(profile, { query });

            return count;
        }),

    getPaginatedBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/paginated',
                tags: ['Boosts'],
                summary: 'Get boosts',
                description: "This endpoint gets the current user's boosts",
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: BoostQueryValidator.optional(),
            }).default({
                limit: 25,
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor, query } = input;
            const { profile } = ctx.user;

            const records = await getBoostsForProfile(profile, { limit: limit + 1, cursor, query });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                deprecated: true,
                description:
                    'This endpoint gets the recipients of a particular boost.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoostRecipients instead',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                limit: z.number().optional().default(25),
                skip: z.number().optional(),
                includeUnacceptedBoosts: z.boolean().default(true),
            })
        )
        .output(BoostRecipientValidator.array())
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const { uri, limit, skip, includeUnacceptedBoosts } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const canViewFullList = await canViewerSeeFullBoostRecipientList(
                ctx.user.profile.profileId,
                boost,
                domain
            );

            const records = await getBoostRecipientsSkipLimit(boost, {
                limit,
                skip,
                includeUnacceptedBoosts,
                domain,
            });

            return sanitizeBoostRecipientRecords(ctx.user.profile, records, !canViewFullList);
        }),

    getPaginatedBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/paginated',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                description: 'This endpoint gets the recipients of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
                query: LCNProfileQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostRecipientsValidator)
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const { uri, limit, cursor, includeUnacceptedBoosts, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            const canViewFullList = await canViewerSeeFullBoostRecipientList(
                ctx.user.profile.profileId,
                boost,
                domain
            );

            const records = await getBoostRecipients(boost, {
                limit: limit + 1,
                cursor,
                includeUnacceptedBoosts,
                query,
                domain,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.sent;
            const paginatedRecords = records.slice(0, limit);
            const sanitizedRecords = await sanitizeBoostRecipientRecords(
                ctx.user.profile,
                paginatedRecords,
                !canViewFullList
            );

            return {
                hasMore,
                records: sanitizedRecords,
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostRecipientCount: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients/count',
                tags: ['Boosts'],
                summary: 'Get boost recipients count',
                description: 'This endpoint counts the recipients of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string(), includeUnacceptedBoosts: z.boolean().default(true) }))
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, includeUnacceptedBoosts } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostRecipients(boost, { includeUnacceptedBoosts });
        }),

    getConnectedBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/connected/{uri}',
                tags: ['Boosts'],
                summary: 'Get connected boost recipients',
                description: 'This endpoint gets the recipients of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
                query: LCNProfileQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostRecipientsValidator)
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const { uri, limit, cursor, includeUnacceptedBoosts, query } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            const canViewFullList = await canViewerSeeFullBoostRecipientList(
                ctx.user.profile.profileId,
                boost,
                domain
            );

            const records = await getConnectedBoostRecipients(ctx.user.profile, boost, {
                limit: limit + 1,
                cursor,
                includeUnacceptedBoosts,
                query,
                domain,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.sent;
            const paginatedRecords = records.slice(0, limit);
            const sanitizedRecords = await sanitizeBoostRecipientRecords(
                ctx.user.profile,
                paginatedRecords,
                !canViewFullList
            );

            return {
                hasMore,
                records: sanitizedRecords,
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getConnectedBoostRecipientCount: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients/connected/{uri}/count',
                tags: ['Boosts'],
                summary: 'Get boost recipients count',
                description: 'This endpoint counts the recipients of a particular boost',
            },
        })
        .input(z.object({ uri: z.string(), includeUnacceptedBoosts: z.boolean().default(true) }))
        .output(z.number())
        .query(async ({ input, ctx }) => {
            const { uri, includeUnacceptedBoosts } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countConnectedBoostRecipients(ctx.user.profile, boost, {
                includeUnacceptedBoosts,
            });
        }),

    revokeBoostRecipient: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/revoke',
                tags: ['Boosts'],
                summary: 'Revoke a boost recipient',
                description:
                    'Revokes a credential for a specified recipient. This marks the credential as revoked instead of deleting it, and removes any permissions granted via claim hooks.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                boostUri: z.string(),
                recipientProfileId: z.string(),
                credentialUri: z.string().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, recipientProfileId, credentialUri } = input;

            const resolvedRecipientProfileId = await getProfileIdFromString(
                recipientProfileId,
                ctx.domain
            );
            if (!resolvedRecipientProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const decodedUri = decodeURIComponent(boostUri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            }

            // Check if the profile has permission to revoke
            const permissions = await getBoostPermissions(boost, profile);
            if (!permissions.canRevoke) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'Profile does not have permission to revoke credentials for this boost',
                });
            }

            // Get the recipient profile
            const recipientProfile = await getProfileByProfileId(resolvedRecipientProfileId);
            if (!recipientProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }

            // Get the credential instance — specific instance if credentialUri provided, else most recent
            const credential = await resolveBoostCredentialInstance({
                boostId: boost.id,
                recipientProfileId: resolvedRecipientProfileId,
                credentialUri,
            });

            if (!credential) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No credential found for this recipient and boost',
                });
            }

            // Revoke the credential
            const { revokeCredentialReceived } =
                await import('@accesslayer/credential/relationships/update');
            const revoked = await revokeCredentialReceived(
                credential.id,
                resolvedRecipientProfileId
            );

            if (!revoked) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to revoke credential',
                });
            }

            // Process revoke hooks to remove permissions
            const { processRevokeHooks } = await import('@helpers/revoke-hooks.helpers');
            await processRevokeHooks(recipientProfile, credential);

            // Notify the holder (fire-and-forget — must not fail the revoke)
            try {
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_REVOKED,
                    to: {
                        did: getDidWeb(ctx.domain, resolvedRecipientProfileId),
                        profileId: resolvedRecipientProfileId,
                        ...(recipientProfile.notificationsWebhook && {
                            notificationsWebhook: recipientProfile.notificationsWebhook,
                        }),
                    },
                    from: {
                        did: getDidWeb(ctx.domain, profile.profileId),
                        profileId: profile.profileId,
                        displayName: profile.displayName,
                    },
                    message: getNotificationMessage(
                        boost.name ? 'credentialRevokedNamed' : 'credentialRevokedUnnamed',
                        resolveRecipientLocale(recipientProfile),
                        {
                            credentialName: boost.name ?? undefined,
                            issuer: profile.displayName ?? profile.profileId,
                        }
                    ),
                    data: { vcUris: [constructUri('credential', credential.id, ctx.domain)] },
                });
            } catch (e) {
                console.error('Failed to queue CREDENTIAL_REVOKED notification', e);
            }

            return true;
        }),

    suspendBoostRecipient: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/suspend',
                tags: ['Boosts'],
                summary: 'Suspend a boost recipient',
                description:
                    'Temporarily suspends a credential for a specified recipient. Suspension is reversible.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                boostUri: z.string(),
                recipientProfileId: z.string(),
                credentialUri: z.string().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, recipientProfileId, credentialUri } = input;

            const resolvedRecipientProfileId = await getProfileIdFromString(
                recipientProfileId,
                ctx.domain
            );
            if (!resolvedRecipientProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const boost = await getBoostByUri(decodeURIComponent(boostUri));
            if (!boost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            }

            const permissions = await getBoostPermissions(boost, profile);
            if (!permissions.canRevoke) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'Profile does not have permission to suspend credentials for this boost',
                });
            }

            const recipientProfile = await getProfileByProfileId(resolvedRecipientProfileId);
            if (!recipientProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }

            // Get the credential instance — specific instance if credentialUri provided, else most recent
            const credential = await resolveBoostCredentialInstance({
                boostId: boost.id,
                recipientProfileId: resolvedRecipientProfileId,
                credentialUri,
            });

            if (!credential) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No credential found for this recipient and boost',
                });
            }

            const { suspendCredentialReceived } =
                await import('@accesslayer/credential/relationships/update');
            const suspended = await suspendCredentialReceived(
                credential.id,
                resolvedRecipientProfileId
            );

            if (!suspended) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to suspend credential',
                });
            }

            // Notify the holder (fire-and-forget — must not fail the suspend)
            try {
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_SUSPENDED,
                    to: {
                        did: getDidWeb(ctx.domain, resolvedRecipientProfileId),
                        profileId: resolvedRecipientProfileId,
                        ...(recipientProfile.notificationsWebhook && {
                            notificationsWebhook: recipientProfile.notificationsWebhook,
                        }),
                    },
                    from: {
                        did: getDidWeb(ctx.domain, profile.profileId),
                        profileId: profile.profileId,
                        displayName: profile.displayName,
                    },
                    message: getNotificationMessage(
                        boost.name ? 'credentialSuspendedNamed' : 'credentialSuspendedUnnamed',
                        resolveRecipientLocale(recipientProfile),
                        {
                            credentialName: boost.name ?? undefined,
                            issuer: profile.displayName ?? profile.profileId,
                        }
                    ),
                    data: { vcUris: [constructUri('credential', credential.id, ctx.domain)] },
                });
            } catch (e) {
                console.error('Failed to queue CREDENTIAL_SUSPENDED notification', e);
            }

            return true;
        }),

    unsuspendBoostRecipient: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/unsuspend',
                tags: ['Boosts'],
                summary: 'Unsuspend a boost recipient',
                description: 'Clears a temporary credential suspension for a specified recipient.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                boostUri: z.string(),
                recipientProfileId: z.string(),
                credentialUri: z.string().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, recipientProfileId, credentialUri } = input;

            const resolvedRecipientProfileId = await getProfileIdFromString(
                recipientProfileId,
                ctx.domain
            );
            if (!resolvedRecipientProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const boost = await getBoostByUri(decodeURIComponent(boostUri));
            if (!boost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            }

            const permissions = await getBoostPermissions(boost, profile);
            if (!permissions.canRevoke) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'Profile does not have permission to unsuspend credentials for this boost',
                });
            }

            // Get the credential instance — specific instance if credentialUri provided, else most recent
            const credential = await resolveBoostCredentialInstance({
                boostId: boost.id,
                recipientProfileId: resolvedRecipientProfileId,
                credentialUri,
            });

            if (!credential) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No credential found for this recipient and boost',
                });
            }

            const { unsuspendCredentialReceived } =
                await import('@accesslayer/credential/relationships/update');
            const unsuspended = await unsuspendCredentialReceived(
                credential.id,
                resolvedRecipientProfileId
            );

            if (!unsuspended) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Credential is not suspended',
                });
            }

            // Look up the recipient so we can forward their notifications webhook
            // (parity with revoke/suspend), if they registered one.
            const recipientProfile = await getProfileByProfileId(resolvedRecipientProfileId);

            // Notify the holder (fire-and-forget — must not fail the unsuspend)
            try {
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_UNSUSPENDED,
                    to: {
                        did: getDidWeb(ctx.domain, resolvedRecipientProfileId),
                        profileId: resolvedRecipientProfileId,
                        ...(recipientProfile?.notificationsWebhook && {
                            notificationsWebhook: recipientProfile.notificationsWebhook,
                        }),
                    },
                    from: {
                        did: getDidWeb(ctx.domain, profile.profileId),
                        profileId: profile.profileId,
                        displayName: profile.displayName,
                    },
                    message: getNotificationMessage(
                        boost.name ? 'credentialRestoredNamed' : 'credentialRestoredUnnamed',
                        resolveRecipientLocale(recipientProfile),
                        {
                            credentialName: boost.name ?? undefined,
                            issuer: profile.displayName ?? profile.profileId,
                        }
                    ),
                    data: { vcUris: [constructUri('credential', credential.id, ctx.domain)] },
                });
            } catch (e) {
                console.error('Failed to queue CREDENTIAL_UNSUSPENDED notification', e);
            }

            return true;
        }),

    getChildrenProfileManagers: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children-profile-managers',
                tags: ['Boosts', 'Profile Managers'],
                summary: 'Get Profile Managers that are a child of a boost',
                description: 'Get Profile Managers that are a child of a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: LCNProfileManagerQueryValidator.optional(),
            })
        )
        .output(PaginatedLCNProfileManagersValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getChildrenProfileManagers(boost, {
                limit: limit + 1,
                cursor,
                query,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(record => ({ ...record, did: getManagedDidWeb(ctx.domain, record.id) }))
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children',
                tags: ['Boosts'],
                summary: 'Get boost children',
                description: 'This endpoint gets the children of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getChildrenBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                numberOfGenerations,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getPaginatedBoostRecipientsWithChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients-with-children/paginated',
                tags: ['Boosts'],
                summary: 'Get boost recipients with children',
                description:
                    'This endpoint gets the recipients of a boost and all its children boosts',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
                boostQuery: BoostQueryValidator.optional(),
                profileQuery: LCNProfileQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostRecipientsWithChildrenValidator)
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const {
                uri,
                limit,
                cursor,
                includeUnacceptedBoosts,
                numberOfGenerations,
                boostQuery,
                profileQuery,
            } = input;

            const decodedUri = decodeURIComponent(uri);
            console.log('[BrainService] getPaginatedBoostRecipientsWithChildren called');
            console.log('[BrainService] URI:', decodedUri);
            console.log('[BrainService] boostQuery:', JSON.stringify(boostQuery, null, 2));

            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            const canViewFullList = await canViewerSeeFullBoostRecipientList(
                ctx.user.profile.profileId,
                boost,
                domain
            );

            const records = await getBoostRecipientsWithChildren(boost, {
                limit: limit + 1,
                cursor,
                includeUnacceptedBoosts,
                numberOfGenerations,
                boostQuery,
                profileQuery,
                domain,
            });

            const hasMore = records.length > limit;

            // Create cursor from the last record (using profileId for consistency with Neo4j sorting)
            let newCursor: string | undefined;
            if (hasMore && records.length > 0) {
                const lastRecord = records[limit - 1];
                if (lastRecord) {
                    newCursor = lastRecord.to.profileId;
                }
            }
            const paginatedRecords = records.slice(0, limit);
            const sanitizedRecords = await sanitizeBoostRecipientRecords(
                ctx.user.profile,
                paginatedRecords,
                !canViewFullList
            );

            return {
                hasMore,
                records: sanitizedRecords,
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostRecipientsWithChildrenCount: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients-with-children/count',
                tags: ['Boosts'],
                summary: 'Count boost recipients with children',
                description:
                    'This endpoint counts distinct recipients of a boost and all its children boosts',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
                boostQuery: BoostQueryValidator.optional(),
                profileQuery: LCNProfileQueryValidator.optional(),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, includeUnacceptedBoosts, numberOfGenerations, boostQuery, profileQuery } =
                input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostRecipientsWithChildren(boost, {
                includeUnacceptedBoosts,
                numberOfGenerations,
                boostQuery,
                profileQuery,
            });
        }),

    countBoostChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children/count',
                tags: ['Boosts'],
                summary: 'Count boost children',
                description: 'This endpoint counts the children of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostChildren(boost, { query, numberOfGenerations });
        }),

    getBoostSiblings: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/siblings',
                tags: ['Boosts'],
                summary: 'Get boost siblings',
                description: 'This endpoint gets the siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getSiblingBoosts(boost, { limit: limit + 1, cursor, query });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countBoostSiblings: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/siblings/count',
                tags: ['Boosts'],
                summary: 'Count boost siblings',
                description: 'This endpoint counts the siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostSiblings(boost, { query });
        }),

    getFamilialBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/family',
                tags: ['Boosts'],
                summary: 'Get familial boosts',
                description:
                    'This endpoint gets the parents, children, and siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                parentGenerations: z.number().or(z.literal(Infinity)).default(1),
                childGenerations: z.number().or(z.literal(Infinity)).default(1),
                includeExtendedFamily: z.boolean().default(false),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const {
                uri,
                limit,
                cursor,
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getFamilialBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countFamilialBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/family/count',
                tags: ['Boosts'],
                summary: 'Count familial boosts',
                description:
                    'This endpoint counts the parents, children, and siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                parentGenerations: z.number().or(z.literal(Infinity)).default(1),
                childGenerations: z.number().or(z.literal(Infinity)).default(1),
                includeExtendedFamily: z.boolean().default(false),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, parentGenerations, childGenerations, includeExtendedFamily } =
                input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countFamilialBoosts(boost, {
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            });
        }),

    getBoostParents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/parents',
                tags: ['Boosts'],
                summary: 'Get boost parents',
                description: 'This endpoint gets the parents of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getParentBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                numberOfGenerations,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countBoostParents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/parents/count',
                tags: ['Boosts'],
                summary: 'Count boost parents',
                description: 'This endpoint counts the parents of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().or(z.literal(Infinity)).default(1),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostParents(boost, { query, numberOfGenerations });
        }),

    updateBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Update a boost',
                description: 'This route updates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                updates: BoostValidator.partial()
                    .omit({ id: true, boost: true, defaultPermissions: true })
                    .extend({
                        credential: VCValidator.or(UnsignedVCValidator).optional(),
                        defaultPermissions: BoostPermissionsValidator.partial().optional(),
                    }),
                skills: z
                    .array(
                        z.object({
                            frameworkId: z.string(),
                            id: z.string(),
                            proficiencyLevel: z.number().optional(),
                        })
                    )
                    .optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, updates, skills } = input;
            const { name, type, category, status, credential, meta, defaultPermissions } = updates;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileEditBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to edit this boost',
                });
            }

            const actualUpdates: Partial<BoostType> = {};

            if (meta) actualUpdates.meta = meta;

            if (isEditableBoost(boost)) {
                if (name) actualUpdates.name = name;
                if (category) actualUpdates.category = category;
                if (type) actualUpdates.type = type;
                if (status) actualUpdates.status = status;
                if (credential) {
                    // First normalize existing alignments in the credential
                    // (converts type: 'Alignment' to type: ['Alignment'] and constructs targetUrl)
                    normalizeCredentialAlignments(credential, ctx.domain);
                    // Then inject any additional alignments from the boost's linked skills
                    //   I don't think this is necessary since it would've been done in createBoost
                    // await injectObv3AlignmentsIntoCredentialForBoost(credential, boost, ctx.domain);
                    actualUpdates.boost = convertCredentialToBoostTemplateJSON(
                        credential,
                        getDidWeb(ctx.domain, profile.profileId)
                    );
                }
            } else if (!meta && !defaultPermissions) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'LIVE Boosts can only have their meta or defaultPermissions updated. DRAFT and PROVISIONAL Boosts can update any field.',
                });
            }

            const togglingOff =
                typeof updates.autoConnectRecipients !== 'undefined' &&
                Boolean(boost.autoConnectRecipients) === true &&
                updates.autoConnectRecipients === false;

            const result = await updateBoost(boost, actualUpdates);

            if (togglingOff) await removeConnectionsForBoost(boost.id);

            if (actualUpdates.boost) await setStorageForUri(uri, JSON.parse(actualUpdates.boost));

            // Handle defaultPermissions update
            if (defaultPermissions !== undefined) {
                await updateDefaultPermissionsForBoost(boost, {
                    ...EMPTY_PERMISSIONS,
                    ...defaultPermissions,
                });
            }

            // If skills provided (including empty array), replace aligned skills for this boost
            if (Array.isArray(skills)) {
                await replaceAlignedSkillsForBoost(boost, skills);
            }

            return result;
        }),

    getBoostAdmins: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/admins',
                tags: ['Boosts'],
                summary: 'Get boost admins',
                description: 'This route returns the admins for a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                includeSelf: z.boolean().default(true),
                uri: z.string(),
            })
        )
        .output(PaginatedVisibleLCNProfilesValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, includeSelf } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const selfProfile = ctx.user.profile;

            const blacklist = await getBlockedAndBlockedByIds(selfProfile);

            const results = await getBoostAdmins(boost, {
                limit: limit + 1,
                cursor,
                blacklist: includeSelf ? blacklist : [selfProfile.profileId, ...blacklist],
            });

            const hasMore = results.length > limit;
            const nextCursor = hasMore ? results.at(-2)?.profileId : undefined;
            const sanitizedRecords = await Promise.all(
                results.slice(0, limit).map(async profile => {
                    const tier = await resolveProfileTier(ctx.user.profile, profile);
                    return stripSensitiveProfileListFields(sanitizeProfileForTier(profile, tier));
                })
            );

            return {
                hasMore,
                ...(nextCursor && { cursor: nextCursor }),
                records: sanitizedRecords,
            };
        }),

    addBoostAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/add-admin',
                tags: ['Boosts'],
                summary: 'Add a Boost admin',
                description: 'This route adds a new admin for a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, profileId } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const targetProfile = await getProfileByProfileId(resolvedProfileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }
            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have admin rights over boost',
                });
            }

            if (await isProfileBoostAdmin(targetProfile, boost)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Target profile is already an admin of this boost',
                });
            }

            await setProfileAsBoostAdmin(targetProfile, boost);

            return true;
        }),

    removeBoostAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/remove-admin',
                tags: ['Boosts'],
                summary: 'Remove a Boost admin',
                description: 'This route removes an  admin from a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                profileId: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, profileId } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const targetProfile = await getProfileByProfileId(resolvedProfileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canManageBoostPermissions(boost, profile))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile can not manage permissions for boost',
                });
            }

            if (await isProfileBoostOwner(targetProfile, boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot remove boost creator',
                });
            }

            await removeProfileAsBoostAdmin(targetProfile, boost);

            return true;
        }),

    getBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/permissions',
                tags: ['Boosts'],
                summary: 'Get boost permissions',
                description: 'This endpoint gets permission metadata about a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions) return EMPTY_PERMISSIONS;

            return permissions;
        }),

    getOtherBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/permissions/{profileId}',
                tags: ['Boosts'],
                summary: 'Get boost permissions for someone else',
                description:
                    'This endpoint gets permission metadata about a boost for someone else',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, profileId } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canManageBoostPermissions(boost, profile))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to get permissions',
                });
            }

            const otherProfile = await getProfileByProfileId(resolvedProfileId);

            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find target profile',
                });
            }

            const permissions = await getBoostPermissions(boost, otherProfile);

            if (!permissions) return EMPTY_PERMISSIONS;

            return permissions;
        }),

    updateBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/permissions',
                tags: ['Boosts'],
                summary: 'Update boost permissions',
                description:
                    'This endpoint updates permission metadata about a boost for the current user',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                updates: BoostPermissionsValidator.omit({ role: true }).partial(),
            })
        )
        .output(z.boolean())
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, updates } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (await isProfileBoostOwner(profile, boost)) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'Cannot update boost creators permissions (this could break permissions!)',
                });
            }

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions || !permissions.canManagePermissions) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to manage permissions',
                });
            }

            const newPermissions = Object.entries(updates).reduce<Partial<BoostPermissions>>(
                (newPermissionsObject, [permission, value]) => {
                    if (typeof value !== 'undefined') {
                        if (!(permissions as any)[permission]) {
                            throw new TRPCError({
                                code: 'UNAUTHORIZED',
                                message: `Profile does not have rights to manage ${permission}`,
                            });
                        }

                        if (QUERYABLE_PERMISSIONS.includes(permission) && value && value !== '*') {
                            try {
                                JSON.parse(value as string);
                                // oxlint-disable-next-line no-unused-vars
                            } catch (error) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message: `Invalid value for ${permission}`,
                                });
                            }
                        }

                        (newPermissionsObject as any)[permission] = value;
                    }
                    return newPermissionsObject;
                },
                {}
            );

            return updateBoostPermissions(profile, boost, newPermissions);
        }),

    updateOtherBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/permissions/{profileId}',
                tags: ['Boosts'],
                summary: "Update other profile's boost permissions",
                description:
                    'This endpoint updates permission metadata about a boost for another user',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                profileId: z.string(),
                updates: BoostPermissionsValidator.omit({ role: true }).partial(),
            })
        )
        .output(z.boolean())
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, updates, profileId } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions || !permissions.canManagePermissions) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to manage permissions',
                });
            }

            const otherProfile = await getProfileByProfileId(resolvedProfileId);

            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find target profile',
                });
            }

            if (await isProfileBoostOwner(otherProfile, boost)) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Cannot update boost creators permissions',
                });
            }

            // Ensure that there is at least an empty permissions relationship
            await getBoostPermissions(boost, otherProfile, true);

            const newPermissions = Object.entries(updates).reduce<Partial<BoostPermissions>>(
                (newPermissionsObject, [permission, value]) => {
                    if (typeof value !== 'undefined') {
                        if (!(permissions as any)[permission]) {
                            throw new TRPCError({
                                code: 'UNAUTHORIZED',
                                message: `Profile does not have rights to manage ${permission}`,
                            });
                        }

                        if (QUERYABLE_PERMISSIONS.includes(permission) && value && value !== '*') {
                            try {
                                JSON.parse(value as string);
                                // oxlint-disable-next-line no-unused-vars
                            } catch (error) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message: `Invalid value for ${permission}`,
                                });
                            }
                        }

                        (newPermissionsObject as any)[permission] = value;
                    }
                    return newPermissionsObject;
                },
                {}
            );

            return updateBoostPermissions(otherProfile, boost, newPermissions);
        }),

    deleteBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Delete a boost',
                description: 'This route deletes a boost',
            },
            requiredScope: 'boosts:delete',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            const childCount = await countBoostChildren(boost, {
                query: {},
                numberOfGenerations: 1,
            });
            if (childCount > 0) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot delete boost with children',
                });
            }

            await Promise.all([deleteBoost(boost), deleteStorageForUri(uri)]);

            return true;
        }),

    generateClaimLink: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/generate-claim-link',
                tags: ['Boosts'],
                summary: 'Generate a claim link for a boost',
                description:
                    'This route creates a challenge that an unknown profile can use to claim a boost.',
            },
            requiredScope: 'boosts:write',
        })
        .input(BoostGenerateClaimLinkInput)
        .output(z.object({ boostUri: z.string(), challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, challenge = uuid(), claimLinkSA, options = {} } = input ?? {};
            const normalizedClaimLinkSA = {
                ...claimLinkSA,
                name: claimLinkSA.name.toLowerCase(),
            };

            const boost = await getBoostByUri(boostUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'Can not generate claim links for Draft Boosts. Claim links can only be generated for Published Boosts.',
                });
            }

            if (!(await isBoostViewableByClaimLink(boost))) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Boost must be viewable by claim link before generating a claim link.',
                });
            }

            if (await isClaimLinkAlreadySetForBoost(boostUri, challenge)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Challenge already in use!',
                });
            }

            await setValidClaimLinkForBoost(
                boostUri,
                challenge,
                normalizedClaimLinkSA,
                options,
                profile.profileId
            );

            return { boostUri: boostUri, challenge };
        }),
    claimBoostWithLink: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/claim',
                tags: ['Boosts'],
                summary: 'Claim a boost using a claim link',
                description: 'Claims a boost using a claim link, including a challenge',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ boostUri: z.string(), challenge: z.string() }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, challenge } = input;

            const [claimLinkSA, boost, generatorProfileId] = await Promise.all([
                getClaimLinkSAInfoForBoost(boostUri, challenge),
                getBoostByUri(boostUri),
                getClaimLinkGeneratorProfileId(boostUri, challenge),
            ]);

            if (!claimLinkSA) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Challenge not found for ${boostUri}`,
                });
            }

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isBoostViewableByClaimLink(boost))) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'This boost is not currently viewable by claim link.',
                });
            }

            const boostOwner = await getBoostOwner(boost);

            if (!boostOwner) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost owner' });
            }

            // Use the generator's profile for SA lookup if available, fall back to boost owner
            const saOwner = generatorProfileId
                ? ((await getProfileByProfileId(generatorProfileId)) ?? boostOwner)
                : boostOwner;

            const saOwnerProfile: ProfileType =
                'profileId' in saOwner ? saOwner : getBoostOwnerProfile(saOwner);
            const saOwnerIssuer =
                'profileId' in saOwner
                    ? { type: 'profile' as const, profile: saOwner }
                    : saOwner.type === 'profile'
                      ? { type: 'profile' as const, profile: saOwner.profile }
                      : {
                            type: 'appStoreListing' as const,
                            listing: saOwner.listing,
                            ownerProfile: saOwner.ownerProfile,
                        };

            const signingAuthority = await getSigningAuthorityForUserByName(
                saOwnerProfile,
                claimLinkSA.endpoint,
                claimLinkSA.name
            );

            if (!signingAuthority) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });
            }

            // Log DELIVERED activity first to get activityId for chaining (outside try for catch access)
            const activityId = await logCredentialSent({
                actorProfileId: saOwnerProfile.profileId,
                recipientType: 'profile',
                recipientIdentifier: profile.profileId,
                recipientProfileId: profile.profileId,
                boostUri,
                source: 'claimLink',
            });

            try {
                const sentBoostUri = await issueClaimLinkBoost(
                    boost,
                    ctx.domain,
                    saOwnerIssuer,
                    profile,
                    signingAuthority
                );

                // Log CLAIMED immediately since autoAcceptCredential: true in issueClaimLinkBoost
                await logCredentialClaimed({
                    activityId,
                    actorProfileId: saOwnerProfile.profileId,
                    recipientType: 'profile',
                    recipientIdentifier: profile.profileId,
                    recipientProfileId: profile.profileId,
                    boostUri,
                    credentialUri: sentBoostUri,
                    source: 'claimLink',
                });

                try {
                    await useClaimLinkForBoost(boostUri, challenge);
                } catch (e) {
                    console.error('Problem using useClaimLinkForBoost', e);
                }

                return sentBoostUri;
            } catch (e) {
                console.error('Unable to issueClaimLinkBoost', e);

                // Log FAILED activity - the activityId was already generated above
                try {
                    await logCredentialFailed({
                        activityId,
                        actorProfileId: saOwnerProfile.profileId,
                        recipientType: 'profile',
                        recipientIdentifier: profile.profileId,
                        recipientProfileId: profile.profileId,
                        boostUri,
                        source: 'claimLink',
                        metadata: {
                            error: e instanceof Error ? e.message : 'Unknown error',
                        },
                    });
                } catch (logError) {
                    console.error('Failed to log credential failed activity:', logError);
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not issue boost with claim link.',
                });
            }
        }),

    makeBoostParent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/make-parent',
                tags: ['Boosts'],
                summary: 'Make Boost Parent',
                description: 'This endpoint creates a parent/child relationship between two boosts',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ parentUri: z.string(), childUri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { parentUri, childUri } = input;
            const boosts = await getBoostsByUri([parentUri, childUri]);

            const parentBoost = boosts.find(boost => boost.id === getIdFromUri(parentUri));
            const childBoost = boosts.find(boost => boost.id === getIdFromUri(childUri));

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (!childBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find child boost' });
            }

            if (!(await canProfileCreateChildBoost(profile, parentBoost, childBoost.dataValues))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile can not create children for parent',
                });
            }

            if (!(await isProfileBoostAdmin(profile, childBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own child boost',
                });
            }

            if (
                await isBoostParent(parentBoost, childBoost, {
                    numberOfGenerations: Infinity,
                    direction: 'none',
                })
            ) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Boost is already a parent',
                });
            }

            return setBoostAsParent(parentBoost, childBoost);
        }),

    removeBoostParent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/remove-parent',
                tags: ['Boosts'],
                summary: 'Remove Boost Parent',
                description: 'This endpoint removes a parent/child relationship between two boosts',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ parentUri: z.string(), childUri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { parentUri, childUri } = input;
            const boosts = await getBoostsByUri([parentUri, childUri]);

            const parentBoost = boosts.find(boost => boost.id === getIdFromUri(parentUri));
            const childBoost = boosts.find(boost => boost.id === getIdFromUri(childUri));

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (!childBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find child boost' });
            }

            if (!(await isProfileBoostAdmin(profile, parentBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own parent boost',
                });
            }

            if (!(await isProfileBoostAdmin(profile, childBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own child boost',
                });
            }

            if (!(await isBoostParent(parentBoost, childBoost))) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Boost is already not a parent',
                });
            }

            return removeBoostAsParent(parentBoost, childBoost);
        }),

    sendBoostViaSigningAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/send/via-signing-authority/{profileId}',
                tags: ['Boosts'],
                summary: 'Send a boost to a profile using a signing authority',
                description:
                    'Issues a boost VC to a recipient profile using a specified signing authority and sends it via the network.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                profileId: z.string(),
                boostUri: z.string(),
                signingAuthority: z.object({
                    name: z.string(),
                    endpoint: z.string(),
                }),
                templateData: z.record(z.string(), z.unknown()).optional(),
                options: z
                    .object({
                        skipNotification: z.boolean().default(false).optional(),
                    })
                    .optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, boostUri, signingAuthority, options } = input;

            const resolvedProfileId = await getProfileIdFromString(profileId, ctx.domain);
            if (!resolvedProfileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const normalizedSigningAuthority = {
                ...signingAuthority,
                name: signingAuthority.name.toLowerCase(),
            };

            const boost = await getBoostByUri(boostUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            const targetProfile = await getProfileByProfileId(resolvedProfileId);

            if (!targetProfile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });
            }

            let unsignedVc: UnsignedVC;

            try {
                let boostJsonString = boost.dataValues.boost;
                const allowAutoAppendEvidence = shouldAutoAppendTemplateEvidence(boostJsonString);

                if (input.templateData && Object.keys(input.templateData).length > 0) {
                    boostJsonString = renderBoostTemplate(
                        boostJsonString,
                        input.templateData as Record<string, unknown>
                    );
                }

                unsignedVc = parseRenderedTemplate<UnsignedVC>(boostJsonString);
                appendTemplateEvidenceToCredential(
                    unsignedVc,
                    input.templateData as Record<string, unknown> | undefined,
                    allowAutoAppendEvidence
                );

                if (isVC2Format(unsignedVc)) {
                    unsignedVc.validFrom = new Date().toISOString();
                } else {
                    unsignedVc.issuanceDate = new Date().toISOString();
                }
                unsignedVc.issuer = { id: getDidWeb(ctx.domain, profile.profileId) };

                if (Array.isArray(unsignedVc.credentialSubject)) {
                    unsignedVc.credentialSubject = unsignedVc.credentialSubject.map(subject => ({
                        ...subject,
                        id: getDidWeb(ctx.domain, targetProfile.profileId),
                    }));
                } else {
                    unsignedVc.credentialSubject = {
                        ...unsignedVc.credentialSubject,
                        id: getDidWeb(ctx.domain, targetProfile.profileId),
                    };
                }
                if (unsignedVc?.type?.includes('BoostCredential')) unsignedVc.boostId = boostUri;
                // Inject OBv3 skill alignments based on boost's framework/skills
                await injectObv3AlignmentsIntoCredentialForBoost(unsignedVc, boost, ctx.domain);
            } catch (e) {
                console.error('Failed to parse boost', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to parse boost',
                });
            }

            const sa = await getSigningAuthorityForUserByName(
                profile,
                normalizedSigningAuthority.endpoint,
                normalizedSigningAuthority.name
            );
            if (!sa) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });
            }

            let credential: IssuedCredential;
            try {
                credential = await issueCredentialWithSigningAuthority(
                    { type: 'profile', profile },
                    await appendBitstringStatusListEntries(
                        unsignedVc,
                        profile.profileId,
                        ctx.domain
                    ),
                    sa,
                    ctx.domain
                );
            } catch (e) {
                console.error('Failed to issue VC with signing authority', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not issue VC with signing authority',
                });
            }

            let skipNotification = profile.profileId === targetProfile.profileId;
            if (options?.skipNotification) skipNotification = options?.skipNotification;

            return sendBoost({
                from: { type: 'profile', profile },
                to: targetProfile,
                boost,
                credential,
                domain: ctx.domain,
                skipNotification,
            });
        }),
});

export type BoostsRouter = typeof boostsRouter;
