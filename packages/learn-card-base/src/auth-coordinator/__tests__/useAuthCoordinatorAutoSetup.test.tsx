/** @vitest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthConfigOverrides, setAuthConfigOverrides } from '../../config/authConfig';
import { useAuthCoordinatorAutoSetup } from '../useAuthCoordinatorAutoSetup';

import type { AuthCoordinatorContextValue } from '../AuthCoordinatorProvider';

const createMigrationCoordinator = (
    migrate: ReturnType<typeof vi.fn>
): AuthCoordinatorContextValue =>
    ({
        state: {
            status: 'needs_migration',
            authUser: { id: 'user-1', providerType: 'firebase' },
            migrationData: { web3AuthKey: 'legacy-private-key' },
        },
        setupNewKey: vi.fn(),
        migrate,
    }) as unknown as AuthCoordinatorContextValue;

describe('useAuthCoordinatorAutoSetup migration gate', () => {
    beforeEach(() => {
        clearAuthConfigOverrides();
    });

    afterEach(() => {
        clearAuthConfigOverrides();
    });

    it('does not migrate when the cohort flag is false and autoMigrate is omitted', () => {
        setAuthConfigOverrides({ sssCohortEnabled: false });
        const migrate = vi.fn().mockResolvedValue(undefined);

        renderHook(() =>
            useAuthCoordinatorAutoSetup(createMigrationCoordinator(migrate), {
                generatePrivateKey: vi.fn(),
                didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zLegacy'),
            })
        );

        expect(migrate).not.toHaveBeenCalled();
    });

    it('migrates when autoMigrate explicitly overrides a disabled cohort flag', async () => {
        setAuthConfigOverrides({ sssCohortEnabled: false });
        const migrate = vi.fn().mockResolvedValue(undefined);

        renderHook(() =>
            useAuthCoordinatorAutoSetup(createMigrationCoordinator(migrate), {
                generatePrivateKey: vi.fn(),
                didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zLegacy'),
                autoMigrate: true,
            })
        );

        await waitFor(() =>
            expect(migrate).toHaveBeenCalledWith('legacy-private-key', 'did:key:zLegacy')
        );
    });
});
