import { z } from 'zod';

export const keycloakUserSchema = z.object({
    id: z.string(),
    username: z.string().optional(),
    email: z.string().optional(),
    emailVerified: z.boolean().optional(),
    enabled: z.boolean().optional(),
    attributes: z.record(z.string(), z.array(z.string())).optional(),
});
export const federatedIdentitySchema = z.object({
    identityProvider: z.string(),
    userId: z.string(),
    userName: z.string(),
});
export type KeycloakUser = z.infer<typeof keycloakUserSchema>;
export type FederatedIdentity = z.infer<typeof federatedIdentitySchema>;

/** Minimal admin client; no tokens or response bodies are included in errors. */
export const createKeycloakAdmin = async (
    fetchRequest: typeof fetch = fetch,
    now: () => number = Date.now
): Promise<{
    request: (path: string, init?: RequestInit) => Promise<Response>;
    findUsers: (email: string) => Promise<KeycloakUser[]>;
    links: (id: string) => Promise<FederatedIdentity[]>;
}> => {
    const origin = process.env.KEYCLOAK_ADMIN_URL ?? 'http://localhost:8081';
    const realm = process.env.KEYCLOAK_ADMIN_REALM ?? 'master';
    const targetRealm = process.env.KEYCLOAK_REALM ?? 'learncard';
    const clientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID ?? 'admin-cli';
    const secret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
    const username = process.env.KEYCLOAK_ADMIN_USERNAME;
    const password = process.env.KEYCLOAK_ADMIN_PASSWORD;
    if (!secret && (!username || !password)) throw new Error('Admin credentials are required');
    let token = '';
    let refreshAt = 0;
    const refreshToken = async (): Promise<void> => {
        const startedAt = now();
        const tokenResponse = await fetchRequest(
            `${origin}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`,
            {
                method: 'POST',
                redirect: 'error',
                signal: AbortSignal.timeout(15_000),
                body: new URLSearchParams({
                    client_id: clientId,
                    ...(secret
                        ? { grant_type: 'client_credentials', client_secret: secret }
                        : { grant_type: 'password', username: username!, password: password! }),
                }),
            }
        );
        if (!tokenResponse.ok)
            throw new Error(`Admin authentication failed (${tokenResponse.status})`);
        const result = z
            .object({ access_token: z.string().min(1), expires_in: z.number().positive() })
            .parse(await tokenResponse.json());
        token = result.access_token;
        const lifetime = result.expires_in * 1000;
        refreshAt = startedAt + lifetime - Math.min(30_000, lifetime / 10);
    };
    await refreshToken();
    const request = async (path: string, init: RequestInit = {}): Promise<Response> => {
        if (now() >= refreshAt) await refreshToken();
        const send = async (): Promise<Response> =>
            fetchRequest(`${origin}/admin/realms/${encodeURIComponent(targetRealm)}${path}`, {
                ...init,
                redirect: 'error',
                signal: AbortSignal.timeout(15_000),
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
        let response = await send();
        if (response.status === 401) {
            await response.body?.cancel();
            await refreshToken();
            response = await send();
        }
        if (!response.ok) throw new Error(`Admin operation failed (${response.status})`);
        return response;
    };
    return {
        request,
        findUsers: async (email: string): Promise<KeycloakUser[]> =>
            z
                .array(keycloakUserSchema)
                .parse(
                    await (
                        await request(`/users?${new URLSearchParams({ email, exact: 'true' })}`)
                    ).json()
                ),
        links: async (id: string): Promise<FederatedIdentity[]> =>
            z
                .array(federatedIdentitySchema)
                .parse(
                    await (
                        await request(`/users/${encodeURIComponent(id)}/federated-identity`)
                    ).json()
                ),
    };
};
