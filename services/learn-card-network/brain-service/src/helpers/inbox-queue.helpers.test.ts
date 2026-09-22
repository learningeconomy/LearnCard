import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { IssueInboxCredentialBatchValidator, InboxBatchStatusValidator } from '@learncard/types';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    claim: vi.fn(),
    finish: vi.fn(),
    checkpoint: vi.fn(),
    read: vi.fn(),
    profile: vi.fn(),
    resolve: vi.fn(),
    issue: vi.fn(),
    authorize: vi.fn(),
    digest: vi.fn(),
    replay: { get: vi.fn(), setIfAbsent: vi.fn(), compareAndSet: vi.fn() },
}));
vi.mock('@environment', async original => ({
    ...(await original<Record<string, unknown>>()),
    getInboxBatchRuntimeEnvironment: () => ({ INBOX_QUEUE_URL: 'local' }),
}));
vi.mock('@accesslayer/inbox-batch/store', () => ({
    createBatchJob: mocks.create,
    claimBatchItem: mocks.claim,
    finishBatchItem: mocks.finish,
    markBatchIssuanceStarted: mocks.checkpoint,
    readBatchJob: mocks.read,
    batchReplayStore: () => mocks.replay,
}));
vi.mock('@accesslayer/profile/read', () => ({ getProfileByProfileId: mocks.profile }));
vi.mock('./inbox.helpers', () => ({
    resolveInboxCredentialInput: mocks.resolve,
    issueToInbox: async (...args: Parameters<typeof import('./inbox.helpers').issueToInbox>) => {
        await args[5]?.();
        return mocks.issue(...args);
    },
}));
vi.mock('./inbox-refresh.helpers', () => ({
    assertInboxRefreshEnabled: mocks.authorize,
    inboxRefreshRequestDigest: mocks.digest,
}));
vi.mock('./inbox-encryption.helpers', () => ({
    encryptInboxCredential: async (value: string) => value,
    decryptInboxCredential: async (value: string) => value,
}));
import { submitInboxBatch, processInboxQueueMessage, getInboxBatch } from './inbox-queue.helpers';

describe('refresh through submission, queue processing and polling', () => {
    const profile = { profileId: 'issuer', did: 'did:example:issuer' } as ProfileType;
    const refresh = {
        refreshId: 'refresh-id',
        credentialId: 'credential-id',
        issuerDid: profile.did,
        refreshService: {
            id: 'https://example.test/refresh',
            type: 'LearnCardCredentialRefresh2026',
        },
    };
    const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: profile.did,
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: {},
    };
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.profile.mockResolvedValue(profile);
        mocks.replay.get.mockResolvedValue(null);
        mocks.replay.setIfAbsent.mockResolvedValue('OK');
        mocks.replay.compareAndSet.mockResolvedValue(true);
        mocks.resolve.mockResolvedValue({ credential, resolvedBoostUri: 'boost:resolved' });
        mocks.digest.mockReturnValue('request-digest');
        mocks.authorize.mockImplementation(async scope => {
            if (scope !== 'inbox:write credentials:write') {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }
        });
        mocks.issue.mockImplementation(async (_profile, _recipient, _credential, options) => ({
            inboxCredential: { id: 'issuance-id' },
            status: 'PENDING',
            ...(options.refresh ? { refresh } : {}),
        }));
    });

    it.each([
        { batchRefresh: true, itemRefresh: undefined, expected: true },
        { batchRefresh: true, itemRefresh: false, expected: false },
        { batchRefresh: false, itemRefresh: true, expected: true },
        { batchRefresh: undefined, itemRefresh: true, expected: true },
        { batchRefresh: undefined, itemRefresh: undefined, expected: undefined },
    ])(
        'preserves batch $batchRefresh / item $itemRefresh through the queue',
        async ({ batchRefresh, itemRefresh, expected }) => {
            const batch = IssueInboxCredentialBatchValidator.parse({
                configuration: { refresh: batchRefresh },
                items: [
                    {
                        recipient: { type: 'email', value: 'first@example.test' },
                        templateUri: 'template',
                    },
                    {
                        recipient: { type: 'email', value: 'second@example.test' },
                        templateUri: 'template',
                        idempotencyKey: 'client-key',
                        configuration: { refresh: itemRefresh },
                    },
                ],
            });
            await submitInboxBatch(profile, batch, {
                domain: 'example.test',
                user: {
                    did: profile.did,
                    isChallengeValid: true,
                    scope: 'inbox:write credentials:write',
                },
            } as Context);
            // Admission checks the whole batch; the worker must independently check its item.
            mocks.authorize.mockClear();
            const job = {
                id: 'batch-id',
                issuer: profile.profileId,
                createdAt: Date.now(),
                payload: mocks.create.mock.lastCall![0].payload,
            };
            mocks.claim.mockResolvedValue({
                job,
                item: {
                    id: 'queued-item',
                    index: 1,
                    replayKey: 'replay-key',
                    duplicate: false,
                },
            });
            await processInboxQueueMessage(JSON.stringify({ itemId: 'queued-item' }));
            expect(mocks.issue).toHaveBeenCalledTimes(1);
            expect(mocks.issue.mock.lastCall![1]).toEqual(batch.items[1]!.recipient);
            expect(mocks.issue.mock.lastCall![3]).toMatchObject({
                refresh: expected,
                boostUri: 'boost:resolved',
                refreshRequestDigest: expected ? 'request-digest' : undefined,
            });
            expect(mocks.checkpoint).toHaveBeenCalledWith('queued-item', expect.any(String));
            if (expected) {
                expect(mocks.authorize).toHaveBeenCalledWith('inbox:write credentials:write');
            } else {
                expect(mocks.authorize).not.toHaveBeenCalled();
                expect(mocks.digest).not.toHaveBeenCalled();
            }
            const result = mocks.finish.mock.lastCall![2];
            expect(result).toMatchObject({ success: true, index: 1, idempotencyKey: 'client-key' });
            expect(result.refresh).toEqual(expected ? refresh : undefined);
            mocks.read.mockResolvedValue({
                job,
                items: [{ index: 1, state: 'COMPLETED', result: JSON.stringify(result) }],
            });
            const polled = InboxBatchStatusValidator.parse(
                await getInboxBatch(profile.profileId, job.id)
            );
            expect(polled.done).toBe(true);
            expect(polled.items[0]!.result).toEqual(JSON.parse(JSON.stringify(result)));
        }
    );

    it.each([
        { configuration: { refresh: true } },
        { refresh: true },
        { refresh: false, configuration: { refresh: true } },
        {},
    ])('rejects refresh at admission before creating a job: %j', async overrides => {
        const batch = IssueInboxCredentialBatchValidator.parse({
            configuration: { refresh: true },
            items: [
                {
                    recipient: { type: 'email', value: 'a@example.test' },
                    templateUri: 'template',
                    ...overrides,
                },
            ],
        });
        await expect(
            submitInboxBatch(profile, batch, {
                user: { scope: 'inbox:write' },
            } as Context)
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('rejects disabled refresh at admission', async () => {
        mocks.authorize.mockRejectedValue(new TRPCError({ code: 'NOT_FOUND' }));
        await expect(
            submitInboxBatch(
                profile,
                {
                    configuration: { refresh: true },
                    items: [
                        {
                            recipient: { type: 'email', value: 'a@example.test' },
                            templateUri: 'template',
                        },
                    ],
                },
                {} as Context
            )
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('allows inbox-only submission when every item opts out of batch refresh', async () => {
        await submitInboxBatch(
            profile,
            {
                configuration: { refresh: true },
                items: [
                    {
                        recipient: { type: 'email', value: 'a@example.test' },
                        templateUri: 'template',
                        refresh: false,
                    },
                    {
                        recipient: { type: 'email', value: 'b@example.test' },
                        templateUri: 'template',
                        refresh: true,
                        configuration: { refresh: false },
                    },
                ],
            },
            { user: { scope: 'inbox:write' } } as Context
        );
        expect(mocks.authorize).not.toHaveBeenCalled();
        expect(mocks.create).toHaveBeenCalledOnce();
    });

    it.each([undefined, 'inbox:write'])(
        'does not grant refresh permissions to queued jobs with scope %s',
        async scope => {
            mocks.claim.mockResolvedValue({
                job: {
                    id: 'batch-id',
                    issuer: profile.profileId,
                    createdAt: Date.now(),
                    payload: JSON.stringify({
                        scope,
                        context: { domain: 'example.test' },
                        batch: {
                            configuration: { refresh: true },
                            items: [
                                {
                                    recipient: { type: 'email', value: 'a@example.test' },
                                    templateUri: 'template',
                                },
                            ],
                        },
                    }),
                },
                item: { id: 'queued-item', index: 0, replayKey: 'replay-key', duplicate: false },
            });
            await processInboxQueueMessage(JSON.stringify({ itemId: 'queued-item' }));
            expect(mocks.authorize).toHaveBeenCalledWith(scope);
            expect(mocks.finish.mock.lastCall![2]).toMatchObject({
                success: false,
                error: { code: 'UNAUTHORIZED' },
            });
            expect(mocks.resolve).not.toHaveBeenCalled();
            expect(mocks.issue).not.toHaveBeenCalled();
            expect(mocks.checkpoint).not.toHaveBeenCalled();
        }
    );
});

describe('batch request identity', () => {
    it('retains submitting permissions in the encrypted job for refresh authorization', async () => {
        const profile = { profileId: 'issuer' } as ProfileType;
        await submitInboxBatch(
            profile,
            {
                configuration: { refresh: true },
                items: [
                    {
                        recipient: { type: 'email', value: 'a@example.test' },
                        templateUri: 'template',
                    },
                ],
            },
            {
                domain: 'example.test',
                user: { did: 'did:example:issuer', scope: 'inbox:write credentials:write' },
            } as Context
        );
        const payload = JSON.parse(mocks.create.mock.lastCall![0].payload);
        expect(payload.scope).toBe('inbox:write credentials:write');
        expect(payload.batch.configuration.refresh).toBe(true);
    });

    it('ignores tenant resolution and branding changes, but keeps tenant ID and domain in the hash', async () => {
        const profile = { profileId: 'issuer' } as ProfileType;
        const batch = {
            requestId: 'request',
            items: [
                {
                    recipient: { type: 'email' as const, value: 'a@example.test' },
                    templateUri: 'template',
                },
            ],
        };
        const submit = async (
            id: string,
            resolvedVia: string,
            brandName: string,
            domain = 'example.test'
        ): Promise<string> => {
            await submitInboxBatch(profile, batch, {
                domain,
                tenant: { id, resolvedVia, emailBranding: { brandName } },
            } as Context);
            return mocks.create.mock.lastCall![0].requestHash;
        };
        const original = await submit('tenant', 'header', 'Before');
        expect(await submit('tenant', 'origin', 'After')).toBe(original);
        expect(await submit('other', 'header', 'Before')).not.toBe(original);
        expect(await submit('tenant', 'header', 'Before', 'other.test')).not.toBe(original);
    });
});
