import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC } from '@learncard/types';
import { SigningAuthorityForUserType } from 'types/profile';
import { ProfileInstance } from '@models';
import { getDidWeb } from '@helpers/did.helpers';

export async function issueCredentialWithSigningAuthority(owner: ProfileInstance, credential: UnsignedVC, signingAuthorityForUser: SigningAuthorityForUserType) {
    try {
        console.log(
            'Issuing Credential with SA',
            JSON.stringify({
                credential,
                signingAuthorityForUser
            })
        );
        const learnCard = await getDidWebLearnCard();

        const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;
        console.log("Issuer Endpoint: ", issuerEndpoint);

        const ownerDid =  getDidWeb(
            process.env.DOMAIN_NAME ?? 'network.learncard.com',
            owner.profileId
        );

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
                    did: signingAuthorityForUser.relationship.did
                }
            }),
        });
        const res = await response.json();
        console.log("RESPONSE: ", res);

        if (!res || res?.code === 'INTERNAL_SERVER_ERROR') {
            throw new Error(res);
        }
        return res;
    } catch (error) {
        console.error('SA Helpers - Error While Sending:', error);
    }
}