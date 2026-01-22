/**
 * Unit tests for ExternalConsentFlowDoor race condition
 *
 * BUG: When user clicks "Continue" while consentedContractLoading is true,
 * the component navigates to consent-flow-sync-data instead of waiting
 * for the consent query to complete.
 *
 * These tests verify the fix: navigation should be deferred until
 * the consent query completes.
 */

import * as React from 'react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Ensure React is in scope for JSX
global.React = React;

// Mock query-string before it's imported
vi.mock('query-string', () => ({
    default: {
        parse: vi.fn(() => ({
            uri: 'lc:network:localhost:contract:test-123',
            returnTo: 'https://example.com/callback',
            recipientToken: undefined,
        })),
    },
    parse: vi.fn(() => ({
        uri: 'lc:network:localhost:contract:test-123',
        returnTo: 'https://example.com/callback',
        recipientToken: undefined,
    })),
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => 'web',
        isNativePlatform: () => false,
    },
}));

vi.mock('@capacitor-firebase/authentication', () => ({
    FirebaseAuthentication: {
        signOut: vi.fn(),
    },
}));

// Mock sub-components that have complex dependencies
vi.mock('./GameFlow/FullScreenGameFlow', () => ({
    __esModule: true,
    default: () => <div data-testid="full-screen-game-flow" />,
}));

vi.mock('./ConsentFlowCredFrontDoor', () => ({
    __esModule: true,
    default: () => <div data-testid="consent-flow-cred-front-door" />,
}));

vi.mock('./ConsentFlowError', () => ({
    __esModule: true,
    default: () => <div data-testid="consent-flow-error" />,
}));

// Mock all the heavy dependencies
vi.mock('@ionic/react', () => ({
    IonPage: ({ children, className }: any) => <div data-testid="ion-page" className={className}>{children}</div>,
    IonCol: ({ children }: any) => <div>{children}</div>,
    IonRow: ({ children }: any) => <div>{children}</div>,
    IonSkeletonText: () => <div data-testid="skeleton" />,
    IonSpinner: () => <div data-testid="spinner" />,
}));

vi.mock('react-router-dom', () => ({
    useHistory: vi.fn(),
    useLocation: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ resetQueries: vi.fn() }),
}));

// Mock the entire learn-card-base module to avoid deep crypto dependencies
// Use require for mocks that need to be configurable
const mockFns = {
    useContract: vi.fn(),
    useConsentedContracts: vi.fn(),
    useCurrentUser: vi.fn(),
    initWallet: vi.fn(),
};

vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    __esModule: true,
    default: () => mockFns.useCurrentUser(),
}));

vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    useConsentedContracts: () => mockFns.useConsentedContracts(),
}));

vi.mock('learn-card-base/hooks/useSocialLogins', () => ({
    SocialLoginTypes: {
        apple: 'apple',
        sms: 'sms',
        passwordless: 'passwordless',
        google: 'google',
    },
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mockFns.initWallet }),
    ProfilePicture: () => <div data-testid="profile-picture" />,
    pushUtilities: { revokePushToken: vi.fn() },
    useWeb3Auth: () => ({ logout: vi.fn() }),
    useSQLiteStorage: () => ({ clearDB: vi.fn(), setCurrentUser: vi.fn() }),
    useContract: (...args: any[]) => mockFns.useContract(...args),
    redirectStore: { set: { authRedirect: vi.fn() } },
    ModalTypes: { FullScreen: 'fullscreen' },
    useModal: () => ({ newModal: vi.fn() }),
}));

vi.mock('learn-card-base/stores/authStore', () => ({
    __esModule: true,
    default: { get: { typeOfLogin: () => '', deviceToken: () => '' } },
}));

vi.mock('../../firebase/firebase', () => ({
    auth: () => ({ signOut: vi.fn() }),
}));

vi.mock('../../helpers/externalLinkHelpers', () => ({
    openPP: vi.fn(),
    openToS: vi.fn(),
}));

vi.mock('../../theme/hooks/useTheme', () => ({
    __esModule: true,
    default: () => ({ colors: { defaults: { primaryColor: 'emerald-700' } } }),
}));

// Import after mocks
import { useHistory, useLocation } from 'react-router-dom';
import ExternalConsentFlowDoor from './ExternalConsentFlowDoor';

const mockUseHistory = useHistory as Mock;
const mockUseLocation = useLocation as Mock;

describe('ExternalConsentFlowDoor', () => {
    const mockPush = vi.fn();
    const contractUri = 'lc:network:localhost:contract:test-123';
    const returnTo = 'https://example.com/callback';

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseHistory.mockReturnValue({ push: mockPush });
        mockUseLocation.mockReturnValue({
            search: `?uri=${encodeURIComponent(contractUri)}&returnTo=${encodeURIComponent(returnTo)}`,
            pathname: '/consent-flow-login',
        });

        mockFns.useCurrentUser.mockReturnValue({
            name: 'Test User',
            uid: 'test-uid',
        });

        mockFns.useContract.mockReturnValue({
            data: {
                name: 'Test Contract',
                subtitle: 'Test subtitle',
                image: 'https://example.com/image.png',
            },
            isPending: false,
            error: null,
        });
    });

    describe('Race condition: clicking Continue while consent query is loading', () => {
        it('should NOT navigate to sync-data when clicked while loading (bug reproduction)', async () => {
            // Setup: consent query is still loading, but data exists
            mockFns.useConsentedContracts.mockReturnValue({
                data: undefined, // Data not yet loaded
                isLoading: true,
            });

            render(<ExternalConsentFlowDoor login={true} />);

            // Find and click the Continue button
            const continueButton = screen.getByRole('button', { name: /continue as/i });
            fireEvent.click(continueButton);

            // BUG: Without fix, this navigates to consent-flow-sync-data immediately
            // EXPECTED: Should NOT navigate while loading
            expect(mockPush).not.toHaveBeenCalledWith(
                expect.stringContaining('consent-flow-sync-data')
            );
        });

        it('should wait for consent query to complete before navigating', async () => {
            // Setup: Start with loading state
            const mockConsentData = {
                contract: { uri: contractUri, owner: { did: 'did:example:owner' } },
            };

            // Initially loading
            mockFns.useConsentedContracts.mockReturnValue({
                data: undefined,
                isLoading: true,
            });

            const { rerender } = render(<ExternalConsentFlowDoor login={true} />);

            // Click while loading
            const continueButton = screen.getByRole('button', { name: /continue as/i });
            fireEvent.click(continueButton);

            // Should not have navigated yet
            expect(mockPush).not.toHaveBeenCalled();

            // Now simulate loading complete with consent data
            mockFns.useConsentedContracts.mockReturnValue({
                data: [mockConsentData],
                isLoading: false,
            });

            rerender(<ExternalConsentFlowDoor login={true} />);

            // After loading completes, should handle navigation appropriately
            // (either redirect to returnTo or show appropriate UI)
            await waitFor(() => {
                // Should NOT navigate to sync-data for already-consented user
                const syncDataCalls = mockPush.mock.calls.filter(
                    (call: any) => call[0]?.includes('consent-flow-sync-data')
                );
                expect(syncDataCalls).toHaveLength(0);
            });
        });

        it('should navigate to sync-data only for users who have NOT consented', async () => {
            // Setup: consent query complete, user has NOT consented to this contract
            mockFns.useConsentedContracts.mockReturnValue({
                data: [], // Empty - no consented contracts
                isLoading: false,
            });

            render(<ExternalConsentFlowDoor login={true} />);

            const continueButton = screen.getByRole('button', { name: /continue as/i });
            fireEvent.click(continueButton);

            // For non-consented user, SHOULD navigate to sync-data
            expect(mockPush).toHaveBeenCalledWith(
                expect.stringContaining('consent-flow-sync-data')
            );
        });
    });
});
