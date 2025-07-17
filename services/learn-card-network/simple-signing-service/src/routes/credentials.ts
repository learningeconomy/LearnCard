import { TRPCError } from '@trpc/server';
import { isVC2Format } from '@learncard/helpers';
import { VCValidator, JWEValidator } from '@learncard/types';

import { IssueEndpointValidator } from 'types/credentials';

import { t, authorizedDidRoute } from '@routes';
import { getSigningAuthorityLearnCard } from '@helpers/learnCard.helpers';

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

                // We always want a fresh did web cache here
                await learnCard.invoke.clearDidWebCache();

                credential.issuer = learnCard.id.did();
                const verificationMethod = learnCard.id.did().startsWith('did:web')
                    ? `${learnCard.id.did()}#${signingAuthority.name}`
                    : undefined;

                const issuedCredential = await learnCard.invoke.issueCredential(credential, {
                    ...options,
                    verificationMethod,
                });

                if (encryption) {
                    const jwe = await learnCard.invoke.createDagJwe(issuedCredential, [
                        learnCard.id.did(),
                        ...encryption.recipients,
                    ]);
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
});
export type ProfilesRouter = typeof credentialsRouter;
