import { describe, expect, it, vi } from 'vitest';
import moment from 'moment';

import { commitExpirationDate } from '../src/components/boost/boostCMS/boostCMSForms/boostCMSDatePicker.helpers';

describe('commitExpirationDate', () => {
    it('commits the selected date and closes the picker', () => {
        const commit = vi.fn(() => undefined);
        const close = vi.fn(() => undefined);

        commitExpirationDate('2026-09-01', commit, close);

        expect(commit).toHaveBeenCalledWith(moment('2026-09-01').toISOString());
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('closes without committing when the picker has no scalar value', () => {
        const commit = vi.fn(() => undefined);
        const close = vi.fn(() => undefined);

        commitExpirationDate(undefined, commit, close);

        expect(commit).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledTimes(1);
    });
});
