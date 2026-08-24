import type { UnsignedVP } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

type QueryParam = string | null | (string | null)[] | undefined;
const validateConsentFlowDidAuthParams = (challenge?: QueryParam, domain?: QueryParam): boolean => {
    const hasChallenge = challenge !== undefined && challenge !== null;
    const hasDomain = domain !== undefined && domain !== null;

    if (hasChallenge !== hasDomain) throw new Error('Incomplete DID Auth request');
    if (
        hasChallenge &&
        (typeof challenge !== 'string' || typeof domain !== 'string' || !challenge || !domain)
    ) {
        throw new Error('Invalid DID Auth request');
    }

    return hasChallenge;
};

export const getConsentFlowContractRedirect = ({
    challenge,
    contractRedirectUrl,
    domain,
}: {
    challenge?: QueryParam;
    contractRedirectUrl?: string;
    domain?: QueryParam;
}): string | undefined =>
    validateConsentFlowDidAuthParams(challenge, domain) ? undefined : contractRedirectUrl;

export const getConsentFlowDidAuthRedirect = async ({
    challenge,
    contractUri,
    domain,
    ownerDid,
    returnTo,
    wallet,
}: {
    challenge?: QueryParam;
    contractUri: string;
    domain?: QueryParam;
    ownerDid: string;
    returnTo: string;
    wallet: BespokeLearnCard;
}): Promise<string> => {
    validateConsentFlowDidAuthParams(challenge, domain);

    const redirect = new URL(returnTo);
    let presentation: UnsignedVP & { contractUri: string };
    let proofOptions: {
        challenge?: string;
        domain?: string;
        proofFormat: 'jwt';
        proofPurpose: 'authentication';
    };

    if (typeof challenge === 'string' && typeof domain === 'string') {
        presentation = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: wallet.id.did(),
            contractUri,
        };
        proofOptions = {
            challenge,
            domain,
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
        };
    } else {
        const unsignedDelegateCredential = wallet.invoke.newCredential({
            type: 'delegate',
            subject: ownerDid,
            access: ['read', 'write'],
        });
        const delegateCredential = await wallet.invoke.issueCredential(unsignedDelegateCredential);

        presentation = {
            ...(await wallet.invoke.newPresentation(delegateCredential)),
            contractUri,
        };
        proofOptions = {
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
        };
        redirect.searchParams.set('did', wallet.id.did());
    }

    const vp = (await wallet.invoke.issuePresentation(presentation, proofOptions)) as unknown;

    if (typeof vp !== 'string') throw new Error('DID Auth presentation must be a JWT');

    redirect.searchParams.set('vp', vp);

    return redirect.toString();
};
