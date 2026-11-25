/** LC-2421: grants issued from a ConsentFlow contract's HCP section. */
import { describe, expect, it } from 'vitest';

import { CreateGrantInputSchema, type CreateGrantInput } from '../schemas';
import type { HcpContract } from './deps';
import { queryEntries } from './entries';
import { createGrant, getContractOffer, getGrant, listGrants } from './grants';
import { listAudit } from './governance';
import { ListAuditInputSchema } from '../schemas';
import {
    CLIENT_DID,
    OTHER_CLIENT_DID,
    PURPOSE,
    client,
    makeHarness,
    otherClient,
    subject,
    type Harness,
} from './test-harness';

const URI = 'lc:network:brain.test/trpc:contract:tutor';
const HOUR = 60 * 60 * 1000;
const DENIED = { type: 'scope-denied' };

const contract = (overrides: Partial<HcpContract> = {}, hcp: Partial<HcpContract['hcp']> = {}) =>
    ({
        uri: URI,
        version: 1,
        name: 'Demo Tutor',
        owner: { profileId: 'tutor-co', displayName: 'Tutor Co' },
        status: 'active',
        expiresAt: null,
        ...overrides,
        hcp: {
            agents: [CLIENT_DID],
            categories: ['goals_and_constraints', 'education_learner_profile'],
            actions: ['read'],
            purposes: [{ code: PURPOSE, description: 'Tutoring' }],
            duration: '4h',
            ...hcp,
        },
    }) as HcpContract;

const allow = (version = 1, clientDid = CLIENT_DID): CreateGrantInput =>
    CreateGrantInputSchema.parse({
        client: { id: clientDid },
        source: { type: 'consentflow', contractUri: URI, contractVersion: version },
    });

const publish = (h: Harness, next: HcpContract) => h.contracts.set(URI, next);

const searched = async (h: Harness, grantId: string, caller = client) =>
    (await queryEntries(h.deps, caller, { grantId, query: 'plan', purpose: PURPOSE }))
        .categoriesSearched;

describe('HCP v1 contract grants (LC-2421)', () => {
    it('resolves access, duration and name from the contract, and pins its version', async () => {
        const h = makeHarness();
        publish(h, contract());
        const grant = await createGrant(h.deps, subject, allow());

        expect(grant).toMatchObject({
            client: { id: CLIENT_DID, name: 'Demo Tutor' },
            access: [
                {
                    actions: ['read'],
                    categories: ['goals_and_constraints', 'education_learner_profile'],
                    purposes: [{ code: PURPOSE, description: 'Tutoring' }],
                },
            ],
            grantType: 'temporary',
            expiresAt: new Date(h.deps.now().getTime() + 4 * HOUR).toISOString(),
            source: { type: 'consentflow', contractUri: URI, contractVersion: 1 },
        });
        expect(await searched(h, grant.grantId)).toEqual([
            'goals_and_constraints',
            'education_learner_profile',
        ]);
    });

    it('ignores any access or name in the request', async () => {
        const h = makeHarness();
        publish(h, contract());
        const input = CreateGrantInputSchema.parse({
            client: { id: CLIENT_DID, name: 'Totally Legit Bank' },
            access: [
                {
                    actions: ['read', 'write'],
                    categories: ['health_context'],
                    purposes: [{ code: PURPOSE, description: 'x' }],
                },
            ],
            source: { type: 'consentflow', contractUri: URI, contractVersion: 1 },
        });
        const grant = await createGrant(h.deps, subject, input);
        expect(grant.client.name).toBe('Demo Tutor');
        expect(grant.access.flatMap(detail => detail.actions)).toEqual(['read']);
        expect(grant.access.flatMap(detail => detail.categories)).not.toContain('health_context');
    });

    it('makes ongoing persistent, and caps temporary grants at the contract expiry', async () => {
        const h = makeHarness();
        publish(h, contract({}, { duration: 'ongoing' }));
        expect(await createGrant(h.deps, subject, allow())).toMatchObject({
            grantType: 'persistent',
            expiresAt: null,
        });

        const soon = new Date(h.deps.now().getTime() + HOUR).toISOString();
        publish(h, contract({ expiresAt: soon }, { duration: '24h' }));
        expect((await createGrant(h.deps, subject, allow())).expiresAt).toBe(soon);
    });

    it('refuses a contract without HCP access, a changed version, or an agent it does not name', async () => {
        const h = makeHarness();
        await expect(createGrant(h.deps, subject, allow())).rejects.toMatchObject({
            type: 'malformed-request',
        });
        publish(h, { ...contract(), hcp: null });
        await expect(createGrant(h.deps, subject, allow())).rejects.toMatchObject({
            type: 'malformed-request',
        });
        publish(h, contract({ status: 'retired' }));
        await expect(createGrant(h.deps, subject, allow())).rejects.toMatchObject({
            type: 'malformed-request',
        });
        publish(h, contract({ version: 2 }));
        await expect(createGrant(h.deps, subject, allow(1))).rejects.toMatchObject({
            type: 'version-conflict',
        });
        await expect(
            createGrant(h.deps, subject, allow(2, OTHER_CLIENT_DID))
        ).rejects.toMatchObject({ type: 'malformed-request' });
        expect(await listGrants(h.deps, subject, 'active')).toEqual([]);
    });

    it('applies a narrowing version to the existing grant at once', async () => {
        const h = makeHarness();
        publish(h, contract());
        const { grantId } = await createGrant(h.deps, subject, allow());

        publish(h, contract({ version: 2 }, { categories: ['education_learner_profile'] }));
        expect(await searched(h, grantId)).toEqual(['education_learner_profile']);
        const shown = await getGrant(h.deps, subject, grantId);
        expect(shown.access[0]!.categories).toEqual(['education_learner_profile']);
        expect(shown.source).toMatchObject({ contractVersion: 1 });
    });

    it('shortens a grant when the contract duration shrinks', async () => {
        const h = makeHarness();
        publish(h, contract());
        const { grantId } = await createGrant(h.deps, subject, allow());
        publish(h, contract({ version: 2 }, { duration: '1h' }));
        h.advance(2 * HOUR);
        await expect(searched(h, grantId)).rejects.toMatchObject(DENIED);
        expect((await getGrant(h.deps, subject, grantId)).status).toBe('expired');
    });

    it('keeps the pinned access after a widening version until the person allows again', async () => {
        const h = makeHarness();
        publish(h, contract());
        const first = await createGrant(h.deps, subject, allow());

        publish(
            h,
            contract(
                { version: 2 },
                {
                    categories: [
                        'goals_and_constraints',
                        'education_learner_profile',
                        'general_preferences',
                    ],
                }
            )
        );
        expect(await searched(h, first.grantId)).not.toContain('general_preferences');

        const second = await createGrant(h.deps, subject, allow(2));
        expect(await searched(h, second.grantId)).toContain('general_preferences');
        expect(second.source).toMatchObject({ contractVersion: 2 });

        // The earlier grant is replaced, not left beside the new one.
        expect((await getGrant(h.deps, subject, first.grantId)).status).toBe('revoked');
        expect((await listGrants(h.deps, subject, 'active')).map(g => g.grantId)).toEqual([
            second.grantId,
        ]);
        const { events } = await listAudit(
            h.deps,
            subject,
            ListAuditInputSchema.parse({ eventTypes: ['grant.revoked'] })
        );
        expect(events[0]).toMatchObject({
            grantId: first.grantId,
            data: { reason: 'superseded', supersededBy: second.grantId },
        });
    });

    it('denies the grant once the contract no longer names the agent, or is gone', async () => {
        const h = makeHarness();
        publish(h, contract({}, { agents: [CLIENT_DID, OTHER_CLIENT_DID] }));
        const { grantId } = await createGrant(h.deps, subject, allow());

        publish(h, contract({ version: 2 }, { agents: [OTHER_CLIENT_DID] }));
        await expect(searched(h, grantId)).rejects.toMatchObject(DENIED);

        publish(h, contract({ version: 3 }));
        expect(await searched(h, grantId)).toHaveLength(2);
        h.contracts.delete(URI);
        await expect(searched(h, grantId)).rejects.toMatchObject(DENIED);
    });

    it('never lets another DID the contract names use a grant issued to someone else', async () => {
        const h = makeHarness();
        publish(h, contract({}, { agents: [CLIENT_DID, OTHER_CLIENT_DID] }));
        const { grantId } = await createGrant(h.deps, subject, allow());
        await expect(searched(h, grantId, otherClient)).rejects.toMatchObject(DENIED);
    });

    it("offers the contract's resolved access and owner to the subject only", async () => {
        const h = makeHarness();
        publish(h, contract());
        expect(await getContractOffer(h.deps, subject, URI)).toMatchObject({
            contractUri: URI,
            version: 1,
            name: 'Demo Tutor',
            owner: { profileId: 'tutor-co', displayName: 'Tutor Co' },
            agents: [CLIENT_DID],
            duration: '4h',
            access: [{ categories: ['goals_and_constraints', 'education_learner_profile'] }],
        });
        await expect(getContractOffer(h.deps, client, URI)).rejects.toMatchObject(DENIED);
        await expect(
            getContractOffer(h.deps, subject, 'lc:network:brain.test/trpc:contract:none')
        ).rejects.toMatchObject({ type: 'malformed-request' });
    });
});
