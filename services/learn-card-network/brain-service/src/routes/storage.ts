import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    UnsignedVC,
    VC,
    VP,
    JWE,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    JWEValidator,
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
} from '@learncard/types';

import { getCredentialUri } from '@helpers/credential.helpers';

import { t, didAndChallengeRoute, openRoute } from '@routes';
import { storePresentation } from '@accesslayer/presentation/create';
import { storeCredential } from '@accesslayer/credential/create';
import { getCredentialById } from '@accesslayer/credential/read';
import { getPresentationById } from '@accesslayer/presentation/read';
import { getUriParts } from '@helpers/uri.helpers';
import { getPresentationUri } from '@helpers/presentation.helpers';
import { getBoostById, getBoostByUri } from '@accesslayer/boost/read';
import { getCachedStorageByUri, setStorageForUri } from '@cache/storage';
import { getContractById } from '@accesslayer/consentflowcontract/read';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';

const isBoostCredential = (item: any): boolean =>
    !!item &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Array.isArray(item.type) &&
    item.type.includes('BoostCredential');

const getSubjects = (credential: any): any[] => {
    if (!credential || typeof credential !== 'object') return [];
    if (Array.isArray(credential.credentialSubject)) return credential.credentialSubject;
    if (credential.credentialSubject) return [credential.credentialSubject];
    return [];
};

const subjectHasAlignments = (subject: any): boolean => {
    if (!subject || typeof subject !== 'object') return false;
    if (Array.isArray(subject?.achievement?.alignment) && subject.achievement.alignment.length > 0)
        return true;
    if (Array.isArray(subject?.alignment) && subject.alignment.length > 0) return true;
    return false;
};

const credentialHasAlignments = (credential: any): boolean =>
    getSubjects(credential).some(subjectHasAlignments);

const getBoostUriFromCredential = (credential: any): string | undefined => {
    const { boostId } = credential ?? {};
    return typeof boostId === 'string' && boostId.length > 0 ? boostId : undefined;
};

const ensureAlignmentsForBoostCredential = async (
    credential: any,
    options: { boostInstance?: any; boostUri?: string }
): Promise<boolean> => {
    if (!isBoostCredential(credential)) return false;
    if (credentialHasAlignments(credential)) return false;

    const { boostInstance: providedInstance, boostUri: providedUri } = options;

    if (providedInstance) {
        await injectObv3AlignmentsIntoCredentialForBoost(credential, providedInstance);
        return true;
    }

    const boostUri = providedUri ?? getBoostUriFromCredential(credential);
    if (!boostUri) return false;

    const instance = await getBoostByUri(boostUri);
    if (!instance) return false;

    await injectObv3AlignmentsIntoCredentialForBoost(credential, instance);
    return true;
};

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
        .input(z.object({ uri: z.string() }))
        .output(
            UnsignedVCValidator.or(VCValidator)
                .or(VPValidator)
                .or(JWEValidator)
                .or(ConsentFlowContractValidator)
                .or(ConsentFlowTermsValidator)
        )
        .query(async ({ input }) => {
            const { uri } = input;

            const { id, type } = getUriParts(uri);

            const cachedResponse = await getCachedStorageByUri(uri);

            if (cachedResponse) {
                let mutated = false;

                if (
                    type === 'credential' &&
                    cachedResponse &&
                    typeof cachedResponse === 'object' &&
                    !Array.isArray(cachedResponse)
                ) {
                    mutated = await ensureAlignmentsForBoostCredential(cachedResponse, {});
                }

                if (
                    type === 'boost' &&
                    cachedResponse &&
                    typeof cachedResponse === 'object' &&
                    !Array.isArray(cachedResponse) &&
                    isBoostCredential(cachedResponse) &&
                    !credentialHasAlignments(cachedResponse)
                ) {
                    const boostInstance = await getBoostById(id);
                    if (boostInstance) {
                        mutated =
                            (await ensureAlignmentsForBoostCredential(cachedResponse, {
                                boostInstance,
                            })) || mutated;
                    }
                }

                if (mutated) await setStorageForUri(uri, cachedResponse as any);

                return cachedResponse;
            }

            if (type === 'credential') {
                const instance = await getCredentialById(id);

                if (!instance) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
                }

                const credential = JSON.parse(instance.credential);

                await ensureAlignmentsForBoostCredential(credential, {});

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

                const boost = JSON.parse(instance.boost);

                if (isBoostCredential(boost)) {
                    await ensureAlignmentsForBoostCredential(boost, {
                        boostInstance: instance,
                    });
                }

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
