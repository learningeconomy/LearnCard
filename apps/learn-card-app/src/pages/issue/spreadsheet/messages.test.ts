import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../../paraglide/runtime.js';
import { spreadsheetErrorMessage, spreadsheetProblem } from './messages';
import { SpreadsheetError } from './parseSpreadsheet';

afterEach(() => setLocale('en', { reload: false }));

describe('description length errors', () => {
    it.each(['en', 'es', 'fr', 'ar'] as const)(
        'uses the active %s locale for the limit and submit error',
        locale => {
            setLocale(locale, { reload: false });
            const message = spreadsheetProblem('length');
            expect(message).toContain(new Intl.NumberFormat(locale).format(2000));
            expect(spreadsheetErrorMessage(new SpreadsheetError('textLength'))).toBe(message);
            expect(message).not.toBe(spreadsheetErrorMessage(new SpreadsheetError('mapping')));
        }
    );
});
