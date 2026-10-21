/**
 * The app passes its locale to the base provider; Nitro enrollment fails
 * closed ("Invalid escrow recoveryLanguage") if it is dropped on the way to
 * the coordinator config.
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

import type { AuthCoordinatorConfig, KeyDerivationStrategy } from '../types';

const configs: AuthCoordinatorConfig[] = [];

vi.mock('../AuthCoordinator', async importOriginal => {
    const actual = await importOriginal<typeof import('../AuthCoordinator')>();
    return {
        ...actual,
        createAuthCoordinator: (config: AuthCoordinatorConfig) => {
            configs.push(config);
            return actual.createAuthCoordinator(config);
        },
    };
});

const { AuthCoordinatorProvider } = await import('../AuthCoordinatorProvider');

const keyDerivation = {
    name: 'mock',
    capabilities: { recovery: false },
    hasLocalKey: vi.fn().mockResolvedValue(false),
    fetchServerKeyStatus: vi.fn().mockResolvedValue({
        exists: false,
        needsMigration: false,
        recoveryMethods: [],
    }),
    deriveKey: vi.fn(),
    setupKey: vi.fn(),
    clearLocalKeys: vi.fn(),
} as unknown as KeyDerivationStrategy;

describe('AuthCoordinatorProvider recovery language', () => {
    it('forwards getRecoveryLanguage to the coordinator config', () => {
        const getRecoveryLanguage = () => 'fr';
        render(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={null}
                getRecoveryLanguage={getRecoveryLanguage}
            >
                <div />
            </AuthCoordinatorProvider>
        );
        expect(configs.at(-1)?.getRecoveryLanguage).toBe(getRecoveryLanguage);
        expect(configs.at(-1)?.getRecoveryLanguage?.()).toBe('fr');
    });
});
