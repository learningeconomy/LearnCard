import { beforeEach, expect, mock, test } from 'bun:test';

mock.module('../constants/env', () => ({
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
    LEARNCARD_CONTRACT_URI: 'lc:network:network.learncard.com/trpc:contract:test-ai-contract',
}));

const { AiConsentError, getActiveAiConsentReceipt, loadActiveAiConsentData } =
    await import('./consent');
const { resetConsentSnapshots, runWithLearnCardRequestScope } = await import('./requestScope');
beforeEach(() => resetConsentSnapshots());
const { runWithAiPrivacyContext } = await import('../ai/privacy');

const contractUri = 'lc:network:network.learncard.com/trpc:contract:test-ai-contract';

const createActiveRecord = () => ({
    contractUri,
    termsUri: 'lc:network:terms:active',
    status: 'live',
    date: '2026-08-01T00:00:00.000Z',
    expiresAt: '2027-08-01T00:00:00.000Z',
    contractUpdatedAt: '2026-08-01T00:00:00.000Z',
    guardian: { required: false, approved: false },
    credentials: [
        {
            category: 'Achievement',
            uri: 'lc:cloud:credential:achievement-1',
        },
    ],
    terms: {
        read: {
            credentials: {
                sharing: true,
                categories: {
                    Achievement: {
                        sharing: true,
                        shared: ['lc:cloud:credential:achievement-1'],
                    },
                },
            },
        },
    },
});

const now = new Date('2026-08-27T00:00:00.000Z');

test('accepts an existing adult grant without inventing notice acceptance or an original grant timestamp', () => {
    const receipt = getActiveAiConsentReceipt(createActiveRecord(), 'credential-ingestion', now);
    expect(receipt?.credentialUris).toEqual(['lc:cloud:credential:achievement-1']);
    expect(receipt?.guardian).toEqual({ required: false, approved: false });
    expect(receipt).not.toHaveProperty('grantedAt');
    expect(receipt).not.toHaveProperty('privacyVersion');
});

test.each([
    ['withdrawn consent', { status: 'withdrawn' }],
    ['stale consent', { status: 'stale' }],
    ['wrong contract', { contractUri: 'lc:network:contract:legacy' }],
    ['expired consent', { expiresAt: '2026-08-26T00:00:00.000Z' }],
    ['missing terms receipt', { termsUri: undefined }],
])('rejects %s', (_label, changes) => {
    expect(
        getActiveAiConsentReceipt({ ...createActiveRecord(), ...changes }, 'model-inference', now)
    ).toBeUndefined();
});

test('rejects credentials outside the consented category and URI set', () => {
    const record = createActiveRecord();

    record.credentials.push({
        category: 'Private Profile',
        uri: 'lc:cloud:credential:private-1',
    });

    expect(getActiveAiConsentReceipt(record, 'embedding', now)).toBeUndefined();
});

test('loads only live records and fails closed when consent is revoked', async () => {
    const getConsentFlowDataForDid = mock(async () => ({
        records: [createActiveRecord()],
        hasMore: false,
        cursor: null,
    }));
    const learnCard = { invoke: { getConsentFlowDataForDid } };

    const result = await loadActiveAiConsentData(
        learnCard,
        'did:example:learner',
        'credential-ingestion'
    );

    expect(result.records).toEqual([createActiveRecord()]);
    expect(result.receipt.status).toBe('live');
    expect(getConsentFlowDataForDid).toHaveBeenCalledWith('did:example:learner', {
        query: { id: 'test-ai-contract' },
    });

    getConsentFlowDataForDid.mockResolvedValueOnce({
        records: [{ ...createActiveRecord(), status: 'withdrawn' }],
        hasMore: false,
        cursor: null,
    });

    await expect(
        loadActiveAiConsentData(learnCard, 'did:example:learner', 'model-inference')
    ).rejects.toBeInstanceOf(AiConsentError);
});

test('rejects repeated consent cursors before returning partial records', async () => {
    const getConsentFlowDataForDid = mock(async () => ({
        records: [createActiveRecord()],
        hasMore: true,
        cursor: 'repeated',
    }));

    await expect(
        loadActiveAiConsentData(
            { invoke: { getConsentFlowDataForDid } },
            'did:example:learner',
            'credential-ingestion'
        )
    ).rejects.toBeInstanceOf(AiConsentError);

    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
});

test('rejects a consent result that exceeds the page cap', async () => {
    let page = 0;
    const getConsentFlowDataForDid = mock(async () => {
        page += 1;

        return {
            records: [createActiveRecord()],
            hasMore: true,
            cursor: `page-${page}`,
        };
    });

    await expect(
        loadActiveAiConsentData(
            { invoke: { getConsentFlowDataForDid } },
            'did:example:learner',
            'credential-ingestion'
        )
    ).rejects.toBeInstanceOf(AiConsentError);

    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(100);
});

test('managed grants require recorded current approval, not a caller boolean alone', () => {
    const record = createActiveRecord();
    expect(
        getActiveAiConsentReceipt(
            { ...record, guardian: { required: true, approved: true } },
            'model-inference',
            now
        )
    ).toBeUndefined();
    const approval = {
        guardianProfileId: 'current-role-manager',
        guardianDid: 'did:example:manager',
        approvedAt: '2026-08-01T00:00:00.000Z',
        contractUpdatedAt: record.contractUpdatedAt,
    };
    expect(
        getActiveAiConsentReceipt(
            { ...record, guardian: { required: true, approved: true, approval } },
            'model-inference',
            now
        )?.guardian.approved
    ).toBe(true);
    expect(
        getActiveAiConsentReceipt(
            {
                ...record,
                contractUpdatedAt: '2026-08-02T00:00:00.000Z',
                guardian: { required: true, approved: true, approval },
            },
            'model-inference',
            now
        )
    ).toBeUndefined();
});

test('rejects ambiguous historical records instead of merging authorization', async () => {
    await expect(
        loadActiveAiConsentData(
            {
                invoke: {
                    getConsentFlowDataForDid: async () => ({
                        records: [
                            createActiveRecord(),
                            { ...createActiveRecord(), status: 'withdrawn' },
                        ],
                    }),
                },
            },
            'did:example:learner',
            'model-inference'
        )
    ).rejects.toBeInstanceOf(AiConsentError);
});

test('repair diagnostics classify known unavailable grants without broadening authorization', async () => {
    for (const [reason, patch] of [
        ['revoked', { status: 'withdrawn' }],
        ['expired', { expiresAt: '2020-01-01T00:00:00Z' }],
        ['guardian_required', { guardian: { required: true, approved: false } }],
        ['unavailable', { guardian: undefined }],
    ] as const) {
        try {
            await loadActiveAiConsentData(
                {
                    invoke: {
                        getConsentFlowDataForDid: async () => ({
                            records: [{ ...createActiveRecord(), ...patch }],
                        }),
                    },
                },
                `did:example:repair-${reason}`,
                'credential-ingestion'
            );
            throw new Error('Rejected grant was accepted');
        } catch (error) {
            expect(error).toBeInstanceOf(AiConsentError);
            expect((error as InstanceType<typeof AiConsentError>).reason).toBe(reason);
        }
    }
    await expect(
        loadActiveAiConsentData(
            { invoke: { getConsentFlowDataForDid: async () => ({ records: [] }) } },
            'did:example:missing',
            'credential-ingestion'
        )
    ).rejects.toMatchObject({ reason: 'missing' });
});

test('reuses one consent read per request, bound to its revision', async () => {
    const getConsentFlowDataForDid = mock(async () => ({
        records: [createActiveRecord()],
        hasMore: false,
    }));
    const learnCard = { invoke: { getConsentFlowDataForDid } };
    const did = 'did:example:learner';

    const receipts = await runWithAiPrivacyContext(did, () =>
        runWithLearnCardRequestScope({}, async () => {
            // The search, each projection and each consent re-check in one request.
            const first = await loadActiveAiConsentData(learnCard, did, 'model-inference');
            const rest = await Promise.all(
                Array.from({ length: 6 }, () =>
                    loadActiveAiConsentData(learnCard, did, 'model-inference')
                )
            );
            const ingestion = await loadActiveAiConsentData(learnCard, did, 'credential-ingestion');
            return [first, ...rest, ingestion].map(({ receipt }) => receipt);
        })
    );

    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
    expect(new Set(receipts.map(({ revision }) => revision)).size).toBe(1);
    // The receipt is still rebuilt for each purpose.
    expect(receipts.at(-1)?.purpose).toBe('credential-ingestion');

    // A new request within the snapshot TTL joins the learner's snapshot; once
    // that is gone it reads again; outside any request scope every call reads.
    await runWithLearnCardRequestScope({}, () =>
        loadActiveAiConsentData(learnCard, did, 'model-inference')
    );
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
    resetConsentSnapshots();
    await runWithLearnCardRequestScope({}, () =>
        loadActiveAiConsentData(learnCard, did, 'model-inference')
    );
    await loadActiveAiConsentData(learnCard, did, 'model-inference');
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(3);
});

test("a fresh read skips the request's shared read and sees a revocation", async () => {
    let record: Record<string, unknown> = createActiveRecord();
    const getConsentFlowDataForDid = mock(async () => ({
        records: [record],
        hasMore: false,
    }));
    const learnCard = { invoke: { getConsentFlowDataForDid } };
    const did = 'did:example:learner';

    await runWithAiPrivacyContext(did, () =>
        runWithLearnCardRequestScope({}, async () => {
            await loadActiveAiConsentData(learnCard, did, 'model-inference');
            record = { ...createActiveRecord(), status: 'withdrawn' };
            // Fan-out reads inside the window still reuse the shared read...
            await loadActiveAiConsentData(learnCard, did, 'model-inference');
            expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
            // ...but a fresh read goes back to the contract and is refused.
            await expect(
                loadActiveAiConsentData(learnCard, did, 'model-inference', {
                    fresh: true,
                })
            ).rejects.toMatchObject({ reason: 'revoked' });
            expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
        })
    );
});

test('does not reuse a failed consent read', async () => {
    const getConsentFlowDataForDid = mock(async () => ({
        records: [createActiveRecord()],
        hasMore: false,
    }));
    getConsentFlowDataForDid.mockRejectedValueOnce(new Error('synthetic outage'));
    const learnCard = { invoke: { getConsentFlowDataForDid } };

    await runWithLearnCardRequestScope({}, async () => {
        await expect(
            loadActiveAiConsentData(learnCard, 'did:example:learner', 'model-inference')
        ).rejects.toThrow('synthetic outage');
        const { receipt } = await loadActiveAiConsentData(
            learnCard,
            'did:example:learner',
            'model-inference'
        );
        expect(receipt.status).toBe('live');
    });
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
});

test('bounds a hung consent read by the request signal and the page timeout', async () => {
    const hung = {
        invoke: { getConsentFlowDataForDid: () => new Promise<never>(() => {}) },
    };
    const controller = new AbortController();
    const startedAt = performance.now();
    const pending = runWithLearnCardRequestScope({ signal: controller.signal }, () =>
        loadActiveAiConsentData(hung, 'did:example:learner', 'model-inference')
    );
    setTimeout(() => controller.abort(new DOMException('deadline', 'TimeoutError')), 20);
    await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });

    await expect(
        loadActiveAiConsentData(hung, 'did:example:learner', 'model-inference', {
            timeoutMs: 20,
        })
    ).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(performance.now() - startedAt).toBeLessThan(1_000);
});

test("plain reads across requests share the learner's snapshot unless the caller holds another revision", async () => {
    let record = createActiveRecord();
    const getConsentFlowDataForDid = mock(async () => ({
        records: [record],
        hasMore: false,
    }));
    const learnCard = { invoke: { getConsentFlowDataForDid } };
    const did = 'did:example:snapshot-learner';
    const load = (expectedRevision?: string) =>
        runWithAiPrivacyContext(did, () =>
            runWithLearnCardRequestScope({}, () =>
                loadActiveAiConsentData(learnCard, did, 'model-inference', {
                    expectedRevision,
                })
            )
        );

    const first = await load();
    const held = first.receipt.revision;
    // The opening and the preload in separate requests: one read.
    expect((await load()).receipt.revision).toBe(held);
    expect((await load(held)).receipt.revision).toBe(held);
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(1);

    // The grant changes upstream. A caller holding another revision than the
    // snapshot's misses it and reads the current one.
    record = { ...createActiveRecord(), date: '2026-08-02T00:00:00.000Z' };
    const current = await load('some-other-revision');
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
    expect(current.receipt.revision).not.toBe(held);
    // A fresh read never takes the snapshot.
    await runWithAiPrivacyContext(did, () =>
        runWithLearnCardRequestScope({}, () =>
            loadActiveAiConsentData(learnCard, did, 'model-inference', {
                fresh: true,
            })
        )
    );
    expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(3);
});
