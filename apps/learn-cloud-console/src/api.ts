export type EcosystemRoleGrant = {
    ecosystemId: string;
    role: string;
};

export type DashboardSession = {
    tenantId: string;
    providerId: string;
    providerKind: string;
    externalSubject: string;
    profileId: string;
    managedDid?: string;
    activeEcosystemId?: string;
    effectiveAccess: {
        ecosystemRoles: EcosystemRoleGrant[];
        scopes: string[];
    };
    assuranceLevel: string;
    sessionId?: string;
    expiresAt?: string;
};

const TENANT_ID = 'learncard';
const PROVIDER_ID = 'lef-wallet';

const jsonHeaders = { 'content-type': 'application/json', 'x-tenant-id': TENANT_ID };

const base64url = (input: string): string =>
    btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Dev-only presentation for the decode-only verifier (CONSOLE_BFF_DEV_INSECURE_AUTH):
// it reads vp.holder without checking the signature, so the third segment is a stub.
const craftDevPresentation = (holderDid: string): string => {
    const header = base64url(JSON.stringify({ alg: 'ES256' }));
    const payload = base64url(JSON.stringify({ iss: holderDid, vp: { holder: holderDid } }));

    return `${header}.${payload}.dev-signature`;
};

const freshHolderDid = (): string => `did:key:z6Mkdev${Math.random().toString(36).slice(2, 10)}`;

const stateFromRedirectUrl = (redirectUrl: string): string | null =>
    new URL(redirectUrl).searchParams.get('state');

export async function login(): Promise<{ profileId: string; expiresAt: string }> {
    const beginRes = await fetch('/auth/login', {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({
            providerId: PROVIDER_ID,
            redirectUri: `${window.location.origin}/callback`,
        }),
    });

    if (!beginRes.ok) throw new Error(`login begin failed (${beginRes.status})`);

    const { redirectUrl } = (await beginRes.json()) as { redirectUrl: string };
    const state = stateFromRedirectUrl(redirectUrl);

    if (!state) throw new Error('login begin did not return a state');

    const vp = craftDevPresentation(freshHolderDid());

    const callbackRes = await fetch('/auth/callback', {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({ providerId: PROVIDER_ID, params: { vp, state } }),
    });

    if (!callbackRes.ok) throw new Error(`login callback failed (${callbackRes.status})`);

    return (await callbackRes.json()) as { profileId: string; expiresAt: string };
}

export async function getSession(): Promise<DashboardSession | null> {
    const res = await fetch('/auth/session', { credentials: 'include' });

    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`session fetch failed (${res.status})`);

    return (await res.json()) as DashboardSession;
}

export async function logout(): Promise<void> {
    const res = await fetch('/auth/logout', { method: 'POST', credentials: 'include' });

    if (!res.ok) throw new Error(`logout failed (${res.status})`);
}
