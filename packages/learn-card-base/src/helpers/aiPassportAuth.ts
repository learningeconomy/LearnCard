import type { UnsignedVP } from '@learncard/types';

import type { BespokeLearnCard } from '../types/learn-card';
import { networkStore } from '../stores/NetworkStore';

export type AiPassportAuthMode = 'legacy' | 'session';

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

const authRequests = new Map<string, Promise<AiPassportAuthMode>>();
const authModes = new Map<string, AiPassportAuthMode>();
const authTokens = new Map<string, string>();
const authWallets = new Map<string, BespokeLearnCard>();

const getAuthKey = (did: string): string => `${networkStore.get.aiServiceUrl()}|${did}`;

export const getAiPassportAuthMode = (did: string): AiPassportAuthMode | undefined =>
    authModes.get(getAuthKey(did));

export const waitForAiPassportAuthMode = async (
    did: string
): Promise<AiPassportAuthMode | undefined> =>
    getAiPassportAuthMode(did) ?? (await authRequests.get(getAuthKey(did)));

export const getAiPassportUrl = (path: string, did?: string): URL => {
    const url = new URL(path, networkStore.get.aiServiceUrl());

    if (did && getAiPassportAuthMode(did) === 'legacy') url.searchParams.set('did', did);

    return url;
};

export const getAiPassportLaunchUrl = (url: string, did?: string): string => {
    const launchUrl = new URL(url);

    if (did && getAiPassportAuthMode(did) === 'legacy') launchUrl.searchParams.set('did', did);

    return launchUrl.toString();
};

export const aiPassportFetch = async (
    path: string,
    init: RequestInit = {},
    did?: string
): Promise<Response> => {
    if (did && !getAiPassportAuthMode(did)) await authRequests.get(getAuthKey(did));

    const initialMode = did ? getAiPassportAuthMode(did) : undefined;
    const request = () => {
        const headers = new Headers(init.headers);
        const token = did ? authTokens.get(getAuthKey(did)) : undefined;

        if (token) headers.set('Authorization', `Bearer ${token}`);

        return fetch(getAiPassportUrl(path, did), {
            ...init,
            headers,
            credentials: 'include',
        });
    };
    const response = await request();

    if (!did || !initialMode || response.status !== 401) return response;

    const key = getAuthKey(did);
    const wallet = authWallets.get(key);

    if (!wallet) return response;

    authModes.delete(key);
    await ensureAiPassportSession(wallet);

    return request();
};

export const getAiPassportWebSocketProtocols = (did: string): string[] | undefined => {
    const token = authTokens.get(getAuthKey(did));

    return token ? ['ai-passport', `ai-passport-session.${token}`] : undefined;
};

const isLegacyChallengeResponse = async (response: Response): Promise<boolean> => {
    if (response.status === 404 || response.status === 405) return true;
    if (response.status !== 401) return false;

    try {
        const payload = (await response.clone().json()) as { error?: unknown };

        return payload.error === 'Authentication required';
    } catch {
        return false;
    }
};

export const ensureAiPassportSession = async (
    wallet: BespokeLearnCard
): Promise<AiPassportAuthMode> => {
    const did = wallet.id.did();
    const key = getAuthKey(did);
    authWallets.set(key, wallet);
    const existing = authRequests.get(key);

    if (existing) return existing;

    const request = (async (): Promise<AiPassportAuthMode> => {
        const sessionHeaders = new Headers();
        const existingToken = authTokens.get(key);

        if (existingToken) sessionHeaders.set('Authorization', `Bearer ${existingToken}`);

        const currentSession = await fetch(getAiPassportUrl('/auth/session', did), {
            credentials: 'include',
            headers: sessionHeaders,
        });

        if (currentSession.ok) {
            const session = (await currentSession.json()) as SessionResponse;

            if (session.authenticated && session.did === did) {
                authModes.set(key, 'session');

                return 'session';
            }
        }

        const challengeResponse = await aiPassportFetch('/auth/challenge', {
            method: 'POST',
        });

        if (!challengeResponse.ok) {
            if (await isLegacyChallengeResponse(challengeResponse)) {
                authModes.set(key, 'legacy');

                return 'legacy';
            }

            throw new Error(`AI Passport challenge request failed (${challengeResponse.status})`);
        }

        const { audience, binding, challenge } =
            (await challengeResponse.json()) as ChallengeResponse;
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

        if (typeof presentation !== 'string') {
            throw new Error('AI Passport DID Auth presentation must be a JWT');
        }

        const sessionResponse = await aiPassportFetch('/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ binding, challenge, vp: presentation }),
        });

        if (!sessionResponse.ok) {
            throw new Error(`AI Passport session request failed (${sessionResponse.status})`);
        }

        const session = (await sessionResponse.json()) as SessionResponse;

        if (!session.authenticated || session.did !== did || typeof session.token !== 'string') {
            throw new Error('AI Passport session identity mismatch');
        }

        authModes.set(key, 'session');
        authTokens.set(key, session.token);

        return 'session';
    })();

    authRequests.set(key, request);

    try {
        return await request;
    } finally {
        if (authRequests.get(key) === request) authRequests.delete(key);
    }
};
