import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { UnsignedVC, VC, VP, JWE } from '@learncard/types';
import {
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    JWEValidator,
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
} from '@learncard/types';

import { getCredentialUri } from '@helpers/credential.helpers';
import { isBoostViewableByClaimLink } from '@helpers/boost.helpers';

import { t, didAndChallengeRoute, openRoute, resolveProfileFromContextDid } from '@routes';
import { storePresentation } from '@accesslayer/presentation/create';
import { storeCredential } from '@accesslayer/credential/create';
import { getCredentialById } from '@accesslayer/credential/read';
import { getPresentationById } from '@accesslayer/presentation/read';
import { getUriParts } from '@helpers/uri.helpers';
import { getPresentationUri } from '@helpers/presentation.helpers';
import { getBoostById } from '@accesslayer/boost/read';
import { canProfileViewBoost } from '@accesslayer/boost/relationships/read';
import { getCachedStorageByUri, setStorageForUri } from '@cache/storage';
import { isClaimLinkAlreadySetForBoost } from '@cache/claim-links';
import { getContractById } from '@accesslayer/consentflowcontract/read';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';
import { BoostStatus } from 'types/boost';

const isDraftOrProvisionalBoost = (status?: string): boolean =>
    status === BoostStatus.enum.DRAFT || status === BoostStatus.enum.PROVISIONAL;

export const storageRouter = t.router({
    store: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/storage/store',
                tags: ['Storage'],
                summary: 'Store a Credential/Presentation',
                description:
                    'This endpoint stores a credential/presentation, returning a uri that can be used to resolve it',
            },
            requiredScope: 'storage:write',
        })
        .input(
            z.object({
                item: UnsignedVCValidator.or(VCValidator).or(VPValidator).or(JWEValidator),
                type: z.enum(['credential', 'presentation']).optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { item, type } = input;

            const isVP = type === 'presentation' || (await VPValidator.spa(item)).success;

            if (isVP && type !== 'credential') {
                const instance = await storePresentation(item as VP | JWE);

                const uri = getPresentationUri(instance.id, ctx.domain);

                await setStorageForUri(uri, item);

                return uri;
            }

            const instance = await storeCredential(item as UnsignedVC | VC | JWE);

            const uri = getCredentialUri(instance.id, ctx.domain);

            await setStorageForUri(uri, item);

            return uri;
        }),

    resolve: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/storage/resolve',
                tags: ['Storage'],
                summary: 'Resolves a URI to a Credential/Presentation',
                description:
                    'This endpoint stores a credential/presentation, returning a uri that can be used to resolve it',
            },
            requiredScope: 'storage:read',
        })
        .input(z.object({ uri: z.string(), challenge: z.string().optional() }))
        .output(
            UnsignedVCValidator.or(VCValidator)
                .or(VPValidator)
                .or(JWEValidator)
                .or(ConsentFlowContractValidator)
                .or(ConsentFlowTermsValidator)
        )
        .query(async ({ input, ctx }) => {
            const { uri, challenge } = input;
            const { domain: localDomain } = ctx;

            const { id, type, method, domain: uriDomain } = getUriParts(uri, true);

            // Check if this is an external URI that needs to be fetched from another instance
            const normalizedUriDomain = uriDomain.replace('/trpc', '').replace(/%3A/g, ':');
            const normalizedLocalDomain = localDomain.replace('/trpc', '').replace(/%3A/g, ':');
            const isLocalUri = !uriDomain || normalizedUriDomain === normalizedLocalDomain;

            if (method === 'network' && !isLocalUri) {
                // Fetch from external brain-service
                const isLocal = uriDomain.includes('localhost');
                const baseUrl = `http${isLocal ? '' : 's'}://${uriDomain
                    .replace(/%3A/g, ':')
                    .replace('/trpc', '')}`;
                const response = await fetch(
                    `${baseUrl}/api/storage/resolve?uri=${encodeURIComponent(uri)}${
                        challenge ? `&challenge=${encodeURIComponent(challenge)}` : ''
                    }`,
                    {
                        signal: AbortSignal.timeout(15000), // 15 second timeout
                    }
                );

                if (!response.ok) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `External resource not found: ${uri}`,
                    });
                }

                return await response.json();
            }

            const cachedResponse = await getCachedStorageByUri(uri);

            if (cachedResponse) {
                if (type === 'boost') {
                    const boostInstance = await getBoostById(id);
                    if (!boostInstance) {
                        throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found' });
                    }

                    if (!ctx.user && isDraftOrProvisionalBoost(boostInstance.status)) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: 'Boost is not publicly accessible.',
                        });
                    }

                    const profile = await resolveProfileFromContextDid(ctx.user?.did, localDomain);
                    const canView = Boolean(
                        profile && (await canProfileViewBoost(profile, boostInstance))
                    );
                    const isViewableByClaimLink = await isBoostViewableByClaimLink(boostInstance);

                    if (!isViewableByClaimLink && !canView) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: 'Boost is not viewable by claim link.',
                        });
                    }

                    if (
                        isViewableByClaimLink &&
                        !canView &&
                        (!challenge || !(await isClaimLinkAlreadySetForBoost(uri, challenge)))
                    ) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: 'A valid claim challenge is required to view this boost.',
                        });
                    }
                }

                return cachedResponse;
            }

            if (type === 'credential') {
                const instance = await getCredentialById(id);

                if (!instance) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
                }

                const credential = JSON.parse(instance.credential);

                await setStorageForUri(uri, credential);

                return credential;
            }

            if (type === 'presentation') {
                const instance = await getPresentationById(id);

                if (!instance) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Presentation not found' });
                }

                const presentation = JSON.parse(instance.presentation);

                await setStorageForUri(uri, presentation);

                return presentation;
            }

            if (type === 'boost') {
                const instance = await getBoostById(id);

                if (!instance) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found' });
                }

                if (!ctx.user && isDraftOrProvisionalBoost(instance.status)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Boost is not publicly accessible.',
                    });
                }

                const profile = await resolveProfileFromContextDid(ctx.user?.did, localDomain);
                const canView = Boolean(profile && (await canProfileViewBoost(profile, instance)));
                const isViewableByClaimLink = await isBoostViewableByClaimLink(instance);

                if (!isViewableByClaimLink && !canView) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Boost is not viewable by claim link.',
                    });
                }

                if (
                    isViewableByClaimLink &&
                    !canView &&
                    (!challenge || !(await isClaimLinkAlreadySetForBoost(uri, challenge)))
                ) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'A valid claim challenge is required to view this boost.',
                    });
                }

                const boost = JSON.parse(instance.boost);

                await setStorageForUri(uri, boost);

                return boost;
            }

            if (type === 'contract') {
                const instance = await getContractById(id);

                if (!instance) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
                }

                const contract = instance.contract;

                await setStorageForUri(uri, contract);

                return contract;
            }

            if (type === 'terms') {
                const relationship = await getContractTermsById(id);

                if (!relationship) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
                }

                const terms = relationship.terms.terms;

                await setStorageForUri(uri, terms);

                return terms;
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unknown URI type',
            });
        }),
});
export type StorageRouter = typeof storageRouter;
