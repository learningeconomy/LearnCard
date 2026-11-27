import React, { useCallback, useEffect, useState } from 'react';
import { IonApp, IonContent, IonFooter, IonHeader, IonPage, IonToolbar } from '@ionic/react';

import { AppLoading } from '../../src/components/overlays/AppLoading';
import { AppOverlayManager } from '../../src/components/overlays/AppOverlayManager';
import { useAppAlert as useAlertHook } from '../../src/components/overlays/useAppAlert';
import { useAppOverlayModal as useModalHook } from '../../src/components/overlays/useAppOverlayModal';
import { AppPopover } from '../../src/components/overlays/AppPopover';
import { useAppToast } from '../../src/components/overlays/useAppToast';

/**
 * `modals-1`: the app's useIonModal / useIonAlert call sites (present options, cssClass values,
 * sheet breakpoints and alert shapes copied from the call sites) with content shaped like the
 * real modal bodies (IonPage + header/toolbar/content, IonContent fullscreen, plain prompt div,
 * IonFooter). A real IonApp hosts them, with `#ion-view-container-root` as the view container.
 * The first modal opens a second modal, a popover, a loading, a toast and an alert over itself.
 * Every scenario reports its dismiss events (role + data) in `ro-*` readouts.
 */
type Report = (key: string, value: string) => void;
type DismissDetail = { role?: string; data?: unknown };

const btn = 'rounded-[12px] bg-grayscale-900 px-3 py-2 text-xs font-medium text-white';

const Section: React.FC<{ testId: string; title: string; children: React.ReactNode }> = ({
    testId,
    title,
    children,
}) => (
    <section data-testid={testId} className="rounded-[16px] bg-white p-3 space-y-2">
        <h2 className="text-sm font-semibold text-grayscale-900">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
);

const describe = (e: CustomEvent<DismissDetail>): string =>
    `role=${e.detail?.role ?? '-'} data=${JSON.stringify(e.detail?.data ?? null)}`;

/** Counts dismisses and keeps the last role / data for one scenario. */
const useDismissLog = (key: string, report: Report) => {
    const [state, setState] = useState({ did: 0, last: '' });
    useEffect(() => report(key, `did=${state.did} ${state.last}`.trim()), [key, state, report]);
    return useCallback(
        (e: CustomEvent<DismissDetail>) => setState(s => ({ did: s.did + 1, last: describe(e) })),
        []
    );
};

type BodyProps = {
    report: Report;
    onClose: (data?: unknown, role?: string) => void;
    tick?: number;
    onTick?: () => void;
};

/** AddressBookContactOptions / UserOptions shape, plus overlays opened over the modal. */
const StackBody: React.FC<BodyProps> = ({ report, onClose, tick, onTick }) => {
    const nestedLog = useDismissLog('modal-nested', report);
    const alertLog = useDismissLog('modal-alert', report);
    const [presentNested, dismissNested] = useModalHook(PromptBody, {
        report,
        onClose: (data?: unknown, role?: string) => dismissNested(data, role),
    });
    const [presentAlert] = useAlertHook();
    const [presentToast] = useAppToast();
    const [popOpen, setPopOpen] = useState(false);
    const [popEvent, setPopEvent] = useState<Event | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    return (
        <IonPage id="user-options-modal">
            <div
                className="flex h-full w-full flex-col gap-2 overflow-auto bg-white p-4"
                data-testid="stack-body"
            >
                <h1 className="font-poppins m-0 p-0 text-xl">Contact options</h1>
                <p className="text-xs" data-testid="stack-tick">
                    tick={tick}
                </p>
                <button type="button" className={btn} data-testid="stack-tick-btn" onClick={onTick}>
                    Bump props
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-open-nested"
                    onClick={() =>
                        presentNested({
                            cssClass: 'center-modal add-contact-modal',
                            backdropDismiss: false,
                            showBackdrop: false,
                            onDidDismiss: nestedLog,
                        })
                    }
                >
                    Modal over modal
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-open-pop"
                    onClick={e => {
                        setPopEvent(e.nativeEvent);
                        setPopOpen(true);
                    }}
                >
                    Popover over modal
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-open-load"
                    onClick={() => setLoading(true)}
                >
                    Loading over modal
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-open-toast"
                    onClick={() =>
                        presentToast({
                            message: 'Synthetic error from a modal',
                            duration: 5000,
                            color: 'danger',
                        })
                    }
                >
                    Toast over modal
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-open-alert"
                    onClick={() =>
                        presentAlert({
                            backdropDismiss: false,
                            cssClass: 'boost-confirmation-alert',
                            header: 'Send a connection request?',
                            buttons: [
                                {
                                    text: 'Confirm',
                                    role: 'confirm',
                                    handler: () => report('modal-alert-handler', 'confirm'),
                                },
                                {
                                    text: 'Cancel',
                                    role: 'cancel',
                                    handler: () => report('modal-alert-handler', 'cancel'),
                                },
                            ],
                            onDidDismiss: alertLog,
                        })
                    }
                >
                    Alert over modal
                </button>
                <button
                    type="button"
                    className={btn}
                    data-testid="stack-close"
                    onClick={() => onClose({ picked: 'close' }, 'confirm')}
                >
                    Close modal
                </button>
                <AppPopover
                    isOpen={popOpen}
                    event={popEvent}
                    reference="event"
                    side="bottom"
                    alignment="start"
                    onDidDismiss={() => setPopOpen(false)}
                >
                    <div className="flex flex-col bg-white p-2">
                        <button
                            type="button"
                            className="p-3 text-left text-sm"
                            data-testid="stack-pop-item"
                        >
                            Option in popover
                        </button>
                    </div>
                </AppPopover>
                <AppLoading
                    isOpen={loading}
                    message="Consenting..."
                    duration={2500}
                    onDidDismiss={() => setLoading(false)}
                />
            </div>
        </IonPage>
    );
};

/** DeleteUserConfirmationPrompt / ConnectModal confirmation shape (plain div, no IonPage). */
const PromptBody: React.FC<BodyProps> = ({ onClose }) => (
    <div
        className="flex flex-col items-center justify-center bg-white text-black w-full pt-6 px-4 pb-4 gap-3"
        data-testid="prompt-body"
    >
        <p className="text-center font-poppins text-lg font-semibold">Are you sure?</p>
        <p className="text-center text-sm text-grayscale-600">
            This synthetic prompt mirrors the confirmation modals.
        </p>
        <button
            type="button"
            className={btn}
            data-testid="prompt-confirm"
            onClick={() => onClose({ ok: true }, 'confirm')}
        >
            Confirm
        </button>
        <button
            type="button"
            className="text-sm text-grayscale-700"
            data-testid="prompt-cancel"
            onClick={() => onClose(undefined, 'cancel')}
        >
            Cancel
        </button>
    </div>
);

const ROWS = Array.from({ length: 40 }, (_, i) => `Result ${i + 1}`);

/** LocationSearch shape: IonPage + IonHeader/IonToolbar + scrolling IonContent. */
const SheetBody: React.FC<BodyProps> = ({ onClose }) => (
    <IonPage className="bg-white">
        <IonHeader className="learn-card-header ion-no-border my-[0px]">
            <IonToolbar className="ion-no-border bg-white " color="white">
                <div className="flex w-full items-center justify-between px-2">
                    <h1 className="font-poppins text-lg">Search location</h1>
                    <button
                        type="button"
                        className="text-sm"
                        data-testid="sheet-close"
                        onClick={() => onClose(undefined, 'cancel')}
                    >
                        Close
                    </button>
                </div>
            </IonToolbar>
        </IonHeader>
        <IonContent>
            <ul className="p-4" data-testid="sheet-list">
                {ROWS.map(r => (
                    <li key={r} className="border-b border-grayscale-200 py-3 text-sm">
                        {r}
                    </li>
                ))}
            </ul>
        </IonContent>
    </IonPage>
);

/** ConnectModal shape: IonContent fullscreen with no footer (gets the bottom safe-area padding). */
const FullBody: React.FC<BodyProps> = ({ onClose }) => (
    <>
        <IonContent fullscreen className="bg-white" data-testid="full-content">
            <section className="flex flex-col items-center justify-center gap-3 p-6">
                <p className="font-bold text-lg">Synthetic full-screen modal</p>
                <button
                    type="button"
                    className={btn}
                    data-testid="full-close"
                    onClick={() => onClose(undefined, 'done')}
                >
                    Done
                </button>
            </section>
        </IonContent>
    </>
);

/** ChildInviteModal / CustomWalletContractData shape: IonHeader + IonContent + IonFooter. */
const FooterBody: React.FC<BodyProps> = ({ onClose }) => (
    <>
        <IonHeader className="ion-no-border">
            <IonToolbar className="bg-white">
                <p className="px-4 font-poppins font-semibold">Invite a child</p>
            </IonToolbar>
        </IonHeader>
        <IonContent className="bg-white">
            <p className="p-4 text-sm">Body text inside IonContent.</p>
        </IonContent>
        <IonFooter className="ion-no-border">
            <IonToolbar className="bg-white">
                <button
                    type="button"
                    className={btn}
                    data-testid="footer-close"
                    onClick={() => onClose(undefined, 'cancel')}
                >
                    Cancel
                </button>
            </IonToolbar>
        </IonFooter>
    </>
);

type ModalCase = {
    id: string;
    label: string;
    body: React.FC<BodyProps>;
    options?: Record<string, unknown>;
};

/** Present options copied from the call sites (see the PR body for the file list). */
const CASES: ModalCase[] = [
    {
        id: 'center-options',
        label: 'center user-options (stack host)',
        body: StackBody,
        options: {
            cssClass: 'center-modal user-options-modal',
            backdropDismiss: true,
            showBackdrop: true,
        },
    },
    {
        id: 'generic',
        label: 'generic-modal (AddressBookHeader)',
        body: StackBody,
        options: {
            cssClass: 'generic-modal show-modal ion-disable-focus-trap',
            backdropDismiss: true,
            showBackdrop: false,
        },
    },
    {
        id: 'delete-user',
        label: 'delete-user (UserOptionsModal)',
        body: PromptBody,
        options: {
            cssClass: 'center-modal user-options-modal delete-user-modal',
            backdropDismiss: false,
            showBackdrop: false,
        },
    },
    {
        id: 'logged-out',
        label: 'logged-out prompt (ClaimFromDashboard)',
        body: PromptBody,
        options: {
            cssClass: 'center-modal boost-logged-out-confirmation-prompt',
            backdropDismiss: true,
            showBackdrop: false,
        },
    },
    {
        id: 'qrcode',
        label: 'user-qrcode (BoostAddressBookContactOptions)',
        body: PromptBody,
        options: {
            cssClass: 'center-modal user-qrcode-modal',
            backdropDismiss: false,
            showBackdrop: false,
        },
    },
    {
        id: 'flex',
        label: 'flex cssClass (BoostCMSAppearanceController)',
        body: PromptBody,
        options: {
            cssClass: 'flex items-center justify-center',
            backdropDismiss: true,
            showBackdrop: true,
        },
    },
    {
        id: 'sheet-80',
        label: 'sheet 0.8 (BoostCMSBasicInfoForm)',
        body: SheetBody,
        options: {
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 0.8,
            breakpoints: [0, 0.8, 0.9, 1],
            handleBehavior: 'cycle',
        },
    },
    {
        id: 'sheet-95',
        label: 'sheet 0.95 (BoostAddressBookContactOptions)',
        body: PromptBody,
        options: {
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 0.95,
            breakpoints: [0, 0.95, 0.95, 1],
            handleBehavior: 'cycle',
        },
    },
    {
        id: 'mobile',
        label: 'mobile-modal, no breakpoints (UserOptionsModal)',
        body: PromptBody,
        options: { cssClass: 'mobile-modal user-options-modal', handleBehavior: 'cycle' },
    },
    { id: 'default', label: 'no options (FamilyCard)', body: FullBody },
    {
        id: 'ios-footer',
        label: "mode: 'ios' + footer (CustomWalletViewContracts)",
        body: FooterBody,
        options: { mode: 'ios' },
    },
];

const ModalLauncher: React.FC<{ c: ModalCase; report: Report }> = ({ c, report }) => {
    const did = useDismissLog(`modal-${c.id}`, report);
    const [tick, setTick] = useState(0);
    const [present, dismiss] = useModalHook(c.body, {
        report,
        tick,
        onTick: () => setTick(t => t + 1),
        onClose: (data?: unknown, role?: string) => dismiss(data, role),
    });
    return (
        <button
            type="button"
            className={btn}
            data-testid={`open-${c.id}`}
            onClick={() => present({ ...(c.options ?? {}), onDidDismiss: did })}
        >
            {c.label}
        </button>
    );
};

/** useFirebase (string form), BoostClaimCard / AddressBookContactItem, ShareBoostsBundle,
 * IssueCredentialPage and ViewCredsBundle alert shapes. */
const AlertLaunchers: React.FC<{ report: Report }> = ({ report }) => {
    const [presentAlert, dismissAlert] = useAlertHook();
    const logs = {
        string: useDismissLog('alert-string', report),
        confirm: useDismissLog('alert-confirm', report),
        error: useDismissLog('alert-error', report),
        discard: useDismissLog('alert-discard', report),
        pin: useDismissLog('alert-pin', report),
    };
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-string"
                onClick={() => {
                    void presentAlert('Synthetic popup-blocked message for social login.');
                }}
            >
                String alert (useFirebase)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-string-logged"
                onClick={() => {
                    void presentAlert({
                        message: 'Synthetic popup-blocked message for social login.',
                        buttons: [{ text: 'Ok' }],
                        onDidDismiss: logs.string,
                    });
                }}
            >
                String alert (logged)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-confirm"
                onClick={() => {
                    void presentAlert({
                        backdropDismiss: false,
                        cssClass: 'boost-confirmation-alert',
                        header: 'Send a connection request to Synthetic Person?',
                        buttons: [
                            {
                                text: 'Confirm',
                                role: 'confirm',
                                handler: async () => report('alert-confirm-handler', 'confirm'),
                            },
                            {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => {
                                    report('alert-confirm-handler', 'cancel');
                                    void dismissAlert();
                                },
                            },
                        ],
                        onDidDismiss: logs.confirm,
                    });
                }}
            >
                Confirm alert (AddressBookContactItem)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-error"
                onClick={() => {
                    void presentAlert({
                        header: 'Error',
                        subHeader: 'Create Boost Bundle error',
                        message: 'Error: synthetic failure',
                        buttons: ['OK'],
                        onDidDismiss: logs.error,
                    });
                }}
            >
                Error alert (ShareBoostsBundle)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-discard"
                onClick={() => {
                    void presentAlert({
                        header: 'Discard this credential?',
                        message: 'You have unsaved changes. Discarding them cannot be undone.',
                        buttons: [
                            { text: 'Keep editing', role: 'cancel' },
                            {
                                text: 'Discard',
                                role: 'destructive',
                                handler: () => report('alert-discard-handler', 'discard'),
                            },
                        ],
                        onDidDismiss: logs.discard,
                    });
                }}
            >
                Discard alert (IssueCredentialPage)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-alert-pin"
                onClick={() => {
                    void presentAlert({
                        backdropDismiss: false,
                        header: 'Please enter your PIN to access this verified boost bundle.',
                        buttons: [
                            {
                                text: 'OK',
                                handler: (alertData: { pin?: string }) => {
                                    if (!alertData?.pin || alertData?.pin?.trim() === '')
                                        return false;
                                    report('alert-pin-value', alertData.pin);
                                    return undefined;
                                },
                            },
                        ],
                        inputs: [
                            {
                                placeholder: 'PIN (max 4 digits)',
                                name: 'pin',
                                attributes: { maxlength: 4 },
                            },
                        ],
                        onDidDismiss: logs.pin,
                    });
                }}
            >
                PIN alert (ViewCredsBundle)
            </button>
        </>
    );
};

const FixtureBody: React.FC = () => {
    const [readouts, setReadouts] = useState<Record<string, string>>({});
    const report = useCallback<Report>(
        (key, value) => setReadouts(r => (r[key] === value ? r : { ...r, [key]: value })),
        []
    );
    return (
        <div
            id="ion-view-container-root"
            className="absolute inset-0 overflow-auto bg-grayscale-100"
        >
            <main className="mx-auto flex w-full max-w-[900px] flex-col gap-3 p-4 font-poppins">
                <Section testId="m1-modal" title="useIonModal call sites">
                    {CASES.map(c => (
                        <ModalLauncher key={c.id} c={c} report={report} />
                    ))}
                </Section>
                <Section testId="m1-alert" title="useIonAlert call sites">
                    <AlertLaunchers report={report} />
                </Section>
                <section
                    data-testid="m1-readouts"
                    className="rounded-[16px] bg-white p-3 font-mono text-[11px] text-grayscale-800"
                >
                    <div>
                        ready: <output data-testid="ro-ready">yes</output>
                    </div>
                    {Object.keys(readouts)
                        .sort()
                        .map(key => (
                            <div key={key}>
                                {key}: <output data-testid={`ro-${key}`}>{readouts[key]}</output>
                            </div>
                        ))}
                </section>
            </main>
        </div>
    );
};

export const ModalsVisualFixture: React.FC = () => (
    <IonApp>
        <FixtureBody />
        <AppOverlayManager />
    </IonApp>
);
