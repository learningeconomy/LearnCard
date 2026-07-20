import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    approveLearnCardAssistantMemory,
    archiveLearnCardAssistantMemory,
    createLearnCardAssistantAuth,
    createLearnCardAssistantDebugCard,
    createLearnCardAssistantSchedule,
    deleteLearnCardAssistantSchedule,
    fetchLearnCardAssistantCards,
    fetchLearnCardAssistantMemories,
    fetchLearnCardAssistantProfile,
    fetchLearnCardAssistantSchedules,
    markLearnCardAssistantCardRead,
    runLearnCardAssistantAgent,
    sendLearnCardAssistantCardFeedback,
    updateLearnCardAssistantProfile,
    updateLearnCardAssistantSchedule,
    withDebugToken,
    type LearnCardAssistantWallet,
} from './learnCardAssistant.api';

const did = 'did:key:z6MkLearner';
const agentUrl = 'http://agent.test';

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const createWallet = (walletDid = did): LearnCardAssistantWallet => ({
    id: { did: vi.fn().mockResolvedValue(walletDid) },
    invoke: {
        getDidAuthVp: vi.fn().mockResolvedValue('vp.jwt'),
    },
});

const mockChallenge = (): void => {
    vi.mocked(fetch).mockResolvedValueOnce(
        jsonResponse({ ok: true, challenge: 'challenge-1', domain: 'http://agent.test' })
    );
};

const createCard = () => ({
    id: 'card-1',
    ownerDid: did,
    type: 'message' as const,
    title: 'Title',
    description: 'Description',
    priority: 'normal' as const,
    createdAt: '2026-06-30T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
});

const createSchedule = () => ({
    id: 'schedule/1',
    ownerDid: did,
    name: 'Morning briefing',
    prompt: 'Create a concise morning briefing.',
    enabled: true,
    timeOfDay: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
    timezone: 'America/Los_Angeles',
    cron: '30 7 * * 0,1,2,3,4,5,6',
    nextRunAt: '2026-07-16T14:30:00.000Z',
    createdAt: '2026-07-15T12:00:00.000Z',
    updatedAt: '2026-07-15T12:00:00.000Z',
});

describe('learnCardAssistant API DID Auth', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('requests a challenge, signs it, and sends Authorization headers', async () => {
        const wallet = createWallet();
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => wallet);

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({ runId: 'run-1', message: 'Hi', messages: [] })
        );

        await runLearnCardAssistantAgent(agentUrl, auth, [{ role: 'user', content: 'Hello' }]);

        expect(fetch).toHaveBeenNthCalledWith(1, `${agentUrl}/api/auth/challenge`, {
            method: 'POST',
        });
        expect(wallet.invoke.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'challenge-1',
            domain: 'http://agent.test',
        });
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            `${agentUrl}/api/agent/run`,
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer vp.jwt' }),
            })
        );
    });

    it('uses auth DID and Authorization on user-scoped helpers', async () => {
        const wallet = createWallet();
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => wallet);
        const helpers = [
            () => fetchLearnCardAssistantCards(agentUrl, auth),
            () => markLearnCardAssistantCardRead(agentUrl, auth, 'card-1'),
            () => sendLearnCardAssistantCardFeedback(agentUrl, auth, 'card-1'),
            () => fetchLearnCardAssistantProfile(agentUrl, auth),
            () => updateLearnCardAssistantProfile(agentUrl, auth, { name: 'Guide' }),
            () => createLearnCardAssistantDebugCard(agentUrl, auth, createCard(), 'debug-token'),
            () => fetchLearnCardAssistantMemories(agentUrl, auth),
            () => approveLearnCardAssistantMemory(agentUrl, auth, 'memory-1'),
            () => archiveLearnCardAssistantMemory(agentUrl, auth, 'memory-1'),
        ];
        const payloads = [
            { ok: true, items: [] },
            { ok: true, item: createCard() },
            { ok: true, item: createCard() },
            {
                ok: true,
                profile: {
                    ownerDid: did,
                    name: 'Guide',
                    personality: 'Helpful',
                    avatarVariant: 'robot',
                    createdAt: '2026-06-30T00:00:00.000Z',
                    updatedAt: '2026-06-30T00:00:00.000Z',
                },
            },
            {
                ok: true,
                profile: {
                    ownerDid: did,
                    name: 'Guide',
                    personality: 'Helpful',
                    avatarVariant: 'robot',
                    createdAt: '2026-06-30T00:00:00.000Z',
                    updatedAt: '2026-06-30T00:00:00.000Z',
                },
            },
            { ok: true, item: createCard() },
            { ok: true, docs: [] },
            { ok: true },
            { ok: true },
        ];

        for (const [index, helper] of helpers.entries()) {
            mockChallenge();
            vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(payloads[index]));

            await helper();
        }

        const protectedCalls = vi
            .mocked(fetch)
            .mock.calls.filter(
                ([url]) =>
                    String(url).includes('/api/users/') || String(url).includes('/api/debug/users/')
            );

        expect(protectedCalls).toHaveLength(helpers.length);
        expect(protectedCalls.every(([url]) => String(url).includes(encodeURIComponent(did)))).toBe(
            true
        );
        expect(
            protectedCalls.every(([, init]) => {
                if (!init || !('headers' in init)) return false;

                const headers = init.headers as Record<string, string>;

                return headers.Authorization === 'Bearer vp.jwt';
            })
        ).toBe(true);
    });

    it('sends exact schedule bodies and maps ISO schedule responses', async () => {
        const wallet = createWallet();
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => wallet);
        const input = {
            name: 'Morning briefing',
            prompt: 'Create a concise morning briefing.',
            enabled: true,
            timeOfDay: '07:30',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
            timezone: 'America/Los_Angeles',
        };

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({ ok: true, schedule: createSchedule() }, 201)
        );

        await expect(createLearnCardAssistantSchedule(agentUrl, auth, input)).resolves.toEqual(
            createSchedule()
        );
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            `${agentUrl}/api/users/${encodeURIComponent(did)}/assistant-schedules`,
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer vp.jwt',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            }
        );

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({
                ok: true,
                schedule: { ...createSchedule(), name: 'Daily briefing' },
            })
        );

        await updateLearnCardAssistantSchedule(agentUrl, auth, 'schedule/1', {
            name: 'Daily briefing',
            enabled: false,
        });
        expect(fetch).toHaveBeenNthCalledWith(
            4,
            `${agentUrl}/api/users/${encodeURIComponent(
                did
            )}/assistant-schedules/${encodeURIComponent('schedule/1')}`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: 'Bearer vp.jwt',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: 'Daily briefing', enabled: false }),
            }
        );

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({ ok: true, schedules: [createSchedule()] })
        );
        await expect(fetchLearnCardAssistantSchedules(agentUrl, auth)).resolves.toEqual([
            createSchedule(),
        ]);

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));
        await expect(
            deleteLearnCardAssistantSchedule(agentUrl, auth, 'schedule/1')
        ).resolves.toBeUndefined();
        expect(fetch).toHaveBeenNthCalledWith(
            8,
            `${agentUrl}/api/users/${encodeURIComponent(
                did
            )}/assistant-schedules/${encodeURIComponent('schedule/1')}`,
            {
                method: 'DELETE',
                headers: { Authorization: 'Bearer vp.jwt' },
            }
        );
    });

    it('propagates friendly schedule server errors', async () => {
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => createWallet());

        mockChallenge();
        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({ ok: false, error: 'You can create up to 10 schedules.' }, 400)
        );

        await expect(
            createLearnCardAssistantSchedule(agentUrl, auth, {
                name: 'Morning briefing',
                prompt: 'Create a concise morning briefing.',
                timeOfDay: '07:30',
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'America/Los_Angeles',
            })
        ).rejects.toThrow('You can create up to 10 schedules.');
    });

    it('throws a friendly error before protected calls when wallet DID mismatches', async () => {
        const wallet = createWallet('did:key:other');
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => wallet);

        mockChallenge();

        await expect(fetchLearnCardAssistantSchedules(agentUrl, auth)).rejects.toThrow(
            'The current wallet DID does not match the assistant DID. Please sign in again.'
        );
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('surfaces challenge and signing failures', async () => {
        const wallet = createWallet();
        const auth = createLearnCardAssistantAuth(agentUrl, did, async () => wallet);

        vi.mocked(fetch).mockResolvedValueOnce(
            jsonResponse({ ok: false, error: 'No challenge.' }, 401)
        );
        await expect(fetchLearnCardAssistantCards(agentUrl, auth)).rejects.toThrow('No challenge.');

        mockChallenge();
        vi.mocked(wallet.invoke.getDidAuthVp).mockResolvedValueOnce({ not: 'jwt' });
        await expect(fetchLearnCardAssistantCards(agentUrl, auth)).rejects.toThrow(
            'Could not sign in to My Assistant.'
        );
    });

    it('adds debug token only when supplied', () => {
        expect(withDebugToken({ Authorization: 'Bearer vp.jwt' })).toEqual({
            Authorization: 'Bearer vp.jwt',
        });
        expect(withDebugToken({ Authorization: 'Bearer vp.jwt' }, 'debug-token')).toEqual({
            Authorization: 'Bearer vp.jwt',
            'X-AI-Agent-Debug-Token': 'debug-token',
        });
    });
});
