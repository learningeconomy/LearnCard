import dotenv from 'dotenv';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC, VCValidator, JWEValidator, VC, JWE } from '@learncard/types';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { getDidWeb } from '@helpers/did.helpers';
import { trace, traceCrypto, traceHttp } from '@tracing';
import { PerfTracker } from '@helpers/perf';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 21_000;

const _mockIssueCredentialWithSigningAuthority = async (credential: UnsignedVC): Promise<VC> => {
    const learnCard = await getLearnCard();
    return learnCard.invoke.issueCredential({ ...credential, issuer: learnCard.id.did() });
};

export async function issueCredentialWithSigningAuthority(
    owner: ProfileType,
    credential: UnsignedVC,
    signingAuthorityForUser: SigningAuthorityForUserType,
    domain: string,
    encrypt: boolean = true,
    ownerDidOverride?: string
): Promise<VC | JWE> {
    const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;
    const saName = signingAuthorityForUser.relationship.name;
    const saDid = signingAuthorityForUser.relationship.did;
    const ownerDid =
        ownerDidOverride ?? getDidWeb(domain ?? 'network.learncard.com', owner.profileId);

    const logContext = {
        owner: owner.profileId,
        ownerDid,
        saName,
        saDid,
        issuerEndpoint,
        encrypt,
    };

    return trace('signing-authority', 'issueCredentialWithSigningAuthority', async () => {
        const perf = new PerfTracker('issueCredentialWithSigningAuthority');

        try {

            if (IS_TEST_ENVIRONMENT) {
                return await _mockIssueCredentialWithSigningAuthority(credential);
            }

            console.log('[SA Helper] Initiating credential issuance', logContext);

            const learnCard = await trace('init', 'getDidWebLearnCard', () => getDidWebLearnCard());
            perf.mark('initDid');

            const brainDid = learnCard.id.did();
            console.log('[SA Helper] Brain DID resolved:', brainDid);

            const didJwt = await traceCrypto('getDidAuthVp', () =>
                learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' })
            );
            perf.mark('didAuthVp');

            if (!didJwt) {
                console.error('[SA Helper] Failed to generate DID Auth VP - got falsy value');
            }

            const subjectId = Array.isArray(credential?.credentialSubject)
                ? credential?.credentialSubject[0]?.id
                : credential?.credentialSubject?.id;

            const encryption = encrypt
                ? {
                      recipients: [brainDid, ...(subjectId ? [subjectId] : [])],
                  }
                : undefined;

            console.log('[SA Helper] Request details:', {
                subjectId,
                encryptionRecipients: encryption?.recipients,
                credentialType: credential?.type,
            });

            // Create an AbortController instance and get the signal
            const controller = new AbortController();
            const { signal } = controller;

            // Set a timeout to abort the fetch request
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

            const response = await traceHttp('fetch-lca-api', async () => {
                const resp = await fetch(issuerEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${didJwt}`,
                    },
                    body: JSON.stringify({
                        credential,
                        signingAuthority: {
                            ownerDid,
                            name: saName,
                            did: saDid,
                        },
                        encryption,
                    }),
                    signal,
                });

                return resp;
            }, { endpoint: issuerEndpoint });

            clearTimeout(timeoutId);

            perf.mark('http');

            console.log('[SA Helper] LCA-API response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[SA Helper] LCA-API returned non-OK response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody,
                    ...logContext,
                });
                throw new Error(
                    `LCA-API returned ${response.status}: ${errorBody}`
                );
            }

            const res = await trace('internal', 'parseResponse', () => response.json());
            perf.mark('parse');

            if (!res || res?.code === 'INTERNAL_SERVER_ERROR') {
                console.error('[SA Helper] LCA-API returned error in body:', JSON.stringify(res));
                throw new Error(
                    `LCA-API error response: ${JSON.stringify(res)}`
                );
            }

            if (encryption) {
                const validationResult = await JWEValidator.spa(res);

                if (!validationResult.success) {
                    console.error('[SA Helper] JWE validation failed:', validationResult.error);
                    throw new Error('Signing Authority returned malformed JWE');
                }

                perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
                return validationResult.data;
            } else {
                const validationResult = await VCValidator.spa(res);

                if (!validationResult.success) {
                    console.error('[SA Helper] VC validation failed:', validationResult.error);
                    throw new Error('Signing Authority returned malformed VC');
                }

                perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
                return validationResult.data;
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const errStack = error instanceof Error ? error.stack : undefined;
            perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint, error: errMsg });
            console.error('[SA Helper] issueCredentialWithSigningAuthority failed:', {
                error: errMsg,
                stack: errStack,
                ...logContext,
            });
            throw error;
        }
    }, { owner: owner.profileId, saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
}
