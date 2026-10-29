import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    CredentialSharePreviewValidator,
    PublishCredentialSharePreviewValidator,
} from '@learncard/types';
import {
    createCredentialSharePreview,
    deleteCredentialSharePreview,
    getCredentialSharePreview,
} from '@accesslayer/credential-share-previews';
import { t, profileRoute, openRoute } from '@routes';

const Id = z.string().uuid();
const previewOutput = CredentialSharePreviewValidator;
const openapi = (method: 'GET' | 'POST', path: `/${string}`, summary: string) => ({
    method,
    path,
    summary,
    tags: ['Credential Share Previews'],
});

export const credentialSharePreviewsRouter = t.router({
    publish: profileRoute
        .meta({
            openapi: {
                ...openapi(
                    'POST',
                    '/credential-share-previews',
                    'Publish credential share preview'
                ),
                protect: true,
            },
        })
        .input(PublishCredentialSharePreviewValidator)
        .output(Id)
        .mutation(async ({ ctx, input }) => {
            const id = await createCredentialSharePreview(ctx.user.profile.profileId, input);
            if (!id) throw new TRPCError({ code: 'NOT_FOUND' });
            return id;
        }),
    delete: profileRoute
        .meta({
            openapi: {
                ...openapi(
                    'POST',
                    '/credential-share-previews/{id}/delete',
                    'Delete owned credential share preview'
                ),
                protect: true,
            },
        })
        .input(z.object({ id: Id }).strict())
        .output(z.boolean())
        .mutation(({ ctx, input }) =>
            deleteCredentialSharePreview(ctx.user.profile.profileId, input.id)
        ),
    get: openRoute
        .meta({
            openapi: openapi(
                'GET',
                '/credential-share-previews/{id}',
                'Get public credential share preview'
            ),
        })
        .input(z.object({ id: Id, shareUri: z.string().min(1).max(4096) }).strict())
        .output(previewOutput)
        .query(async ({ input }) => {
            const preview = await getCredentialSharePreview(input.id, input.shareUri);
            if (!preview) throw new TRPCError({ code: 'NOT_FOUND' });
            return preview;
        }),
});
export type CredentialSharePreviewsRouter = typeof credentialSharePreviewsRouter;
