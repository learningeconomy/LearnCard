import { describe, expect, it } from 'vitest';

import { getCanonicalScheduleCron, getNextScheduleRun } from '../../src/autonomy/schedules';
import {
    DEFAULT_SCHEDULED_CARD_WINDOW_SECONDS,
    describeScheduleCreated,
    describeScheduledCardFailure,
    findScheduledCard,
    getScheduledCardDeadline,
    getScheduledCardWindowMs,
    type SmokeFeedItem,
} from '../../src/smoke/scheduledCard';

const scheduleName = 'Scheduled deployment smoke 1760900000000';
const createdAfter = '2026-10-19T18:44:58.000Z';
const scheduledAt = new Date('2026-10-19T18:47:00.000Z');

const failureContext = (items: SmokeFeedItem[]) => ({
    items,
    scheduleName,
    scheduleId: 'schedule-123',
    createdAfter,
    scheduledAt,
    deadline: getScheduledCardDeadline(scheduledAt, getScheduledCardWindowMs(undefined)),
    polls: 57,
});

describe('scheduled smoke card window', () => {
    it('defaults to eight minutes after the scheduled time', () => {
        expect(DEFAULT_SCHEDULED_CARD_WINDOW_SECONDS).toBe(480);
        expect(getScheduledCardWindowMs(undefined)).toBe(480_000);
        expect(getScheduledCardWindowMs('  ')).toBe(480_000);
        expect(
            getScheduledCardDeadline(scheduledAt, getScheduledCardWindowMs(undefined)).toISOString()
        ).toBe('2026-10-19T18:55:00.000Z');
    });

    it('covers the latency seen in the one passing staging smoke', () => {
        const deadline = getScheduledCardDeadline(scheduledAt, getScheduledCardWindowMs(undefined));

        expect(deadline.getTime() - scheduledAt.getTime()).toBeGreaterThan(168_000 * 2);
    });

    it('accepts a whole-second override', () => {
        expect(getScheduledCardWindowMs('360')).toBe(360_000);
    });

    it.each(['abc', '12.5', '59', '1801', '-1'])('rejects the override %j', value => {
        expect(() => getScheduledCardWindowMs(value)).toThrow(
            'AI_AGENT_SMOKE_SCHEDULE_WINDOW_SECONDS must be a whole number from 60 to 1800.'
        );
    });
});

describe('findScheduledCard', () => {
    it('ignores interactive, stale, and differently titled cards', () => {
        const match = {
            origin: 'autonomous',
            title: scheduleName,
            createdAt: '2026-10-19T18:49:40.000Z',
            sourceRunId: 'run-1',
        };

        expect(
            findScheduledCard(
                [
                    { ...match, origin: 'interactive' },
                    { ...match, createdAt: '2026-10-19T18:40:00.000Z' },
                    { ...match, title: 'Scheduled smoke completed' },
                    match,
                ],
                scheduleName,
                createdAfter
            )
        ).toBe(match);
    });
});

describe('describeScheduledCardFailure', () => {
    it('says when no autonomous card appeared at all', () => {
        const message = describeScheduledCardFailure(
            failureContext([
                { origin: 'interactive', title: 'Hi', createdAt: '2026-10-19T18:45:10.000Z' },
                { origin: 'autonomous', title: 'Old card', createdAt: '2026-10-18T17:00:00.000Z' },
            ])
        );

        expect(message).toBe(
            [
                'Scheduled smoke task did not produce an Assistant card: no new autonomous Assistant card appeared within 480 s of the scheduled time.',
                'scheduledAt=2026-10-19T18:47:00.000Z',
                'deadline=2026-10-19T18:55:00.000Z',
                'scheduleId=schedule-123',
                'polls=57',
                'newest autonomous cards:',
                '  - title="Old card" createdAt=2026-10-18T17:00:00.000Z',
            ].join('\n')
        );
    });

    it('says when a new autonomous card appeared with a different title', () => {
        const message = describeScheduledCardFailure(
            failureContext([
                {
                    origin: 'autonomous',
                    title: 'Scheduled smoke completed',
                    createdAt: '2026-10-19T18:49:40.000Z',
                    sourceRunId: 'run-2',
                },
            ])
        );

        expect(message).toContain(
            `1 new autonomous Assistant card(s) appeared, but none was titled "${scheduleName}".`
        );
        expect(message).toContain(
            '  - title="Scheduled smoke completed" createdAt=2026-10-19T18:49:40.000Z sourceRunId=run-2'
        );
    });

    it('says when the matching card had no run ID', () => {
        const message = describeScheduledCardFailure(
            failureContext([
                {
                    origin: 'autonomous',
                    title: scheduleName,
                    createdAt: '2026-10-19T18:49:40.000Z',
                },
            ])
        );

        expect(message).toContain(
            'a matching autonomous Assistant card appeared, but it had no sourceRunId.'
        );
    });

    it('lists at most the five newest autonomous cards', () => {
        const items = Array.from({ length: 7 }, (_, index) => ({
            origin: 'autonomous',
            title: `Card ${index}`,
            createdAt: `2026-10-1${index}T00:00:00.000Z`,
        }));
        const message = describeScheduledCardFailure(failureContext(items));
        const listed = message.split('\n').filter(line => line.startsWith('  - '));

        expect(listed).toHaveLength(5);
        expect(listed[0]).toContain('Card 6');
        expect(listed[4]).toContain('Card 2');
    });
});

describe('describeScheduleCreated', () => {
    it('logs only the schedule fields that help trace a missed run', () => {
        const summary = describeScheduleCreated(
            {
                id: 'schedule-123',
                enabled: true,
                cron: '47 18 * * 1',
                timezone: 'UTC',
                nextRunAt: '2026-10-19T18:47:00.000Z',
                prompt: 'Reply with exactly: Scheduled smoke completed.',
                ownerDid: 'did:key:z6Mk-smoke',
            } as Parameters<typeof describeScheduleCreated>[0],
            scheduledAt,
            { environment: 'staging', projectRef: 'proj_example' }
        );

        expect(summary).toEqual({
            phase: 'schedule-created',
            scheduleId: 'schedule-123',
            enabled: true,
            cron: '47 18 * * 1',
            timezone: 'UTC',
            nextRunAt: '2026-10-19T18:47:00.000Z',
            window: undefined,
            nextRunEffectiveAt: undefined,
            nextRunMatchesScheduledAt: true,
            expectedTriggerEnvironment: 'staging',
            expectedTriggerProjectRef: 'proj_example',
        });
    });

    it('flags a next run that is not the scheduled minute', () => {
        expect(
            describeScheduleCreated({ nextRunAt: '2026-10-26T18:47:00.000Z' }, scheduledAt, {})
                .nextRunMatchesScheduledAt
        ).toBe(false);
    });
});

describe('describeScheduleCreated with a Trigger.dev window', () => {
    // From the staging schedule that never fired: nominal 21:23, assigned 21:43:30.8 by a 1h window.
    const tick = new Date('2026-10-19T21:23:00.000Z');

    it('flags an assigned start that drifts past the scheduled minute', () => {
        const summary = describeScheduleCreated(
            {
                id: 'schedule-123',
                nextRunAt: '2026-10-19T21:23:00.000Z',
                window: '1h',
                nextRunEffectiveAt: '2026-10-19T21:43:30.800Z',
            },
            tick,
            {}
        );

        expect(summary).toMatchObject({
            window: '1h',
            nextRunEffectiveAt: '2026-10-19T21:43:30.800Z',
            nextRunMatchesScheduledAt: false,
        });
    });

    it('passes when a 0m window fires at the scheduled minute', () => {
        expect(
            describeScheduleCreated(
                {
                    nextRunAt: '2026-10-19T21:23:00.000Z',
                    window: '0m',
                    nextRunEffectiveAt: '2026-10-19T21:23:00.000Z',
                },
                tick,
                {}
            ).nextRunMatchesScheduledAt
        ).toBe(true);
    });
});

describe('smoke schedule cron', () => {
    // The smoke builds timeOfDay and daysOfWeek from UTC getters, three minutes out.
    const smokeSchedule = (createdAt: string) => {
        const tick = new Date(Date.parse(createdAt) + 180_000);
        tick.setUTCSeconds(0, 0);
        const timeOfDay = `${String(tick.getUTCHours()).padStart(2, '0')}:${String(
            tick.getUTCMinutes()
        ).padStart(2, '0')}`;
        const cron = getCanonicalScheduleCron(timeOfDay, [tick.getUTCDay() as 0]);

        return { tick, cron, nextRunAt: getNextScheduleRun(cron, 'UTC', new Date(createdAt)) };
    };

    it.each([
        ['2026-10-16T04:27:13Z', '30 4 * * 5'],
        ['2026-10-19T18:44:56Z', '47 18 * * 1'],
        ['2026-10-19T23:57:30Z', '0 0 * * 2'],
        ['2026-10-18T23:59:59Z', '2 0 * * 1'],
    ])('schedules %s for the intended UTC minute (%s)', (createdAt, expectedCron) => {
        const { tick, cron, nextRunAt } = smokeSchedule(createdAt);

        expect(cron).toBe(expectedCron);
        expect(nextRunAt.toISOString()).toBe(tick.toISOString());
    });
});
