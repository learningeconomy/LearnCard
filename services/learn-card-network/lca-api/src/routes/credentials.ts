import { TRPCError } from '@trpc/server';
import { VCValidator, JWEValidator } from '@learncard/types';
import { isVC2Format } from '@learncard/helpers';
import { z } from 'zod';

import { getDeliveryService, getFrom } from '../services/delivery';
import { IssueEndpointValidator } from 'types/credentials';
import { t, authorizedDidRoute, openRoute } from '@routes';
import { getSigningAuthorityLearnCard } from '@helpers/learnCard.helpers';

const ENDORSEMENT_REQUEST_TEMPLATE_ALIAS = process.env.POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS ?? '';

export const credentialsRouter = t.router({
    issueCredential: authorizedDidRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credentials/issue',
                tags: ['Credentials'],
                summary: 'Issue a Credential',
                description:
                    "This route is used to create a new signing authority that can sign credentials on the current user's behalf",
            },
        })
        .input(IssueEndpointValidator)
        .output(VCValidator.or(JWEValidator))
        .mutation(async ({ input }) => {
            const { credential, options = {}, signingAuthority, encryption } = input;
            try {
                // If incoming credential doesn't have an issuanceDate, default it to right now
                if (
                    credential &&
                    !('issuanceDate' in (credential ?? {})) &&
                    !('validFrom' in (credential ?? {}))
                ) {
                    if (isVC2Format(credential)) {
                        credential.validFrom = new Date().toISOString();
                    } else {
                        credential.issuanceDate = new Date().toISOString();
                    }
                }

                const learnCard = await getSigningAuthorityLearnCard(
                    signingAuthority.ownerDid,
                    signingAuthority.name
                );

                credential.issuer = learnCard.id.did();
                const verificationMethod = learnCard.id.did().startsWith('did:web')
                    ? `${learnCard.id.did()}#${signingAuthority.name}`
                    : undefined;

                const issuedCredential = await learnCard.invoke.issueCredential(credential, {
                    ...options,
                    verificationMethod,
                });

                if (encryption) {
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('recipients', [learnCard.id.did(), ...encryption.recipients]);
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    const jwe = await learnCard.invoke.createDagJwe(issuedCredential, [
                        learnCard.id.did(),
                        ...encryption.recipients,
                    ]);
                    console.log('jwe', JSON.stringify(jwe));
                    return jwe;
                }

                return issuedCredential;
            } catch (error) {
                console.error(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: '[/credentials/issue] Caught error: ' + JSON.stringify(error),
                });
            }
        }),

    sendEndorsementShareLink: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'POST',
                path: '/credentials/send-endorsement-share-link',
                tags: ['Credentials'],
                summary: 'Send an endorsement share link',
                description:
                    "This route is used to send an endorsement share link to a user's email address.",
            },
        })
        .input(
            z.object({
                email: z.string().email(),
                shareLink: z.string(),
                issuer: z.object({
                    name: z.string(),
                }),
                credential: z.object({
                    name: z.string(),
                }),
                message: z.string().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input }) => {
            const { email, shareLink, issuer, credential, message } = input;

            if (!shareLink || !email) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Email and shareLink are required',
                });
            }

            const _email = email.toLowerCase();

            try {
                await getDeliveryService().send({
                    to: _email,
                    templateAlias: ENDORSEMENT_REQUEST_TEMPLATE_ALIAS,
                    templateModel: {
                        recipient: { name: _email },
                        shareLink,
                        message,
                        issuer,
                        credential,
                    },
                    from: getFrom({ mailbox: 'endorsement' }),
                });
                return true;
            } catch (error) {
                console.error('Failed to send verification email:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to send endorsement share link email',
                });
            }
        }),
});
export type ProfilesRouter = typeof credentialsRouter;
