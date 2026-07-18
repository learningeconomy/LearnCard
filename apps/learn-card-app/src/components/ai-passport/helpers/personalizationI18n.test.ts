import { describe, it, expect } from 'vitest';

import * as m from '../../../paraglide/messages.js';
import { TITLE_KEYS, Q1_OPTION_KEYS, PLACEHOLDER_KEYS } from './personalizationI18n';

/**
 * `personalizationI18n` resolves message keys via a dynamic `m[key]` lookup
 * from constant tables — invisible to both i18n CI guards (the build-time
 * `paraglideOnWarn` and the static `check-i18n-keys.mjs` only catch literal
 * `m['…']`). A wrong/stale key there silently renders nothing with no build or
 * runtime error. This test is the gate: every key in the tables must resolve
 * to a real Paraglide message function.
 */
const resolves = (key: string): boolean =>
    typeof (m as Record<string, unknown>)[key] === 'function';

describe('personalizationI18n message-key tables', () => {
    const tableKeys = [
        ...Object.values(TITLE_KEYS),
        ...Q1_OPTION_KEYS,
        ...Object.values(PLACEHOLDER_KEYS).filter((k): k is string => Boolean(k)),
    ];

    it('references at least the expected number of keys', () => {
        // 3 titles + 5 Q1 options + 2 placeholders
        expect(tableKeys.length).toBe(10);
    });

    it.each(tableKeys)('key "%s" resolves to a Paraglide message', key => {
        expect(resolves(key)).toBe(true);
    });
});
