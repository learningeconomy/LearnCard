import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC } from '@learncard/types';
import { SigningAuthorityForUserType } from 'types/profile';
import { ProfileInstance } from '@models';

export async function issueCredentialWithSigningAuthority(owner: ProfileInstance, credential: UnsignedVC, signingAuthorityForUser: SigningAuthorityForUserType) {
    try {
        console.log(
            'Issuing Credential with SA',
            JSON.stringify({
                credential,
                signingAuthorityForUser
            })
        );
        //const learnCard = await getDidWebLearnCard();

        //const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        const response = await fetch(`${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //'Authorization': `Bearer ${didJwt}`,
            },
            body: JSON.stringify({
                credential,
                signingAuthority: {
                    ownerDid: owner.did,
                    name: signingAuthorityForUser.relationship.name,
                    did: signingAuthorityForUser.relationship.did
                }
            }),
        });
        const res = await response.json();

        if (!res) {
            throw new Error(res);
        }
        return res;
    } catch (error) {
        console.error('SA Helpers - Error While Sending:', error);
    }
}