import type {
    InAppMessage,
    InAppMessagePlatform,
    InAppMessagePredicate,
    InAppMessageVersionOp,
    InAppMessageVersionSource,
} from '@learncard/types';

export interface InAppMessageRuntimeContext {
    platform: InAppMessagePlatform;
    role: string | null;
    versions: Partial<Record<InAppMessageVersionSource, string>>;
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

export const evaluatePredicate = (
    predicate: InAppMessagePredicate,
    ctx: InAppMessageRuntimeContext
): boolean => {
    if ('all' in predicate) return predicate.all.every(p => evaluatePredicate(p, ctx));
    if ('any' in predicate) return predicate.any.some(p => evaluatePredicate(p, ctx));
    if ('not' in predicate) return !evaluatePredicate(predicate.not, ctx);

    if ('platform' in predicate) return predicate.platform.includes(ctx.platform);

    if ('role' in predicate) return ctx.role !== null && predicate.role.includes(ctx.role);

    if ('version' in predicate) {
        const current = ctx.versions[predicate.version.source];

        if (!current) return false;

        const cmp = compareSemver(current, predicate.version.value);

        if (cmp === null) return false;

        return satisfiesOp(cmp, predicate.version.op);
    }

    return false;
};

export const messageMatches = (message: InAppMessage, ctx: InAppMessageRuntimeContext): boolean => {
    if (!message.enabled) return false;
    if (!message.targeting) return true;

    return evaluatePredicate(message.targeting, ctx);
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

        return { result: children.every(c => c.result), label: 'all (AND)', children };
    }

    if ('any' in predicate) {
        const children = predicate.any.map(p => tracePredicate(p, ctx));

        return { result: children.some(c => c.result), label: 'any (OR)', children };
    }

    if ('not' in predicate) {
        const child = tracePredicate(predicate.not, ctx);

        return { result: !child.result, label: 'not', children: [child] };
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
}

export const explainMessage = (
    message: InAppMessage,
    ctx: InAppMessageRuntimeContext
): MessageExplanation => ({
    id: message.id,
    enabled: message.enabled,
    matched: messageMatches(message, ctx),
    trace: message.targeting ? tracePredicate(message.targeting, ctx) : null,
});
