import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    environment,
    getInstallIntentReconcilerRuntimeEnvironment,
    parseBrainServiceEnvironment,
} from '@environment';

describe('Install intent reconciler runtime configuration', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('reads updates and removals without changing the startup snapshot', () => {
        const startupDisabled = environment.INSTALL_INTENT_RECONCILER_DISABLED;

        vi.stubEnv('INSTALL_INTENT_RECONCILER_DISABLED', 'true');
        vi.stubEnv('INSTALL_INTENT_RECONCILER_BACKOFF_MS', '0');
        vi.stubEnv('INSTALL_INTENT_RECONCILER_MAX_RETRIES', '1');
        vi.stubEnv('INSTALL_INTENT_RECONCILER_DISABLED_ECOSYSTEM_IDS', 'eco_a,eco_b');
        expect(getInstallIntentReconcilerRuntimeEnvironment()).toMatchObject({
            INSTALL_INTENT_RECONCILER_DISABLED: true,
            INSTALL_INTENT_RECONCILER_BACKOFF_MS: '0',
            INSTALL_INTENT_RECONCILER_MAX_RETRIES: '1',
            INSTALL_INTENT_RECONCILER_DISABLED_ECOSYSTEM_IDS: 'eco_a,eco_b',
        });

        vi.stubEnv('INSTALL_INTENT_RECONCILER_DISABLED', 'false');
        vi.stubEnv('INSTALL_INTENT_RECONCILER_MAX_RETRIES', '5');
        expect(getInstallIntentReconcilerRuntimeEnvironment()).toMatchObject({
            INSTALL_INTENT_RECONCILER_DISABLED: false,
            INSTALL_INTENT_RECONCILER_MAX_RETRIES: '5',
        });

        vi.stubEnv('INSTALL_INTENT_RECONCILER_DISABLED', undefined);
        vi.stubEnv('INSTALL_INTENT_RECONCILER_MAX_RETRIES', undefined);
        const restored = getInstallIntentReconcilerRuntimeEnvironment();
        expect(restored.INSTALL_INTENT_RECONCILER_DISABLED).toBe(false);
        expect(restored.INSTALL_INTENT_RECONCILER_MAX_RETRIES).toBeUndefined();
        expect(environment.INSTALL_INTENT_RECONCILER_DISABLED).toBe(startupDisabled);
    });

    it.each([
        'INSTALL_INTENT_RECONCILER_DISABLED',
        'INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION',
    ])('rejects invalid %s at startup and at runtime', key => {
        vi.stubEnv(key, 'not-a-boolean');

        expect(() => getInstallIntentReconcilerRuntimeEnvironment()).toThrow(key);
        expect(() =>
            parseBrainServiceEnvironment({ NODE_ENV: 'test', [key]: 'not-a-boolean' })
        ).toThrow(key);
    });

    it('validates only reconciler controls at runtime', () => {
        vi.stubEnv('PORT', 'not-a-port');
        vi.stubEnv('INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION', 'false');

        expect(
            getInstallIntentReconcilerRuntimeEnvironment()
                .INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION
        ).toBe(false);
    });
});
