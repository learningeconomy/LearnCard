import { expect, test } from 'bun:test';
import { canonicalOrigin, trustedOrigins, trustedAdminReadOrigin } from './trusted-origin';
import { csrfToken, validAdminMutation } from '../admin/security';
for (const domain of ['https://lca-backend.fly.dev', 'https://ai-passport.fly.dev']) {
    test(`${domain} trusts configured self-origin for login/handoff and admin reads only`, () => {
        const origins = trustedOrigins(domain, ['https://ai.learncard.test']);
        expect(origins).toContain(new URL('/admin', domain).origin);
        expect(canonicalOrigin(domain + '/')).toBe(domain);
        const request = new Request(domain + '/admin/embeddings', {
            headers: { Host: 'attacker.test', 'X-Forwarded-Host': 'attacker.test' },
        });
        expect(trustedAdminReadOrigin(request, domain, [])).toBe(domain);
        expect(
            trustedAdminReadOrigin(
                new Request(request.url, { headers: { 'Sec-Fetch-Site': 'cross-site' } }),
                domain,
                []
            )
        ).toBeNull();
        for (const Origin of [
            'null',
            'https://attacker.test',
            domain + '.attacker.test',
            domain + '/',
        ]) {
            expect(
                trustedAdminReadOrigin(
                    new Request(request.url, { headers: { Origin } }),
                    domain,
                    []
                )
            ).toBeNull();
            expect(origins).not.toContain(Origin);
        }
        const headers = {
            Origin: domain,
            'Content-Type': 'application/json',
            'X-Passport-CSRF': csrfToken('fixture', domain),
        };
        expect(
            validAdminMutation(
                new Request(request.url, { method: 'POST', headers }),
                'fixture',
                origins
            )
        ).toBe(true);
        expect(
            validAdminMutation(
                new Request(request.url, {
                    method: 'POST',
                    headers: { ...headers, Origin: 'https://ai.learncard.test' },
                }),
                'fixture',
                origins
            )
        ).toBe(false);
        expect(
            validAdminMutation(new Request(request.url, { method: 'POST' }), 'fixture', origins)
        ).toBe(false);
    });
}
test('non-web and credential-bearing canonical domains fail closed', () => {
    for (const value of ['javascript:alert(1)', 'https://user:password@example.test', 'invalid'])
        expect(() => canonicalOrigin(value)).toThrow();
});
