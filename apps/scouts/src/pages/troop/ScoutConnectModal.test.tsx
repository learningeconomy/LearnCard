// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ScoutConnectModal from './ScoutConnectModal';

vi.mock('@ionic/react', () => ({
    IonList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@capacitor/clipboard', () => ({ Clipboard: { write: vi.fn() } }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

vi.mock('react-router', () => ({ useHistory: () => ({ push: vi.fn() }) }));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    ModalTypes: { Cancel: 'cancel', Center: 'center', FullScreen: 'full-screen' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    useCountBoostRecipients: () => ({ data: 1 }),
    useGetBoostRecipients: () => ({ data: [] }),
    useGetProfile: () => ({ data: { profileId: 'test-profile' } }),
    useModal: () => ({
        newModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    useResolveBoost: () => ({ data: { boostId: 'urn:boost:test' } }),
    useToast: () => ({ presentToast: vi.fn() }),
    useWallet: () => ({ initWallet: vi.fn() }),
    UserProfilePicture: () => null,
}));

vi.mock('../../hooks/useDebounce', () => ({ default: () => vi.fn() }));
vi.mock('../../components/boost/hooks/useBoost', () => ({
    default: () => ({ handleSubmitExistingBoostOther: vi.fn() }),
}));
vi.mock('../../components/boost/boost', () => ({
    BoostCMSIssueTo: {},
    ShortBoostState: {},
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://localhost:3000',
}));

vi.mock('./TroopID', () => ({ default: () => null }));
vi.mock('../../components/qrcode-scanner-button/QRCodeModalContent', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boost-options/boostUserOptions/ShortBoostSomeoneScreen', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boostLoader/BoostLoader', () => ({
    BoostIssuanceLoading: () => null,
}));
vi.mock('../../components/svgs/CopyStack', () => ({ default: () => null }));
vi.mock('../../components/svgs/QRCodeIcon', () => ({ default: () => null }));
vi.mock('../../components/svgs/ShareArrow', () => ({ default: () => null }));
vi.mock('../../components/svgs/AddUserIcon', () => ({ default: () => null }));

describe('ScoutConnectModal', () => {
    afterEach(cleanup);

    it('renders the invite modal when one recipient has received the troop ID', () => {
        expect(() =>
            render(
                <ScoutConnectModal
                    boostUriForClaimLink="urn:boost:test"
                    type="Scout"
                    credential={{ boostId: 'urn:boost:test' } as never}
                />
            )
        ).not.toThrow();
    });
});
