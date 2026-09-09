/** @vitest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('useAuthCoordinatorAutoSetup migration', () => {
    it('migrates a legacy key when the coordinator reaches needs_migration', async () => {
        const migrate = vi.fn().mockResolvedValue(undefined);

        renderHook(() =>
            useAuthCoordinatorAutoSetup(createMigrationCoordinator(migrate), {
                generatePrivateKey: vi.fn(),
                didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zLegacy'),
            })
        );

        await waitFor(() =>
            expect(migrate).toHaveBeenCalledWith('legacy-private-key', 'did:key:zLegacy')
        );
    });

    it('does not migrate when the hook is disabled', () => {
        const migrate = vi.fn().mockResolvedValue(undefined);

        renderHook(() =>
            useAuthCoordinatorAutoSetup(createMigrationCoordinator(migrate), {
                generatePrivateKey: vi.fn(),
                didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zLegacy'),
                enabled: false,
            })
        );

        expect(migrate).not.toHaveBeenCalled();
    });
});
