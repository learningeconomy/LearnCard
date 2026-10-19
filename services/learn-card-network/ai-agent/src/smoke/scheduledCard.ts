/**
 * Pure helpers for the staging smoke's scheduled-card check (scripts/smoke.ts).
 * They live in src so the service tests and typecheck cover them.
 */

/** The one passing smoke saw its card 158-168 s after the tick, so 180 s left almost no headroom. */
export const DEFAULT_SCHEDULED_CARD_WINDOW_SECONDS = 480;
export const SCHEDULED_CARD_POLL_INTERVAL_MS = 10_000;

const MIN_WINDOW_SECONDS = 60;
const MAX_WINDOW_SECONDS = 1_800;
const RECENT_CARD_LIMIT = 5;

export interface SmokeFeedItem {
    origin?: string;
    title?: string;
    sourceRunId?: string;
    createdAt?: string;
}

export interface SmokeScheduleResponse {
    id?: string;
    enabled?: boolean;
    cron?: string;
    timezone?: string;
    nextRunAt?: string;
}

export interface SmokeTriggerTarget {
    environment?: string;
    projectRef?: string;
}

/**
 * Summarizes the schedule-create response for the smoke log. It picks fields explicitly so the
 * prompt and owner never leak into the log. The Trigger.dev target is what the deploy expected;
 * the API response doesn't say which project the service actually synced to.
 */
export const describeScheduleCreated = (
    schedule: SmokeScheduleResponse | undefined,
    scheduledAt: Date,
    target: SmokeTriggerTarget
): Record<string, unknown> => ({
    phase: 'schedule-created',
    scheduleId: schedule?.id,
    enabled: schedule?.enabled,
    cron: schedule?.cron,
    timezone: schedule?.timezone,
    nextRunAt: schedule?.nextRunAt,
    nextRunMatchesScheduledAt: schedule?.nextRunAt
        ? Date.parse(schedule.nextRunAt) === scheduledAt.getTime()
        : false,
    expectedTriggerEnvironment: target.environment,
    expectedTriggerProjectRef: target.projectRef,
});

export const getScheduledCardWindowMs = (value: string | undefined): number => {
    const raw = value?.trim();
    if (!raw) return DEFAULT_SCHEDULED_CARD_WINDOW_SECONDS * 1_000;

    const seconds = Number(raw);
    if (
        !Number.isInteger(seconds) ||
        seconds < MIN_WINDOW_SECONDS ||
        seconds > MAX_WINDOW_SECONDS
    ) {
        throw new Error(
            `AI_AGENT_SMOKE_SCHEDULE_WINDOW_SECONDS must be a whole number from ${MIN_WINDOW_SECONDS} to ${MAX_WINDOW_SECONDS}.`
        );
    }

    return seconds * 1_000;
};

export const getScheduledCardDeadline = (scheduledAt: Date, windowMs: number): Date =>
    new Date(scheduledAt.getTime() + windowMs);

const isNewAutonomousCard = (item: SmokeFeedItem, createdAfter: string): boolean =>
    item.origin === 'autonomous' && Boolean(item.createdAt && item.createdAt >= createdAfter);

export const findScheduledCard = (
    items: SmokeFeedItem[],
    scheduleName: string,
    createdAfter: string
): SmokeFeedItem | undefined =>
    items.find(item => isNewAutonomousCard(item, createdAfter) && item.title === scheduleName);

export interface ScheduledCardFailureContext {
    items: SmokeFeedItem[];
    scheduleName: string;
    scheduleId: string;
    createdAfter: string;
    scheduledAt: Date;
    deadline: Date;
    polls: number;
}

const describeOutcome = ({
    items,
    scheduleName,
    createdAfter,
    scheduledAt,
    deadline,
}: ScheduledCardFailureContext): string => {
    const windowSeconds = Math.round((deadline.getTime() - scheduledAt.getTime()) / 1_000);
    const matching = findScheduledCard(items, scheduleName, createdAfter);

    if (matching) {
        return 'a matching autonomous Assistant card appeared, but it had no sourceRunId.';
    }

    const newCards = items.filter(item => isNewAutonomousCard(item, createdAfter));
    if (newCards.length > 0) {
        return `${newCards.length} new autonomous Assistant card(s) appeared, but none was titled "${scheduleName}".`;
    }

    return `no new autonomous Assistant card appeared within ${windowSeconds} s of the scheduled time.`;
};

const formatCard = (item: SmokeFeedItem): string =>
    [
        `title=${JSON.stringify(item.title ?? '')}`,
        `createdAt=${item.createdAt ?? 'unknown'}`,
        ...(item.sourceRunId ? [`sourceRunId=${item.sourceRunId}`] : []),
    ].join(' ');

/** Builds the smoke failure message. It only includes feed card fields, never request headers. */
export const describeScheduledCardFailure = (context: ScheduledCardFailureContext): string => {
    const recent = context.items
        .filter(item => item.origin === 'autonomous')
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, RECENT_CARD_LIMIT);

    return [
        `Scheduled smoke task did not produce an Assistant card: ${describeOutcome(context)}`,
        `scheduledAt=${context.scheduledAt.toISOString()}`,
        `deadline=${context.deadline.toISOString()}`,
        `scheduleId=${context.scheduleId}`,
        `polls=${context.polls}`,
        recent.length > 0
            ? `newest autonomous cards:\n${recent.map(item => `  - ${formatCard(item)}`).join('\n')}`
            : 'newest autonomous cards: none',
    ].join('\n');
};
