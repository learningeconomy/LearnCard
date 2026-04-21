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
            const logContext = {
                ownerDid: signingAuthority.ownerDid,
                saName: signingAuthority.name,
                saDid: signingAuthority.did,
                credentialType: credential?.type,
                encrypt: !!encryption,
            };

            try {
                console.log('[SSS /credentials/issue] Request received', logContext);

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

                console.log('[SSS /credentials/issue] Resolving SA LearnCard...');
                const learnCard = await getSigningAuthorityLearnCard(
                    signingAuthority.ownerDid,
                    signingAuthority.name
                );
                const saDid = learnCard.id.did();
                console.log('[SSS /credentials/issue] SA LearnCard resolved, DID:', saDid);

                // We always want a fresh did web cache here
                await learnCard.invoke.clearDidWebCache();

                if (typeof credential.issuer === 'object' && credential.issuer !== null) {
                    credential.issuer.id = saDid;
                } else {
                    credential.issuer = saDid;
                }

                const verificationMethod = saDid.startsWith('did:web')
                    ? `${saDid}#${signingAuthority.name}`
                    : undefined;

                console.log('[SSS /credentials/issue] Issuing credential...', {
                    verificationMethod,
                    issuer: credential.issuer,
                });
                const issuedCredential = await learnCard.invoke.issueCredential(credential, {
                    ...options,
                    verificationMethod,
                });
                console.log('[SSS /credentials/issue] Credential issued successfully');

                if (encryption) {
                    const recipients = [saDid, ...encryption.recipients];
                    console.log(
                        '[SSS /credentials/issue] Encrypting JWE for recipients:',
                        recipients
                    );
                    const jwe = await learnCard.invoke.createDagJwe(issuedCredential, [
                        ...recipients,
                    ]);
                    console.log('[SSS /credentials/issue] JWE created successfully');
                    return jwe;
                }

                return issuedCredential;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                const errStack = error instanceof Error ? error.stack : undefined;
                console.error('[SSS /credentials/issue] Failed:', {
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
});
export type ProfilesRouter = typeof credentialsRouter;
