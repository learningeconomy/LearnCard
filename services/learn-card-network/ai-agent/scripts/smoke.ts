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

const wallet = await initLearnCard({ seed });
const did = wallet.id.did();
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

const result = await request<AgentRunResponse>('/api/agent/run', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${vpJwt}`,
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

console.log(
    JSON.stringify({
        ok: true,
        runId: result.runId,
        toolNames: [...new Set(toolRuns.map(toolRun => toolRun.name).filter(Boolean))],
    })
);
