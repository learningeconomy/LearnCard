import type { InAppMessage } from '@learncard/types';
import { DEFAULT_SUPPRESSED_ROUTE_PREFIXES, isRouteSuppressed } from '../routeSuppression';
import {
    compareSemver,
    evaluatePredicate,
    explainMessage,
    messageMatches,
    pickHighestPriority,
    tracePredicate,
    type InAppMessageRuntimeContext,
} from '../predicates';

const ctx = (overrides: Partial<InAppMessageRuntimeContext> = {}): InAppMessageRuntimeContext => ({
    platform: 'ios',
    role: 'learner',
    versions: { native: '1.0.5', web: '2.3.1', capgo: '1.0.7' },
    ...overrides,
});

describe('compareSemver', () => {
    it('orders by major, minor, patch', () => {
        expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
        expect(compareSemver('1.2.0', '1.1.9')).toBe(1);
        expect(compareSemver('2.0.0', '2.0.0')).toBe(0);
    });

    it('tolerates v-prefix, missing segments, and prerelease/build', () => {
        expect(compareSemver('v1.2.3', '1.2.3')).toBe(0);
        expect(compareSemver('1.2', '1.2.0')).toBe(0);
        expect(compareSemver('1.0.0-beta.1', '1.0.0')).toBe(0);
    });

    it('returns null for unparseable input', () => {
        expect(compareSemver('builtin', '1.0.0')).toBeNull();
        expect(compareSemver('1.0.0', 'abc')).toBeNull();
    });
});

describe('evaluatePredicate', () => {
    it('matches platform membership', () => {
        expect(evaluatePredicate({ platform: ['ios', 'android'] }, ctx())).toBe(true);
        expect(evaluatePredicate({ platform: ['android'] }, ctx())).toBe(false);
    });

    it('matches role membership and handles null role', () => {
        expect(evaluatePredicate({ role: ['learner'] }, ctx())).toBe(true);
        expect(evaluatePredicate({ role: ['teacher'] }, ctx())).toBe(false);
        expect(evaluatePredicate({ role: ['learner'] }, ctx({ role: null }))).toBe(false);
    });

    it('compares versions per source with each operator', () => {
        expect(
            evaluatePredicate({ version: { source: 'capgo', op: 'lt', value: '1.0.8' } }, ctx())
        ).toBe(true);
        expect(
            evaluatePredicate({ version: { source: 'native', op: 'gte', value: '1.0.5' } }, ctx())
        ).toBe(true);
        expect(
            evaluatePredicate({ version: { source: 'web', op: 'gt', value: '3.0.0' } }, ctx())
        ).toBe(false);
    });

    it('fails closed when the version source is missing or unparseable', () => {
        expect(
            evaluatePredicate(
                { version: { source: 'capgo', op: 'lt', value: '1.0.8' } },
                ctx({ versions: { native: '1.0.5' } })
            )
        ).toBe(false);
        expect(
            evaluatePredicate(
                { version: { source: 'capgo', op: 'lt', value: '1.0.8' } },
                ctx({ versions: { capgo: 'builtin' } })
            )
        ).toBe(false);
    });

    it('combines with all / any / not', () => {
        const tree = {
            all: [
                { platform: ['ios', 'android'] as ['ios', 'android'] },
                { any: [{ role: ['learner'] as [string] }, { role: ['guardian'] as [string] }] },
                {
                    not: {
                        version: { source: 'capgo' as const, op: 'gte' as const, value: '2.0.0' },
                    },
                },
            ],
        };

        expect(evaluatePredicate(tree, ctx())).toBe(true);
        expect(evaluatePredicate(tree, ctx({ role: 'teacher' }))).toBe(false);
        expect(evaluatePredicate(tree, ctx({ platform: 'web' }))).toBe(false);
    });
});

describe('messageMatches', () => {
    const base: InAppMessage = {
        id: 'm1',
        priority: 0,
        dismissible: true,
        frequency: 'once',
        presentation: 'modal',
        title: 'Hi',
        actions: [],
        enabled: true,
    };

    it('matches everyone when no targeting is present', () => {
        expect(messageMatches(base, ctx())).toBe(true);
    });

    it('respects the enabled flag', () => {
        expect(messageMatches({ ...base, enabled: false }, ctx())).toBe(false);
    });

    it('applies targeting when present', () => {
        expect(messageMatches({ ...base, targeting: { platform: ['android'] } }, ctx())).toBe(
            false
        );
    });
});

describe('tracePredicate', () => {
    it('labels leaves with expected vs actual and the result', () => {
        const trace = tracePredicate({ platform: ['android'] }, ctx());

        expect(trace.result).toBe(false);
        expect(trace.label).toContain('platform in [android]');
        expect(trace.label).toContain('actual "ios"');
    });

    it('reports the failing branch inside an all(...) tree', () => {
        const trace = tracePredicate(
            {
                all: [
                    { platform: ['ios'] as ['ios'] },
                    { version: { source: 'capgo' as const, op: 'gte' as const, value: '2.0.0' } },
                ],
            },
            ctx()
        );

        expect(trace.result).toBe(false);
        expect(trace.children?.[0].result).toBe(true);
        expect(trace.children?.[1].result).toBe(false);
    });

    it('marks a version predicate unavailable when the source is missing', () => {
        const trace = tracePredicate(
            { version: { source: 'capgo', op: 'lt', value: '1.0.8' } },
            ctx({ versions: { native: '1.0.5' } })
        );

        expect(trace.result).toBe(false);
        expect(trace.label).toContain('(unavailable)');
    });
});

describe('explainMessage', () => {
    const message: InAppMessage = {
        id: 'm1',
        priority: 0,
        dismissible: true,
        frequency: 'once',
        presentation: 'modal',
        title: 'Hi',
        actions: [],
        enabled: true,
        targeting: { role: ['teacher'] },
    };

    it('returns matched=false with a trace when targeting fails', () => {
        const explanation = explainMessage(message, ctx());

        expect(explanation.id).toBe('m1');
        expect(explanation.matched).toBe(false);
        expect(explanation.trace?.result).toBe(false);
    });

    it('returns a null trace when the message has no targeting', () => {
        const explanation = explainMessage({ ...message, targeting: undefined }, ctx());

        expect(explanation.matched).toBe(true);
        expect(explanation.trace).toBeNull();
    });
});

describe('isRouteSuppressed', () => {
    const prefixes = DEFAULT_SUPPRESSED_ROUTE_PREFIXES;

    it('suppresses exact critical routes and their subpaths', () => {
        expect(isRouteSuppressed('/login', prefixes)).toBe(true);
        expect(isRouteSuppressed('/claim/boost', prefixes)).toBe(true);
        expect(isRouteSuppressed('/consent-flow', prefixes)).toBe(true);
        expect(isRouteSuppressed('/__/auth/action', prefixes)).toBe(true);
    });

    it('allows normal app routes', () => {
        expect(isRouteSuppressed('/wallet', prefixes)).toBe(false);
        expect(isRouteSuppressed('/dashboard', prefixes)).toBe(false);
        expect(isRouteSuppressed('/campfire', prefixes)).toBe(false);
        expect(isRouteSuppressed('/pathways', prefixes)).toBe(false);
    });

    it('does not over-match on prefix collisions', () => {
        expect(isRouteSuppressed('/connections', prefixes)).toBe(false);
        expect(isRouteSuppressed('/logins-history', prefixes)).toBe(false);
    });
});

describe('pickHighestPriority', () => {
    const make = (id: string, priority: number): InAppMessage => ({
        id,
        priority,
        dismissible: true,
        frequency: 'once',
        presentation: 'modal',
        title: id,
        actions: [],
        enabled: true,
    });

    it('returns null for an empty list', () => {
        expect(pickHighestPriority([])).toBeNull();
    });

    it('returns the highest-priority message', () => {
        expect(pickHighestPriority([make('a', 1), make('b', 5), make('c', 3)])?.id).toBe('b');
    });
});
