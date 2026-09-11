import { describe, expect, it } from 'vitest';

import { adminToolOptions } from './admin-tools.helpers';

describe('adminToolOptions', () => {
    it('does not expose retired internal testing tools', () => {
        expect(adminToolOptions.map(option => option.label)).not.toContain(
            'Guardian Credential Test'
        );
        expect(adminToolOptions.map(option => option.label)).not.toContain('AppEvent Perf Bench');
    });
});
