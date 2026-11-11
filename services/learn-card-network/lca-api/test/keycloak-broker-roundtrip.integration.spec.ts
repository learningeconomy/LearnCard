import { randomUUID } from 'node:crypto';
import { decodeJwt } from 'jose';
import { describe, expect, it } from 'vitest';
import { createKeycloakAdmin } from '../scripts/keycloak-admin';
import { roundtripEnabled, signInThroughBroker } from './helpers/keycloak-broker';

describe.runIf(roundtripEnabled)('full Keycloak broker round-trip', () => {
    it('issues a Keycloak session for a new email without rendering any page', async () => {
        const { verifyKeycloakToken } = await import('../src/helpers/auth.helpers');
        const { getAuthSubjectsCollection } = await import('../src/models/AuthSubject');
        const { client } = await import('./helpers/live-mongo');
        const admin = await createKeycloakAdmin();
        const email = `broker-${randomUUID()}@example.com`;
        try {
            const { idToken, trace } = await signInThroughBroker(email);
            const verified = await verifyKeycloakToken(idToken);
            const users = await admin.findUsers(email);
            expect(users).toHaveLength(1);
            expect(verified).toMatchObject({ providerType: 'keycloak', email, id: users[0]!.id });
            expect(decodeJwt(idToken).sub).toBe(users[0]!.id);
            const subject = await getAuthSubjectsCollection().findOne({
                identityKey: `email:${email}`,
            });
            expect(subject).not.toBeNull();
            expect(await admin.links(users[0]!.id)).toContainEqual(
                expect.objectContaining({
                    identityProvider: 'lca-api',
                    userId: subject!.subject,
                })
            );
            expect(trace.length).toBeGreaterThanOrEqual(4);
            expect(trace.every(hop => /^3\d\d /.test(hop))).toBe(true);
        } finally {
            for (const user of await admin.findUsers(email))
                await admin.request(`/users/${user.id}`, { method: 'DELETE' });
            await getAuthSubjectsCollection().deleteOne({ identityKey: `email:${email}` });
            await client.close();
        }
    }, 60_000);
});
