import React, { useRef, useState } from 'react';
import { IonApp, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { AppCol, AppGrid, AppRow } from '../../src/components/layout';
import { AppIcon } from '../../src/components/icon';
import { AppCard, AppCardContent, AppText } from '../../src/components/widgets';
import { alertCircleOutline, homeOutline, refreshOutline } from 'ionicons/icons';
import type { ConsentFlowContract } from '@learncard/types';

import * as m from '../../src/paraglide/messages.js';
import useTheme from '../../src/theme/hooks/useTheme';
import { getInfoFromContractKey } from '../../src/helpers/contract.helpers';
import MultiTextInput from '../../src/pages/hidden/MultiTextInput';
import BoostCMSMemberPrivacyOptions from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSMemberPrivacyOptions/BoostCMSMemberPrivacyOptions';
import { initialBoostCMSState, type BoostCMSState } from '../../src/components/boost/boost';
import DevCliBackButton from '../../src/pages/devCli/DevCliBackButton';
import { AppButton, type AppButtonProps } from '../../src/components/controls/AppButton';
import { AppButtons } from '../../src/components/controls/AppButtons';
import AppDatetime from '../../src/components/datetime/AppDatetime';
import { AppCheckbox } from '../../src/components/controls/AppCheckbox';
import { AppRadio, AppRadioGroup } from '../../src/components/controls/AppRadio';
import {
    storageOptionsList,
    StorageOptionsEnum,
} from '../../src/pages/adminToolsPage/AdminToolsStorage/AdminToolsStorageOption';
import {
    networkOptionsList,
    NetworkOptionsEnum,
} from '../../src/pages/adminToolsPage/AdminToolsNetwork/AdminToolsNetwork';

/**
 * `controls-1a`: every app call site that used IonButton / IonButtons / IonCheckbox / IonRadio /
 * IonRadioGroup (phase 4 batch 1a), rendered with fixed local data and no backend. Those call
 * sites now use the app-owned AppButton / AppButtons / AppCheckbox / AppRadioGroup / AppRadio;
 * CreateAPITokenModal's date picker is AppDatetime with AppButtons as its `buttons`.
 *
 * Components that render standalone are the real ones. Pages whose mount effects need a wallet,
 * network or xterm are faithful excerpts: the controls, their props and classes, and their
 * immediate wrappers are copied from the source line cited in each block. Page-level containers
 * (IonPage/IonContent) become plain divs with the same classes and backgrounds, so each block has
 * an intrinsic height for clipped screenshots. Block titles still name the Ionic components, so
 * screenshots stay comparable with the pre-migration captures.
 *
 * Inputs carry the same change / `onClick` wiring as their call sites, and each one reports its
 * state in an `<output data-testid="…-value">`, for keyboard and pointer behavior checks.
 */

const Block: React.FC<{ testId: string; title: string; children: React.ReactNode }> = ({
    testId,
    title,
    children,
}) => (
    <section data-testid={testId} className="w-full max-w-[800px] flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grayscale-600">
            {title}
        </h2>
        {children}
    </section>
);

const Value: React.FC<{ testId: string; value: unknown }> = ({ testId, value }) => (
    <output data-testid={testId} className="text-xs font-mono text-grayscale-600">
        {JSON.stringify(value ?? null)}
    </output>
);

/** src/components/creds-bundle/ViewCredsBundle.tsx:117-147 (header only; page opens a PIN alert). */
const ViewCredsBundleToolbar: React.FC = () => (
    <IonHeader translucent={true}>
        <IonToolbar className="flex">
            <div className="flex justify-between items-center">
                <div>
                    <a
                        href="#learncard"
                        rel="noreferrer"
                        onClick={event => event.preventDefault()}
                        className="text-base tracking-[6px] mx-[20px] font-bold text-mv_red-700 w-full"
                    >
                        LEARN<span className="text-mv_blue-700">CARD</span>
                    </a>
                </div>

                <AppButton className="text-grayscale-600 mr-[20px]" onClick={() => undefined}>
                    Learn More
                </AppButton>
            </div>
        </IonToolbar>
    </IonHeader>
);

/**
 * src/pages/devCli/DevCli.tsx:731-751 with the header rules of its inline <style> (863-930).
 * The Google Fonts @import is omitted: the fixture makes no network requests.
 */
const DevCliToolbar: React.FC = () => (
    <div className="cli-page">
        <IonHeader className="cli-header">
            <IonToolbar className="cli-toolbar">
                <AppButtons slot="start">
                    <DevCliBackButton defaultHref="/launchpad" className="cli-back-btn" />
                </AppButtons>

                <IonTitle className="cli-title">LearnCard CLI</IonTitle>

                <AppButtons slot="end">
                    <button
                        onClick={() => undefined}
                        className="cli-tutorial-btn"
                        title="Open Tutorials"
                    >
                        📖 Tutorial
                    </button>
                </AppButtons>
            </IonToolbar>
        </IonHeader>
        <style>{`
            .cli-page {
                --ion-background-color: #1d2021;
            }

            .cli-header {
                --ion-background-color: #282828;
            }

            .cli-toolbar {
                --background: linear-gradient(180deg, #32302f 0%, #282828 100%);
                --border-color: #3c3836;
                --color: #ebdbb2;
                border-bottom: 1px solid #3c3836;
            }

            .cli-title {
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                font-weight: 600;
                color: #fbf1c7;
                letter-spacing: 0.02em;
            }

            .cli-back-btn {
                --color: #a89984;
                --color-hover: #ebdbb2;
                --color-focused: #fe8019;
            }

            .cli-back-btn::part(native) {
                color: #a89984;
            }

            .cli-back-btn::part(native):hover {
                color: #ebdbb2;
            }

            .cli-tutorial-btn {
                padding: 6px 12px;
                background: rgba(69, 133, 136, 0.2);
                border: 1px solid #458588;
                border-radius: 6px;
                color: #83a598;
                font-size: 12px;
                font-weight: 500;
                font-family: 'JetBrains Mono', monospace;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .cli-tutorial-btn:hover {
                background: rgba(69, 133, 136, 0.3);
                color: #fbf1c7;
            }
        `}</style>
    </div>
);

/**
 * src/pages/launchPad/EmbedAppFullScreen.tsx:172-202. The end slot holds a fixed-size stand-in for
 * `AppCredentialDashboard`, which reads app credential queries.
 */
const EmbedAppFullScreenToolbar: React.FC = () => (
    <IonHeader>
        <IonToolbar>
            <AppButtons slot="start">
                <AppButton onClick={() => undefined}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </AppButton>
            </AppButtons>
            <IonTitle>Community Academy</IonTitle>
            <AppButtons className="mr-[10px]" slot="end">
                <span
                    data-testid="c1a-embedapp-dashboard-placeholder"
                    className="inline-block h-[36px] w-[36px] rounded-full bg-grayscale-200"
                />
            </AppButtons>
        </IonToolbar>
    </IonHeader>
);

/**
 * src/pages/adminToolsPage/api-tokens/CreateAPITokenModal.tsx:85-110, rendered inline instead of in
 * a modal. value/min are fixed dates instead of `moment()`. AppDatetime still highlights the real
 * "today", so a spec capturing this block must also fix the clock (`page.clock.setFixedTime`).
 */
const CreateAPITokenDatetime: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const [expirationDate, setExpirationDate] = useState<string | null>('2026-12-01');
    const [clicks, setClicks] = useState<string[]>([]);

    return (
        <>
            <AppDatetime
                onIonChange={e => {
                    const value = e.detail.value;
                    setExpirationDate(typeof value === 'string' ? value.slice(0, 10) : null);
                }}
                value={expirationDate}
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                color={primaryColor}
                max="2050-12-31"
                min="2026-10-16"
                buttons={
                    <AppButtons slot="buttons">
                        <AppButton color="primary" onClick={() => setClicks([...clicks, 'clear'])}>
                            Clear
                        </AppButton>
                        <AppButton color="primary" onClick={() => setClicks([...clicks, 'done'])}>
                            Done
                        </AppButton>
                    </AppButtons>
                }
            />
            <Value testId="c1a-api-token-datetime-value" value={{ expirationDate, clicks }} />
        </>
    );
};

/** src/pages/approveAccount/ApproveAccount.tsx:91-135 (success and error branches side by side). */
const ApproveAccountButtons: React.FC = () => (
    <div className="flex flex-col grow bg-emerald-700 ion-color-emerald-700">
        <div className="h-full w-full flex flex-col items-center justify-center px-6 py-8 text-center text-white">
            <h1 className="text-xl font-bold text-white mb-2">Account Approved</h1>
            <p className="text-emerald-50 max-w-[520px] mb-4">Profile approved successfully.</p>
            <AppButton color="light" onClick={() => undefined}>
                Open LearnCard Login
            </AppButton>

            <h1 className="text-xl font-bold text-white mb-2 mt-8">Unable to Approve</h1>
            <p className="text-emerald-50 max-w-[520px] mb-4">This approval link has expired.</p>
            <AppButton color="light" onClick={() => undefined}>
                Go to Login
            </AppButton>
        </div>
    </div>
);

/** src/pages/interactions/InteractionsPage.tsx:186-232 (error card). */
const InteractionsErrorCard: React.FC = () => (
    <div className="ion-padding">
        <AppGrid>
            <AppRow className="ion-justify-content-center ion-align-items-center">
                <AppCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                    <AppCard color="light" className="ion-padding">
                        <AppCardContent className="ion-text-center">
                            <AppIcon
                                icon={alertCircleOutline}
                                color="danger"
                                style={{ fontSize: '48px', marginBottom: '16px' }}
                            />
                            <IonTitle
                                color="danger"
                                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                            >
                                Interaction Error
                            </IonTitle>
                            <AppText color="medium" className="ion-margin-top ion-margin-bottom">
                                <p>Interaction not found or expired.</p>
                            </AppText>
                            <AppButton
                                expand="block"
                                onClick={() => undefined}
                                className="ion-margin-top"
                            >
                                <AppIcon slot="start" icon={refreshOutline} />
                                Try Again
                            </AppButton>
                            <AppButton
                                expand="block"
                                color="medium"
                                fill="outline"
                                onClick={() => undefined}
                                className="ion-margin-top"
                            >
                                <AppIcon slot="start" icon={homeOutline} />
                                Go to Home
                            </AppButton>
                        </AppCardContent>
                    </AppCard>
                </AppCol>
            </AppRow>
        </AppGrid>
    </div>
);

/** The Guardian page's text-white surface on `bgColor` (GuardianCredentialApprovalPage.tsx:199-202). */
const GuardianSurface: React.FC<{
    testId: string;
    bgColor: string;
    children: React.ReactNode;
}> = ({ testId, bgColor, children }) => (
    <div
        data-testid={testId}
        className="w-full flex flex-col items-center justify-center px-6 py-6 text-center text-white"
        style={{ backgroundColor: bgColor }}
    >
        {children}
    </div>
);

/** src/pages/interactions/GuardianCredentialApprovalPage.tsx:199-345, one block per page state. */
const GuardianButtons: React.FC = () => {
    const { theme } = useTheme();
    const bgColor =
        theme.colors.defaults.loginBgColor ?? theme.colors.defaults.loaders?.[0] ?? '#047857';
    const isProcessing = false;
    const otpCode = '123';

    return (
        <div className="flex flex-col gap-2">
            {/* state === 'ready' && !canSkipOtp (:255-275) */}
            <GuardianSurface testId="c1a-guardian-buttons-send-code" bgColor={bgColor}>
                <div className="w-full max-w-sm">
                    <p className="text-white/80 text-sm mb-4">
                        To approve or reject, we'll send a verification code to your email.
                    </p>
                    <AppButton
                        expand="block"
                        color="light"
                        onClick={() => undefined}
                        disabled={isProcessing}
                    >
                        Send Verification Code
                    </AppButton>
                </div>
            </GuardianSurface>

            {/* state === 'ready' && canSkipOtp (:278-302) */}
            <GuardianSurface testId="c1a-guardian-buttons-in-app" bgColor={bgColor}>
                <div className="w-full max-w-sm">
                    <p className="text-white/80 text-sm mb-4">
                        You have a guardian relationship with this student. You can approve or
                        reject this credential directly.
                    </p>
                    <AppButton
                        expand="block"
                        color="light"
                        onClick={() => undefined}
                        disabled={isProcessing}
                    >
                        Approve
                    </AppButton>
                    <AppButton
                        expand="block"
                        fill="outline"
                        color="light"
                        onClick={() => undefined}
                        disabled={isProcessing}
                        className="mt-2"
                    >
                        Reject
                    </AppButton>
                </div>
            </GuardianSurface>

            {/* state === 'code_sent' with an incomplete code (:313-340): both disabled */}
            <GuardianSurface testId="c1a-guardian-buttons-otp-disabled" bgColor={bgColor}>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <p className="text-white/80 text-sm mb-2">
                        Enter the 6-digit code we sent to your email.
                    </p>
                    <AppButton
                        expand="block"
                        color="light"
                        onClick={() => undefined}
                        disabled={isProcessing || otpCode.length !== 6}
                    >
                        Approve
                    </AppButton>
                    <AppButton
                        expand="block"
                        fill="outline"
                        color="light"
                        onClick={() => undefined}
                        disabled={isProcessing || otpCode.length !== 6}
                    >
                        Reject
                    </AppButton>
                </div>
            </GuardianSurface>
        </div>
    );
};

/**
 * src/pages/consentFlow/ConsentFlowReadSharingModal.tsx:228-372, the three sharing checkboxes with
 * the same handler shape (`onClick` on both label and checkbox, `checked` derived from `term`).
 * The real modal also calls `useGetCredentialCount` / `useGetCredentialList`, whose queryFns
 * initialize a wallet.
 *
 * Only `term` changes trigger a re-render, as in the source. The handler log is written to the DOM
 * through a ref, not React state: an extra re-render would re-apply `checked` (AppCheckbox keeps
 * Ionic React's model) and hide the existing desync (clicking the already-checked "Live syncing"
 * box is an early return in the handler, so the internally toggled state is never corrected).
 */
const ConsentSharingCheckboxes: React.FC = () => {
    const category = 'Achievement';
    const required = false;
    const { plural } = getInfoFromContractKey(category);
    const [term, setTerm] = useState({ sharing: true, shareAll: true, shared: [] as string[] });
    const handlerCalls = useRef<string[]>([]);
    const handlerLog = useRef<HTMLOutputElement>(null);
    const record = (name: string): void => {
        handlerCalls.current.push(name);
        if (handlerLog.current) {
            handlerLog.current.textContent = JSON.stringify(handlerCalls.current);
        }
    };

    const handleLiveSyncing = (): void => {
        record('liveSyncing');
        if (term.shareAll) return;
        setTerm({
            ...term,
            shared: ['lc:fixture:1', 'lc:fixture:2'],
            shareAll: true,
            sharing: true,
        });
    };
    const handleSelectiveSharing = (): void => {
        record('selectiveSharing');
        setTerm({ ...term, shared: [], shareAll: false, sharing: true });
    };
    const handleNotSharing = (): void => {
        record('notSharing');
        setTerm({ ...term, shareAll: false, sharing: false, shared: [] });
    };

    return (
        <AppRow className="w-full">
            <AppCol
                size="12"
                className="w-full bg-white rounded-[15px] shadow-box-bottom py-2 px-5"
            >
                <fieldset className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3">
                    <section className="w-full justify-between items-center flex gap-3">
                        <label
                            onClick={handleLiveSyncing}
                            htmlFor={`${category}-share-all`}
                            className="flex flex-col flex-1 gap-1"
                        >
                            <h6 className="text-grayscale-900 text-lg font-poppins">
                                {m['arabicFixes.liveSyncing']()}
                            </h6>
                            <span className="text-grayscale-700 text-sm font-poppins">
                                {m['arabicFixes.continuousShare']({ items: plural })}
                            </span>
                        </label>

                        <AppCheckbox
                            id={`${category}-share-all`}
                            color="emerald-700"
                            className="shrink-0 h-8 w-8"
                            mode="ios"
                            checked={term.shareAll && term.sharing}
                            onClick={handleLiveSyncing}
                        />
                    </section>
                </fieldset>

                <fieldset className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3 last:border-0">
                    <section className="w-full justify-between items-center flex gap-3">
                        <label
                            onClick={handleSelectiveSharing}
                            className="flex flex-col flex-1 gap-1"
                        >
                            <h6 className="text-grayscale-900 text-lg font-poppins">
                                {m['arabicFixes.selectiveSharing']()}
                            </h6>
                            <span className="text-grayscale-700 text-sm font-poppins">
                                {m['arabicFixes.selectiveSharingHelp']({ items: plural })}
                            </span>
                        </label>

                        <AppCheckbox
                            color="emerald-700"
                            className="shrink-0 h-8 w-8"
                            mode="ios"
                            checked={!term.shareAll && term.sharing}
                            onClick={handleSelectiveSharing}
                        />
                    </section>
                </fieldset>

                {!required && (
                    <fieldset className="w-full flex flex-col gap-3 py-3">
                        <section className="w-full justify-between items-center flex gap-3">
                            <label
                                onClick={handleNotSharing}
                                className="flex flex-col flex-1 gap-1"
                            >
                                <h6 className="text-grayscale-900 text-lg font-poppins">
                                    {m['arabicFixes.notSharing']()}
                                </h6>
                                <span className="text-grayscale-700 text-sm font-poppins">
                                    {m['arabicFixes.notSharingHelp']({ items: plural })}
                                </span>
                            </label>

                            <AppCheckbox
                                color="emerald-700"
                                className="shrink-0 h-8 w-8"
                                mode="ios"
                                checked={!term.sharing}
                                onClick={handleNotSharing}
                            />
                        </section>
                    </fieldset>
                )}
                <Value testId="c1a-consent-checkboxes-value" value={term} />
                <output
                    ref={handlerLog}
                    data-testid="c1a-consent-checkboxes-handler-calls"
                    className="block text-xs font-mono text-grayscale-600"
                >
                    []
                </output>
            </AppCol>
        </AppRow>
    );
};

type RadioOption = { label: string; type: string };

/**
 * Shared body of AdminToolsStorageOption.tsx:179-240 and AdminToolsNetwork.tsx:182-245 (identical
 * apart from the option list and the description suffix). The custom-endpoint IonInput is omitted:
 * IonInput is outside this batch.
 */
const AdminToolsRadioGroup: React.FC<{
    options: RadioOption[];
    initial: string;
    suffix: string;
    testId: string;
}> = ({ options, initial, suffix, testId }) => {
    const [selectedType, setSelectedType] = useState<string | undefined>(initial);

    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px] pt-4">
            <div className="w-full flex flex-col items-center justify-center px-4">
                <AppRadioGroup
                    value={selectedType}
                    onValueChange={value => setSelectedType(value as string)}
                    className="w-full"
                >
                    {options.map((opt, index) => {
                        const isSelected = selectedType === opt.type;
                        return (
                            <fieldset
                                key={index}
                                className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3 first:pt-0 last:pb-6 last:border-b-0"
                            >
                                <section className="w-full justify-between items-center flex gap-3">
                                    <label className="flex flex-col flex-1 gap-1">
                                        <h6 className="text-grayscale-900 text-lg font-poppins">
                                            {opt.label}
                                        </h6>
                                        <span className="text-grayscale-700 text-sm font-poppins">
                                            {opt.label} {suffix}
                                        </span>
                                    </label>

                                    <div
                                        className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${
                                            isSelected
                                                ? 'bg-emerald-700 text-white'
                                                : 'bg-grayscale-100 text-transparent'
                                        }`}
                                    >
                                        <AppRadio
                                            value={opt.type}
                                            className="w-full h-full ml-2"
                                            color="white"
                                            mode="ios"
                                        />
                                    </div>
                                </section>
                            </fieldset>
                        );
                    })}
                </AppRadioGroup>
            </div>
            <div className="px-4 pb-4">
                <Value testId={`${testId}-value`} value={selectedType} />
            </div>
        </section>
    );
};

/** Real MultiTextInput (src/pages/hidden/MultiTextInput.tsx:47): one unchecked and one checked row. */
const MultiTextInputFixture: React.FC = () => {
    const [values, setValues] = useState<ConsentFlowContract['read']['personal']>({
        name: { required: false },
        email: { required: true },
    });
    return (
        <>
            <MultiTextInput
                values={values}
                onChange={setValues}
                label="Personal data"
                buttonText="Add field"
                style="admin-dashboard"
            />
            <Value testId="c1a-multitextinput-value" value={values} />
        </>
    );
};

/** Real BoostCMSMemberPrivacyOptions (:114): three uncontrolled `<AppCheckbox />`. */
const BoostCMSMemberOptionsFixture: React.FC = () => {
    const [state, setState] = useState<BoostCMSState>(initialBoostCMSState);
    return <BoostCMSMemberPrivacyOptions state={state} setState={setState} />;
};

/** Every checkbox state, in both modes. The app forces ios (ConsentFlow) or inherits the global mode. */
const CheckboxStates: React.FC = () => {
    const [checked, setChecked] = useState(false);
    return (
        <div className="bg-white rounded-[15px] p-4 flex flex-col gap-3">
            {(['ios', 'md'] as const).map(mode => (
                <div
                    key={mode}
                    data-testid={`c1a-checkbox-states-${mode}`}
                    className="flex gap-6 items-center"
                >
                    <span className="w-8 text-xs font-mono">{mode}</span>
                    <AppCheckbox mode={mode} color="emerald-700" aria-label={`${mode} unchecked`} />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        checked
                        aria-label={`${mode} checked`}
                    />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        disabled
                        aria-label={`${mode} disabled`}
                    />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        checked
                        disabled
                        aria-label={`${mode} disabled checked`}
                    />
                    <AppCheckbox mode={mode} aria-label={`${mode} default color checked`} checked />
                </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
                <AppCheckbox
                    color="emerald-700"
                    checked={checked}
                    onCheckedChange={setChecked}
                    aria-label="Controlled checkbox"
                />
                Controlled (onIonChange)
            </label>
            <Value testId="c1a-checkbox-states-value" value={checked} />
        </div>
    );
};

/**
 * Each AppButton color/fill/expand combination used by the app (formerly IonButton), enabled
 * and disabled, in both modes. App call sites pass no `mode`, so they follow the global one (ios on iPhone UAs, md
 * elsewhere). These rows pin it, so a single capture shows both looks.
 */
const ButtonMatrix: React.FC = () => {
    const variants: { name: string; props: AppButtonProps }[] = [
        { name: 'default', props: {} },
        { name: 'primary', props: { color: 'primary' } },
        { name: 'light', props: { color: 'light' } },
        { name: 'light-outline', props: { color: 'light', fill: 'outline' } },
        { name: 'medium-outline', props: { color: 'medium', fill: 'outline' } },
        { name: 'block', props: { expand: 'block' } },
        { name: 'light-block', props: { color: 'light', expand: 'block' } },
        {
            name: 'light-outline-block',
            props: { color: 'light', fill: 'outline', expand: 'block' },
        },
    ];
    return (
        <div
            className="rounded-[15px] p-4 flex flex-col gap-2"
            style={{ backgroundColor: '#047857' }}
        >
            {(['global', 'md', 'ios'] as const).flatMap(mode =>
                [false, true].map(disabled => {
                    const suffix = `${mode}-${disabled ? 'disabled' : 'enabled'}`;
                    return (
                        <div
                            key={suffix}
                            data-testid={`c1a-button-matrix-${suffix}`}
                            className="flex flex-wrap items-start gap-2"
                        >
                            <span className="w-[110px] text-xs font-mono text-white">{suffix}</span>
                            {variants.map(({ name, props }) => (
                                <div key={name} className={props.expand ? 'w-[220px]' : undefined}>
                                    <AppButton
                                        mode={mode === 'global' ? undefined : mode}
                                        color={props.color}
                                        fill={props.fill}
                                        expand={props.expand}
                                        disabled={disabled}
                                        data-testid={`c1a-button-${name}-${suffix}`}
                                    >
                                        {name}
                                    </AppButton>
                                </div>
                            ))}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export const ControlsVisualFixture: React.FC = () => (
    <main className="mx-auto flex w-full max-w-[860px] flex-col items-stretch gap-6 p-6 font-poppins">
        {/*
         * IonApp starts Ionic's focus-visible (`.ion-focused`) and tap-click (`.ion-activated`)
         * utilities, as it does at the real app root. Its host CSS (absolute, contain, overflow)
         * would clip this long page, so it is mounted empty and hidden instead of as a wrapper.
         */}
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="c1a-button-matrix" title="IonButton variants used by the app">
            <ButtonMatrix />
        </Block>
        <Block
            testId="c1a-viewcredsbundle-toolbar"
            title="ViewCredsBundle: IonButton in IonToolbar"
        >
            <ViewCredsBundleToolbar />
        </Block>
        <Block testId="c1a-devcli-toolbar" title="DevCli: IonButtons start/end">
            <DevCliToolbar />
        </Block>
        <Block testId="c1a-embedapp-toolbar" title="EmbedAppFullScreen: IonButtons start/end">
            <EmbedAppFullScreenToolbar />
        </Block>
        <Block testId="c1a-api-token-datetime" title="CreateAPITokenModal: IonButtons slot=buttons">
            <CreateAPITokenDatetime />
        </Block>
        <Block testId="c1a-approve-account" title="ApproveAccount: color=light">
            <ApproveAccountButtons />
        </Block>
        <Block testId="c1a-interactions-error" title="InteractionsPage: block / medium outline">
            <InteractionsErrorCard />
        </Block>
        <Block testId="c1a-guardian-buttons" title="GuardianCredentialApprovalPage">
            <GuardianButtons />
        </Block>
        <Block testId="c1a-consent-checkboxes" title="ConsentFlowReadSharingModal checkboxes">
            <ConsentSharingCheckboxes />
        </Block>
        <Block testId="c1a-checkbox-states" title="IonCheckbox states">
            <CheckboxStates />
        </Block>
        <Block testId="c1a-multitextinput" title="MultiTextInput (real)">
            <MultiTextInputFixture />
        </Block>
        <Block testId="c1a-boostcms-member-options" title="BoostCMSMemberPrivacyOptions (real)">
            <BoostCMSMemberOptionsFixture />
        </Block>
        <Block testId="c1a-admin-storage-radios" title="AdminToolsStorageOption radios">
            <AdminToolsRadioGroup
                options={storageOptionsList}
                initial={StorageOptionsEnum.staging}
                suffix="storage"
                testId="c1a-admin-storage-radios"
            />
        </Block>
        <Block testId="c1a-admin-network-radios" title="AdminToolsNetwork radios">
            <AdminToolsRadioGroup
                options={networkOptionsList}
                initial={NetworkOptionsEnum.production}
                suffix="network"
                testId="c1a-admin-network-radios"
            />
        </Block>
    </main>
);
