import type {
    InAppMessage,
    InAppMessagePlatform,
    InAppMessagePredicate,
    InAppMessageTrigger,
    InAppMessageVersionOp,
    InAppMessageVersionSource,
} from '@learncard/types';

import {
    countMatchingCredentials,
    credentialMatches,
    type CredentialSummary,
} from './credentialFacts';

export interface InAppMessageEvent {
    event: 'credential.claimed' | 'app.opened';
    occurredAt: number;
    credential?: CredentialSummary;
    accountDid?: string;
}

export interface InAppMessageRuntimeContext {
    platform: InAppMessagePlatform;
    role: string | null;
    versions: Partial<Record<InAppMessageVersionSource, string>>;
    now: number;
    credentials: CredentialSummary[] | null;
    credentialsComplete: boolean;
    recentEvents: InAppMessageEvent[];
}

const parseSemver = (raw: string): [number, number, number] | null => {
    const core = raw.trim().replace(/^v/i, '').split(/[-+]/)[0];
    const parts = core.split('.');

    if (parts.length > 3) return null;

    const nums = parts.map(p => Number(p));

    if (nums.some(n => !Number.isInteger(n) || n < 0)) return null;

    return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
};

export const compareSemver = (a: string, b: string): number | null => {
    const pa = parseSemver(a);
    const pb = parseSemver(b);

    if (!pa || !pb) return null;

    for (let i = 0; i < 3; i += 1) {
        if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
    }

    return 0;
};

const satisfiesOp = (cmp: number, op: InAppMessageVersionOp): boolean => {
    switch (op) {
        case 'lt':
            return cmp < 0;
        case 'lte':
            return cmp <= 0;
        case 'eq':
            return cmp === 0;
        case 'gte':
            return cmp >= 0;
        case 'gt':
            return cmp > 0;
        default:
            return false;
    }
};

const INCOMPLETE_NEGATED_CREDENTIAL = Symbol('incomplete-negated-credential');
type PredicateResult = boolean | typeof INCOMPLETE_NEGATED_CREDENTIAL;

const evaluatePredicateInternal = (
    predicate: InAppMessagePredicate,
    ctx: InAppMessageRuntimeContext,
    underNot: boolean
): PredicateResult => {
    if ('all' in predicate || 'any' in predicate) {
        const children = ('all' in predicate ? predicate.all : predicate.any).map(child =>
            evaluatePredicateInternal(child, ctx, underNot)
        );

        if (children.includes(INCOMPLETE_NEGATED_CREDENTIAL)) {
            return INCOMPLETE_NEGATED_CREDENTIAL;
        }

        return 'all' in predicate ? children.every(Boolean) : children.some(Boolean);
    }

    if ('not' in predicate) {
        const result = evaluatePredicateInternal(predicate.not, ctx, true);

        return result === INCOMPLETE_NEGATED_CREDENTIAL ? INCOMPLETE_NEGATED_CREDENTIAL : !result;
    }

    if ('platform' in predicate) return predicate.platform.includes(ctx.platform);

    if ('role' in predicate) return ctx.role !== null && predicate.role.includes(ctx.role);

    if ('credential' in predicate) {
        if (underNot && !ctx.credentialsComplete) return INCOMPLETE_NEGATED_CREDENTIAL;
        if (!ctx.credentials) return false;

        const { minCount, ...match } = predicate.credential;

        return countMatchingCredentials(ctx.credentials, match, ctx.now) >= minCount;
    }

    if ('version' in predicate) {
        const current = ctx.versions[predicate.version.source];

        if (!current) return false;

        const cmp = compareSemver(current, predicate.version.value);

        if (cmp === null) return false;

        return satisfiesOp(cmp, predicate.version.op);
    }

    return false;
};

export const evaluatePredicate = (
    predicate: InAppMessagePredicate,
    ctx: InAppMessageRuntimeContext
): boolean => evaluatePredicateInternal(predicate, ctx, false) === true;

export const triggerSatisfied = (
    trigger: InAppMessageTrigger | undefined,
    ctx: InAppMessageRuntimeContext
): boolean => {
    if (!trigger) return true;

    const earliest = ctx.now - trigger.windowMinutes * 60 * 1000;

    return ctx.recentEvents.some(event => {
        if (
            event.event !== trigger.event ||
            event.occurredAt < earliest ||
            event.occurredAt > ctx.now
        )
            return false;
        if (!trigger.where) return true;

        return Boolean(
            event.credential && credentialMatches(event.credential, trigger.where, ctx.now)
        );
    });
};

export const messageMatches = (message: InAppMessage, ctx: InAppMessageRuntimeContext): boolean => {
    if (!message.enabled) return false;
    if (message.targeting && !evaluatePredicate(message.targeting, ctx)) return false;

    return triggerSatisfied(message.trigger, ctx);
};

export const pickHighestPriority = (messages: InAppMessage[]): InAppMessage | null => {
    if (messages.length === 0) return null;

    return messages.reduce((best, m) => (m.priority > best.priority ? m : best));
};

export interface PredicateTrace {
    result: boolean;
    label: string;
    children?: PredicateTrace[];
}

export const tracePredicate = (
    predicate: InAppMessagePredicate,
    ctx: InAppMessageRuntimeContext
): PredicateTrace => {
    if ('all' in predicate) {
        const children = predicate.all.map(p => tracePredicate(p, ctx));

        return { result: evaluatePredicate(predicate, ctx), label: 'all (AND)', children };
    }

    if ('any' in predicate) {
        const children = predicate.any.map(p => tracePredicate(p, ctx));

        return { result: evaluatePredicate(predicate, ctx), label: 'any (OR)', children };
    }

    if ('not' in predicate) {
        const child = tracePredicate(predicate.not, ctx);

        return { result: evaluatePredicate(predicate, ctx), label: 'not', children: [child] };
    }

    if ('platform' in predicate) {
        const result = predicate.platform.includes(ctx.platform);

        return {
            result,
            label: `platform in [${predicate.platform.join(', ')}] — actual "${ctx.platform}"`,
        };
    }

    if ('role' in predicate) {
        const result = ctx.role !== null && predicate.role.includes(ctx.role);

        return {
            result,
            label: `role in [${predicate.role.join(', ')}] — actual "${ctx.role ?? '(none)'}"`,
        };
    }

    if ('credential' in predicate) {
        const { minCount, ...match } = predicate.credential;
        const matched = ctx.credentials
            ? countMatchingCredentials(ctx.credentials, match, ctx.now)
            : 0;
        const state = ctx.credentialsComplete ? 'complete' : 'incomplete';

        return {
            result: evaluatePredicate(predicate, ctx),
            label: `credential ${JSON.stringify(match)} ≥ ${minCount} — matched ${matched} of ${
                ctx.credentials?.length ?? 0
            } (${state})`,
        };
    }

    const { source, op, value } = predicate.version;
    const current = ctx.versions[source];

    return {
        result: evaluatePredicate(predicate, ctx),
        label: `version ${source} ${op} ${value} — actual "${current ?? '(unavailable)'}"`,
    };
};

export interface MessageExplanation {
    id: string;
    enabled: boolean;
    matched: boolean;
    trace: PredicateTrace | null;
    triggerSatisfied: boolean;
}

export const explainMessage = (
    message: InAppMessage,
    ctx: InAppMessageRuntimeContext
): MessageExplanation => {
    const targetingTrace = message.targeting ? tracePredicate(message.targeting, ctx) : null;
    const triggered = triggerSatisfied(message.trigger, ctx);
    const matched = messageMatches(message, ctx);
    return {
        id: message.id,
        enabled: message.enabled,
        matched,
        trace: message.trigger
            ? {
                  result: matched,
                  label: 'targeting AND trigger',
                  children: [
                      ...(targetingTrace ? [targetingTrace] : []),
                      {
                          result: triggered,
                          label: `trigger ${message.trigger.event} within ${message.trigger.windowMinutes}m${message.trigger.where ? ` where ${JSON.stringify(message.trigger.where)}` : ''}`,
                      },
                  ],
              }
            : targetingTrace,
        triggerSatisfied: triggered,
    };
};
