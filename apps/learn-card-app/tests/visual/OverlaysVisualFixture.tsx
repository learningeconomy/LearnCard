import React, { useCallback, useEffect, useState } from 'react';
import { IonApp } from '@ionic/react';

import { AppLoading } from 'learn-card-base/ui/overlays/AppLoading';
import { AppOverlayManager } from 'learn-card-base/ui/overlays/AppOverlayManager';
import { AppPopover } from 'learn-card-base/ui/overlays/AppPopover';
import { AppToast } from 'learn-card-base/ui/overlays/AppToast';
import { useAppToast } from 'learn-card-base/ui/overlays/useAppToast';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';

import type { SourceMappedField } from 'learn-card-base/helpers/credentials/clr/renderer';
import ClrSourceInfo from '../../src/components/clr-transcript/ClrSourceInfo';
import { AppItem, AppList } from 'learn-card-base/ui/list';

/**
 * `overlays-1`: the app's AppPopover, AppLoading, AppToast and useAppToast call sites (formerly
 * IonPopover, IonLoading, IonToast and useIonToast; section titles keep those names) as excerpts
 * (same props, classes and inline styles), plus the real ClrSourceInfo. A real IonApp hosts them,
 * with `#ion-view-container-root` as the view container overlays mark `aria-hidden`. A modal
 * (useAppOverlayModal, formerly useIonModal) checks stacking, Escape and focus with overlays
 * opened over it. Every scenario reports its open state and dismiss events in `ro-*` readouts.
 */
type Report = (key: string, value: string) => void;
type DismissDetail = { role?: string };
type Counts = { will: number; did: number; role: string };
const fmt = (open: boolean, c: Counts, extra = ''): string =>
    `open=${open} will=${c.will} did=${c.did} role=${c.role || '-'}${extra ? ` ${extra}` : ''}`;

/** Open-state + dismiss counters for one overlay scenario. */
const useOverlayLog = (key: string, report: Report) => {
    const [open, setOpen] = useState(false);
    const [counts, setCounts] = useState<Counts>({ will: 0, did: 0, role: '' });
    const [extra, setExtra] = useState('');
    useEffect(() => report(key, fmt(open, counts, extra)), [key, open, counts, extra, report]);
    const onWillDismiss = (e: CustomEvent<DismissDetail>) =>
        setCounts(c => ({ ...c, will: c.will + 1, role: e.detail?.role ?? '' }));
    const onDidDismiss = (e: CustomEvent<DismissDetail>) => {
        setCounts(c => ({ ...c, did: c.did + 1, role: e.detail?.role ?? '' }));
        setOpen(false);
    };
    return { open, setOpen, onWillDismiss, onDidDismiss, setExtra };
};

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

const btn = 'rounded-[12px] bg-grayscale-900 px-3 py-2 text-xs font-medium text-white';

const SORT = ['Most Recent', 'Alphabetical', 'Most Used'];

/** LaunchPadPopOverButton.tsx:85 / LearnerInsightsPopOverButton.tsx:85 (trigger="trigger-button"). */
const TriggerPopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-trigger', report);
    const [sortBy, setSortBy] = useState(SORT[0]);
    useEffect(() => log.setExtra(`sort=${sortBy.replace(/ /g, '_')}`), [sortBy]); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <>
            <button
                id="trigger-button"
                type="button"
                className={btn}
                data-testid="open-pop-trigger"
                onClick={() => log.setOpen(true)}
            >
                Sort (trigger)
            </button>
            <AppPopover
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
                reference="trigger"
                trigger="trigger-button"
                className="launchpad-popover"
            >
                <AppList>
                    {SORT.map(option => (
                        <AppItem
                            className="font-notoSans text-sm flex items-center justify-start text-left"
                            key={option}
                            lines="none"
                            button={true}
                            detail={false}
                            onClick={() => setSortBy(option)}
                            data-testid={`pop-trigger-${option.replace(/ /g, '_')}`}
                        >
                            {option === sortBy ? '✓ ' : ''}
                            {option}
                        </AppItem>
                    ))}
                </AppList>
            </AppPopover>
        </>
    );
};

/** SkillsHubPopoverButton.tsx:150 (formal theme class + --min-width). */
const FormalPopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-formal', report);
    return (
        <>
            <button
                id="trigger-button-skills"
                type="button"
                className={btn}
                data-testid="open-pop-formal"
                onClick={() => log.setOpen(true)}
            >
                Sort skills
            </button>
            <AppPopover
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
                reference="trigger"
                trigger="trigger-button-skills"
                className="launchpad-formal"
                style={{ '--min-width': '300px' } as React.CSSProperties}
            >
                <div className="p-[15px] rounded-[20px] bg-white">
                    <div className="flex flex-col gap-[5px]">
                        {SORT.map(option => (
                            <button
                                key={option}
                                type="button"
                                className="font-poppins text-[16px] flex gap-[10px] items-center justify-start text-left text-grayscale-900 rounded-[15px] w-full p-[10px]"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </AppPopover>
        </>
    );
};

/** PassportSharingMenu.tsx:174 (event, bottom / end, --width 304px). */
const SharePopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-share', report);
    const [event, setEvent] = useState<Event | undefined>(undefined);
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid="open-pop-share"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    log.setOpen(true);
                }}
            >
                Share passport
            </button>
            <AppPopover
                isOpen={log.open}
                event={event}
                reference="event"
                side="bottom"
                alignment="end"
                dismissOnSelect={false}
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
                style={{ '--width': '304px' } as React.CSSProperties}
            >
                <div className="flex flex-col p-2">
                    <button
                        type="button"
                        className="p-3 text-left text-sm text-grayscale-900"
                        data-testid="pop-share-share"
                    >
                        Share
                    </button>
                    <button type="button" className="p-3 text-left text-sm text-grayscale-900">
                        View shared
                    </button>
                </div>
            </AppPopover>
        </>
    );
};

/** ResumeBuilderHistoryDropdownButton.tsx:81 (event, bottom / start, wide clamped content). */
const ResumePopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-resume', report);
    const [event, setEvent] = useState<Event | undefined>(undefined);
    return (
        <>
            <button
                type="button"
                className={`${btn} ml-auto`}
                data-testid="open-pop-resume"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    log.setOpen(true);
                }}
            >
                Resume history
            </button>
            <AppPopover
                isOpen={log.open}
                event={event}
                reference="event"
                side="bottom"
                alignment="start"
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
                className="resume-history-popover"
            >
                <div className="bg-white rounded-[24px] p-3">
                    <div className="px-3 py-2 flex items-start justify-between gap-3">
                        <p className="text-[18px] font-semibold text-grayscale-900">
                            Resume history
                        </p>
                        <button type="button" className="text-sm text-grayscale-700">
                            New resume
                        </button>
                    </div>
                    <p className="px-3 pb-3 text-sm text-grayscale-600">
                        Three saved versions of your synthetic resume. Pick one to restore it.
                    </p>
                </div>
            </AppPopover>
        </>
    );
};

/** MyAssistantPage.tsx:392 (event, default side / alignment). */
const AssistantPopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-assistant', report);
    const [event, setEvent] = useState<Event | undefined>(undefined);
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid="open-pop-assistant"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    log.setOpen(true);
                }}
            >
                Filter
            </button>
            <AppPopover
                isOpen={log.open}
                event={event}
                reference="event"
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={() => {
                    log.onDidDismiss(new CustomEvent('x', { detail: { role: 'did' } }));
                    setEvent(undefined);
                }}
                className="assistant-filter-popover"
            >
                <div className="w-[280px] rounded-[20px] border border-grayscale-200 bg-white p-4 shadow-bottom-2-4 space-y-v3-4 font-poppins">
                    <p className="text-xs font-medium text-grayscale-700 mb-2">Show</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            className="py-2.5 px-3 rounded-[20px] text-sm font-medium bg-grayscale-900 text-white"
                        >
                            Inbox
                        </button>
                        <button
                            type="button"
                            className="py-2.5 px-3 rounded-[20px] text-sm font-medium bg-grayscale-100 text-grayscale-800"
                        >
                            Activity
                        </button>
                    </div>
                </div>
            </AppPopover>
        </>
    );
};

/** A trigger pinned near the bottom of the viewport: the popover flips above it. */
const BottomEdgePopover: React.FC<{ report: Report }> = ({ report }) => {
    const log = useOverlayLog('pop-bottom', report);
    const [event, setEvent] = useState<Event | undefined>(undefined);
    return (
        <>
            <button
                type="button"
                className={btn}
                style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 5 }}
                data-testid="open-pop-bottom"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    log.setOpen(true);
                }}
            >
                Bottom edge
            </button>
            <AppPopover
                isOpen={log.open}
                event={event}
                reference="event"
                side="bottom"
                alignment="start"
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
            >
                <div className="bg-white rounded-[16px] p-1.5">
                    <AppList lines="none" className="bg-transparent">
                        {['Transcript', 'Diploma', 'Badge'].map(key => (
                            <AppItem key={key} button detail={false} className="rounded-[12px]">
                                {key}
                            </AppItem>
                        ))}
                    </AppList>
                </div>
            </AppPopover>
        </>
    );
};

const CLR_FIELD = {
    specField: 'achievement.name',
    sourcePath: 'credentialSubject.achievement.name',
    value: 'Synthetic Algebra I',
    directlyMapped: true,
} as SourceMappedField<unknown>;

/** EmbedIframeModalContent.tsx:232 / AppStoreDetailModal.tsx:1057 (inline toasts). */
const InlineToast: React.FC<{
    report: Report;
    id: string;
    label: string;
    message: string;
    duration: number;
    color: 'success' | 'danger';
}> = ({ report, id, label, message, duration, color }) => {
    const log = useOverlayLog(id, report);
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid={`open-${id}`}
                onClick={() => log.setOpen(true)}
            >
                {label}
            </button>
            <AppToast
                isOpen={log.open}
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
                message={message}
                duration={duration}
                position="bottom"
                color={color}
            />
        </>
    );
};

/** FrameworkCRUD.tsx:30 (useIonToast). */
const HookToasts: React.FC<{ report: Report }> = ({ report }) => {
    const [presentToast] = useAppToast();
    const [count, setCount] = useState(0);
    useEffect(() => report('toast-hook', `presented=${count}`), [count, report]);
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid="open-toast-hook-success"
                onClick={() => {
                    presentToast({
                        message: 'Framework created successfully!',
                        duration: 2000,
                        color: 'success',
                    });
                    setCount(c => c + 1);
                }}
            >
                Hook toast (success)
            </button>
            <button
                type="button"
                className={btn}
                data-testid="open-toast-hook-danger"
                onClick={() => {
                    presentToast({
                        message: 'Error: synthetic failure',
                        duration: 3000,
                        color: 'danger',
                    });
                    setCount(c => c + 1);
                }}
            >
                Hook toast (danger)
            </button>
        </>
    );
};

/** ErrorLogout.tsx:32 / NewDataSource.tsx:49 / ClaimFromDashboard.tsx:487 (mode="ios" loadings). */
const Loading: React.FC<{
    report: Report;
    id: string;
    label: string;
    message: string;
    cssClass?: string;
}> = ({ report, id, label, message, cssClass }) => {
    const log = useOverlayLog(id, report);
    useEffect(() => {
        if (!log.open) return undefined;
        const t = window.setTimeout(() => log.setOpen(false), 2500);
        return () => window.clearTimeout(t);
    }, [log.open]); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <>
            <button
                type="button"
                className={btn}
                data-testid={`open-${id}`}
                onClick={() => log.setOpen(true)}
            >
                {label}
            </button>
            <AppLoading
                mode="ios"
                message={message}
                isOpen={log.open}
                cssClass={cssClass}
                onWillDismiss={log.onWillDismiss}
                onDidDismiss={log.onDidDismiss}
            />
        </>
    );
};

/** Modal content (useAppOverlayModal): overlays opened over a modal. */
const ModalBody: React.FC<{ report: Report; onClose: () => void }> = ({ report, onClose }) => {
    const pop = useOverlayLog('modal-pop', report);
    const [event, setEvent] = useState<Event | undefined>(undefined);
    return (
        <div className="flex h-full w-full flex-col gap-2 bg-white p-4" data-testid="modal-body">
            <p className="text-sm font-semibold text-grayscale-900">Synthetic modal</p>
            <button
                type="button"
                className={btn}
                data-testid="modal-open-pop"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    pop.setOpen(true);
                }}
            >
                Popover over modal
            </button>
            <Loading
                report={report}
                id="modal-load"
                label="Loading over modal"
                message="Consenting..."
            />
            <InlineToast
                report={report}
                id="modal-toast"
                label="Toast over modal"
                message="Synthetic error from a modal"
                duration={5000}
                color="danger"
            />
            <button type="button" className={btn} data-testid="modal-close" onClick={onClose}>
                Close modal
            </button>
            <AppPopover
                isOpen={pop.open}
                event={event}
                reference="event"
                side="bottom"
                alignment="start"
                onWillDismiss={pop.onWillDismiss}
                onDidDismiss={pop.onDidDismiss}
            >
                <div className="flex flex-col bg-white p-2">
                    <button
                        type="button"
                        className="p-3 text-left text-sm"
                        data-testid="modal-pop-item"
                    >
                        Option in popover
                    </button>
                </div>
            </AppPopover>
        </div>
    );
};

/** Inside IonApp, next to the AppOverlayManager that renders the modal. */
const FixtureBody: React.FC = () => {
    const [readouts, setReadouts] = useState<Record<string, string>>({});
    const report = useCallback<Report>(
        (key, value) => setReadouts(r => (r[key] === value ? r : { ...r, [key]: value })),
        []
    );
    const [modalDid, setModalDid] = useState(0);
    const [presentModal, dismissModal] = useAppOverlayModal(ModalBody, {
        report,
        onClose: () => dismissModal(),
    });
    const shown: Record<string, string> = { ...readouts, modal: `did=${modalDid}` };

    return (
        <>
            <div
                id="ion-view-container-root"
                className="absolute inset-0 overflow-auto bg-grayscale-100"
            >
                <main className="mx-auto flex w-full max-w-[900px] flex-col gap-3 p-4 font-poppins">
                    <Section testId="o1-popover" title="IonPopover call sites">
                        <TriggerPopover report={report} />
                        <FormalPopover report={report} />
                        <SharePopover report={report} />
                        <AssistantPopover report={report} />
                        <span
                            className="flex items-center gap-1 text-xs text-grayscale-700"
                            data-testid="clr-source"
                        >
                            Source info <ClrSourceInfo field={CLR_FIELD} label="Achievement name" />
                        </span>
                        <ResumePopover report={report} />
                        <BottomEdgePopover report={report} />
                    </Section>
                    <Section testId="o1-loading" title="IonLoading call sites">
                        <Loading
                            report={report}
                            id="load-basic"
                            label="Log out"
                            message="Logging out..."
                        />
                        <Loading
                            report={report}
                            id="load-clear"
                            label="Claim (clear background)"
                            message="Claiming credential..."
                            cssClass="[--background:none]"
                        />
                    </Section>
                    <Section testId="o1-toast" title="IonToast / useIonToast call sites">
                        <InlineToast
                            report={report}
                            id="toast-copied"
                            label="Copy link"
                            message="Link copied to clipboard!"
                            duration={2000}
                            color="success"
                        />
                        <InlineToast
                            report={report}
                            id="toast-error"
                            label="Embed error"
                            message="Synthetic error: credential claim failed"
                            duration={5000}
                            color="danger"
                        />
                        <HookToasts report={report} />
                    </Section>
                    <Section testId="o1-modal" title="Overlays over an Ionic modal">
                        <button
                            type="button"
                            className={btn}
                            data-testid="open-modal"
                            onClick={() =>
                                presentModal({
                                    cssClass: 'center-modal user-options-modal',
                                    backdropDismiss: true,
                                    showBackdrop: true,
                                    onDidDismiss: () => setModalDid(n => n + 1),
                                })
                            }
                        >
                            Open Ionic modal
                        </button>
                    </Section>
                    <section
                        data-testid="o1-readouts"
                        className="rounded-[16px] bg-white p-3 font-mono text-[11px] text-grayscale-800"
                    >
                        {Object.keys(shown)
                            .sort()
                            .map(key => (
                                <div key={key}>
                                    {key}: <output data-testid={`ro-${key}`}>{shown[key]}</output>
                                </div>
                            ))}
                    </section>
                </main>
            </div>
        </>
    );
};

export const OverlaysVisualFixture: React.FC = () => (
    <IonApp>
        <FixtureBody />
        <AppOverlayManager />
    </IonApp>
);
