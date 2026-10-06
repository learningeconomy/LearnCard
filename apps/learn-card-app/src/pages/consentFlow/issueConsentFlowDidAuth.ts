import type { UnsignedVP } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { isLearnCardAiPassportContractUri } from 'learn-card-base/constants/aiPassport';

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

const requireAiPassportChallenge = (
    returnTo: QueryParam,
    challenged: boolean,
    contractUri?: string
): void => {
    if (!challenged && isLearnCardAiPassportContractUri(contractUri)) {
        throw new Error(
            'AI Passport requires challenge-based authentication; refresh and sign in again'
        );
    }
    if (typeof returnTo !== 'string' || challenged) return;
    let origin: string;
    try {
        origin = new URL(returnTo).origin;
    } catch {
        return; // Relative navigation is handled by the caller.
    }
    if (origin === new URL(networkStore.get.aiServiceUrl()).origin) {
        throw new Error(
            'AI Passport requires challenge-based authentication; refresh and sign in again'
        );
    }
};

export const getConsentFlowContractRedirect = ({
    challenge,
    contractRedirectUrl,
    contractUri,
    domain,
    returnTo,
}: {
    challenge?: QueryParam;
    contractRedirectUrl?: string;
    contractUri?: string;
    domain?: QueryParam;
    returnTo?: QueryParam;
}): string | undefined => {
    const challenged = validateConsentFlowDidAuthParams(challenge, domain);
    if (typeof returnTo === 'string') requireAiPassportChallenge(returnTo, challenged, contractUri);
    if (contractRedirectUrl)
        requireAiPassportChallenge(contractRedirectUrl, challenged, contractUri);
    return challenged ? undefined : contractRedirectUrl;
};

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
    const challenged = validateConsentFlowDidAuthParams(challenge, domain);
    requireAiPassportChallenge(returnTo, challenged, contractUri);

    const redirect = new URL(returnTo);

    if (redirect.protocol !== 'http:' && redirect.protocol !== 'https:') {
        throw new Error('Invalid consent redirect URL');
    }

    if (typeof challenge === 'string' && typeof domain === 'string') {
        const aiPassportOrigin = new URL(networkStore.get.aiServiceUrl()).origin;
        let audienceOrigin: string;

        try {
            audienceOrigin = new URL(domain).origin;
        } catch {
            throw new Error('Invalid DID Auth domain');
        }

        if (redirect.origin !== aiPassportOrigin || audienceOrigin !== aiPassportOrigin) {
            throw new Error('DID Auth callback must use the configured AI Passport origin');
        }
    }
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

    if (
        typeof challenge === 'string' &&
        redirect.searchParams.get('response_mode') === 'fragment'
    ) {
        const fragment = new URLSearchParams(redirect.hash.slice(1));

        fragment.set('vp', vp);
        redirect.hash = fragment.toString();
    } else {
        redirect.searchParams.set('vp', vp);
    }

    return redirect.toString();
};
