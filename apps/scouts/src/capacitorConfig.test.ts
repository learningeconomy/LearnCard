import { describe, expect, it } from 'vitest';

import config from '../capacitor.config';

describe('ScoutPass capacitor.config', () => {
    // Capacitor's default ("debug") logs plugin payloads, including SQLite rows with the private key.
    it('turns Capacitor bridge logging off', () => {
        expect(config.loggingBehavior).toBe('none');
    });
});
