import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import type { BitstringStatusListEntry, UnsignedVC } from '@learncard/types';
import { VPValidator } from '@learncard/types';
import { injectManagedRefreshService } from '@learncard/helpers';

import { neogma } from '@instance';
import { getUser } from './helpers/getClient';
import { sendSpy } from './helpers/spies';
import { InboxCredential } from '@models';
import * as statusLists from '@helpers/status-list.helpers';
import { bindRefreshStatusEntries } from '@helpers/managed-status.helpers';
import { mutateCredentialStatus } from '@helpers/credential-status-mutation.helpers';
import { storeCredential } from '@accesslayer/credential/create';
import { getCredentialUri } from '@helpers/credential.helpers';
import {
    computeCredentialStatusDigest,
    matchesCredentialStatusDigest,
} from '@helpers/credential-refresh-materiality.helpers';

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
const domain = 'localhost:3000';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

const bit = async (entry: BitstringStatusListEntry): Promise<boolean> => {
    const list = await statusLists.getStatusListById(entry.statusListCredential.split('/').pop()!);
    if (!list) throw new Error('Missing public status list');
    const signed = await statusLists.getSignedStatusListCredential(list.id);
    const subject = Array.isArray(signed?.credentialSubject)
        ? signed.credentialSubject[0]
        : signed?.credentialSubject;
    if (typeof subject?.encodedList !== 'string')
        throw new Error('Missing signed public bitstring');
    const bytes = statusLists.decodeBitstring(subject.encodedList, list.size);
    const index = Number(entry.statusListIndex);
    return Boolean(bytes[Math.floor(index / 8)]! & (1 << (index % 8)));
};

const send = async (arrayShape = false) => {
    const template: UnsignedVC = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential'],
        issuer: issuer.learnCard.id.did(),
        credentialSubject: { id: holder.learnCard.id.did() },
        validFrom: '2026-01-01T00:00:00Z',
    };
    const allocation = await issuer.clients.fullAuth.boost.prepareRefreshableSend({
        recipient: 'status-holder',
        template: { credential: template },
        credentialId: 'urn:uuid:managed-status-test',
        statusPurposes: arrayShape ? ['suspension'] : [],
    });
    const entries = allocation.statusEntries!;
    expect(entries.map(entry => entry.statusPurpose)).toEqual(
        arrayShape ? ['revocation', 'suspension'] : ['revocation']
    );
    const unsigned = injectManagedRefreshService(
        {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: 'urn:uuid:managed-status-test',
            type: ['VerifiableCredential'],
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: allocation.holderDid },
            validFrom: '2026-01-01T00:00:00Z',
            credentialStatus: arrayShape ? entries : entries[0],
        } satisfies UnsignedVC,
        allocation.refreshService
    );
    const credential = await issuer.learnCard.invoke.issueCredential(unsigned);
    const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
        boostUri: allocation.boostUri,
    });
    const root = (
        await neogma.queryRunner.run(
            'MATCH (:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root) RETURN root.id AS id',
            { refreshId: allocation.refreshId }
        )
    ).records[0]!.get('id') as string;
    return { allocation, entries, unsigned, credential, uri, root };
};

describe('Managed public status', () => {
    it.each([false, true])(
        'repairs the exact legacy receipt before claim (array=%s)',
        async arrayShape => {
            const { allocation, credential, uri } = await send(arrayShape);
            await neogma.queryRunner.run(
                'MATCH (r:CredentialRefresh {refreshId: $refreshId}) REMOVE r.statusEntries, r.credentialStatusBinding',
                { refreshId: allocation.refreshId }
            );
            await expect(
                holder.clients.fullAuth.credentialRefresh.getReceipt({ uri })
            ).rejects.toThrow('Delivery binding unavailable');
            await issuer.clients.fullAuth.credentialRefresh.attachStatusEntries({
                refreshId: allocation.refreshId,
                credentialStatus: credential.credentialStatus!,
            });
            const receipt = await holder.clients.fullAuth.credentialRefresh.getReceipt({ uri });
            expect(receipt?.credentialStatus).toEqual(credential.credentialStatus);
            expect(await holder.clients.fullAuth.credential.acceptCredential({ uri })).toBeTruthy();
        }
    );

    it.each([false, true])(
        'returns the exact signed status shape before acceptance (array=%s)',
        async arrayShape => {
            const { credential, uri } = await send(arrayShape);
            const receipt = await holder.clients.fullAuth.credentialRefresh.getReceipt({ uri });
            expect(receipt?.credentialStatus).toEqual(credential.credentialStatus);
            expect(receipt?.refreshService).toEqual(credential.refreshService);
            expect(receipt).not.toHaveProperty('credentialSubject');
            expect(receipt).not.toHaveProperty('proof');
        }
    );

    it('never exposes a managed receipt after delivery revocation', async () => {
        const { uri, root } = await send();
        await neogma.queryRunner.run(
            'MATCH ()-[sent:CREDENTIAL_SENT]->(:Credential {id: $root}) SET sent.status = "revoked"',
            { root }
        );
        await expect(
            holder.clients.fullAuth.credentialRefresh.getReceipt({ uri })
        ).rejects.toThrow();
    });

    it('distinguishes an authorized ordinary delivery from a missing delivery', async () => {
        await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: "status-issuer"}) CREATE (p)-[:CREDENTIAL_SENT {to: "status-holder"}]->(:Credential {id: "ordinary-root"})'
        );
        expect(
            await holder.clients.fullAuth.credentialRefresh.getReceipt({
                uri: getCredentialUri('ordinary-root', 'localhost%3A3000'),
            })
        ).toBeNull();
        await expect(
            holder.clients.fullAuth.credentialRefresh.getReceipt({
                uri: getCredentialUri('unknown-root', 'localhost%3A3000'),
            })
        ).rejects.toThrow();
    });

    it('keeps inbox escrow pending when a workflow claim reuses a managed index', async () => {
        const { entries } = await send();
        const credential = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            id: 'urn:uuid:ordinary-inbox-reuse',
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
            credentialStatus: entries,
        });
        const inbox = await issuer.clients.fullAuth.inbox.issue({
            credential,
            recipient: { type: 'email', value: 'holder@example.com' },
        });
        const localExchangeId = new URL(inbox.claimUrl!).pathname.split('/').pop()!;
        const start = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const presentation = VPValidator.parse(
            await holder.learnCard.invoke.getDidAuthVp({
                challenge: start.verifiablePresentationRequest?.challenge,
                domain: start.verifiablePresentationRequest?.domain,
            })
        );
        const response = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: presentation,
        });
        expect(response.inboxDeliveries).toEqual([]);
        const stored = await InboxCredential.findOne({ where: { id: inbox.issuanceId } });
        expect(stored?.currentStatus).toBe('PENDING');
        expect(stored?.credential).toBeDefined();
    });

    it('returns a clear repair error for a credential without supported status entries', async () => {
        const { allocation } = await send();
        await neogma.queryRunner.run(
            'MATCH (r:CredentialRefresh {refreshId: $refreshId}) SET r.credentialStatusDigest = $digest REMOVE r.statusEntries',
            { refreshId: allocation.refreshId, digest: computeCredentialStatusDigest([]) }
        );
        await expect(
            issuer.clients.fullAuth.credentialRefresh.attachStatusEntries({
                refreshId: allocation.refreshId,
                credentialStatus: [],
            })
        ).rejects.toThrow('no supported public status entries');
    });

    beforeAll(async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));
    });
    afterAll(() => {
        delete process.env.CREDENTIAL_REFRESH_ENABLED;
    });
    beforeEach(async () => {
        await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
        await issuer.clients.fullAuth.profile.createProfile({ profileId: 'status-issuer' });
        await holder.clients.fullAuth.profile.createProfile({ profileId: 'status-holder' });
    });

    it('shares public bits across v1/v2/v3 and rolls back failed unsuspension', async () => {
        const { allocation, entries, unsigned } = await send(true);
        for (const month of ['02', '03']) {
            await issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                mode: 'issuer-signed',
                refreshId: allocation.refreshId,
                signedCredential: await issuer.learnCard.invoke.issueCredential({
                    ...unsigned,
                    validFrom: `2026-${month}-01T00:00:00Z`,
                }),
            });
        }
        const versions = await neogma.queryRunner.run(
            'MATCH (c:Credential {refreshId: $refreshId}) RETURN c.id AS id, c.version AS version ORDER BY version',
            { refreshId: allocation.refreshId }
        );
        expect(versions.records).toHaveLength(3);
        expect(Number(versions.records[2]!.get('version'))).toBe(3);
        for (const row of versions.records) {
            expect(await statusLists.getStatusEntriesForCredential(String(row.get('id')))).toEqual(
                entries
            );
        }
        const suspension = entries.find(entry => entry.statusPurpose === 'suspension')!;
        const mutation = {
            boostUri: allocation.boostUri,
            recipientProfileId: 'status-holder',
            credentialUri: getCredentialUri(
                String(versions.records[2]!.get('id')),
                'localhost%3A3000'
            ),
        };
        await issuer.clients.fullAuth.boost.suspendBoostRecipient(mutation);
        expect(await bit(suspension)).toBe(true);
        const failure = vi
            .spyOn(statusLists, 'setStatusListEntryBit')
            .mockRejectedValueOnce(new Error('forced write failure'));
        await expect(
            issuer.clients.fullAuth.boost.unsuspendBoostRecipient(mutation)
        ).rejects.toThrow('forced write failure');
        failure.mockRestore();
        expect(await bit(suspension)).toBe(true);
        expect(await issuer.clients.fullAuth.boost.unsuspendBoostRecipient(mutation)).toBe(true);
        expect(await bit(suspension)).toBe(false);
        await issuer.clients.fullAuth.boost.revokeBoostRecipient(mutation);
        expect(await bit(entries[0]!)).toBe(true);
    });

    it('reconciles an earlier revocation when the original send is retried', async () => {
        const { allocation, credential, root, entries } = await send();
        await neogma.queryRunner.run(
            'MATCH (r:CredentialRefresh {refreshId: $refreshId}) REMOVE r.statusEntries',
            { refreshId: allocation.refreshId }
        );
        await mutateCredentialStatus(root, 'status-holder', 'revocation', true);
        expect(await bit(entries[0]!)).toBe(false);
        await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
            refreshId: allocation.refreshId,
            credential,
            boostUri: allocation.boostUri,
        });
        expect(await bit(entries[0]!)).toBe(true);
    });

    it('serializes concurrent binding and revocation without losing the public bit', async () => {
        const { allocation, entries, root } = await send();
        await Promise.all([
            bindRefreshStatusEntries(allocation.refreshId, entries, 'status-issuer', domain),
            mutateCredentialStatus(root, 'status-holder', 'revocation', true),
        ]);
        expect(await bit(entries[0]!)).toBe(true);
    });

    it('rejects ordinary delivery reusing a managed index and concurrent cross-kind reservations', async () => {
        const { allocation, credential, entries } = await send();
        const ordinary = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            id: 'urn:uuid:ordinary-status-test',
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
            credentialStatus: entries,
        });
        await expect(
            issuer.clients.fullAuth.boost.sendBoost({
                uri: allocation.boostUri,
                profileId: 'status-holder',
                credential: ordinary,
            })
        ).rejects.toThrow('already bound');
        const other = await issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
            holder: { profileId: 'status-holder', did: holder.learnCard.id.did() },
            credentialId: 'urn:uuid:race',
        });
        const fresh = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        const outcomes = await Promise.allSettled([
            bindRefreshStatusEntries(other.refreshId, fresh, 'status-issuer', domain),
            storeCredential(
                { ...credential, id: 'urn:uuid:ordinary-race', credentialStatus: fresh },
                undefined,
                'status-issuer'
            ),
        ]);
        expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(outcomes.filter(result => result.status === 'rejected')).toHaveLength(1);
    });

    it.each([false, true])(
        'repairs already revoked credentials without changing status shape (array=%s)',
        async arrayShape => {
            const { allocation, credential, root, entries } = await send(arrayShape);
            await neogma.queryRunner.run(
                'MATCH (r:CredentialRefresh {refreshId: $refreshId}) REMOVE r.statusEntries',
                { refreshId: allocation.refreshId }
            );
            await mutateCredentialStatus(root, 'status-holder', 'revocation', true);
            expect(await bit(entries[0]!)).toBe(false);
            await issuer.clients.fullAuth.credentialRefresh.attachStatusEntries({
                refreshId: allocation.refreshId,
                credentialStatus: credential.credentialStatus!,
            });
            expect(await bit(entries[0]!)).toBe(true);
            expect(
                matchesCredentialStatusDigest(
                    credential.credentialStatus,
                    computeCredentialStatusDigest(credential.credentialStatus)
                )
            ).toBe(true);
            expect(
                matchesCredentialStatusDigest(
                    arrayShape ? entries[0] : entries,
                    computeCredentialStatusDigest(credential.credentialStatus)
                )
            ).toBe(false);
        }
    );

    it('rejects another refresh reusing an index, wrong owners, purpose, bounds and remote URLs', async () => {
        const { entries } = await send();
        const allocation =
            await issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                holder: { profileId: 'status-holder', did: holder.learnCard.id.did() },
                credentialId: 'urn:uuid:second',
            });
        await expect(
            bindRefreshStatusEntries(allocation.refreshId, entries, 'status-issuer', domain)
        ).rejects.toThrow('already bound');
        const entry = entries[0]!;
        await expect(
            statusLists.validateStatusEntries(entries, 'status-holder', domain)
        ).rejects.toThrow('owner');
        await expect(
            statusLists.setStatusListEntryBit(entry, true, 'status-holder')
        ).rejects.toThrow('owner');
        await expect(
            statusLists.validateStatusEntries(
                [{ ...entry, statusPurpose: 'suspension' }],
                'status-issuer',
                domain
            )
        ).rejects.toThrow('purpose');
        await expect(
            statusLists.validateStatusEntries(
                [{ ...entry, statusListIndex: '999999999' }],
                'status-issuer',
                domain
            )
        ).rejects.toThrow('range');
        await expect(
            statusLists.validateStatusEntries(
                [{ ...entry, statusListCredential: 'https://other.example/status-lists/id' }],
                'status-issuer',
                domain
            )
        ).rejects.toThrow('local');
    });
});
