import { describe } from 'vitest';

/**
 * Simple tag-based describe wrapper for Vitest.
 * Allows filtering via CLI flags:
 *  --tags="@interop,@dcc" to include only matching tags
 *  --tags-not="@interop" to exclude matching tags
 * Or via environment variables:
 *  TEST_TAGS="@interop,@dcc" and TEST_TAGS_NOT="@interop"
 */
type DescribeFn = () => void | Promise<void>;
type BasicDescribe = (name: string, fn: DescribeFn) => void;

export function taggedDescribe(name: string, tags: string[], fn: DescribeFn) {
    const includeTags = [...getFlagValues('tags'), ...getEnvList('TEST_TAGS')];
    const excludeTags = [...getFlagValues('tags-not'), ...getEnvList('TEST_TAGS_NOT')];

    const shouldRun = computeShouldRun(tags, includeTags, excludeTags);

    const runner: BasicDescribe = (shouldRun ? describe : describe.skip) as unknown as BasicDescribe;
    return runner(name, fn);
}

function getFlagValues(flag: string): string[] {
    const values: string[] = [];

    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];

        if (arg === `--${flag}` && process.argv[i + 1]) {
            values.push(process.argv[i + 1]);
            i += 1;
            continue;
        }

        if (arg.startsWith(`--${flag}=`)) {
            const [, val] = arg.split('=');
            if (val) values.push(val);
        }
    }

    return values
        .flatMap(v => v.split(','))
        .map(v => v.trim())
        .filter(Boolean);
}

function getEnvList(name: string): string[] {
    const raw = process.env[name];
    if (!raw) return [];
    return raw
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
}

function computeShouldRun(tags: string[], include: string[], exclude: string[]): boolean {
    // If include list provided, only run when intersection is non-empty
    if (include.length > 0) {
        if (!tags.some(t => include.includes(t))) return false;
    }

    // If exclude list provided, skip when intersection is non-empty
    if (exclude.length > 0) {
        if (tags.some(t => exclude.includes(t))) return false;
    }

    return true;
}
