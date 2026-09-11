import { connect, ensureIdentity, loadProject, type ProjectOptions } from './project';
import { out } from './out';

type ActivityEvent = {
    activityId: string;
    eventType: string;
    timestamp: string;
    recipientType: string;
    recipientIdentifier: string;
    credentialUri?: string;
    status?: string;
    boost?: { name?: string } | null;
    metadata?: Record<string, unknown>;
};

const LATEST_FIRST = (a: ActivityEvent, b: ActivityEvent) => b.timestamp.localeCompare(a.timestamp);

/** One human line per event: time, what happened, to whom. */
export const formatEvent = (event: ActivityEvent): string => {
    const when = event.timestamp.replace('T', ' ').slice(0, 19);
    const failure = event.eventType === 'FAILED' ? `  ${String(event.metadata?.error ?? '')}` : '';
    return `${when}  ${event.eventType.padEnd(9)} ${event.recipientIdentifier}${failure}`;
};

/** Collapse a chain into what a developer wants to know: the current state. */
export const summarize = (chain: ActivityEvent[]) => {
    const ordered = [...chain].sort(LATEST_FIRST);
    const latest = ordered[0];
    const claimed = chain.find(e => e.eventType === 'CLAIMED');
    return {
        state: latest?.eventType ?? 'UNKNOWN',
        recipient: latest?.recipientIdentifier,
        template: latest?.boost?.name,
        credentialUri: claimed?.credentialUri ?? latest?.credentialUri,
        credentialStatus: latest?.status,
        events: ordered.map(e => ({
            type: e.eventType,
            at: e.timestamp,
            ...(e.eventType === 'FAILED' && e.metadata?.error ? { error: e.metadata.error } : {}),
        })),
    };
};

type StatusOptions = ProjectOptions & { limit?: string; event?: string };

export const runStatus = async (activityId: string | undefined, options: StatusOptions) => {
    const project = await loadProject(process.cwd());
    if (!project.env.SECURE_SEED)
        throw new Error(
            'No SECURE_SEED in .env. Send something first: npx @learncard/cli send you@example.com'
        );
    await ensureIdentity(project, options);
    const learnCard = await connect(project, options);

    if (activityId) {
        const chain = (await learnCard.invoke.getActivityChain({ activityId })) as ActivityEvent[];
        if (!chain.length) throw new Error(`No activity found for ${activityId}.`);
        const summary = summarize(chain);
        out.log(`${summary.state}  ${summary.template ?? ''} → ${summary.recipient}`);
        for (const e of [...chain].sort(LATEST_FIRST)) out.log(`  ${formatEvent(e)}`);
        if (summary.credentialUri) out.log(`Credential: ${summary.credentialUri}`);
        if (summary.state !== 'CLAIMED')
            out.log('Not claimed yet. Re-run to check again, or use `webhook` to be told.');
        out.set({ activityId, ...summary });
        return;
    }

    const limit = Number(options.limit ?? 20);
    const eventType = options.event?.toUpperCase();
    const page = await learnCard.invoke.getMyActivities({
        limit,
        ...(eventType ? { eventType: eventType as never } : {}),
    });
    const records = page.records as ActivityEvent[];
    if (!records.length) {
        out.log('No sends yet. Try: npx @learncard/cli send you@example.com');
        out.set({ activities: [] });
        return;
    }
    out.log('activityId                            state      recipient');
    for (const r of records)
        out.log(`${r.activityId}  ${r.eventType.padEnd(9)}  ${r.recipientIdentifier}`);
    if (page.hasMore)
        out.log(`…more. Raise --limit or filter with --event claimed|delivered|created.`);
    out.log('Details for one: npx @learncard/cli status <activityId>');
    out.set({
        activities: records.map(r => ({
            activityId: r.activityId,
            state: r.eventType,
            recipient: r.recipientIdentifier,
            template: r.boost?.name,
            at: r.timestamp,
        })),
        hasMore: page.hasMore,
    });
};
