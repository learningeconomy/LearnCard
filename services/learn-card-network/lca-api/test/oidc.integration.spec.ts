import { describe, expect, it } from 'vitest';

// Lightweight import contract; the Redis/Mongo-backed full chain is covered by
// keycloak-broker-roundtrip.integration.spec.ts with KEYCLOAK_ROUNDTRIP=true.
describe.runIf(process.env.KEYCLOAK_INTEGRATION === 'true')(
    'lca-api Keycloak broker import',
    () => {
        const issuer =
            process.env.KEYCLOAK_ISSUERS?.split(',')[0] || 'http://localhost:8081/realms/learncard';

        it('serves discovery from the imported realm', async () => {
            const response = await fetch(`${issuer}/.well-known/openid-configuration`);
            expect(response.status).toBe(200);
            expect(await response.json()).toMatchObject({ issuer });
        });

        it('redirects to the registered lca-api provider and forwards the ticket hint', async () => {
            const params = new URLSearchParams({
                client_id: 'learncard-app',
                redirect_uri: 'http://localhost:3000/callback',
                response_type: 'code',
                scope: 'openid',
                state: 'broker-test',
                code_challenge: 'x'.repeat(43),
                code_challenge_method: 'S256',
                kc_idp_hint: 'lca-api',
                login_hint: 'synthetic-ticket-not-redeemed',
            });
            const response = await fetch(`${issuer}/protocol/openid-connect/auth?${params}`, {
                redirect: 'manual',
            });
            expect([302, 303]).toContain(response.status);
            const brokerLogin = new URL(response.headers.get('location')!);
            expect(`${brokerLogin.origin}${brokerLogin.pathname}`).toBe(
                `${issuer}/broker/lca-api/login`
            );
            const brokerResponse = await fetch(brokerLogin, {
                redirect: 'manual',
                headers: {
                    cookie: response.headers
                        .getSetCookie()
                        .map(cookie => cookie.split(';')[0])
                        .join('; '),
                },
            });
            expect([302, 303]).toContain(brokerResponse.status);
            const url = new URL(brokerResponse.headers.get('location')!);
            expect(`${url.origin}${url.pathname}`).toBe('http://localhost:5100/oidc/authorize');
            expect(url.searchParams.get('client_id')).toBe('keycloak-broker');
            expect(url.searchParams.get('login_hint')).toBe('synthetic-ticket-not-redeemed');
            expect(url.searchParams.get('redirect_uri')).toBe(`${issuer}/broker/lca-api/endpoint`);
        });
    }
);
