// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    currentUser: { name: 'Scout' },
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
    BarcodeScanner: {
        checkPermissions: mocks.checkPermissions,
        requestPermissions: mocks.requestPermissions,
    },
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));
vi.mock('learn-card-base', async () => {
    const { useModal } = await import('learn-card-base/components/modals/useModal');
    const { ModalTypes } = await import('learn-card-base/components/modals/types/Modals');
    const { QRCodeScannerStore } = await import('learn-card-base/stores/QRCodeScannerStore');
    return {
        useModal,
        ModalTypes,
        QRCodeScannerStore,
        useCurrentUser: () => mocks.currentUser,
        useGetProfile: () => ({ data: undefined }),
        useGetCurrentLCNUser: () => ({ currentLCNUser: undefined }),
        useGetConnections: () => ({ data: [] }),
        useIsCurrentUserLCNUser: () => ({ data: true }),
        useWallet: () => ({
            initWallet: async () => ({
                id: { did: () => 'did:web:scoutnetwork.org:users:scout' },
                invoke: { getConnections: async () => [] },
            }),
        }),
        useToast: () => ({ presentToast: vi.fn() }),
        getLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
    };
});
vi.mock('@ionic/react', () => ({
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => mocks.currentUser,
}));
vi.mock('learn-card-base/hooks/useSQLiteStorage', () => ({ default: () => ({}) }));
vi.mock('learn-card-base/components/profilePicture/ProfilePicture', () => ({
    default: () => null,
}));
vi.mock('../../hooks/useLogout', () => ({ default: () => ({}) }));
vi.mock('../../helpers/externalLinkHelpers', () => ({ openToS: vi.fn(), openPP: vi.fn() }));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://scoutpass.org',
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ capabilities: {} }),
}));
vi.mock('../network-prompts/hooks/useCheckIfUserInNetwork', () => ({
    useCheckIfUserInNetwork: () => () => true,
}));
vi.mock('../network-prompts/hooks/useJoinLCNetworkModal', () => ({ default: () => ({}) }));
vi.mock('../user-profile/UserProfileSetup', () => ({ default: () => null }));
vi.mock('../share/ShareModal', () => ({ default: () => null }));
vi.mock('../scouts/ScoutsIdView', () => ({ default: () => null }));
vi.mock('../scouts/ScoutPassFooter', () => ({ default: () => null }));
vi.mock('../scoutsID-CMS/ScoutPassIDCMS', () => ({ default: () => null }));
vi.mock('../scoutsID-CMS/scouts-cms.helpers', () => ({
    DEFAULT_COLOR_LIGHT: '#ffffff',
    DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL: '',
    DEFAULT_SCOUTS_WALLPAPER: '',
}));
vi.mock('../recovery', () => ({ RecoverySetupModal: () => null }));
vi.mock('../auth/ReAuthOverlay', () => ({ default: () => null }));
vi.mock('../../pages/adminToolsPage/AdminToolsModal/AdminToolsModal', () => ({
    default: () => null,
}));

import { ModalsProvider, useModalsContext } from 'learn-card-base/components/modals/ModalsContext';
import { useModal } from 'learn-card-base/components/modals/useModal';
import { QRCodeScannerStore } from 'learn-card-base/stores/QRCodeScannerStore';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import QRCodeScannerButton from './QRCodeScannerButton';
import MyScoutsModal from '../scouts/MyScoutsModal';
import QrCodeUserCard from '../qrcode-user-card/QRCodeUserCard';
import ScannerPermissionsPrompt from '../scanner-permissions-prompt/ScannerPermissionsPrompt';
import * as m from '../../paraglide/messages.js';

// Use the real provider and render its open components without Ionic's animations.
const ModalStack = () => {
    const { modals } = useModalsContext();
    return (
        <>
            <output data-testid="open-modal-count">
                {modals.filter(modal => modal.open).length}
            </output>
            {modals.map(modal => {
                const type = React.isValidElement(modal.component) ? modal.component.type : null;
                const name =
                    type === QrCodeUserCard
                        ? 'qr-card'
                        : type === ScannerPermissionsPrompt
                          ? 'permission-prompt'
                          : 'my-scouts';
                return (
                    <div key={modal.id} data-testid={name} data-open={modal.open}>
                        {modal.open && modal.component}
                    </div>
                );
            })}
        </>
    );
};

const MyScoutsLauncher = () => {
    const { newModal } = useModal();
    return (
        <button onClick={() => newModal(<MyScoutsModal branding={BrandingEnum.scoutPass} />)}>
            Open My Scouts
        </button>
    );
};

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    mocks.checkPermissions.mockReset().mockResolvedValue({ camera: 'prompt' });
    mocks.requestPermissions.mockReset().mockResolvedValue({ camera: 'granted' });
    QRCodeScannerStore.set.closeScanner();
    container = document.createElement('div');
    document.body.appendChild(container);
    // RTL 11's render uses the legacy root, which does not reproduce React 18 batching.
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    QRCodeScannerStore.set.closeScanner();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe.each(['header', 'My Scouts'] as const)('%s QR card permission flow', entry => {
    it('closes both the permission prompt and its own QR card after the first grant', async () => {
        await act(async () => {
            root.render(
                <ModalsProvider>
                    {entry === 'header' ? (
                        <QRCodeScannerButton branding={BrandingEnum.scoutPass} />
                    ) : (
                        <MyScoutsLauncher />
                    )}
                    <ModalStack />
                </ModalsProvider>
            );
        });

        if (entry === 'My Scouts') {
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Open My Scouts' }));
            });
        }
        await act(async () => {
            const button =
                entry === 'header'
                    ? screen.getAllByRole('button', { name: m['scanner.scanQR']() })[1]
                    : within(screen.getByTestId('my-scouts')).getByRole('button', { name: '' });
            fireEvent.click(button);
        });
        expect(screen.getByTestId('qr-card').getAttribute('data-open')).toBe('true');

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: m['scanner.scanLabel']() }));
        });
        expect(screen.getByTestId('permission-prompt').getAttribute('data-open')).toBe('true');
        expect(screen.getByTestId('qr-card').getAttribute('data-open')).toBe('true');

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: m['common.continue']() }));
        });

        expect(mocks.requestPermissions).toHaveBeenCalledOnce();
        expect(QRCodeScannerStore.get.showScanner()).toBe(true);
        expect(screen.getByTestId('permission-prompt').getAttribute('data-open')).toBe('false');
        expect(screen.getByTestId('qr-card').getAttribute('data-open')).toBe('false');
        if (entry === 'My Scouts') {
            expect(screen.getByTestId('my-scouts').getAttribute('data-open')).toBe('true');
        }

        await act(async () => {
            QRCodeScannerStore.set.closeScanner();
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(screen.queryByTestId('qr-card')).toBeNull();
        expect(screen.queryByTestId('permission-prompt')).toBeNull();
        expect(screen.getByTestId('open-modal-count').textContent).toBe(
            entry === 'header' ? '0' : '1'
        );
    });
});
