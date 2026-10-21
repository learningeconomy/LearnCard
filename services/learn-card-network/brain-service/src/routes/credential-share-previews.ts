import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CredentialSharePreviewValidator } from '@learncard/types';
import {
    createCredentialSharePreview,
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
        .input(CredentialSharePreviewValidator)
        .output(Id)
        .mutation(async ({ input }) => {
            const id = randomUUID();
            await createCredentialSharePreview(id, input);
            return id;
        }),
    get: openRoute
        .meta({
            openapi: openapi(
                'GET',
                '/credential-share-previews/{id}',
                'Get public credential share preview'
            ),
        })
        .input(z.object({ id: Id }).strict())
        .output(previewOutput)
        .query(async ({ input }) => {
            const preview = await getCredentialSharePreview(input.id);
            if (!preview) throw new TRPCError({ code: 'NOT_FOUND' });
            return preview;
        }),
});
export type CredentialSharePreviewsRouter = typeof credentialSharePreviewsRouter;
