import type { UnsignedVP } from '@learncard/types';

import type { BespokeLearnCard } from '../types/learn-card';
import { networkStore } from '../stores/NetworkStore';
import { walletStore } from '../stores/walletStore';

export type AiPassportAuthMode = 'session';

type ChallengeResponse = {
    audience: string;
    binding: string;
    challenge: string;
};

type SessionResponse = {
    authenticated: true;
    did: string;
    token?: string;
};

type WebSocketTicketResponse = {
    ticket: string;
};

const WEBSOCKET_TICKET_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

const authRequests = new Map<string, Promise<AiPassportAuthMode>>();
const authModes = new Map<string, AiPassportAuthMode>();
const authTokens = new Map<string, string>();
let authGeneration = 0;

const getAuthKey = (did: string): string => `${networkStore.get.aiServiceUrl()}|${did}`;

/** Invalidate both negotiated sessions and every continuation of an in-flight request. */
export const clearAiPassportAuth = (): void => {
    authGeneration += 1;
    authRequests.clear();
    authModes.clear();
    authTokens.clear();
};

// Invalidate even an away-and-back switch while a negotiation is suspended.
walletStore.store.subscribe((state, previous) => {
    if (state.wallet !== previous.wallet) clearAiPassportAuth();
});
networkStore.store.subscribe((state, previous) => {
    if (state.aiServiceUrl !== previous.aiServiceUrl) clearAiPassportAuth();
});

const guardCurrentIdentity = (did: string) => {
    const wallet = walletStore.get.wallet();
    if (!wallet) throw new Error('AI Passport authentication requires an initialized wallet');
    if (wallet.id.did() !== did) throw new Error('AI Passport wallet identity mismatch');
    const generation = authGeneration;
    const key = getAuthKey(did);

    return () => {
        if (
            generation !== authGeneration ||
            getAuthKey(did) !== key ||
            walletStore.get.wallet() !== wallet ||
            wallet.id.did() !== did
        ) {
            throw new Error('AI Passport session identity or service changed');
        }
    };
};

export const getAiPassportAuthMode = (did: string): AiPassportAuthMode | undefined =>
    walletStore.get.wallet()?.id.did() === did ? authModes.get(getAuthKey(did)) : undefined;

export const getAiPassportUrl = (path: string): URL =>
    new URL(path, networkStore.get.aiServiceUrl());

const getAiPassportFetchUrl = (path: string): URL => {
    const backendUrl = new URL(networkStore.get.aiServiceUrl());
    const url = new URL(path, backendUrl);

    if (url.origin !== backendUrl.origin) {
        throw new Error(
            'AI Passport authenticated requests must use the configured service origin'
        );
    }

    return url;
};

export const aiPassportFetch = async (
    path: string,
    init: RequestInit = {},
    did: string
): Promise<Response> => {
    getAiPassportFetchUrl(path);
    const assertCurrent = guardCurrentIdentity(did);
    const key = getAuthKey(did);
    const wallet = walletStore.get.wallet()!;

    if (!getAiPassportAuthMode(did)) await ensureAiPassportSession(wallet);
    assertCurrent();

    const request = async () => {
        assertCurrent();
        if (getAiPassportAuthMode(did) !== 'session') {
            throw new Error('AI Passport session or service changed');
        }
        const headers = new Headers(init.headers);
        // Only a token negotiated for this identity may authenticate the request.
        headers.delete('Authorization');
        const token = authTokens.get(key);
        if (token) headers.set('Authorization', `Bearer ${token}`);

        const response = await fetch(getAiPassportFetchUrl(path), {
            ...init,
            headers,
            credentials: 'include',
        });
        assertCurrent();
        return response;
    };
    const response = await request();
    if (response.status !== 401) return response;

    authModes.delete(key);
    await ensureAiPassportSession(wallet);
    assertCurrent();
    return request();
};

export const getAiPassportWebSocketProtocols = async (did: string): Promise<string[]> => {
    const assertCurrent = guardCurrentIdentity(did);
    const response = await aiPassportFetch('/auth/websocket-ticket', { method: 'POST' }, did);

    if (!response.ok) {
        throw new Error(`AI Passport WebSocket ticket request failed (${response.status})`);
    }

    const { ticket } = (await response.json()) as WebSocketTicketResponse;
    assertCurrent();
    if (typeof ticket !== 'string' || !WEBSOCKET_TICKET_PATTERN.test(ticket)) {
        throw new Error('AI Passport WebSocket ticket response is invalid');
    }

    return ['ai-passport', `ai-passport-ticket.${ticket}`];
};

export const ensureAiPassportSession = async (
    wallet: BespokeLearnCard
): Promise<AiPassportAuthMode> => {
    const did = wallet.id.did();
    const assertCurrent = guardCurrentIdentity(did);
    const key = getAuthKey(did);
    const existing = authRequests.get(key);
    if (existing) {
        const mode = await existing;
        assertCurrent();
        return mode;
    }
    authModes.delete(key);

    const authFetch = async (path: string, init: RequestInit = {}) => {
        assertCurrent();
        const response = await fetch(getAiPassportFetchUrl(path), {
            ...init,
            credentials: 'include',
        });
        assertCurrent();
        return response;
    };
    const request = (async (): Promise<AiPassportAuthMode> => {
        const sessionHeaders = new Headers();
        const existingToken = authTokens.get(key);
        if (existingToken) sessionHeaders.set('Authorization', `Bearer ${existingToken}`);

        const currentSession = await authFetch('/auth/session', { headers: sessionHeaders });
        if (currentSession.ok) {
            const session = (await currentSession.json()) as SessionResponse;
            assertCurrent();
            if (session.authenticated && session.did === did) {
                authModes.set(key, 'session');
                return 'session';
            }
        }

        const challengeResponse = await authFetch('/auth/challenge', { method: 'POST' });
        if (!challengeResponse.ok) {
            throw new Error(`AI Passport challenge request failed (${challengeResponse.status})`);
        }
        const { audience, binding, challenge } =
            (await challengeResponse.json()) as ChallengeResponse;
        assertCurrent();
        if (
            audience !== new URL(networkStore.get.aiServiceUrl()).origin ||
            typeof binding !== 'string' ||
            !binding ||
            typeof challenge !== 'string' ||
            !challenge
        ) {
            throw new Error('AI Passport challenge response is invalid');
        }
        const unsignedPresentation: UnsignedVP = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: did,
        };
        const presentation = (await wallet.invoke.issuePresentation(unsignedPresentation, {
            challenge,
            domain: audience,
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
        })) as unknown;
        assertCurrent();
        if (typeof presentation !== 'string') {
            throw new Error('AI Passport DID Auth presentation must be a JWT');
        }

        const sessionResponse = await authFetch('/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ binding, challenge, vp: presentation }),
        });
        if (!sessionResponse.ok) {
            throw new Error(`AI Passport session request failed (${sessionResponse.status})`);
        }
        const session = (await sessionResponse.json()) as SessionResponse;
        assertCurrent();
        if (!session.authenticated || session.did !== did) {
            throw new Error('AI Passport session identity mismatch');
        }

        authModes.set(key, 'session');
        authTokens.delete(key);
        if (typeof session.token === 'string') authTokens.set(key, session.token);
        return 'session';
    })();

    authRequests.set(key, request);
    try {
        return await request;
    } catch (error) {
        // An invalidated negotiation must not erase a newer account's session.
        if (authRequests.get(key) === request) {
            authModes.delete(key);
            authTokens.delete(key);
        }
        throw error;
    } finally {
        if (authRequests.get(key) === request) authRequests.delete(key);
    }
};
