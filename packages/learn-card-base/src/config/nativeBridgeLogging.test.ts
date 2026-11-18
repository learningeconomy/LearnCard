import { describe, expect, it } from 'vitest';

import { withNativeBridgeLoggingPolicy } from './nativeBridgeLogging';

describe('withNativeBridgeLoggingPolicy', () => {
    it('turns Capacitor bridge logging off and keeps the rest of the config', () => {
        expect(withNativeBridgeLoggingPolicy({ appId: 'x', plugins: { A: {} } })).toEqual({
            appId: 'x',
            plugins: { A: {} },
            loggingBehavior: 'none',
        });
    });

    it('overrides a tenant config that asks for logging', () => {
        expect(
            withNativeBridgeLoggingPolicy({ loggingBehavior: 'production' }).loggingBehavior
        ).toBe('none');
    });
});
