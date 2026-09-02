import { describe, it, expect } from 'vitest';

import * as m from '../../paraglide/messages.js';
import { NEW_BOOST_LABEL_KEYS } from './newBoostLabelKeys';

/**
 * NewBoostButton resolves its per-category label via a dynamic
 * `(m as Record)[labelKey]()` lookup from NEW_LABEL_KEYS — invisible to both
 * i18n CI guards (which only catch literal `m['…']`), so a stale/typo'd key
 * silently renders an empty label. The component's table is built from
 * `NEW_BOOST_LABEL_KEYS`, so validating these keys validates the table.
 */
const resolves = (key: string): boolean =>
    typeof (m as Record<string, unknown>)[key] === 'function';

describe('NewBoostButton message-key table', () => {
    it.each(Object.entries(NEW_BOOST_LABEL_KEYS))(
        '%s → "%s" resolves to a Paraglide message',
        (_name, key) => {
            expect(resolves(key)).toBe(true);
        }
    );
});
