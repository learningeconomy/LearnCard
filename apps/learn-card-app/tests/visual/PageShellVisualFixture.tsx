import React, { useEffect, useRef, useState } from 'react';
import { IonApp } from '@ionic/react';

import { Page, Content, SCROLL_JUSTIFY_END } from './pageShim';
import { AppFooter, AppHeader, AppTitle, AppToolbar } from '../../src/components/chrome';
import { AppButton } from '../../src/components/controls/AppButton';
import { AppButtons } from '../../src/components/controls/AppButtons';
import { AppFab, AppFabButton } from '../../src/components/widgets';
import { AppTabs, AppTabBar, AppTabButton } from '../../src/components/app-shell/AppTabs';
import { AppOutlet } from '../../src/components/app-shell/AppOutlet';
import { AppOverlayManager } from '../../src/components/overlays/AppOverlayManager';
import { useAppOverlayModal } from '../../src/components/overlays/useAppOverlayModal';
import { useLockBodyScroll } from '../../src/pages/pathways/hooks/useLockBodyScroll';
import LegalPageLayout from '../../src/pages/legal/LegalPageLayout';
import { CredentialReceiveScreen } from '../../src/pages/credentialStorage/CredentialReceiveScreen';
import { personaCredentials } from '../../src/pages/dashboard/dashboard.personas';

/**
 * `page-1`: the page shell (page box + scroll content) in full pages, under the tab bar and in
 * AppOverlayModal sheets / dialogs. `&case=<id>` renders one case; `&ins=1` simulates device
 * safe-area insets (top 47, bottom 34, left 10, right 14). Synthetic cases import the page and
 * content from ./pageShim (Ionic or app-owned); `r-*` cases render real call sites.
 */
const params = new URLSearchParams(location.search);
const CASE = params.get('case') ?? 's-basic';
const INSETS = params.get('ins') === '1';

type ScrollApi = {
    scrollToTop: (duration?: number) => Promise<void>;
    scrollToBottom: (duration?: number) => Promise<void>;
    scrollToPoint: (
        x: number | undefined | null,
        y: number | undefined | null,
        duration?: number
    ) => Promise<void>;
    scrollByPoint: (x: number, y: number, duration: number) => Promise<void>;
    getScrollElement: () => Promise<HTMLElement>;
};
type ScrollEv = {
    detail: {
        scrollTop: number;
        scrollLeft: number;
        deltaY: number;
        startY: number;
        currentY: number;
        type?: string;
        isScrolling?: boolean;
    };
};

const Rows: React.FC<{ n?: number; label?: string }> = ({ n = 30, label = 'Row' }) => (
    <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: n }, (_, i) => (
            <div key={i} className="rounded-[12px] bg-white p-3 text-sm text-grayscale-900">
                {label} {i + 1}: The quick brown fox jumps over the lazy dog.
            </div>
        ))}
    </div>
);

const Header: React.FC<{ title?: string; translucent?: boolean; children?: React.ReactNode }> = ({
    title = 'Page shell',
    translucent,
    children,
}) => (
    <AppHeader translucent={translucent}>
        <AppToolbar>
            <AppTitle>{title}</AppTitle>
            {children && <AppButtons slot="end">{children}</AppButtons>}
        </AppToolbar>
    </AppHeader>
);

const Footer: React.FC<{ translucent?: boolean }> = ({ translucent }) => (
    <AppFooter translucent={translucent}>
        <AppToolbar>
            <div className="px-4 py-2 text-sm text-grayscale-900">Footer toolbar</div>
        </AppToolbar>
    </AppFooter>
);

const ScrollCase: React.FC = () => {
    const ref = useRef<ScrollApi>(null);
    const [last, setLast] = useState('none');
    const [starts, setStarts] = useState(0);
    const [ends, setEnds] = useState(0);
    const [el, setEl] = useState('');
    const call = async (fn: (api: ScrollApi) => Promise<void>): Promise<void> => {
        const api = ref.current;
        if (!api) return;
        await fn(api);
        const scrollEl = await api.getScrollElement();
        setEl(`${scrollEl.scrollTop}/${scrollEl.scrollHeight}/${scrollEl.clientHeight}`);
    };
    return (
        <Page>
            <Header title="Scroll API">
                <AppButton
                    data-testid="to-bottom"
                    onClick={() => void call(a => a.scrollToBottom())}
                >
                    Bottom
                </AppButton>
                <AppButton
                    data-testid="to-point"
                    onClick={() => void call(a => a.scrollToPoint(0, 300))}
                >
                    300
                </AppButton>
                <AppButton
                    data-testid="by-point"
                    onClick={() => void call(a => a.scrollByPoint(0, 100, 0))}
                >
                    +100
                </AppButton>
                <AppButton data-testid="to-top" onClick={() => void call(a => a.scrollToTop())}>
                    Top
                </AppButton>
                <AppButton
                    data-testid="to-bottom-anim"
                    onClick={() => void call(a => a.scrollToBottom(300))}
                >
                    Anim
                </AppButton>
            </Header>
            <Content
                ref={ref as never}
                scrollEvents
                onIonScrollStart={() => setStarts(n => n + 1)}
                onIonScrollEnd={() => setEnds(n => n + 1)}
                onIonScroll={(e: ScrollEv) => {
                    const d = e.detail;
                    setLast(
                        `${d.type}:${d.scrollTop}:${d.currentY}:${d.startY}:${d.deltaY}:${d.isScrolling}`
                    );
                }}
            >
                <Rows n={40} />
            </Content>
            <output data-testid="ro-ionscroll">{last}</output>
            <output data-testid="ro-starts">{starts}</output>
            <output data-testid="ro-ends">{ends}</output>
            <output data-testid="ro-el">{el}</output>
        </Page>
    );
};

const ColorBox: React.FC<{ label: string } & Record<string, unknown>> = ({ label, ...props }) => (
    <div className="relative h-[96px] w-full border-b border-grayscale-300">
        <Content {...props}>
            <p className="p-2 text-sm">{label}</p>
            <Rows n={2} />
        </Content>
    </div>
);

const LockCase: React.FC = () => {
    useLockBodyScroll(true);
    return (
        <Page>
            <Header title="Locked" />
            <Content>
                <Rows />
            </Content>
        </Page>
    );
};

type Body = React.FC<{ onClose: () => void }>;
const ModalBody: (fullscreen: boolean) => Body = fullscreen => {
    const B: Body = ({ onClose }) => (
        <Page>
            <AppHeader className="ion-no-border" translucent={fullscreen}>
                <AppToolbar>
                    <AppTitle>Modal title</AppTitle>
                    <AppButtons slot="end">
                        <AppButton aria-label="Close" onClick={onClose} data-testid="modal-close">
                            Close
                        </AppButton>
                    </AppButtons>
                </AppToolbar>
            </AppHeader>
            <Content fullscreen={fullscreen}>
                <Rows n={20} label="Modal row" />
            </Content>
            <Footer translucent={fullscreen} />
        </Page>
    );
    return B;
};
const PlainModalBody: Body = () => (
    <Content className="ion-padding">
        <Rows n={20} label="Bare content" />
    </Content>
);

const MODALS: Record<string, { body: Body; options: Record<string, unknown> }> = {
    'm-sheet': {
        body: ModalBody(false),
        options: {
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 0.6,
            breakpoints: [0, 0.6, 1],
            handleBehavior: 'cycle',
        },
    },
    'm-sheet-full': {
        body: ModalBody(true),
        options: {
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 1,
            breakpoints: [0, 0.6, 1],
        },
    },
    'm-center': {
        body: ModalBody(false),
        options: {
            cssClass: 'center-modal user-options-modal',
            backdropDismiss: true,
            showBackdrop: true,
        },
    },
    'm-full': { body: ModalBody(true), options: {} },
    'm-ios': { body: ModalBody(true), options: { mode: 'ios' } },
    'm-bare': { body: PlainModalBody, options: {} },
};

const ModalCase: React.FC<{ id: string }> = ({ id }) => {
    const spec = MODALS[id];
    const [present, dismiss] = useAppOverlayModal(spec.body, { onClose: () => dismiss() });
    return (
        <Page>
            <Content>
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
            </Content>
        </Page>
    );
};

const TabsCase: React.FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
    <AppTabs>
        <AppOutlet>
            <Page>
                <Header title="Tab page" translucent={fullscreen} />
                <Content fullscreen={fullscreen} color="grayscale-100">
                    <Rows />
                </Content>
            </Page>
        </AppOutlet>
        <AppTabBar className="lc-footer-nav">
            {['one', 'two', 'three'].map(tab => (
                <AppTabButton key={tab} tab={tab} href={`/${tab}`}>
                    <span className="text-[11px] font-semibold text-grayscale-900">{tab}</span>
                </AppTabButton>
            ))}
        </AppTabBar>
    </AppTabs>
);

const PageCase: React.FC<{ id: string }> = ({ id }) => {
    switch (id) {
        case 's-basic':
            return (
                <Page className="bg-grayscale-100" data-testid="page">
                    <Header />
                    <Content>
                        <Rows />
                    </Content>
                    <Footer />
                </Page>
            );
        case 's-fullscreen':
            return (
                <Page>
                    <Header translucent title="Fullscreen" />
                    <Content fullscreen>
                        <Rows />
                    </Content>
                    <Footer translucent />
                </Page>
            );
        case 's-padding':
            return (
                <Page>
                    <Header title="Padding" />
                    <Content className="ion-padding" color="grayscale-100">
                        <Rows n={12} />
                    </Content>
                </Page>
            );
        case 's-colors':
            return (
                <Page>
                    <Content>
                        <ColorBox label="default" />
                        <ColorBox label="grayscale-800" color="grayscale-800" />
                        <ColorBox
                            label="grayscale-100 + class"
                            color="grayscale-100"
                            className="bg-grayscale-100"
                        />
                        <ColorBox
                            label="emerald-700"
                            color="emerald-700"
                            className="flex flex-col grow bg-emerald-700"
                        />
                        <ColorBox label="teal-400" color="teal-400" />
                        <ColorBox
                            label="transparent"
                            color="transparent"
                            className="transparent-modal-backdrop"
                        />
                        <ColorBox
                            label="style --background"
                            style={{ '--background': '#EFF0F5' }}
                        />
                        <ColorBox
                            label="class --background"
                            className="font-poppins [--background:#EFF0F5]"
                        />
                        <ColorBox label="share-page" className="share-page h-full" />
                        <ColorBox label="ion-padding" className="ion-padding" />
                    </Content>
                </Page>
            );
        case 's-scroll':
            return <ScrollCase />;
        case 's-noscroll':
            return (
                <Page>
                    <Header title="scrollY false" />
                    <Content scrollY={false}>
                        <Rows />
                    </Content>
                </Page>
            );
        case 's-fixed':
            return (
                <Page>
                    <Header title="Fixed slot" />
                    <Content>
                        <AppFab slot="fixed" vertical="bottom" horizontal="end">
                            <AppFabButton aria-label="Add">+</AppFabButton>
                        </AppFab>
                        <Rows />
                    </Content>
                </Page>
            );
        case 's-fsfix':
            return (
                <Page>
                    <Content className={`fs-ion-content-fix bg-emerald-700 ${SCROLL_JUSTIFY_END}`}>
                        <div className="p-4 text-white">Bottom-aligned card</div>
                    </Content>
                </Page>
            );
        case 's-lock':
            return <LockCase />;
        case 's-centered':
            return (
                <Page>
                    <Content fullscreen className="flex items-center justify-center">
                        <div className="p-4 text-center">Centered (flex on the content host)</div>
                    </Content>
                </Page>
            );
        case 's-tabs':
            return <TabsCase fullscreen />;
        case 's-tabs-plain':
            return <TabsCase fullscreen={false} />;
        case 'r-legal':
            return (
                <LegalPageLayout title="Privacy Policy" lastUpdated="November 1, 2026">
                    <Rows n={20} label="Clause" />
                </LegalPageLayout>
            );
        case 'r-receive':
            return (
                <CredentialReceiveScreen
                    credentials={[personaCredentials['lc:cloud:rec-2']] as never}
                    origin="https://issuer.example"
                    onAccept={() => undefined}
                    onReject={() => undefined}
                />
            );
        default:
            return MODALS[id] ? <ModalCase id={id} /> : <div>Unknown case {id}</div>;
    }
};

export const PageShellVisualFixture: React.FC = () => {
    const readyRef = useRef<HTMLOutputElement>(null);
    if (INSETS) {
        const s = document.documentElement.style;
        s.setProperty('--safe-area-inset-top', '47px');
        s.setProperty('--safe-area-inset-bottom', '34px');
        s.setProperty('--ion-safe-area-left', '10px');
        s.setProperty('--ion-safe-area-right', '14px');
    }
    // Marked ready after the first passive effects, without a re-render.
    useEffect(() => {
        readyRef.current?.setAttribute('data-testid', 'ro-ready');
    }, []);
    return (
        <IonApp>
            <div id="ion-view-container-root" className="ion-page absolute inset-0">
                <PageCase id={CASE} />
            </div>
            <div className="pointer-events-none fixed bottom-0 left-0 z-[-1] text-[8px] opacity-0">
                <output ref={readyRef}>yes</output>
            </div>
            <AppOverlayManager />
        </IonApp>
    );
};

export default PageShellVisualFixture;
