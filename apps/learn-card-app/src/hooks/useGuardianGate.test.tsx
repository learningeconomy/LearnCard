import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useGuardianGate, clearGuardianVerification } from './useGuardianGate';

// Mock the dependencies
const mockNewModal = vi.fn();
const mockCloseModal = vi.fn();
const mockInitWallet = vi.fn();

vi.mock('learn-card-base', () => ({
    getLogger: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    }),
    switchedProfileStore: {
        use: {
            isSwitchedProfile: vi.fn(() => false),
            profileType: vi.fn(() => null),
        },
        get: {
            switchedDid: vi.fn(() => undefined),
        },
    },
    currentUserStore: {
        use: {
            parentUserDid: vi.fn(() => null),
        },
        get: {
            parentUser: vi.fn(() => null),
        },
    },
    useModal: () => ({
        newModal: mockNewModal,
        closeModal: mockCloseModal,
    }),
    useWallet: () => ({
        initWallet: mockInitWallet,
    }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: null,
    }),
    calculateAge: vi.fn(() => NaN),
    ModalTypes: {
        Center: 'Center',
        Cancel: 'Cancel',
        FullScreen: 'FullScreen',
    },
}));

vi.mock('learn-card-base/stores/guardianApprovalStore', () => ({
    guardianApprovalStore: {
        set: {
            clearAllApprovals: vi.fn(),
            setApproval: vi.fn(),
            clearApproval: vi.fn(),
        },
    },
}));

vi.mock('../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper', () => ({
    FamilyPinWrapper: ({ handleOnSubmit }: { handleOnSubmit: () => void }) => (
        <div data-testid="family-pin-wrapper">
            <button onClick={handleOnSubmit}>Verify</button>
        </div>
    ),
}));

// Import mocked modules to manipulate them
import { switchedProfileStore, currentUserStore } from 'learn-card-base';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useGuardianGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear module-level verification cache so tests don't leak TTL state
        clearGuardianVerification();
        // Reset to default non-child profile state
        (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(false);
        (switchedProfileStore.use.profileType as Mock).mockReturnValue(null);
        (currentUserStore.use.parentUserDid as Mock).mockReturnValue(null);
    });

    describe('isChildProfile detection', () => {
        it('should return isChildProfile=false when not switched', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(false);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue(null);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=false when switched to service profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('service');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=false when switched to parent profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=true when switched to child profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('child');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(true);
        });
    });

    describe('guardedAction - non-child profile passthrough', () => {
        it('should execute action immediately for non-child profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(false);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue(null);

            const action = vi.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should execute action immediately for parent profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('parent');

            const action = vi.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should execute action immediately for service profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('service');

            const action = vi.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });
    });

    describe('guardedAction - skip option', () => {
        it('should execute action immediately when skip=true regardless of profile type', async () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as Mock).mockReturnValue('did:example:parent');

            const action = vi.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate({ skip: true }), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });
    });

    describe('guardedAction - child profile gating', () => {
        beforeEach(() => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as Mock).mockReturnValue('did:example:parent');
            mockInitWallet.mockResolvedValue({
                invoke: {
                    hasPin: vi.fn().mockResolvedValue(true),
                },
            });
        });

        it('should show PIN modal for child profile when action is triggered', async () => {
            const action = vi.fn();

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            // Start the guarded action but don't await (modal will be shown)
            act(() => {
                result.current.guardedAction(action);
            });

            await waitFor(() => {
                expect(mockNewModal).toHaveBeenCalledTimes(1);
            });

            // Action should not be called yet (waiting for PIN)
            expect(action).not.toHaveBeenCalled();
        });

        it('should skip verification and execute action when no PIN is set', async () => {
            mockInitWallet.mockResolvedValue({
                invoke: {
                    hasPin: vi.fn().mockResolvedValue(false),
                },
            });

            const action = vi.fn();
            const onVerified = vi.fn();

            const { result } = renderHook(() => useGuardianGate({ onVerified }), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(onVerified).toHaveBeenCalled();
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should call onCancel when parentDid is missing', async () => {
            (currentUserStore.use.parentUserDid as Mock).mockReturnValue(null);
            const onCancel = vi.fn();
            const action = vi.fn();

            const { result } = renderHook(() => useGuardianGate({ onCancel }), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(onCancel).toHaveBeenCalled();
            expect(action).not.toHaveBeenCalled();
        });
    });

    describe('TTL verification caching', () => {
        it('should return isGuardianVerified=false initially', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as Mock).mockReturnValue('did:example:parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isGuardianVerified).toBe(false);
        });

        it('should clear verification when clearVerification is called', () => {
            (switchedProfileStore.use.isSwitchedProfile as Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as Mock).mockReturnValue('did:example:parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            act(() => {
                result.current.clearVerification();
            });

            expect(result.current.isGuardianVerified).toBe(false);
        });
    });

    describe('options callbacks', () => {
        it('should accept onVerified callback', () => {
            const onVerified = vi.fn();

            const { result } = renderHook(() => useGuardianGate({ onVerified }), { wrapper });

            expect(result.current.guardedAction).toBeDefined();
        });

        it('should accept custom verificationTTL', () => {
            const customTTL = 10 * 60 * 1000; // 10 minutes

            const { result } = renderHook(() => useGuardianGate({ verificationTTL: customTTL }), {
                wrapper,
            });

            expect(result.current.guardedAction).toBeDefined();
        });
    });

    describe('hook return values', () => {
        it('should return all expected properties', () => {
            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current).toHaveProperty('guardedAction');
            expect(result.current).toHaveProperty('isChildProfile');
            expect(result.current).toHaveProperty('isGuardianVerified');
            expect(result.current).toHaveProperty('clearVerification');

            expect(typeof result.current.guardedAction).toBe('function');
            expect(typeof result.current.isChildProfile).toBe('boolean');
            expect(typeof result.current.isGuardianVerified).toBe('boolean');
            expect(typeof result.current.clearVerification).toBe('function');
        });
    });
});
