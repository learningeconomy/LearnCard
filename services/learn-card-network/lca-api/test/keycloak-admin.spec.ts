import { afterEach, describe, expect, it, vi } from 'vitest';
import { createKeycloakAdmin } from '../scripts/keycloak-admin';

const token = (value: string): Response => Response.json({ access_token: value, expires_in: 100 });

afterEach((): void => vi.unstubAllEnvs());

describe('Keycloak admin token lifetime', (): void => {
    it('refreshes once after 401 and retries with the new token', async (): Promise<void> => {
        vi.stubEnv('KEYCLOAK_ADMIN_CLIENT_SECRET', 'test');
        const fetchRequest = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(token('first'))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(token('second'))
            .mockResolvedValueOnce(Response.json([]));
        const admin = await createKeycloakAdmin(fetchRequest);
        await expect(admin.findUsers('test@example.com')).resolves.toEqual([]);
        expect(fetchRequest).toHaveBeenCalledTimes(4);
        expect(fetchRequest.mock.calls[3]?.[1]?.headers).toMatchObject({
            Authorization: 'Bearer second',
        });
    });

    it('does not retry a second 401', async (): Promise<void> => {
        vi.stubEnv('KEYCLOAK_ADMIN_CLIENT_SECRET', 'test');
        const fetchRequest = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(token('first'))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(token('second'))
            .mockResolvedValueOnce(new Response(null, { status: 401 }));
        const admin = await createKeycloakAdmin(fetchRequest);
        await expect(admin.request('/users')).rejects.toThrow('Admin operation failed (401)');
        expect(fetchRequest).toHaveBeenCalledTimes(4);
    });

    it('refreshes shortly before expiry but reuses a valid token', async (): Promise<void> => {
        vi.stubEnv('KEYCLOAK_ADMIN_CLIENT_SECRET', 'test');
        let time = 0;
        const fetchRequest = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(token('first'))
            .mockResolvedValueOnce(Response.json([]))
            .mockResolvedValueOnce(token('second'))
            .mockResolvedValueOnce(Response.json([]));
        const admin = await createKeycloakAdmin(fetchRequest, (): number => time);
        time = 89_000;
        await admin.request('/users');
        expect(fetchRequest).toHaveBeenCalledTimes(2);
        time = 90_000;
        await admin.request('/users');
        expect(fetchRequest).toHaveBeenCalledTimes(4);
        expect(fetchRequest.mock.calls[3]?.[1]?.headers).toMatchObject({
            Authorization: 'Bearer second',
        });
    });
});
