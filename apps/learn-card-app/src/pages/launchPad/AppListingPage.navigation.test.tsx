import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { createTestHistory, TestRouter } from 'learn-card-base/test-utils/testRouter';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import AppListingPage from './AppListingPage';

const state = vi.hoisted(() => ({
    installed: true,
    install: vi.fn(),
    modal: null as React.ReactNode,
    toast: vi.fn(),
    listing: {
        listing_id: 'library',
        slug: 'library',
        display_name: 'Library',
        tagline: 'Learn',
        icon_url: 'https://example.test/icon.png',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: JSON.stringify({ url: 'https://partner.test/app' }),
    },
}));
vi.mock('../../providers/useAuthSettled', () => ({ useAuthSettled: () => true }));
vi.mock('./useAppStore', () => ({
    default: () => ({
        usePublicListing: () => ({ data: state.listing, isLoading: false }),
        useInstallApp: () => ({ mutateAsync: state.install }),
        useUninstallApp: () => ({ mutateAsync: vi.fn() }),
        useInstallCount: () => ({ data: 1 }),
        useIsAppInstalled: () => ({ data: state.installed, isLoading: false }),
    }),
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    useModal: () => ({
        newModal: (node: React.ReactNode) => {
            state.modal = node;
        },
        closeModal: vi.fn(),
        replaceModal: vi.fn(),
    }),
    ModalTypes: { Right: 'right', Center: 'center', FullScreen: 'fullscreen' },
    useConfirmation: () => vi.fn(),
    useIsLoggedIn: () => true,
    useWithdrawConsent: () => ({ mutateAsync: vi.fn() }),
    useWallet: () => ({ initWallet: vi.fn() }),
    useGetAppMetadata: () => ({}),
    useGetAppReviews: () => ({}),
    useToast: () => ({ presentToast: state.toast }),
    ToastTypeEnum: { Error: 'error' },
}));
vi.mock('learn-card-base/stores/redirectStore', () => ({
    default: {
        use: { installIntent: () => null, isOnboardingOpen: () => false },
        get: { installIntent: () => null, isOnboardingOpen: () => false },
        set: {},
    },
}));
vi.mock('@learncard/react', () => ({ ThreeDotVertical: () => null }));
vi.mock('../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({
        guardedAction: async (fn: () => void) => fn(),
        isChildProfile: false,
    }),
}));
vi.mock('../consentFlow/useConsentFlow', () => ({
    useConsentFlowByUri: () => ({ hasConsented: false }),
}));
vi.mock('./EmbedIframeModal', () => ({ EmbedIframeModal: () => null }));
vi.mock('../../components/ai-passport-apps/helpers/AppScreenshotSlider', () => ({
    default: () => null,
}));
vi.mock('../../components/ai-passport-apps/helpers/StaticStarRating', () => ({
    default: () => null,
}));
vi.mock(
    '../../components/ai-passport-apps/AiPassportAppProfileDetails/AiPassportAppProfileRatings',
    () => ({ default: () => null })
);
vi.mock('../consentFlow/ConsentFlowPrivacyAndData', () => ({ default: () => null }));
vi.mock('./GuardianConsentLaunchModal', () => ({ default: () => null }));
vi.mock('./AiTutorConnectedView', () => ({ default: () => null }));
vi.mock('../../components/credentials/AppInstallConsentModal', () => ({
    AppInstallConsentModal: ({ onAccept }: { onAccept: () => void }) => (
        <button onClick={onAccept}>Accept installation</button>
    ),
}));
beforeEach(() => {
    state.installed = true;
    state.modal = null;
    state.install.mockReset().mockResolvedValue(true);
    state.toast.mockClear();
});
afterEach(cleanup);

const setup = (path = '/course?unit=2#lesson') => {
    const history = createTestHistory({
        initialEntries: ['/wallet', `/app/library?launch=1&path=${encodeURIComponent(path)}`],
        initialIndex: 1,
    });
    const view = render(
        <TestRouter history={history}>
            <Routes>
                <Route path="/app/:listingId" element={<AppListingPage />} />
            </Routes>
        </TestRouter>
    );
    return { history, view };
};

it('launches an installed app once at the requested path and Back skips the listing', async () => {
    const { history } = setup();
    await waitFor(() => expect(history.location.pathname).toBe('/apps/library'));
    expect(history.location.state).toMatchObject({
        path: '/course?unit=2#lesson',
        isInstalled: true,
    });
    // One REPLACE: the listing entry became the app, so Back skips it.
    expect(history.entries).toEqual([expect.stringMatching(/^REPLACE \/apps\/library/)]);
    expect(state.install).not.toHaveBeenCalled();
    await act(() => history.goBack());
    expect(history.location.pathname).toBe('/wallet');
});

it('waits for explicit installation consent, then opens the same requested page', async () => {
    state.installed = false;
    const { history } = setup('/learn');
    expect(history.location.pathname).toBe('/app/library');
    fireEvent.click(screen.getByRole('button', { name: /install/i }));
    await waitFor(() => expect(state.modal).not.toBeNull());
    render(<>{state.modal}</>);
    fireEvent.click(screen.getByRole('button', { name: 'Accept installation' }));
    await waitFor(() => expect(history.location.pathname).toBe('/apps/library'));
    expect(state.install).toHaveBeenCalledExactlyOnceWith('library');
    expect(history.location.state).toMatchObject({ path: '/learn', isInstalled: true });
    await act(() => history.goBack());
    expect(history.location.pathname).toBe('/wallet');
});

it('fails closed on unsafe paths without replacing the listing', async () => {
    const { history } = setup('//evil.test');
    await waitFor(() => expect(state.toast).toHaveBeenCalled());
    expect(history.location.pathname).toBe('/app/library');
});

it('does not launch after failed installation', async () => {
    state.installed = false;
    state.install.mockRejectedValueOnce(new Error('offline'));
    const { history } = setup('/learn');
    fireEvent.click(screen.getByRole('button', { name: /install/i }));
    await waitFor(() => expect(state.modal).not.toBeNull());
    render(<>{state.modal}</>);
    fireEvent.click(screen.getByRole('button', { name: 'Accept installation' }));
    await waitFor(() => expect(state.toast).toHaveBeenCalled());
    expect(history.location.pathname).toBe('/app/library');
});

it('does not pull a learner back after they leave while installation is pending', async () => {
    state.installed = false;
    let complete: (installed: boolean) => void = () => {};
    state.install.mockImplementationOnce(
        () =>
            new Promise<boolean>(resolve => {
                complete = resolve;
            })
    );
    const { history } = setup('/learn');
    fireEvent.click(screen.getByRole('button', { name: /install/i }));
    await waitFor(() => expect(state.modal).not.toBeNull());
    render(<>{state.modal}</>);
    fireEvent.click(screen.getByRole('button', { name: 'Accept installation' }));
    await act(() => history.goBack());
    await act(async () => complete(true));
    expect(history.location.pathname).toBe('/wallet');
});
