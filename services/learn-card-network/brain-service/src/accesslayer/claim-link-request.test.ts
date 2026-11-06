import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { neogma } from '@instance';
import { getCredentialUri } from '@helpers/credential.helpers';
import {
    getClaimLinkRequestCredentialId,
    recoverClaimLinkRequest,
    releaseClaimLinkRequestOwner,
    reserveClaimLinkRequest,
} from './claim-link-request';

const request = {
    profileId: 'recipient-a',
    issuerProfileId: 'issuer',
    boostUri: 'lc:network:localhost%3A3000/trpc:boost:one',
    challenge: 'challenge',
    requestId: 'request-one',
    ownerToken: 'owner-one',
    domain: 'localhost%3A3000',
    claimLinkGeneration: 'generation-one',
};
const id = getClaimLinkRequestCredentialId(
    request.profileId,
    request.boostUri,
    request.challenge,
    request.requestId
);
const credentialUri = getCredentialUri(id, request.domain);

const seedCredential = async (accepted = false, status?: string) => {
    await neogma.queryRunner.run(
        `MATCH (issuer:Profile {profileId: 'issuer'}), (recipient:Profile {profileId: 'recipient-a'})
         CREATE (boost:Boost {id: 'one', boost: $credential})
         CREATE (c:Credential {id: $id, credential: $credential})-[:INSTANCE_OF]->(boost)
         CREATE (issuer)-[sent:CREDENTIAL_SENT {to: 'recipient-a', date: '2026-10-29T00:00:00.000Z'}]->(c)
         SET sent.status = $status
         FOREACH (_ IN CASE WHEN $accepted THEN [1] ELSE [] END |
             CREATE (c)-[:CREDENTIAL_RECEIVED {from: 'issuer', date: '2026-10-29T00:00:00.000Z'}]->(recipient))`,
        {
            id,
            accepted,
            status: status ?? null,
            credential: JSON.stringify({
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:recipient' },
            }),
        }
    );
};
const graph = async () => {
    const result = await neogma.queryRunner.run(
        `MATCH (c:Credential {id: $id})
         OPTIONAL MATCH (c)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: 'recipient-a'})
         RETURN count(DISTINCT c) AS credentials, count(received) AS received`,
        { id }
    );
    return {
        credentials: Number(result.records[0]?.get('credentials') ?? 0),
        received: Number(result.records[0]?.get('received') ?? 0),
    };
};

beforeAll(async () => {
    await neogma.queryRunner.run('DROP CONSTRAINT claim_link_request_id_unique IF EXISTS');
});
beforeEach(async () => {
    await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
    await neogma.queryRunner.run(
        `UNWIND ['recipient-a', 'recipient-b', 'issuer'] AS id
         CREATE (:Profile {profileId: id, did: 'did:example:' + id, displayName: id, bio: '', shortBio: ''})`
    );
});
afterAll(async () => {
    await neogma.driver.close();
});

describe('durable claim requests without the optional uniqueness index', () => {
    it('serializes concurrent reservation across independent database sessions', async () => {
        const reservations = await Promise.all(
            Array.from({ length: 8 }, (_, index) =>
                reserveClaimLinkRequest({ ...request, ownerToken: `owner-${index}` })
            )
        );
        expect(reservations.filter(result => result.acquired)).toHaveLength(1);
        const persisted = await neogma.queryRunner.run(
            'MATCH (r:ClaimLinkRequest) RETURN count(r) AS requests'
        );
        expect(Number(persisted.records[0]!.get('requests'))).toBe(1);
    });

    it('recovers an accepted credential after lost completion without issuing another one or consuming twice', async () => {
        await reserveClaimLinkRequest(request);
        await seedCredential(true);
        const consume = vi.fn().mockResolvedValue(true);
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({
            status: 'complete',
            credentialUri,
        });
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({
            status: 'complete',
            credentialUri,
        });
        expect(consume).toHaveBeenCalledTimes(1);
        expect(await graph()).toEqual({ credentials: 1, received: 1 });
    });

    it('resumes acceptance of a stored claim once after the original handler failed', async () => {
        await reserveClaimLinkRequest(request);
        await seedCredential();
        await releaseClaimLinkRequestOwner(request);
        const consume = vi.fn().mockResolvedValue(true);
        await Promise.all(
            Array.from({ length: 5 }, () => recoverClaimLinkRequest(request, consume))
        );
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({
            status: 'complete',
            credentialUri,
        });
        expect(await graph()).toEqual({ credentials: 1, received: 1 });
    });

    it('does not take acceptance away from a running handler or reissue an uncertain absent credential', async () => {
        await reserveClaimLinkRequest(request);
        const consume = vi.fn().mockResolvedValue(true);
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({ status: 'pending' });
        await seedCredential();
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({ status: 'pending' });
        expect(
            (await reserveClaimLinkRequest({ ...request, ownerToken: 'second-owner' })).acquired
        ).toBe(false);
        expect(await graph()).toEqual({ credentials: 1, received: 0 });
        expect(consume).not.toHaveBeenCalled();
    });

    it('retains revocation enforcement while recovering a persisted credential', async () => {
        await reserveClaimLinkRequest(request);
        await seedCredential(false, 'revoked');
        await releaseClaimLinkRequestOwner(request);
        const consume = vi.fn().mockResolvedValue(true);
        await expect(recoverClaimLinkRequest(request, consume)).rejects.toThrow('revoked');
        expect(await graph()).toEqual({ credentials: 1, received: 0 });
        expect(consume).not.toHaveBeenCalled();
    });

    it('retries interrupted usage finalization without duplicating the accepted credential', async () => {
        await reserveClaimLinkRequest(request);
        await seedCredential(true);
        const consume = vi
            .fn()
            .mockRejectedValueOnce(new Error('usage response lost'))
            .mockResolvedValue(true);
        await expect(recoverClaimLinkRequest(request, consume)).rejects.toThrow(
            'usage response lost'
        );
        expect(await recoverClaimLinkRequest(request, consume)).toEqual({
            status: 'complete',
            credentialUri,
        });
        expect(await graph()).toEqual({ credentials: 1, received: 1 });
    });

    it('releases only a definitively pre-storage failure and keeps another owner or stored claim intact', async () => {
        await reserveClaimLinkRequest(request);
        await releaseClaimLinkRequestOwner({ ...request, ownerToken: 'wrong-owner' }, true);
        expect((await reserveClaimLinkRequest({ ...request, ownerToken: 'retry' })).acquired).toBe(
            false
        );
        await releaseClaimLinkRequestOwner(request, true);
        expect((await reserveClaimLinkRequest({ ...request, ownerToken: 'retry' })).acquired).toBe(
            true
        );
        await seedCredential(true);
        await releaseClaimLinkRequestOwner({ ...request, ownerToken: 'retry' }, true);
        expect(
            (await reserveClaimLinkRequest({ ...request, ownerToken: 'another' })).acquired
        ).toBe(false);
        expect(await recoverClaimLinkRequest(request, vi.fn().mockResolvedValue(true))).toEqual({
            status: 'complete',
            credentialUri,
        });
    });

    it('never exposes a prior claim across recipient, challenge, link, or request identities', async () => {
        await reserveClaimLinkRequest(request);
        await seedCredential(true);
        const consume = vi.fn().mockResolvedValue(true);
        for (const changed of [
            { profileId: 'recipient-b' },
            { boostUri: 'boost:other' },
            { challenge: 'another' },
            { requestId: 'another' },
        ]) {
            expect(await recoverClaimLinkRequest({ ...request, ...changed }, consume)).toEqual({
                status: 'absent',
            });
        }
        expect(consume).not.toHaveBeenCalled();
    });
});
