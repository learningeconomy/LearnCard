import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

const mocks = vi.hoisted(() => ({
    gate: { isAiEnabled: false, reason: 'disabled_user' },
    fetchProfile: vi.fn(),
    initWallet: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    IonList: ({ children }: React.PropsWithChildren) => <nav>{children}</nav>,
    IonMenuToggle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ enableLearnCardAssistant: true }),
}));
vi.mock('learn-card-base', () => ({
    currentUserStore: { use: { parentLDFlags: () => ({}) } },
    walletStore: { useTracked: { syncState: () => ({ status: 'idle' }) } },
    WalletSyncState: { Syncing: 'syncing', Completed: 'completed' },
    ToastTypeEnum: { Error: 'error' },
    ModalTypes: { Right: 'right' },
    useAiFeatureGate: () => mocks.gate,
    useGetCurrentLCNUser: () => ({ currentLCNUser: { did: 'did:key:learner' } }),
    useGetUnreadUserNotifications: () => ({ data: { notifications: [] } }),
    useToast: () => ({ presentToast: vi.fn() }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useModal: () => ({ newModal: vi.fn() }),
}));
vi.mock('learn-card-base/components/sidemenu/sidemenuHelpers', () => ({
    SideMenuLinksEnum: { adminTools: 'admin', personalize: 'personalize' },
    getSideMenuLinkLabel: () => 'My Assistant',
}));
vi.mock('learn-card-base/hooks/useDeviceTypeByWidth', () => ({
    useDeviceTypeByWidth: () => ({ isMobile: false }),
}));
vi.mock('../../paraglide/messages.js', () => ({
    'sidemenu.links.passport': () => 'Passport',
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    useTheme: () => ({
        theme: { sideMenuRootLinks: [{ id: 'assistant', path: '/ai/assistant' }] },
        getIconSet: () => ({ assistant: () => null }),
        getColorSet: () => ({}),
    }),
}));
vi.mock('../../theme/icons/index', () => ({ IconSetEnum: { sideMenu: 'sideMenu' } }));
vi.mock('../../theme/colors/index', () => ({ ColorSetEnum: { sideMenu: 'sideMenu' } }));
vi.mock('../generic/PreloadingLink', () => ({
    default: ({ children, to }: React.PropsWithChildren<{ to: string }>) => (
        <a href={to}>{children}</a>
    ),
}));
vi.mock('../svgs/CustomSpinner', () => ({ default: () => null }));
vi.mock('../ai-passport/AiPassportPersonalizationContainer', () => ({ default: () => null }));
vi.mock('../notifications/useOpenNotifications', () => ({ default: () => vi.fn() }));
vi.mock('../../pages/dashboard/hooks/useDashboardAsHome', () => ({
    useDashboardAsHome: () => false,
}));
vi.mock('../../pages/my-assistant/learnCardAssistant.api', () => ({
    createLearnCardAssistantAuth: () => ({ did: 'did:key:learner', getHeaders: vi.fn() }),
    fetchLearnCardAssistantProfile: mocks.fetchProfile,
    getInitialAgentUrl: () => 'http://agent.test',
    normalizeAgentUrl: (url: string) => url,
}));

import SideMenuRootLinks from './SideMenuRootLinks';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchProfile.mockResolvedValue({ name: 'Personal Guide' });
});

afterEach(cleanup);

describe('sidebar assistant privacy', () => {
    it.each(['disabled_user', 'disabled_minor'])(
        'does not request an assistant profile for %s, but loads after AI is enabled',
        async reason => {
            mocks.gate = { isAiEnabled: false, reason };
            const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
            const props = {
                activeTab: '/passport',
                setActiveTab: vi.fn(),
                branding: 'learncard' as BrandingEnum,
            };
            const view = render(<SideMenuRootLinks {...props} />, {
                wrapper: ({ children }: React.PropsWithChildren) => (
                    <QueryClientProvider client={client}>{children}</QueryClientProvider>
                ),
            });
            await act(async () => {});
            expect(screen.getByRole('button', { name: 'My Assistant' })).toBeInTheDocument();
            expect(mocks.fetchProfile).not.toHaveBeenCalled();

            mocks.gate = { isAiEnabled: true, reason: 'enabled' };
            view.rerender(<SideMenuRootLinks {...props} />);
            expect(await screen.findByRole('link', { name: 'Personal Guide' })).toBeInTheDocument();
            expect(mocks.fetchProfile).toHaveBeenCalledTimes(1);
            view.unmount();
            client.clear();
        }
    );
});
