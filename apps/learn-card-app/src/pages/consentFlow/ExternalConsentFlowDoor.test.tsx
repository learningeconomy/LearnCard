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
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
        stringify: vi.fn(() => 'uri=lc%3Anetwork%3Alocalhost%3Acontract%3Atest-123'),
    },
    parse: vi.fn(() => ({
        uri: 'lc:network:localhost:contract:test-123',
        returnTo: 'https://example.com/callback',
        recipientToken: undefined,
    })),
    stringify: vi.fn(() => 'uri=lc%3Anetwork%3Alocalhost%3Acontract%3Atest-123'),
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => 'web',
        isNativePlatform: () => false,
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
    IonPage: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
        <div data-testid="ion-page" className={className}>
            {children}
        </div>
    ),
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSkeletonText: () => <div data-testid="skeleton" />,
    IonSpinner: () => <div data-testid="spinner" />,
}));

vi.mock('react-router-dom', () => ({
    useHistory: vi.fn(),
    useLocation: vi.fn(),
}));

// Mock the entire learn-card-base module to avoid deep crypto dependencies
// Use require for mocks that need to be configurable
const mockFns = {
    useContract: vi.fn(),
    useConsentedContracts: vi.fn(),
    useCurrentUser: vi.fn(),
    useGetCurrentLCNUser: vi.fn(),
    getAvailableProfiles: vi.fn(),
    switchedDid: undefined as string | undefined,
    initWallet: vi.fn(),
    presentToast: vi.fn(),
};

vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    __esModule: true,
    default: () => mockFns.useCurrentUser(),
}));
vi.mock('learn-card-base/hooks/useGetCurrentLCNUser', () => ({
    default: () => mockFns.useGetCurrentLCNUser(),
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

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({
        name: 'LearnCard',
        loginRedirectPath: '/login',
    }),
}));

vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: vi.fn() }),
    useProfileSnapshotCapture: () => ({ capture: vi.fn(), snapshotRef: { current: null } }),
    AnalyticsEvents: {
        CONSENT_FLOW_STARTED: 'consent_flow_started',
    },
    ProfileBuildMethod: {
        Manual: 'manual',
    },
    ACCOUNT_CREATED_AT_KEY: 'account_created_at',
    SESSION_START_KEY: 'session_start',
}));

vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => ({ signOut: vi.fn() }),
    getLogger: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    }),
    useWallet: () => ({ initWallet: mockFns.initWallet }),
    UserProfilePicture: ({ user }: { user: { image?: string; displayName?: string } }) => (
        <img src={user.image} alt={user.displayName} />
    ),
    pushUtilities: { revokePushToken: vi.fn() },
    useAuthCoordinator: () => ({ logout: vi.fn(), state: { status: 'idle' } }),
    useSQLiteStorage: () => ({ clearDB: vi.fn(), setCurrentUser: vi.fn() }),
    useContract: (...args: unknown[]) => mockFns.useContract(...args),
    redirectStore: { set: { authRedirect: vi.fn() } },
    ModalTypes: { FullScreen: 'fullscreen' },
    UploadTypesEnum: {
        Resume: 'resume',
        Certificate: 'certificate',
        Transcript: 'transcript',
        Diploma: 'diploma',
        RawVC: 'raw-vc',
    },
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: mockFns.presentToast }),
    useModal: () => ({ newModal: vi.fn() }),
}));

vi.mock('learn-card-base/stores/authStore', () => ({
    __esModule: true,
    default: { get: { typeOfLogin: () => '', deviceToken: () => '' } },
}));

vi.mock('learn-card-base/stores/NetworkStore', () => ({
    __esModule: true,
    networkStore: {
        get: {
            networkUrl: () => '',
            networkApiUrl: () => '',
            cloudUrl: () => '',
            xapiUrl: () => '',
            apiEndpoint: () => '',
            aiServiceUrl: () => '',
            tenantId: () => '',
        },
        set: {
            networkUrl: vi.fn(),
            networkApiUrl: vi.fn(),
            cloudUrl: vi.fn(),
            xapiUrl: vi.fn(),
            apiEndpoint: vi.fn(),
            aiServiceUrl: vi.fn(),
            tenantId: vi.fn(),
        },
        use: {
            networkUrl: () => '',
            networkApiUrl: () => '',
            cloudUrl: () => '',
            xapiUrl: () => '',
            apiEndpoint: () => '',
            aiServiceUrl: () => '',
            tenantId: () => '',
        },
    },
}));

vi.mock('learn-card-base/stores/walletStore', () => ({
    __esModule: true,
    walletStore: {
        get: {
            wallet: () => null,
            isMigrating: () => false,
            syncState: () => ({ status: 0, text: null }),
        },
        set: {
            wallet: vi.fn(),
            isMigrating: vi.fn(),
            syncState: vi.fn(),
            setIsSyncing: vi.fn(),
        },
        use: {
            wallet: () => null,
            isMigrating: () => false,
            syncState: () => ({ status: 0, text: null }),
        },
    },
    switchedProfileStore: {
        get: {
            switchedDid: () => undefined,
            profileType: () => null,
            isSwitchedProfile: () => false,
        },
        set: {
            switchedDid: vi.fn(),
            profileType: vi.fn(),
        },
        use: {
            switchedDid: () => mockFns.switchedDid,
            profileType: () => null,
            isSwitchedProfile: () => false,
        },
    },
}));

vi.mock('../../firebase/firebase', () => ({
    auth: () => ({ signOut: vi.fn() }),
}));

vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAuthCoordinator: () => ({
        logout: vi.fn().mockResolvedValue(undefined),
        state: { status: 'idle' },
    }),
}));

vi.mock('../../config/bootstrapTenantConfig', () => ({
    getLoginRedirectUrl: () => 'https://example.com/login',
}));

vi.mock('../../stores/resumeBuilderStore', () => ({
    resumeBuilderStore: {
        set: {
            resetStore: vi.fn(),
        },
    },
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

    let queryClient: QueryClient;
    const renderDoor = () =>
        render(<ExternalConsentFlowDoor login={true} />, {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        });
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        mockFns.switchedDid = undefined;
        mockFns.getAvailableProfiles.mockResolvedValue({ records: [], hasMore: false });
        mockFns.initWallet.mockResolvedValue({
            invoke: { getAvailableProfiles: mockFns.getAvailableProfiles },
        });
        mockFns.useConsentedContracts.mockReturnValue({ data: [], isLoading: false });

        mockUseHistory.mockReturnValue({ push: mockPush });
        mockUseLocation.mockReturnValue({
            search: `?uri=${encodeURIComponent(contractUri)}&returnTo=${encodeURIComponent(
                returnTo
            )}`,
            pathname: '/consent-flow-login',
        });

        mockFns.useCurrentUser.mockReturnValue({
            name: 'Test User',
            uid: 'test-uid',
        });
        mockFns.useGetCurrentLCNUser.mockReturnValue({
            currentLCNUser: null,
            currentLCNUserLoading: false,
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

    afterEach(() => queryClient.clear());
    it('shows the selected organization identity after wallet restoration', () => {
        mockFns.useCurrentUser.mockReturnValue({ name: '', profileImage: '', uid: 'test-uid' });
        mockFns.useGetCurrentLCNUser.mockReturnValue({
            currentLCNUser: {
                displayName: 'Demo Organization',
                image: 'https://example.com/org.png',
                profileId: 'demo-org',
            },
            currentLCNUserLoading: false,
        });
        mockFns.useConsentedContracts.mockReturnValue({ data: [], isLoading: false });

        renderDoor();

        expect(screen.getByRole('button', { name: 'Continue as Demo Organization' })).toBeTruthy();
        expect(screen.getByRole('img', { name: 'Demo Organization' }).getAttribute('src')).toBe(
            'https://example.com/org.png'
        );
    });

    it('restores a child’s family identity when its network profile is blank', async () => {
        mockFns.switchedDid = 'did:web:localhost%3A4000:users:child-id';
        mockFns.useCurrentUser.mockReturnValue({ name: '', profileImage: '', uid: 'parent-auth' });
        mockFns.useGetCurrentLCNUser.mockReturnValue({
            currentLCNUser: {
                profileId: 'child-id',
                did: mockFns.switchedDid,
                displayName: '',
                image: '',
            },
            currentLCNUserLoading: false,
        });
        mockFns.getAvailableProfiles.mockResolvedValue({
            records: [
                {
                    profile: { profileId: 'child-id', did: mockFns.switchedDid },
                    manager: { displayName: 'Lil Demo', image: 'https://example.com/child.png' },
                },
            ],
            hasMore: false,
        });

        renderDoor();

        await screen.findByRole('button', { name: 'Continue as Lil Demo' });
        expect(screen.getByRole('img', { name: 'Lil Demo' }).getAttribute('src')).toBe(
            'https://example.com/child.png'
        );
    });

    it.each([
        {
            displayName: 'Updated Child',
            image: '',
            expectedName: 'Updated Child',
            expectedImage: 'https://example.com/family.png',
        },
        {
            displayName: '',
            image: 'https://example.com/profile.png',
            expectedName: 'Lil Demo',
            expectedImage: 'https://example.com/profile.png',
        },
    ])(
        'keeps explicit profile identity ahead of family metadata: $expectedName',
        async ({ displayName, image, expectedName, expectedImage }) => {
            mockFns.switchedDid = 'did:web:localhost%3A4000:users:child-id';
            mockFns.useCurrentUser.mockReturnValue({
                name: '',
                profileImage: '',
                uid: 'parent-auth',
            });
            mockFns.useGetCurrentLCNUser.mockReturnValue({
                currentLCNUser: { profileId: 'child-id', displayName, image },
                currentLCNUserLoading: false,
            });
            mockFns.getAvailableProfiles.mockResolvedValue({
                records: [
                    {
                        profile: { profileId: 'child-id' },
                        manager: {
                            displayName: 'Lil Demo',
                            image: 'https://example.com/family.png',
                        },
                    },
                ],
                hasMore: false,
            });

            renderDoor();

            await screen.findByRole('button', { name: `Continue as ${expectedName}` });
            await waitFor(() =>
                expect(screen.getByRole('img', { name: expectedName }).getAttribute('src')).toBe(
                    expectedImage
                )
            );
        }
    );

    it('waits for the child’s identity instead of allowing consent as an opaque account ID', () => {
        mockFns.switchedDid = 'did:web:localhost%3A4000:users:child-id';
        mockFns.useCurrentUser.mockReturnValue({ name: '', profileImage: '', uid: 'parent-auth' });
        mockFns.useGetCurrentLCNUser.mockReturnValue({
            currentLCNUser: { profileId: 'child-id', displayName: '', image: '' },
            currentLCNUserLoading: false,
        });
        mockFns.getAvailableProfiles.mockReturnValue(new Promise<unknown>(() => {}));

        renderDoor();

        expect(
            screen.getByRole('button', { name: 'Loading profile...' }).hasAttribute('disabled')
        ).toBe(true);
        expect(screen.queryByRole('button', { name: 'Continue as child-id' })).toBeNull();
    });

    describe('Race condition: clicking Continue while consent query is loading', () => {
        it('should NOT navigate to sync-data when clicked while loading (bug reproduction)', async () => {
            // Setup: consent query is still loading, but data exists
            mockFns.useConsentedContracts.mockReturnValue({
                data: undefined, // Data not yet loaded
                isLoading: true,
            });

            renderDoor();

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

            const { rerender } = renderDoor();

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
                    (call: unknown[]) =>
                        typeof call[0] === 'string' && call[0].includes('consent-flow-sync-data')
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

            renderDoor();

            const continueButton = screen.getByRole('button', { name: /continue as/i });
            fireEvent.click(continueButton);

            // For non-consented user, SHOULD navigate to sync-data
            expect(mockPush).toHaveBeenCalledWith(
                expect.stringContaining('consent-flow-sync-data')
            );
        });
    });
});
