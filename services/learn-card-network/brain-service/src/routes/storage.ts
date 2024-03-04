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

import { t, didAndChallengeRoute } from '@routes';
import { storePresentation } from '@accesslayer/presentation/create';
import { storeCredential } from '@accesslayer/credential/create';
import { getCredentialById } from '@accesslayer/credential/read';
import { getPresentationById } from '@accesslayer/presentation/read';
import { getUriParts } from '@helpers/uri.helpers';
import { getPresentationUri } from '@helpers/presentation.helpers';
import { getBoostById } from '@accesslayer/boost/read';
import { getCachedStorageByUri, setStorageForUri } from '@cache/storage';
import { getContractById } from '@accesslayer/consentflowcontract/read';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';

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

    resolve: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/storage/resolve/{uri}',
                tags: ['Storage'],
                summary: 'Resolves a URI to a Credential/Presentation',
                description:
                    'This endpoint stores a credential/presentation, returning a uri that can be used to resolve it',
            },
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

            if (cachedResponse) return cachedResponse;

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
