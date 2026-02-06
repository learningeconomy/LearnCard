import dotenv from 'dotenv';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC, VCValidator, JWEValidator, VC, JWE } from '@learncard/types';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { getDidWeb } from '@helpers/did.helpers';
import { trace, traceCrypto, traceHttp } from '@tracing';

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
    return trace('signing-authority', 'issueCredentialWithSigningAuthority', async () => {
        try {

            if (IS_TEST_ENVIRONMENT) {
                return await _mockIssueCredentialWithSigningAuthority(credential);
            }

            const learnCard = await trace('init', 'getDidWebLearnCard', () => getDidWebLearnCard());

            const didJwt = await traceCrypto('getDidAuthVp', () =>
                learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' })
            );

            const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;

            const subjectId = Array.isArray(credential?.credentialSubject)
                ? credential?.credentialSubject[0]?.id
                : credential?.credentialSubject?.id;

            const ownerDid =
                ownerDidOverride ?? getDidWeb(domain ?? 'network.learncard.com', owner.profileId);

            const encryption = encrypt
                ? {
                      recipients: [learnCard.id.did(), ...(subjectId ? [subjectId] : [])],
                  }
                : undefined;

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
                            name: signingAuthorityForUser.relationship.name,
                            did: signingAuthorityForUser.relationship.did,
                        },
                        encryption,
                    }),
                    signal,
                });

                return resp;
            }, { endpoint: issuerEndpoint });

            clearTimeout(timeoutId);

            const res = await trace('internal', 'parseResponse', () => response.json());

            if (!res || res?.code === 'INTERNAL_SERVER_ERROR') {
                throw new Error(res);
            }

            if (encryption) {
                const validationResult = await JWEValidator.spa(res);

                if (!validationResult.success)
                    throw new Error('Signing Authority returned malformed JWE');

                return validationResult.data;
            } else {
                const validationResult = await VCValidator.spa(res);

                if (!validationResult.success)
                    throw new Error('Signing Authority returned malformed VC');

                return validationResult.data;
            }
        } catch (error) {
            console.error('SA Helpers - Error While Sending:', error);
            throw new Error('SA Helpers - Error While Sending');
        }
    }, { owner: owner.profileId, saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
}
