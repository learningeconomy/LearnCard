import React, { useCallback, useRef, useState } from 'react';
import moment from 'moment';
import { IonApp } from '@ionic/react';
import { AppButton } from 'learn-card-base/ui/controls/AppButton';
import { AppButtons } from 'learn-card-base/ui/controls/AppButtons';
import AppDatetime, { type AppDatetimeHandle } from 'learn-card-base/ui/datetime/AppDatetime';

import { AppOverlayManager } from 'learn-card-base/ui/overlays/AppOverlayManager';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';
import { useTheme } from '../../src/theme/hooks/useTheme';

/**
 * `datetime-1`: every AppDatetime (formerly IonDatetime) call site in learn-card-app, one per page (`&case=<id>`), with
 * the call site's props, className, value format, min / max (still computed from `moment()`, so a
 * capture fixes the clock) and onIonChange / onIonCancel handlers. Each case reports how often
 * ionChange / ionCancel fired, the last raw `detail.value`, and the value the call site derives
 * from it. `modal-*` cases open the picker the way the useAppOverlayModal call sites do.
 */
const Datetime = AppDatetime;

type Report = (key: string, value: string) => void;
type ChangeEvent = { detail: { value?: string | string[] | null } };

const useLog = (report: Report) => {
    const state = useRef({ change: 0, cancel: 0, raw: '-', derived: '-' });
    const push = useCallback(() => {
        const s = state.current;
        report('events', `change=${s.change} cancel=${s.cancel} raw=${s.raw} derived=${s.derived}`);
    }, [report]);
    return {
        change: (e: ChangeEvent, derive: (v: ChangeEvent['detail']['value']) => unknown) => {
            const s = state.current;
            s.change += 1;
            s.raw = JSON.stringify(e.detail.value ?? null);
            s.derived = JSON.stringify(derive(e.detail.value) ?? null);
            push();
        },
        cancel: () => {
            state.current.cancel += 1;
            push();
        },
    };
};

/** The wrapper div every call site renders around its picker. */
const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full h-full transparent flex items-center justify-center">{children}</div>
);

type CaseProps = { report: Report; primaryColor?: string };

/** BoostCMSAdvancedSettingsForm.tsx:68 (also ConsentFlowShareDurationModal / ReadSharingModal). */
const Advanced: React.FC<CaseProps & { initial: string | null; disabled?: boolean }> = ({
    report,
    primaryColor,
    initial,
    disabled = false,
}) => {
    const log = useLog(report);
    const [expirationDate, setExpirationDate] = useState<string | null>(initial);
    return (
        <Wrap>
            <Datetime
                onIonChange={e => {
                    log.change(e, v => moment(v as string).toISOString());
                    setExpirationDate(moment(e.detail.value as string).toISOString());
                }}
                onIonCancel={log.cancel}
                value={expirationDate ? moment(expirationDate).format('YYYY-MM-DD') : null}
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                showDefaultButtons
                color={primaryColor}
                max="2050-12-31"
                disabled={disabled}
                min={moment().format('YYYY-MM-DD')}
            />
        </Wrap>
    );
};

/** BoostCMSBasicInfoForm.tsx:59 and BoostShareableCode.tsx:101 / :562 (date-time). */
const Basic: React.FC<CaseProps & { initial?: string }> = ({ report, primaryColor, initial }) => {
    const log = useLog(report);
    const [expirationDate, setExpirationDate] = useState<string | undefined>(initial);
    return (
        <Wrap>
            <Datetime
                onIonChange={e => {
                    log.change(e, v => moment(v as string).toISOString());
                    setExpirationDate(moment(e.detail.value as string).toISOString());
                }}
                onIonCancel={log.cancel}
                value={
                    expirationDate ? moment(expirationDate).format('YYYY-MM-DDTHH:mm') : undefined
                }
                id="datetime"
                presentation="date-time"
                className="bg-white text-black rounded-[20px] z-50"
                showDefaultButtons
                showDefaultTimeLabel
                color={primaryColor}
                max="2050-12-31T23:59"
                min={moment().format('YYYY-MM-DDTHH:mm')}
            />
        </Wrap>
    );
};

/** DatePickerInputContent.tsx:100 (mobile date of birth). */
const DateOfBirth: React.FC<CaseProps & { locale: string; initial: string }> = ({
    report,
    locale,
    initial,
}) => {
    const log = useLog(report);
    const [value, setValue] = useState(initial);
    const maxDate = new Date();
    const minDate = new Date('1900-01-01T00:00:00');
    return (
        <Wrap>
            <Datetime
                aria-label="Date of Birth"
                locale={locale}
                onIonChange={event => {
                    log.change(event, v => (v ? moment(v as string).format('YYYY-MM-DD') : null));
                    if (event.detail.value) {
                        setValue(moment(event.detail.value as string).format('YYYY-MM-DD'));
                    }
                }}
                value={value || undefined}
                presentation="date"
                className="bg-white text-black rounded-[20px] w-full shadow-3xl z-50 font-notoSans"
                showDefaultButtons
                color="indigo-500"
                max={maxDate ? moment(maxDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')}
                min={moment(minDate).format('YYYY-MM-DD')}
                onIonCancel={log.cancel}
            />
        </Wrap>
    );
};

/** ResumePreviewCredentialToTextBlock.tsx:111 (no min). */
const Resume: React.FC<CaseProps> = ({ report }) => {
    const log = useLog(report);
    const [selected, setSelected] = useState('');
    return (
        <Wrap>
            <Datetime
                onIonChange={e => {
                    log.change(e, v => (v ? moment(v as string).format('YYYY-MM-DD') : null));
                    if (e.detail.value) {
                        setSelected(moment(e.detail.value as string).format('YYYY-MM-DD'));
                    }
                }}
                value={selected || undefined}
                presentation="date"
                className="bg-white text-black rounded-[20px] w-full shadow-3xl z-50 font-notoSans"
                showDefaultButtons
                color="indigo-500"
                max={moment().format('YYYY-MM-DD')}
                onIonCancel={log.cancel}
            />
        </Wrap>
    );
};

/** CreateContractModal.tsx:435 (max 2077). */
const Contract: React.FC<CaseProps> = ({ report, primaryColor }) => {
    const log = useLog(report);
    const [expiresAt, setExpiresAt] = useState('');
    return (
        <Wrap>
            <Datetime
                onIonChange={e => {
                    log.change(e, v => moment(v as string).toISOString());
                    setExpiresAt(moment(e.detail.value as string).toISOString());
                }}
                value={!expiresAt ? null : moment(expiresAt).format('YYYY-MM-DD')}
                onIonCancel={log.cancel}
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                showDefaultButtons
                color={primaryColor}
                max="2077-12-31"
                min={moment().format('YYYY-MM-DD')}
            />
        </Wrap>
    );
};

/** CreateAPITokenModal.tsx:74 (ios mode, slot="buttons" Clear / Done calling reset / confirm). */
const ApiToken: React.FC<CaseProps> = ({ report, primaryColor }) => {
    const log = useLog(report);
    const [expirationDate, setExpirationDate] = useState<string | null>(null);
    const datetime = useRef<AppDatetimeHandle>(null);
    return (
        <Datetime
            mode="ios"
            ref={datetime}
            onIonChange={e => {
                log.change(e, v => (v === undefined ? null : moment(v as string).toISOString()));
                if (e.detail.value === undefined) setExpirationDate(null);
                else setExpirationDate(moment(e.detail.value as string).toISOString());
            }}
            value={expirationDate ? moment(expirationDate).format('YYYY-MM-DD') : null}
            id="datetime"
            presentation="date"
            className="bg-white text-black rounded-[20px] shadow-3xl z-50"
            color={primaryColor}
            max="2050-12-31"
            min={moment().format('YYYY-MM-DD')}
            buttons={
                <AppButtons slot="buttons" mode="ios">
                    <AppButton color="primary" mode="ios" onClick={() => datetime.current?.reset()}>
                        Clear
                    </AppButton>
                    <AppButton
                        color="primary"
                        mode="ios"
                        onClick={() => datetime.current?.confirm()}
                    >
                        Done
                    </AppButton>
                </AppButtons>
            }
        />
    );
};

/** The useAppOverlayModal call sites (BasicInfo / AdvancedSettings / ShareDuration options). */
const InModal: React.FC<CaseProps & { presentation: 'date' | 'date-time' }> = ({
    report,
    primaryColor,
    presentation,
}) => {
    const dismissed = useRef(0);
    const [present] = useAppOverlayModal(
        presentation === 'date' ? (
            <Advanced report={report} primaryColor={primaryColor} initial={null} />
        ) : (
            <Basic report={report} primaryColor={primaryColor} />
        )
    );
    return (
        <button
            type="button"
            data-testid="open-modal"
            className="rounded-[12px] bg-grayscale-900 px-3 py-2 text-xs font-medium text-white"
            onClick={() =>
                present({
                    backdropDismiss: true,
                    showBackdrop: false,
                    cssClass: 'flex items-center justify-center',
                    onDidDismiss: (e: CustomEvent<{ role?: string }>) => {
                        dismissed.current += 1;
                        report(
                            'modal',
                            `dismissed=${dismissed.current} role=${e.detail?.role ?? '-'}`
                        );
                    },
                })
            }
        >
            Open picker ({presentation})
        </button>
    );
};

const CASES: Record<string, { width: string; render: (p: CaseProps) => React.ReactNode }> = {
    advanced: {
        width: 'max-w-[350px]',
        render: p => <Advanced {...p} initial="2026-12-05T00:00:00.000Z" />,
    },
    'advanced-empty': { width: 'max-w-[350px]', render: p => <Advanced {...p} initial={null} /> },
    'advanced-disabled': {
        width: 'max-w-[350px]',
        render: p => <Advanced {...p} initial="2026-12-05T00:00:00.000Z" disabled />,
    },
    basic: { width: 'w-fit', render: p => <Basic {...p} initial="2026-12-05T14:45:00.000Z" /> },
    'basic-empty': { width: 'w-fit', render: p => <Basic {...p} /> },
    dob: {
        width: 'max-w-[400px]',
        render: p => <DateOfBirth {...p} locale="en" initial="1990-06-15" />,
    },
    'dob-ar': {
        width: 'max-w-[400px]',
        render: p => <DateOfBirth {...p} locale="ar" initial="" />,
    },
    resume: { width: 'max-w-[400px]', render: p => <Resume {...p} /> },
    contract: { width: 'max-w-[350px]', render: p => <Contract {...p} /> },
    'api-token': { width: 'max-w-[300px]', render: p => <ApiToken {...p} /> },
    'modal-date': { width: '', render: p => <InModal {...p} presentation="date" /> },
    'modal-date-time': { width: '', render: p => <InModal {...p} presentation="date-time" /> },
};

const FixtureBody: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const id = new URLSearchParams(window.location.search).get('case') ?? 'advanced';
    const c = CASES[id] ?? CASES.advanced;
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
                <section data-testid="d1-stage" className={`mx-auto w-full ${c.width}`}>
                    {c.render({ report, primaryColor })}
                </section>
                <section
                    data-testid="d1-readouts"
                    className="rounded-[16px] bg-white p-3 font-mono text-[11px] text-grayscale-800"
                >
                    <div>
                        case: <output data-testid="ro-ready">{id}</output> color: {primaryColor}
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

export const DatetimeVisualFixture: React.FC = () => (
    <IonApp>
        <FixtureBody />
        <AppOverlayManager />
    </IonApp>
);
