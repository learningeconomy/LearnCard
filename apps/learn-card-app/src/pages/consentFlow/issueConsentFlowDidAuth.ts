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

export class AiPassportReauthenticationRequired extends Error {
    constructor() {
        super('AI Passport requires challenge-based authentication; refresh and sign in again');
        this.name = 'AiPassportReauthenticationRequired';
    }
}

// Local navigation never transports an authentication presentation. Protocol-relative
// URLs and backslashes are excluded because browsers can resolve them off-origin.
const isLocalNavigation = (destination: string): boolean =>
    destination.startsWith('/') &&
    !destination.startsWith('//') &&
    !destination.includes('\\') &&
    Array.from(destination).every(character => character.charCodeAt(0) > 32);

const getAiPassportOrigin = (): string | undefined => {
    try {
        const url = new URL(networkStore.get.aiServiceUrl());
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : undefined;
    } catch {
        // Allowed TODO_* tenant placeholders must not break unrelated integrations.
        return undefined;
    }
};

const validateDestination = (
    destination: QueryParam,
    challenged: boolean,
    contractUri?: string,
    domain?: QueryParam
): void => {
    if (typeof destination !== 'string' || !destination) return;
    if (isLocalNavigation(destination) && !challenged) return;
    // Contract identity still protects external AI Passport callbacks even when
    // tenant configuration is missing or malformed.
    if (!challenged && isLearnCardAiPassportContractUri(contractUri)) {
        throw new AiPassportReauthenticationRequired();
    }
    let redirect: URL;
    try {
        redirect = new URL(destination);
    } catch {
        if (challenged) throw new Error('Invalid consent redirect URL');
        return; // Preserve unrelated relative contract navigation.
    }
    if (redirect.protocol !== 'http:' && redirect.protocol !== 'https:') {
        if (challenged) throw new Error('Invalid consent redirect URL');
        return;
    }
    const aiPassportOrigin = getAiPassportOrigin();
    if (!challenged && redirect.origin === aiPassportOrigin) {
        throw new AiPassportReauthenticationRequired();
    }
    if (challenged) {
        let audienceOrigin: string;
        try {
            audienceOrigin = new URL(domain as string).origin;
        } catch {
            throw new Error('Invalid DID Auth domain');
        }
        if (
            !aiPassportOrigin ||
            redirect.origin !== aiPassportOrigin ||
            audienceOrigin !== aiPassportOrigin
        ) {
            throw new Error('DID Auth callback must use the configured AI Passport origin');
        }
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
    validateDestination(returnTo, challenged, contractUri, domain);
    // Challenged flows suppress this server-provided override and use returnTo.
    if (!challenged) validateDestination(contractRedirectUrl, false, contractUri);
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
    validateDestination(returnTo, challenged, contractUri, domain);
    // Callers normally navigate local paths themselves; never generate a proof for one.
    if (isLocalNavigation(returnTo) && !challenged) return returnTo;
    const redirect = new URL(returnTo);
    if (redirect.protocol !== 'http:' && redirect.protocol !== 'https:') {
        throw new Error('Invalid consent redirect URL');
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
