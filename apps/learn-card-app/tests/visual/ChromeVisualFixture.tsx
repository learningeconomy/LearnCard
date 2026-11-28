import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

import { BackButton, Footer, Header, Title, Toolbar } from './chromeShim';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppButton } from 'learn-card-base/ui/controls/AppButton';
import { AppButtons } from 'learn-card-base/ui/controls/AppButtons';
import { AppOverlayManager } from 'learn-card-base/ui/overlays/AppOverlayManager';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';
import BoostCMSHeader from '../../src/components/boost/boostCMS/BoostCMSHeader/BoostCMSHeader';
import BoostCMSFooter from '../../src/components/boost/boostCMS/BoostCMSFooter/BoostCMSFooter';
import { BoostUserTypeEnum } from '../../src/components/boost/boost-options/boostOptions';
import { BoostCMSStepsEnum } from '../../src/components/boost/boost';
import { CheckListManagerHeader } from '../../src/components/learncard/checklist/CheckListManager/CheckListManagerHeader';
import { FamilyCMSFooter } from '../../src/components/familyCMS/FamilyCMSFooter/FamilyCMSFooter';
import LearnCardFooter from '../../src/components/learncard/LearnCardFooter';
import UserOptionsModal from '../../src/components/userOptions/UserOptionsModal';
import { OnboardingFooter } from '../../src/components/onboarding/onboardingFooter/OnboardingFooter';
import GenericNetworkError from '../../src/components/generic/GenericNetworkError';
import { ResumeBuilderToolbar } from '../../src/components/resume-builder/ResumeBuilderToolbar';
import { AppStoreHeader } from '../../src/pages/appStoreDeveloper/components/AppStoreHeader';
import { DeveloperPortalProvider } from '../../src/pages/appStoreDeveloper/DeveloperPortalContext';
import EndorsementFormFooter from '../../src/components/boost-endorsements/EndorsementForm/EndorsementFormFooter';

/**
 * `chrome-1`: page chrome (header, footer, toolbar, title, back button) in full pages and in
 * AppOverlayModal sheets / dialogs. `&case=<id>` renders one case; `&ins=1` simulates device
 * safe-area insets (top 47, bottom 34, left 10, right 14). Synthetic cases import the chrome from
 * ./chromeShim (Ionic or app-owned); `r-*` cases render the real call-site components.
 */
const params = new URLSearchParams(location.search);
const CASE = params.get('case') ?? 's-page';
const INSETS = params.get('ins') === '1';

const noop = (): void => undefined;
const Rows: React.FC<{ n?: number; label?: string }> = ({ n = 30, label = 'Row' }) => (
    <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: n }, (_, i) => (
            <div key={i} className="rounded-[12px] bg-white p-3 text-sm text-grayscale-900">
                {label} {i + 1}: The quick brown fox jumps over the lazy dog.
            </div>
        ))}
    </div>
);

const Chev = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);

const StdHeader: React.FC<{ title?: string; className?: string; translucent?: boolean }> = ({
    title = 'Page title that is long enough to be truncated on narrow screens',
    className,
    translucent,
}) => (
    <Header className={className} translucent={translucent}>
        <Toolbar>
            <AppButtons slot="start">
                <BackButton defaultHref="/home" />
            </AppButtons>
            <Title>{title}</Title>
            <AppButtons slot="end">
                <AppButton aria-label="More" data-testid="more-btn">
                    More
                </AppButton>
            </AppButtons>
        </Toolbar>
    </Header>
);

const StdFooter: React.FC<{ className?: string; translucent?: boolean }> = ({
    className,
    translucent,
}) => (
    <Footer className={className} translucent={translucent}>
        <Toolbar>
            <div className="flex items-center justify-center gap-2 px-4">
                <button
                    type="button"
                    className="rounded-full bg-grayscale-900 px-6 py-2 text-white"
                >
                    Continue
                </button>
            </div>
        </Toolbar>
    </Footer>
);

const COLORS = [
    'white',
    'transparent',
    '#fffff',
    'light',
    'grayscale-100',
    'grayscale-800',
    'grayscale-900',
];

const DEVCLI_CSS = `
.cli-page { --ion-background-color: #1d2021; }
.cli-header { --ion-background-color: #282828; }
.cli-toolbar { --background: linear-gradient(180deg, #32302f 0%, #282828 100%); --border-color: #3c3836; --color: #ebdbb2; border-bottom: 1px solid #3c3836; }
.cli-title { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; color: #fbf1c7; letter-spacing: 0.02em; }
.cli-back-btn { --color: #a89984; --color-hover: #ebdbb2; --color-focused: #fe8019; }
.cli-back-btn > .app-back-button-native { color: #a89984; }
.cli-back-btn > .app-back-button-native:hover { color: #ebdbb2; }
.cli-tutorial-btn { padding: 6px 12px; background: rgba(69, 133, 136, 0.2); border: 1px solid #458588; border-radius: 6px; color: #83a598; font-size: 12px; font-weight: 500; cursor: pointer; }
`;

type Body = React.FC<{ onClose: () => void }>;

const ModalBody: Body = ({ onClose }) => (
    <AppPage>
        <Header className="ion-no-border">
            <Toolbar>
                <Title>Modal title</Title>
                <AppButtons slot="end">
                    <AppButton aria-label="Close" onClick={onClose} data-testid="modal-close">
                        Close
                    </AppButton>
                </AppButtons>
            </Toolbar>
        </Header>
        <AppContent>
            <Rows n={12} label="Modal row" />
        </AppContent>
        <Footer>
            <Toolbar color="light">
                <div className="px-4 text-sm">Footer toolbar</div>
            </Toolbar>
        </Footer>
    </AppPage>
);

const UserOptionsBody: Body = ({ onClose }) => (
    <UserOptionsModal
        handleCloseModal={onClose}
        handleLogout={noop}
        showFixedFooter
        title="Options"
        footer={<div className="p-2 text-center">Fixed footer</div>}
    />
);

const MODALS: Record<string, { body: Body; options: Record<string, unknown> }> = {
    'm-sheet': {
        body: ModalBody,
        options: {
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 0.95,
            breakpoints: [0, 0.95, 0.95, 1],
            handleBehavior: 'cycle',
        },
    },
    'm-center': {
        body: ModalBody,
        options: {
            cssClass: 'center-modal user-options-modal',
            backdropDismiss: true,
            showBackdrop: true,
        },
    },
    'm-full': { body: ModalBody, options: {} },
    'm-ios-footer': { body: ModalBody, options: { mode: 'ios' } },
    'm-useroptions': {
        body: UserOptionsBody,
        options: { cssClass: 'mobile-modal user-options-modal', handleBehavior: 'cycle' },
    },
};

const ModalCase: React.FC<{ id: string }> = ({ id }) => {
    const spec = MODALS[id];
    const [present, dismiss] = useAppOverlayModal(spec.body, { onClose: () => dismiss() });
    return (
        <AppPage>
            <AppContent>
                <div className="p-4">
                    <button
                        type="button"
                        data-testid="open-modal"
                        className="rounded-[12px] bg-grayscale-900 px-3 py-2 text-white"
                        onClick={() => present(spec.options)}
                    >
                        Open {id}
                    </button>
                </div>
                <Rows n={10} label="Under" />
            </AppContent>
        </AppPage>
    );
};

const PageCase: React.FC<{ id: string }> = ({ id }) => {
    switch (id) {
        case 's-page':
            return (
                <AppPage>
                    <StdHeader />
                    <AppContent data-testid="content">
                        <Rows />
                    </AppContent>
                    <StdFooter />
                </AppPage>
            );
        case 's-noborder':
            return (
                <AppPage>
                    <Header className="ion-no-border">
                        <Toolbar color="light">
                            <Title>No border, light</Title>
                        </Toolbar>
                    </Header>
                    <AppContent data-testid="content">
                        <Rows n={8} />
                    </AppContent>
                    <Footer className="ion-no-border">
                        <Toolbar color="grayscale-800">
                            <div className="px-4 py-2">Dark footer toolbar</div>
                        </Toolbar>
                    </Footer>
                </AppPage>
            );
        case 's-multi':
            return (
                <AppPage>
                    <Header>
                        <Toolbar>
                            <Title>First toolbar</Title>
                        </Toolbar>
                        <Toolbar>
                            <div className="px-4 py-1">
                                <input
                                    aria-label="Search"
                                    placeholder="Search"
                                    className="w-full rounded border px-2"
                                />
                            </div>
                        </Toolbar>
                    </Header>
                    <AppContent data-testid="content">
                        <Rows n={8} />
                    </AppContent>
                    <Footer>
                        <Toolbar>
                            <div className="px-4">Footer one</div>
                        </Toolbar>
                        <Toolbar>
                            <div className="px-4">Footer two</div>
                        </Toolbar>
                    </Footer>
                </AppPage>
            );
        case 's-translucent':
            return (
                <AppPage>
                    <StdHeader translucent />
                    <AppContent fullscreen data-testid="content">
                        <div className="h-[120px] bg-[linear-gradient(90deg,#f97316,#2563eb)]" />
                        <Rows />
                    </AppContent>
                    <StdFooter translucent />
                </AppPage>
            );
        case 's-colors':
            return (
                <AppPage>
                    <AppContent data-testid="content">
                        <div className="flex flex-col gap-2 bg-[#ddeeff] p-2">
                            {COLORS.map(c => (
                                <Toolbar key={c} color={c}>
                                    <Title>color {c}</Title>
                                </Toolbar>
                            ))}
                            <Toolbar color="transparent" mode="ios">
                                <Title>transparent ios</Title>
                            </Toolbar>
                            <Toolbar mode="ios">
                                <Title>default ios</Title>
                                <AppButtons slot="end">
                                    <AppButton>Go</AppButton>
                                </AppButtons>
                            </Toolbar>
                            <Toolbar>
                                <AppButtons slot="start">
                                    <AppButton>Start</AppButton>
                                </AppButtons>
                                <AppButtons slot="end">
                                    <AppButton>End</AppButton>
                                </AppButtons>
                                <Title>Slots around title</Title>
                            </Toolbar>
                            <Toolbar>
                                <Title size="small">Small title</Title>
                            </Toolbar>
                        </div>
                    </AppContent>
                </AppPage>
            );
        case 's-tailwind':
            return (
                <AppPage>
                    <Header color="light" className="rounded-b-[30px] overflow-hidden shadow-md">
                        <Toolbar color="light" className="text-white px-4 py-4!">
                            <div className="p-2 text-grayscale-900">Rounded header (CheckList)</div>
                        </Toolbar>
                    </Header>
                    <AppContent data-testid="content">
                        <Header className="ion-no-border mt-[25px]">
                            <Toolbar className="ion-no-border" color="grayscale-900">
                                <div className="px-4 text-white">
                                    mt-[25px] grayscale-900 (MyData)
                                </div>
                            </Toolbar>
                        </Header>
                        <Toolbar className="w-full sticky top-0" color="light">
                            <div className="px-4">sticky light toolbar (QrCode)</div>
                        </Toolbar>
                        <Header className="resume-builder-toolbar ion-no-border shrink-0 font-poppins">
                            <Toolbar className="[--background:white] [--border-width:0px] [--padding-start:0px] [--padding-end:0px]">
                                <div className="border-b px-5 py-3">Resume toolbar vars</div>
                            </Toolbar>
                        </Header>
                        <Header className="ion-no-border border-b border-grayscale-200">
                            <Toolbar style={{ '--background': 'white' } as React.CSSProperties}>
                                <div className="px-4">style --background (ShareLink)</div>
                            </Toolbar>
                        </Header>
                        <Header className="ion-no-border flex items-center px-5 gap-3">
                            <Toolbar
                                className="ion-no-border flex items-center gap-3"
                                color="grayscale-100"
                            >
                                <div className="px-4">flex header + toolbar (ConsentFlow)</div>
                            </Toolbar>
                        </Header>
                        <Footer className="w-full flex justify-center items-center ion-no-border backdrop-blur-[10px] ion-padding bg-white/60">
                            <Toolbar color="transparent">
                                <div className="px-4">blurred footer (Onboarding)</div>
                            </Toolbar>
                        </Footer>
                        <Rows n={6} />
                    </AppContent>
                </AppPage>
            );
        case 's-devcli':
            return (
                <AppPage className="cli-page">
                    <style>{DEVCLI_CSS}</style>
                    <Header className="cli-header">
                        <Toolbar className="cli-toolbar">
                            <AppButtons slot="start">
                                <BackButton defaultHref="/launchpad" className="cli-back-btn" />
                            </AppButtons>
                            <Title className="cli-title">LearnCard CLI</Title>
                            <AppButtons slot="end">
                                <button className="cli-tutorial-btn" title="Open Tutorials">
                                    📖 Tutorial
                                </button>
                            </AppButtons>
                        </Toolbar>
                    </Header>
                    <AppContent className="ion-no-padding">
                        <Rows n={6} label="$" />
                    </AppContent>
                </AppPage>
            );
        case 'r-boostcms':
            return (
                <AppPage>
                    <BoostCMSHeader
                        boostUserType={BoostUserTypeEnum.someone}
                        selectedVCType={BoostCategoryOptionsEnum.achievement}
                        currentStep={BoostCMSStepsEnum.create}
                        handleNextStep={noop}
                        handlePrevStep={noop}
                        handleConfirmationModal={noop}
                        publishedBoostUri={null}
                        handleSaveAndIssue={noop}
                        isLoading={false}
                        issueToLength={0}
                    />
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                    <BoostCMSFooter
                        boostUserType={BoostUserTypeEnum.someone}
                        selectedVCType={BoostCategoryOptionsEnum.achievement}
                        currentStep={BoostCMSStepsEnum.create}
                        handleNextStep={noop}
                        handlePreview={noop}
                        handleSaveAndQuit={noop}
                        isLoading={false}
                        isSaveLoading={false}
                        handleSubmit={noop}
                    />
                </AppPage>
            );
        case 'r-checklist':
            return (
                <AppPage>
                    <CheckListManagerHeader />
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                </AppPage>
            );
        case 'r-footers':
            return (
                <AppPage>
                    <AppContent>
                        <Rows n={4} />
                    </AppContent>
                    <FamilyCMSFooter
                        handleCreateFamily={noop}
                        handleEditFamily={noop}
                        handleCloseModal={noop}
                    />
                </AppPage>
            );
        case 'r-learncard-footer':
            return (
                <AppPage>
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                    <LearnCardFooter buttonText="Share" buttonAction={noop} />
                </AppPage>
            );
        case 'r-onboarding':
            return (
                <AppPage>
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                    <OnboardingFooter text="Continue" onClick={noop} showBackButton onBack={noop} />
                </AppPage>
            );
        case 'r-useroptions':
            return (
                <AppPage>
                    <UserOptionsModal
                        handleCloseModal={noop}
                        handleLogout={noop}
                        showFixedFooter
                        title="Options"
                        footer={<div className="p-2 text-center">Fixed footer</div>}
                    />
                </AppPage>
            );
        case 'r-network-error':
            return (
                <GenericNetworkError text="Network error" closeModal={noop} handleRetry={noop} />
            );
        case 'r-resume':
            return (
                <AppPage>
                    <ResumeBuilderToolbar
                        loadingAction={null}
                        historyControl={<span>History</span>}
                        onBack={noop}
                        onPreview={noop}
                        onDownload={noop}
                        onPublish={noop}
                    />
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                </AppPage>
            );
        case 'r-appstore':
            return (
                <AppPage>
                    <DeveloperPortalProvider>
                        <AppStoreHeader
                            title="Developer portal"
                            rightContent={<button type="button">Right</button>}
                        />
                    </DeveloperPortalProvider>
                    <AppContent>
                        <Rows n={10} />
                    </AppContent>
                </AppPage>
            );
        case 'r-endorsement':
            return (
                <AppPage>
                    <AppContent>
                        <Rows n={6} />
                    </AppContent>
                    <EndorsementFormFooter handleEndorsementSubmit={noop} showDeclineButton />
                </AppPage>
            );
        default:
            return MODALS[id] ? <ModalCase id={id} /> : <div>Unknown case {id}</div>;
    }
};

const PathReadout: React.FC = () => {
    const loc = useLocation();
    return <output data-testid="ro-path">{loc.pathname}</output>;
};

export const ChromeVisualFixture: React.FC = () => {
    const readyRef = useRef<HTMLOutputElement>(null);
    useLayoutEffect(() => {
        if (INSETS) {
            const s = document.documentElement.style;
            s.setProperty('--safe-area-inset-top', '47px');
            s.setProperty('--safe-area-inset-bottom', '34px');
            s.setProperty('--ion-safe-area-left', '10px');
            s.setProperty('--ion-safe-area-right', '14px');
        }
    }, []);
    // Marked ready after the first passive effects, without a re-render.
    useEffect(() => {
        readyRef.current?.setAttribute('data-testid', 'ro-ready');
    }, []);
    return (
        <AppRoot>
            <div id="ion-view-container-root" className="ion-page absolute inset-0">
                <PageCase id={CASE} />
            </div>
            <div className="pointer-events-none fixed bottom-0 left-0 z-[-1] text-[8px] opacity-0">
                <output ref={readyRef}>yes</output>
                <PathReadout />
            </div>
            <AppOverlayManager />
        </AppRoot>
    );
};

export default ChromeVisualFixture;
