import dotenv from 'dotenv';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC, VCValidator, JWEValidator, VC, JWE } from '@learncard/types';
import { SigningAuthorityForUserType } from 'types/profile';
import { ProfileInstance } from '@models';
import { getDidWeb } from '@helpers/did.helpers';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 12_000;

const _mockIssueCredentialWithSigningAuthority = async (credential: UnsignedVC) => {
    const learnCard = await getLearnCard();
    return learnCard.invoke.issueCredential({ ...credential, issuer: learnCard.id.did() });
};

export async function issueCredentialWithSigningAuthority(
    owner: ProfileInstance,
    credential: UnsignedVC,
    signingAuthorityForUser: SigningAuthorityForUserType,
    encrypt: boolean = true
): Promise<VC | JWE> {
    try {
        console.log(
            'Issuing Credential with SA',
            JSON.stringify({
                credential,
                signingAuthorityForUser,
            })
        );

        if (IS_TEST_ENVIRONMENT) {
            console.log('✅ IS TEST ENVIRONMENT _mockIssueCredentialWithSigningAuthority');
            return _mockIssueCredentialWithSigningAuthority(credential);
        }

        const learnCard = await getDidWebLearnCard();

        const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;
        console.log('Issuer Endpoint: ', issuerEndpoint);

        const ownerDid = getDidWeb(
            process.env.DOMAIN_NAME ?? 'network.learncard.com',
            owner.profileId
        );

        const encryption = encrypt
            ? {
                  recipients: [learnCard.id.did()],
              }
            : undefined;

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
        console.log('RESPONSE: ', res);

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