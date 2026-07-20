import type { AgentAutonomySchedule } from './schedules';
import type { AgentServiceRuntime } from '../runtime';
import { runChatRequest, type RunChatResult } from '../server';

export interface RunScheduledAgentRequestOptions {
    schedule: AgentAutonomySchedule;
    scheduledFor: Date;
    runtime: AgentServiceRuntime;
    signal?: AbortSignal;
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const runScheduledAgentRequest = async ({
    schedule,
    scheduledFor,
    runtime,
    signal,
}: RunScheduledAgentRequestOptions): Promise<RunChatResult> => {
    const prompt = [
        `Scheduled task: ${schedule.name}`,
        `Scheduled for: ${scheduledFor.toISOString()} (${schedule.timezone})`,
        '',
        schedule.prompt,
        '',
        "Complete this task autonomously using your full LearnCard Agent capabilities. Use or update this user's memory when useful, and avoid repeating information the user has already received. Summarize the result clearly for the user.",
    ].join('\n');
    const result = await runChatRequest({
        body: { messages: [{ role: 'user', content: prompt }] },
        ownerDid: schedule.ownerDid,
        config: runtime.config,
        provider: runtime.provider,
        tools: runtime.tools,
        consentFlowRuntime: runtime.consentFlowRuntime,
        selfImprovementRuntime: runtime.selfImprovementRuntime,
        assistantFeedRuntime: runtime.assistantFeedRuntime,
        assistantProfileRuntime: runtime.assistantProfileRuntime,
        runOrigin: 'autonomous',
        ...(signal ? { signal } : {}),
    });

    if (result.status !== 200 || !('message' in result.payload)) {
        throw new Error(
            'error' in result.payload ? result.payload.error : 'Scheduled agent request failed.'
        );
    }
    if (!result.afterResponse) {
        throw new Error('Scheduled agent request did not provide post-run processing.');
    }

    signal?.throwIfAborted();
    await result.afterResponse(signal);
    signal?.throwIfAborted();

    const wroteAssistantCard = result.payload.toolRuns.some(toolRun =>
        Boolean(
            toolRun &&
                typeof toolRun === 'object' &&
                'name' in toolRun &&
                toolRun.name === 'recordLearnCardAssistantCard' &&
                !('error' in toolRun && toolRun.error)
        )
    );
    signal?.throwIfAborted();

    if (!wroteAssistantCard) {
        const response = normalizeWhitespace(result.payload.message);

        await runtime.assistantFeedRuntime.recordItem({
            ownerDid: schedule.ownerDid,
            origin: 'autonomous',
            dedupeKey: `autonomy:${schedule.id}:${scheduledFor.toISOString()}`,
            type: 'message',
            title: schedule.name,
            description: response.slice(0, 220) || 'Scheduled task completed.',
            ...(response ? { detail: response.slice(0, 2_000) } : {}),
            priority: 'normal',
            sourceRunId: result.payload.runId,
        });
    }

    return result;
};
