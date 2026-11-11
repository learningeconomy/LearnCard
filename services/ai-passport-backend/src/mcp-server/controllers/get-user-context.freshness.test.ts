import { beforeEach, describe, expect, mock, test } from 'bun:test';

process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 7).toString('base64');
process.env.MONGO_URI ||= 'mongodb://localhost:27017/test';
process.env.OPENAI_API_KEY ||= 'test-openai-key';
process.env.SEED ||= 'test-seed';

const OWNER = 'did:example:learner';
const URI = 'lc:cloud:credential:achievement-1';
const CONTRACT_URI =
    process.env.LEARNCARD_CONTRACT_URI ||
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

const createActiveRecord = () => ({
    contractUri: CONTRACT_URI,
    termsUri: 'lc:network:terms:active',
    status: 'live',
    date: '2026-08-01T00:00:00.000Z',
    expiresAt: '2027-08-01T00:00:00.000Z',
    contractUpdatedAt: '2026-08-01T00:00:00.000Z',
    guardian: { required: false, approved: false },
    credentials: [{ category: 'Achievement', uri: URI }],
    terms: {
        read: {
            credentials: {
                sharing: true,
                categories: {
                    Achievement: { sharing: true, shared: [URI] },
                },
            },
        },
    },
});

let record: Record<string, unknown> = createActiveRecord();
let duringProjection: (() => void) | undefined;
let duringCacheRead: (() => void) | undefined;
const published: string[] = [];
const promptCache = new Map<
    string,
    { prompt: string; version: string; metadata: { consentRevision: string } }
>();

const getConsentFlowDataForDid = mock(async () => ({
    records: [record],
    hasMore: false,
}));

mock.module('../../services/dataErasure', () => ({
    assertOwnerOperationActive: async () => undefined,
    withOwnerOperation: async (_did: string, operation: () => Promise<unknown>) => operation(),
}));
mock.module('../../learncard', () => ({
    getLearnCard: async () => ({ invoke: { getConsentFlowDataForDid } }),
}));
mock.module('../../credentials/service', () => ({
    resolveVerifiedCredentialProjection: async () => {
        duringProjection?.();
        return {
            schemaVersion: '1',
            category: 'Achievement',
            credentialTypes: ['AchievementCredential'],
            facts: [{ kind: 'achievement', value: 'TypeScript Foundations' }],
        };
    },
}));
mock.module('../../ai', () => ({
    aiCall: mock(async (input: { message: unknown }) => {
        published.push(JSON.stringify(input.message));
        return { prompt: 'Published learner context', summary: 'Published summary' };
    }),
}));
mock.module(new URL('../../ai/index.ts', import.meta.url).href, () => ({
    aiCall: mock(async (input: { message: unknown }) => {
        published.push(JSON.stringify(input.message));
        return { prompt: 'Published learner context', summary: 'Published summary' };
    }),
}));
mock.module('../../ai/pseudonymization', () => ({
    pseudonymizeProviderInput: async (text: string) => text,
}));
mock.module('../../db', () => ({
    db: {
        getLearnerContextPromptByHash: async (did: string, revision: string, hash: string) => {
            duringCacheRead?.();
            return promptCache.get(`${did}:${revision}:${hash}`) ?? null;
        },
        upsertLearnerContextPromptByHash: async (input: {
            did: string;
            consentRevision: string;
            hash: string;
            prompt: string;
            metadata: { consentRevision: string };
            version: string;
        }) => {
            promptCache.set(`${input.did}:${input.consentRevision}:${input.hash}`, {
                prompt: input.prompt,
                version: input.version,
                metadata: { consentRevision: input.metadata.consentRevision },
            });
        },
        getCredentialSummaryByHash: async () => undefined,
        upsertCredentialSummaryByHash: async () => undefined,
    },
}));

const { AiConsentError, loadActiveAiConsentData } = await import('../../learncard/consent');
const { resetConsentSnapshots, runWithLearnCardRequestScope } =
    await import('../../learncard/requestScope');
const { runWithAiPrivacyContext } = await import('../../ai/privacy');
const { getLatestUserSummary } = await import('./get-user-context');

const runTool = () =>
    runWithAiPrivacyContext(OWNER, () =>
        runWithLearnCardRequestScope({}, () => getLatestUserSummary(OWNER))
    );

beforeEach(() => {
    resetConsentSnapshots();
    record = createActiveRecord();
    duringProjection = undefined;
    duringCacheRead = undefined;
    published.length = 0;
    promptCache.clear();
    getConsentFlowDataForDid.mockClear();
});

describe('MCP get_user_context consent freshness', () => {
    test('a request-scoped cache still holds the first grant after revoke, but the tool publishes nothing', async () => {
        const learnCard = { invoke: { getConsentFlowDataForDid } };
        await runWithAiPrivacyContext(OWNER, () =>
            runWithLearnCardRequestScope({}, async () => {
                await loadActiveAiConsentData(learnCard, OWNER, 'model-inference');
                record = { ...createActiveRecord(), status: 'withdrawn' };
                // Fan-out reads keep the request cache.
                await expect(
                    loadActiveAiConsentData(learnCard, OWNER, 'model-inference')
                ).resolves.toMatchObject({ receipt: { status: 'live' } });
                expect(getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
                duringProjection = () => {
                    record = { ...createActiveRecord(), status: 'withdrawn' };
                };
                await expect(getLatestUserSummary(OWNER)).rejects.toBeInstanceOf(AiConsentError);
            })
        );
        expect(published).toEqual([]);
    });

    test('revoking during projection on the uncached path does not publish learner context', async () => {
        duringProjection = () => {
            record = { ...createActiveRecord(), status: 'withdrawn' };
        };
        await expect(runTool()).rejects.toBeInstanceOf(AiConsentError);
        expect(published).toEqual([]);
    });

    test('revoking on the prompt-cache fast path does not return or publish cached context', async () => {
        const first = await runTool();
        expect(first).toBe('Published learner context');
        expect(published).toHaveLength(1);
        expect(promptCache.size).toBe(1);

        published.length = 0;
        resetConsentSnapshots();
        duringCacheRead = () => {
            record = { ...createActiveRecord(), status: 'withdrawn' };
        };
        await expect(runTool()).rejects.toBeInstanceOf(AiConsentError);
        expect(published).toEqual([]);
    });

    test('a snapshot reuse still hides a revoke from unqualified reads, but the tool stays closed', async () => {
        const learnCard = { invoke: { getConsentFlowDataForDid } };
        await runWithAiPrivacyContext(OWNER, () =>
            runWithLearnCardRequestScope({}, () =>
                loadActiveAiConsentData(learnCard, OWNER, 'model-inference')
            )
        );
        record = { ...createActiveRecord(), status: 'withdrawn' };
        // A later request without fresh:true joins the learner snapshot.
        await runWithAiPrivacyContext(OWNER, () =>
            runWithLearnCardRequestScope({}, async () => {
                await expect(
                    loadActiveAiConsentData(learnCard, OWNER, 'model-inference')
                ).resolves.toMatchObject({ receipt: { status: 'live' } });
                await expect(getLatestUserSummary(OWNER)).rejects.toBeInstanceOf(AiConsentError);
            })
        );
        expect(published).toEqual([]);
    });
});
