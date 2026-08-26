import { initLearnCard } from '@learncard/init';

interface ChallengeResponse {
    ok?: boolean;
    challenge?: string;
    domain?: string;
    error?: string;
}

interface AgentRunResponse {
    runId?: string;
    message?: string;
    error?: string;
    toolRuns?: Array<{
        name?: string;
        error?: string;
    }>;
}

interface ScheduleResponse {
    schedule?: {
        id?: string;
        nextRunAt?: string;
    };
    error?: string;
}

interface AssistantFeedResponse {
    items?: Array<{
        origin?: string;
        title?: string;
        sourceRunId?: string;
        createdAt?: string;
    }>;
}

const baseUrl = process.env.AI_AGENT_SMOKE_BASE_URL?.trim().replace(/\/+$/, '');
const seed = process.env.AI_AGENT_SMOKE_SEED?.trim();

if (!baseUrl) throw new Error('AI_AGENT_SMOKE_BASE_URL must be set.');
if (!seed) throw new Error('AI_AGENT_SMOKE_SEED must be set.');

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(180_000),
    });
    const payload = (await response.json()) as T & { error?: string };

    if (!response.ok) {
        throw new Error(
            `AI Agent smoke request failed with HTTP ${response.status}: ${
                payload.error ?? 'unknown error'
            }`
        );
    }

    return payload;
};

const delay = (milliseconds: number): Promise<void> => {
    const { promise, resolve } = Promise.withResolvers<void>();

    setTimeout(resolve, milliseconds);

    return promise;
};
const wallet = await initLearnCard({ seed });
const did = wallet.id.did();
const createAuthorization = async (): Promise<string> => {
    const challenge = await request<ChallengeResponse>('/api/auth/challenge', { method: 'POST' });

    if (!challenge.ok || !challenge.challenge || !challenge.domain) {
        throw new Error(challenge.error ?? 'AI Agent did not return a valid DID Auth challenge.');
    }

    const vpJwt = await wallet.invoke.getDidAuthVp({
        proofFormat: 'jwt',
        challenge: challenge.challenge,
        domain: challenge.domain,
    });

    if (typeof vpJwt !== 'string') throw new Error('Could not create the smoke-test DID Auth VP.');

    return `Bearer ${vpJwt}`;
};

const result = await request<AgentRunResponse>('/api/agent/run', {
    method: 'POST',
    headers: {
        Authorization: await createAuthorization(),
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        did,
        messages: [
            {
                role: 'user',
                content:
                    'This is an operational smoke test. Call getConsentedUserData once to verify approved learner context is reachable, call getUserMemoryManifest once to verify memory is reachable, and call webSearch once for the current UTC date. Then reply with one short sentence. Do not write or change any user data.',
            },
        ],
    }),
});

if (!result.runId || !result.message) {
    throw new Error(result.error ?? 'AI Agent smoke run did not return a run ID and response.');
}

const toolRuns = result.toolRuns ?? [];
const requiredTools = ['getConsentedUserData', 'getUserMemoryManifest', 'webSearch'];
const failedTool = toolRuns.find(toolRun => toolRun.error);

if (failedTool)
    throw new Error(`AI Agent smoke tool failed: ${failedTool.name ?? 'unknown tool'}.`);

const missingTools = requiredTools.filter(
    requiredTool => !toolRuns.some(toolRun => toolRun.name === requiredTool)
);

if (missingTools.length > 0) {
    throw new Error(
        `AI Agent smoke run did not exercise required tools: ${missingTools.join(', ')}.`
    );
}

const scheduleName = `Scheduled deployment smoke ${Date.now()}`;
const scheduledAt = new Date(Date.now() + 180_000);

scheduledAt.setUTCSeconds(0, 0);

const scheduleTime = `${String(scheduledAt.getUTCHours()).padStart(2, '0')}:${String(
    scheduledAt.getUTCMinutes()
).padStart(2, '0')}`;
const scheduleCreatedAfter = new Date().toISOString();
const scheduleResult = await request<ScheduleResponse>(
    `/api/users/${encodeURIComponent(did)}/assistant-schedules`,
    {
        method: 'POST',
        headers: {
            Authorization: await createAuthorization(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: scheduleName,
            prompt: 'Reply with exactly: Scheduled smoke completed. Do not call any tools.',
            enabled: true,
            timeOfDay: scheduleTime,
            daysOfWeek: [scheduledAt.getUTCDay()],
            timezone: 'UTC',
        }),
    }
);
const scheduleId = scheduleResult.schedule?.id;

if (!scheduleId || !scheduleResult.schedule?.nextRunAt) {
    throw new Error(scheduleResult.error ?? 'Could not create the scheduled smoke task.');
}

let scheduledRunId: string | undefined;

try {
    const deadline = scheduledAt.getTime() + 180_000;

    while (Date.now() < deadline) {
        const feed = await request<AssistantFeedResponse>(
            `/api/users/${encodeURIComponent(did)}/assistant-feed?limit=50`,
            { headers: { Authorization: await createAuthorization() } }
        );
        const scheduledCard = feed.items?.find(
            item =>
                item.origin === 'autonomous' &&
                item.title === scheduleName &&
                Boolean(item.createdAt && item.createdAt >= scheduleCreatedAfter)
        );

        if (scheduledCard) {
            scheduledRunId = scheduledCard.sourceRunId;
            break;
        }

        await delay(10_000);
    }

    if (!scheduledRunId) throw new Error('Scheduled smoke task did not produce an Assistant card.');
} finally {
    await request<{ ok?: boolean }>(
        `/api/users/${encodeURIComponent(did)}/assistant-schedules/${encodeURIComponent(
            scheduleId
        )}`,
        {
            method: 'DELETE',
            headers: { Authorization: await createAuthorization() },
        }
    );
}

console.log(
    JSON.stringify({
        ok: true,
        runId: result.runId,
        toolNames: [...new Set(toolRuns.map(toolRun => toolRun.name).filter(Boolean))],
        scheduledRunId,
    })
);
