import type { CredentialStoreEvent } from '@learncard/chapi-plugin';
import { VCValidator, type VC, type VP } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import {
    getExchangeUrlFromExchangeRequest,
    isInteractExchangeRequest,
    isVcApiProtocolExchangeRequest,
} from '../../helpers/chapi.helpers';

export class ChapiReceiveError extends Error {
    constructor(public readonly code: 'invalid' | 'request' | 'save' | 'response' | 'account') {
        super(`chapi.receive.${code}`);
    }
}

/** Validate without rewriting signed credential bytes or dropping extra fields. */
export const getReceivedCredentials = (presentation: unknown): VC[] => {
    if (!presentation || typeof presentation !== 'object') throw new ChapiReceiveError('invalid');
    const field = (presentation as VP).verifiableCredential;
    const credentials = Array.isArray(field) ? field : field ? [field] : [];
    if (!credentials.length || credentials.some(vc => !VCValidator.safeParse(vc).success)) {
        throw new ChapiReceiveError('invalid');
    }
    return credentials;
};

const postExchange = async (
    url: string,
    body: unknown,
    signal?: AbortSignal
): Promise<Record<string, unknown>> => {
    // Exit before allocating a timeout/listener or invoking any fetch wrapper.
    // This also stops a second VC-API round if cancellation occurred while the
    // DID-auth presentation was being prepared.
    if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 30_000);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok) throw new ChapiReceiveError('request');
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object') throw new ChapiReceiveError('invalid');
        return result as Record<string, unknown>;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
    }
};

/** Resolve incoming issuance only; never answer credential disclosure queries automatically. */
export const loadChapiPresentation = async (
    wallet: BespokeLearnCard,
    event: CredentialStoreEvent,
    signal?: AbortSignal
): Promise<VP> => {
    if (!isInteractExchangeRequest(event) && !isVcApiProtocolExchangeRequest(event)) {
        getReceivedCredentials(event.credential.data);
        return event.credential.data;
    }
    const url = getExchangeUrlFromExchangeRequest(event);
    if (!url || !/^https?:\/\//i.test(url)) throw new ChapiReceiveError('invalid');
    const isVcApi = isVcApiProtocolExchangeRequest(event);
    let result: Record<string, unknown>;
    if (isVcApi) {
        result = await postExchange(url, {}, signal);
        if (result.verifiablePresentationRequest) {
            const request = result.verifiablePresentationRequest as {
                query?: { type?: string } | { type?: string }[];
                domain?: string;
                challenge?: string;
            };
            const queries = Array.isArray(request.query) ? request.query : [request.query];
            if (
                !queries.length ||
                queries.some(
                    query => !query || !['DIDAuthentication', 'DIDAuth'].includes(query.type ?? '')
                )
            )
                throw new ChapiReceiveError('invalid');
            const vp = await wallet.invoke.getDidAuthVp({
                domain: request.domain,
                challenge: request.challenge,
                proofPurpose: 'authentication',
                verificationMethod: await wallet.invoke.didToVerificationMethod(
                    wallet.id.did('key')
                ),
            });
            result = await postExchange(url, { verifiablePresentation: vp }, signal);
        }
    } else {
        const request = event.credential.data;
        const vp = await wallet.invoke.issuePresentation(
            {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://w3id.org/security/suites/ed25519-2020/v1',
                ],
                type: ['VerifiablePresentation'],
                holder: wallet.id.did('key'),
            },
            {
                domain: request.domain,
                challenge: request.challenge,
                proofPurpose: 'authentication',
                verificationMethod: await wallet.invoke.didToVerificationMethod(
                    wallet.id.did('key')
                ),
            }
        );
        result = await postExchange(url, vp, signal);
    }
    const presentation =
        result.verifiablePresentation ??
        (result.verifiableCredential
            ? result
            : {
                  '@context': ['https://www.w3.org/ns/credentials/v2'],
                  type: ['VerifiablePresentation'],
                  verifiableCredential: [result],
              });
    getReceivedCredentials(presentation);
    return presentation as VP;
};
