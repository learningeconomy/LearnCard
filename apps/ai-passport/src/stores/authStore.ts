import { atom } from 'nanostores';
import { BACKEND_URL } from '../constants/env';

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
const authListeners = new Set<(did: string | null) => void>();

const setAuthenticatedDid = (did: string | null): void => {
    const previousDid = auth.get().did;

    auth.set({ did });

    if (previousDid !== did) {
        authListeners.forEach(listener => listener(did));
    }
};

export const auth = atom<AuthState>(initialState);
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
    let response: Response;

    if (sessionHandoff) {
        const handoff = sessionHandoff;

        sessionHandoff = null;

        try {
            response = await authenticatedFetch('/auth/handoff', {
                body: JSON.stringify({ handoff }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
        } catch {
            response = await authenticatedFetch('/auth/session');
        }

        if (!response.ok) {
            response = await authenticatedFetch('/auth/session');
        }
    } else {
        response = await authenticatedFetch('/auth/session');
    }

    if (!response.ok) {
        sessionToken = null;
        setAuthenticatedDid(null);
        return false;
    }

    const session = (await response.json()) as {
        authenticated: boolean;
        did: string;
        token?: string;
    };

    sessionToken = session.token ?? null;

    setAuthenticatedDid(session.did);

    return session.authenticated;
};

export function refreshAuth(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export function getDid() {
    return auth.get().did;
}

export function clearAuth() {
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
