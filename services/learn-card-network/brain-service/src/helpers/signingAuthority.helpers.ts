import dotenv from 'dotenv';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { VCValidator, JWEValidator, type UnsignedVC, type VC, type JWE } from '@learncard/types';
import type { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { getDidWeb } from '@helpers/did.helpers';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 21_000;

const _mockIssueCredentialWithSigningAuthority = async (credential: UnsignedVC) => {
    const learnCard = await getLearnCard();
    return learnCard.invoke.issueCredential({ ...credential, issuer: learnCard.id.did() });
};

export async function issueCredentialWithSigningAuthority(
    owner: ProfileType,
    credential: UnsignedVC,
    signingAuthorityForUser: SigningAuthorityForUserType,
    domain: string,
    encrypt = true
): Promise<VC | JWE> {
    try {
        if (!IS_TEST_ENVIRONMENT) {
            console.log(
                'Issuing Credential with SA',
                JSON.stringify({
                    credential,
                    signingAuthorityForUser,
                })
            );
        }

        if (IS_TEST_ENVIRONMENT) {
            return await _mockIssueCredentialWithSigningAuthority(credential);
        }

        const learnCard = await getDidWebLearnCard();

        const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;

        if (!IS_TEST_ENVIRONMENT) console.log('Issuer Endpoint:', issuerEndpoint);

        const ownerDid = getDidWeb(domain ?? 'network.learncard.com', owner.profileId);

        const encryption = encrypt ? { recipients: [learnCard.id.did()] } : undefined;

        // Create an AbortController instance and get the signal
        const controller = new AbortController();
        const { signal } = controller;

        // Set a timeout to abort the fetch request
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(issuerEndpoint, {
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

        clearTimeout(timeoutId);

        const res = await response.json();

        if (!IS_TEST_ENVIRONMENT) console.log('RESPONSE:', res);

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
}
