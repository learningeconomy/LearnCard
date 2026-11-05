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
import { getCredentialUri, sendCredential } from '@helpers/credential.helpers';
import { releaseUnlinkedCredential } from '@accesslayer/credential/delete';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import * as credentialRelationships from '@accesslayer/credential/relationships/create';
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
        statusBinding: 'server',
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

    it.each([false, true])(
        'preserves client allocation unless server binding is requested (server=%s)',
        async serverBinding => {
            const template: UnsignedVC = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                issuer: issuer.learnCard.id.did(),
                credentialSubject: { id: holder.learnCard.id.did() },
            };
            const input = {
                recipient: 'status-holder',
                template: { credential: template },
                idempotencyKey: 'status-binding-compatibility',
                ...(serverBinding ? { statusBinding: 'server' as const } : {}),
            };
            const prepared = await issuer.clients.fullAuth.boost.prepareRefreshableSend(input);
            const aggregate = await neogma.queryRunner.run(
                'MATCH (r:CredentialRefresh {refreshId: $refreshId}) RETURN r.statusEntries AS entries',
                { refreshId: prepared.refreshId }
            );
            if (serverBinding) {
                expect(prepared.statusEntries).toHaveLength(1);
                expect(JSON.parse(aggregate.records[0]!.get('entries'))).toEqual(
                    prepared.statusEntries
                );
            } else {
                expect(prepared.statusEntries).toBeUndefined();
                expect(aggregate.records[0]!.get('entries')).toBeNull();
                const bindings = await neogma.queryRunner.run(
                    'MATCH (b:CredentialStatusBinding) RETURN b'
                );
                expect(bindings.records).toHaveLength(0);
            }
            expect(await issuer.clients.fullAuth.boost.prepareRefreshableSend(input)).toEqual(
                prepared
            );
            await expect(
                issuer.clients.fullAuth.boost.prepareRefreshableSend({
                    ...input,
                    statusBinding: serverBinding ? undefined : 'server',
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            // Previous SDKs independently allocate through this route after preparation.
            const clientEntries = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
                statusPurposes: ['revocation'],
            });
            const handoff = async (entries: BitstringStatusListEntry[]) => {
                const signedCredential = await issuer.learnCard.invoke.issueCredential(
                    injectManagedRefreshService(
                        {
                            ...template,
                            id: prepared.credentialId,
                            credentialSubject: { id: prepared.holderDid },
                            credentialStatus: entries,
                        },
                        prepared.refreshService
                    )
                );
                return issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: input.recipient,
                    templateUri: prepared.boostUri,
                    idempotencyKey: input.idempotencyKey,
                    refresh: true,
                    signedCredential,
                });
            };
            if (serverBinding) {
                await expect(handoff(clientEntries)).rejects.toThrow(
                    'Credential status does not match allocated entries'
                );
            }
            const entries = prepared.statusEntries ?? clientEntries;
            const result = await handoff(entries);
            expect(result.refresh?.refreshId).toBe(prepared.refreshId);
            expect(await bit(entries[0]!)).toBe(false);
            await issuer.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri: prepared.boostUri,
                recipientProfileId: input.recipient,
                credentialUri: result.credentialUri,
            });
            expect(await bit(entries[0]!)).toBe(true);
            const retry = await issuer.clients.fullAuth.boost.prepareRefreshableSend(input);
            expect(retry.completed).toEqual(result);
            expect(retry.statusEntries).toEqual(prepared.statusEntries);
        }
    );

    it('unsuspends legacy revocation-only deliveries and supports new suspension and revocation', async () => {
        const { root, entries } = await send();
        await neogma.queryRunner.run(
            'MATCH ()-[sent:CREDENTIAL_SENT]->(:Credential {id: $root}) SET sent.status = $status',
            { root, status: 'suspended' }
        );
        expect(await mutateCredentialStatus(root, 'status-holder', 'suspension', false)).toBe(true);
        expect(await mutateCredentialStatus(root, 'status-holder', 'suspension', true)).toBe(true);
        expect(await bit(entries[0]!)).toBe(false);
        expect(await mutateCredentialStatus(root, 'status-holder', 'revocation', true)).toBe(true);
        expect(await bit(entries[0]!)).toBe(true);
    });

    it('uses the stored status owner when the delivery sender differs', async () => {
        const entries = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        const credential = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
            credentialStatus: entries,
        });
        const stored = await storeCredential(credential, undefined, 'status-issuer');
        await neogma.queryRunner.run(
            'MATCH (sender:Profile {profileId: $sender}), (c:Credential {id: $id}) CREATE (sender)-[:CREDENTIAL_SENT {to: $recipient}]->(c)',
            { sender: 'status-holder', recipient: 'status-holder', id: stored.id }
        );
        expect(await mutateCredentialStatus(stored.id, 'status-holder', 'revocation', true)).toBe(
            true
        );
        expect(await bit(entries[0]!)).toBe(true);
    });

    it('rolls back a failed ordinary send and retries the same signed status index', async () => {
        const entries = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        const credential = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
            credentialStatus: entries,
        });
        const from = await getProfileByProfileId('status-issuer');
        const to = await getProfileByProfileId('status-holder');
        if (!from || !to) throw new Error('Missing test profiles');
        const failure = vi
            .spyOn(credentialRelationships, 'createSentCredentialRelationship')
            .mockRejectedValueOnce(new Error('forced relationship failure'));
        try {
            await expect(sendCredential(from, to, credential, domain)).rejects.toThrow(
                'forced relationship failure'
            );
        } finally {
            failure.mockRestore();
        }
        await expect(sendCredential(from, to, credential, domain)).resolves.toEqual(
            expect.any(String)
        );
        const rows = await neogma.queryRunner.run(
            'MATCH (binding:CredentialStatusBinding) RETURN binding'
        );
        expect(rows.records).toHaveLength(1);
    });

    it('releases unlinked reservations but preserves linked credentials', async () => {
        const entries = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        const credential = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
            credentialStatus: entries,
        });
        const first = await storeCredential(credential, undefined, 'status-issuer');
        await releaseUnlinkedCredential(first.id);
        const second = await storeCredential(credential, undefined, 'status-issuer');
        await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: $profile}), (c:Credential {id: $id}) CREATE (p)-[:CREDENTIAL_SENT {to: $recipient}]->(c)',
            { profile: 'status-issuer', recipient: 'status-holder', id: second.id }
        );
        await releaseUnlinkedCredential(second.id);
        await expect(storeCredential(credential, undefined, 'status-issuer')).rejects.toThrow(
            'already bound'
        );
    });

    it('does not create orphan credentials for status-free inbox claims without a boost', async () => {
        const credential = await issuer.learnCard.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: issuer.learnCard.id.did(),
            credentialSubject: { id: holder.learnCard.id.did() },
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
        expect(response.inboxDeliveries).toHaveLength(1);
        const nodes = await neogma.queryRunner.run('MATCH (c:Credential) RETURN c');
        expect(nodes.records).toHaveLength(0);
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
