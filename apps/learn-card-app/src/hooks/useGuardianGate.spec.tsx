import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useGuardianGate } from './useGuardianGate';

// Mock the dependencies
const mockNewModal = jest.fn();
const mockCloseModal = jest.fn();
const mockInitWallet = jest.fn();

jest.mock('learn-card-base', () => ({
    switchedProfileStore: {
        use: {
            isSwitchedProfile: jest.fn(() => false),
            profileType: jest.fn(() => null),
        },
    },
    currentUserStore: {
        use: {
            parentUserDid: jest.fn(() => null),
        },
    },
    useModal: () => ({
        newModal: mockNewModal,
        closeModal: mockCloseModal,
    }),
    useWallet: () => ({
        initWallet: mockInitWallet,
    }),
    ModalTypes: {
        Center: 'Center',
        Cancel: 'Cancel',
        FullScreen: 'FullScreen',
    },
}));

jest.mock('../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper', () => ({
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
        jest.clearAllMocks();
        // Reset to default non-child profile state
        (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(false);
        (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue(null);
        (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue(null);
    });

    describe('isChildProfile detection', () => {
        it('should return isChildProfile=false when not switched', () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(false);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue(null);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=false when switched to service profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('service');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=false when switched to parent profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(false);
        });

        it('should return isChildProfile=true when switched to child profile', () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('child');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isChildProfile).toBe(true);
        });
    });

    describe('guardedAction - non-child profile passthrough', () => {
        it('should execute action immediately for non-child profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(false);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue(null);

            const action = jest.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should execute action immediately for parent profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('parent');

            const action = jest.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should execute action immediately for service profiles', async () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('service');

            const action = jest.fn().mockResolvedValue(undefined);

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
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue('did:example:parent');

            const action = jest.fn().mockResolvedValue(undefined);

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
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue('did:example:parent');
            mockInitWallet.mockResolvedValue({
                invoke: {
                    hasPin: jest.fn().mockResolvedValue(true),
                },
            });
        });

        it('should show PIN modal for child profile when action is triggered', async () => {
            const action = jest.fn();

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
                    hasPin: jest.fn().mockResolvedValue(false),
                },
            });

            const action = jest.fn();
            const onVerified = jest.fn();

            const { result } = renderHook(() => useGuardianGate({ onVerified }), { wrapper });

            await act(async () => {
                await result.current.guardedAction(action);
            });

            expect(action).toHaveBeenCalledTimes(1);
            expect(onVerified).toHaveBeenCalled();
            expect(mockNewModal).not.toHaveBeenCalled();
        });

        it('should call onCancel when parentDid is missing', async () => {
            (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue(null);
            const onCancel = jest.fn();
            const action = jest.fn();

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
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue('did:example:parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            expect(result.current.isGuardianVerified).toBe(false);
        });

        it('should clear verification when clearVerification is called', () => {
            (switchedProfileStore.use.isSwitchedProfile as jest.Mock).mockReturnValue(true);
            (switchedProfileStore.use.profileType as jest.Mock).mockReturnValue('child');
            (currentUserStore.use.parentUserDid as jest.Mock).mockReturnValue('did:example:parent');

            const { result } = renderHook(() => useGuardianGate(), { wrapper });

            act(() => {
                result.current.clearVerification();
            });

            expect(result.current.isGuardianVerified).toBe(false);
        });
    });

    describe('options callbacks', () => {
        it('should accept onVerified callback', () => {
            const onVerified = jest.fn();

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
