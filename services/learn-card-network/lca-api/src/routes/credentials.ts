import { environment } from '@environment';
import { TRPCError } from '@trpc/server';
import { VCValidator, JWEValidator } from '@learncard/types';
import { isVC2Format } from '@learncard/helpers';
import { z } from 'zod';

import { getDeliveryService, getFrom } from '../services/delivery';
import { IssueEndpointValidator } from 'types/credentials';
import { t, authorizedDidRoute, openRoute } from '@routes';
import { getSigningAuthorityLearnCard } from '@helpers/learnCard.helpers';

const ENDORSEMENT_REQUEST_TEMPLATE_ALIAS =
    environment.POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS ?? '';

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
            const logContext = {
                ownerDid: signingAuthority.ownerDid,
                saName: signingAuthority.name,
                saDid: signingAuthority.did,
                credentialType: credential?.type,
                encrypt: !!encryption,
            };

            try {
                console.log('[LCA /credentials/issue] Request received', logContext);

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

                console.log('[LCA /credentials/issue] Resolving SA LearnCard...');
                const learnCard = await getSigningAuthorityLearnCard(
                    signingAuthority.ownerDid,
                    signingAuthority.name
                );
                const saDid = learnCard.id.did();
                console.log('[LCA /credentials/issue] SA LearnCard resolved, DID:', saDid);

                // DIDKit may silently omit unresolvable recipients. Resolve every requested
                // recipient and verify coverage in the resulting JWE before returning it.
                const recipientKeys = encryption
                    ? await Promise.all(
                          [...new Set([saDid, ...encryption.recipients])].map(async did => {
                              const doc = await learnCard.invoke.resolveDid(did).catch(() => null);
                              const keys = doc?.keyAgreement
                                  ?.map(method => {
                                      const id = typeof method === 'string' ? method : method.id;
                                      return id?.startsWith('#') ? `${did}${id}` : id;
                                  })
                                  .filter((id): id is string => Boolean(id));
                              if (!keys?.length) {
                                  throw new TRPCError({
                                      code: 'BAD_REQUEST',
                                      message: `Recipient has no resolvable key-agreement keys: ${did}`,
                                  });
                              }
                              return { did, keys };
                          })
                      )
                    : [];

                // Preserve issuer.name/image if the credential has an object-form issuer
                if (typeof credential.issuer === 'object' && credential.issuer !== null) {
                    credential.issuer.id = saDid;
                } else {
                    credential.issuer = saDid;
                }
                const verificationMethod = saDid.startsWith('did:web')
                    ? `${saDid}#${signingAuthority.name}`
                    : undefined;

                const issuedCredential = await learnCard.invoke
                    .issueCredential(credential, {
                        ...options,
                        verificationMethod,
                    })
                    .catch(async (error: unknown) => {
                        const errorMessage = error instanceof Error ? error.message : String(error);

                        // DIDKit does not expose a structured code for this resolver failure,
                        // so this targeted retry is coupled to its current error message.
                        if (
                            !verificationMethod ||
                            (!errorMessage.includes('Missing verification relationship.') &&
                                !errorMessage.includes('Key mismatch'))
                        ) {
                            throw error;
                        }

                        console.warn(
                            '[LCA /credentials/issue] Refreshing stale did:web document and retrying',
                            { issuer: saDid }
                        );

                        await learnCard.invoke.resolveDid(saDid, { noCache: true });

                        return learnCard.invoke.issueCredential(credential, {
                            ...options,
                            verificationMethod,
                        });
                    });

                console.log('[LCA /credentials/issue] Credential issued successfully');

                if (encryption) {
                    const recipients = [saDid, ...encryption.recipients];
                    console.log(
                        '[LCA /credentials/issue] Encrypting JWE for recipients:',
                        recipients
                    );
                    const jwe = await learnCard.invoke
                        .createDagJwe(issuedCredential, recipients)
                        .catch((error: unknown) => {
                            // An unresolved recipient is a permanent input failure, not an issuer
                            // failure. Return 4xx so callers do not retry it as a transient 5xx.
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: `Unable to encrypt for a recipient: ${
                                    error instanceof Error ? error.message : String(error)
                                }`,
                            });
                        });
                    const encryptedKeys = new Set(
                        (jwe.recipients ?? []).map(recipient => recipient.header?.kid)
                    );
                    for (const { did, keys } of recipientKeys) {
                        if (!keys.some(key => encryptedKeys.has(key))) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: `Recipient has no usable X25519 key-agreement key: ${did}`,
                            });
                        }
                    }
                    console.log('[LCA /credentials/issue] JWE created successfully');
                    return jwe;
                }

                return issuedCredential;
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                const errMsg = error instanceof Error ? error.message : String(error);
                const errStack = error instanceof Error ? error.stack : undefined;
                console.error('[LCA /credentials/issue] Failed:', {
                    error: errMsg,
                    stack: errStack,
                    ...logContext,
                });
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `[/credentials/issue] ${errMsg}`,
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
        .mutation(async ({ input, ctx }) => {
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
                    from: getFrom({ mailbox: 'endorsement', branding: ctx.tenant?.emailBranding }),
                    branding: ctx.tenant?.emailBranding,
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
