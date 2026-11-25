import { boundedRequest } from './bounded-request';

const BACKEND_URL = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;

type AuthState = {
    did: string | null;
};

const initialState: AuthState = { did: null };
const takeSessionHandoff = (): string | null => {
    if (typeof window === 'undefined') return null;

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const handoff = fragment.get('ai_passport_handoff');

    if (!handoff) return null;

    fragment.delete('ai_passport_handoff');

    const remainingFragment = fragment.toString();

    window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${
            remainingFragment ? `#${remainingFragment}` : ''
        }`
    );

    return /^[A-Za-z0-9_-]{32,128}$/.test(handoff) ? handoff : null;
};

let sessionHandoff = takeSessionHandoff();
let sessionToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let authRevision = 0;
let refreshController: AbortController | null = null;
const authListeners = new Set<(did: string | null) => void>();

const setAuthenticatedDid = (did: string | null): void => {
    const previousDid = auth.get().did;

    auth.set({ did });

    if (previousDid !== did) {
        authListeners.forEach(listener => listener(did));
    }
};

let state: AuthState = initialState;
export const auth = {
    get: () => state,
    set: (value: AuthState) => {
        state = value;
    },
};
export const authenticatedFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);

    if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);

    return fetch(new URL(path, BACKEND_URL), {
        ...init,
        credentials: 'include',
        headers,
    });
};

const refreshSession = async (): Promise<boolean> => {
    const revision = authRevision;
    const controller = new AbortController();
    refreshController = controller;
    try {
        const session = await boundedRequest(async signal => {
            const init = { signal };
            let response: Response;
            if (sessionHandoff) {
                const handoff = sessionHandoff;
                sessionHandoff = null;
                try {
                    response = await authenticatedFetch('/auth/handoff', {
                        ...init,
                        body: JSON.stringify({ handoff }),
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                    });
                } catch {
                    signal.throwIfAborted();
                    response = await authenticatedFetch('/auth/session', init);
                }
                if (!response.ok) {
                    signal.throwIfAborted();
                    response = await authenticatedFetch('/auth/session', init);
                }
            } else {
                response = await authenticatedFetch('/auth/session', init);
            }
            // Only an authoritative denial clears a previously verified identity.
            if ([401, 403].includes(response.status)) return null;
            if (!response.ok) throw new Error('Session update unavailable.');
            const value = (await response.json()) as {
                authenticated?: boolean;
                did?: string;
                token?: string;
            };
            if (value.authenticated === false) return null;
            if (value.authenticated !== true || typeof value.did !== 'string' || !value.did)
                throw new Error('Session update unavailable.');
            return value;
        }, controller.signal);
        if (revision !== authRevision || controller.signal.aborted) return false;
        if (!session) {
            clearAuth();
            return false;
        }
        sessionToken = session.token ?? null;
        setAuthenticatedDid(session.did!);
        return true;
    } catch (error) {
        // Logout wins even when an earlier fetch or response body completes late.
        if (revision !== authRevision || controller.signal.aborted) return false;
        throw error;
    }
};

export function refreshAuth(signal?: AbortSignal): Promise<boolean> {
    signal?.throwIfAborted();
    if (!refreshPromise) {
        const pending = refreshSession().finally(() => {
            if (refreshPromise === pending) {
                refreshPromise = null;
                refreshController = null;
            }
        });
        refreshPromise = pending;
    }

    if (!signal) return refreshPromise;
    const pending = refreshPromise;
    return new Promise((resolve, reject) => {
        const abort = () => reject(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
}

export function getDid() {
    return auth.get().did;
}

export function clearAuth() {
    authRevision += 1;
    refreshController?.abort();
    refreshController = null;
    refreshPromise = null;
    sessionHandoff = null;
    sessionToken = null;
    setAuthenticatedDid(null);
}

export async function logout(): Promise<void> {
    const logoutRequest = authenticatedFetch('/auth/logout', {
        method: 'POST',
    });

    clearAuth();
    await logoutRequest;
}

export function onAuthChange(listener: (did: string | null) => void): () => void {
    authListeners.add(listener);

    return () => authListeners.delete(listener);
}

export function isAuthenticated() {
    const state = auth.get();

    return Boolean(state.did);
}

// Async mutations use this epoch to prevent old denials from clearing a newer login.
export const getAuthRevision = () => authRevision;
