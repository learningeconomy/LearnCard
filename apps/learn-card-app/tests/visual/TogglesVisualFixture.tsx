import React, { useEffect, useRef, useState } from 'react';
import { IonApp, IonCol, IonLabel, IonRow, IonToggle } from '@ionic/react';
import { useImmer } from 'use-immer';
import { Lock } from 'lucide-react';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import LockBold from 'learn-card-base/svgs/LockBold';

import * as m from '../../src/paraglide/messages.js';
import useTheme from '../../src/theme/hooks/useTheme';
import {
    initialBoostCMSState,
    BoostCMSAppearancePreviewTypeEnum,
    type BoostCMSState,
} from '../../src/components/boost/boost';
import { boostVCTypeOptions } from '../../src/components/boost/boost-options/boostOptions';
import BoostCMSAIMissionForm from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSAIMission/BoostCMSAIMissionForm';
import BoostCMSAddChatForm from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSAddChat/BoostCMSAddChatForm';
import BoostCMSPermissionsForm from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSPermissions/BoostCMSPermissionsForm';
import ResumeBuilderToggle from '../../src/components/resume-builder/ResumeBuilderToggle';
import NetworkSettings from '../../src/components/network-settings/NetworkSettings';
import {
    NetworkSettingsEnum,
    type NetworkSettingsState,
} from '../../src/components/network-settings/networkSettings.helpers';
import ConsentFlowCredentialAccessToggles from '../../src/pages/consentFlow/ConsentFlowCredentialAccessToggles';
import ConsentFlowPersonalAccessToggles from '../../src/pages/consentFlow/ConsentFlowPersonalAccessToggles';
import SettingRow from '../../src/pages/privacy-settings/components/SettingRow';
import GlassCard from '../../src/pages/privacy-settings/components/GlassCard';
// Not global in the app: only DataSharingCenterView / SharedLinksAllSheet import it, so `ds-toggle`
// (T-K) is styled on the privacy page and unstyled on any other mount. The fixture imports it so
// T-K renders as on that page; the unstyled look is the same as T-L (no class).
import '../../src/pages/privacy-settings/dataSharingCenter.scss';

/**
 * `toggles-1b`: representative IonToggle call sites for every group (T-A … T-M) in the phase 4
 * batch 1b inventory (anvil-ionic-evidence/p4c/inventory.md §1.1), rendered with fixed local data
 * and no backend.
 *
 * Components that render standalone with props only are the real ones (BoostCMSAIMissionForm,
 * BoostCMSAddChatForm, BoostCMSPermissionsForm, ResumeBuilderToggle, NetworkSettings,
 * ConsentFlowCredentialAccessToggles, ConsentFlowPersonalAccessToggles, SettingRow). Everything else
 * is a faithful excerpt: the toggle, its props, classes and handler shape, and its immediate row
 * wrappers, copied from the source line cited in each block. Page state those handlers touch is
 * reduced to the fields the toggle reads.
 *
 * Each call site is its own component with local state, as in the source. Ionic React re-applies
 * `checked` to an IonToggle whenever its parent re-renders, so a shared page-level state would
 * reset toggles that were flipped internally (Space on an `onClick` site, the uncontrolled T-M).
 *
 * Every block reports app state in `<output data-testid="t1b-…-value">`. Sites wired with
 * `onClick` (T-H, T-I, T-J) also log handler calls into `<output data-testid="t1b-…-handler-calls">`
 * through a ref, not state: Space toggles ion-toggle without a click event, and a state-driven log
 * would re-render, re-apply `checked` and hide that desync.
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
    <output data-testid={testId} className="block text-xs font-mono text-grayscale-600">
        {JSON.stringify(value ?? null)}
    </output>
);

/** Handler-call log written to the DOM through a ref, so logging never re-renders the call site. */
const useHandlerLog = (): {
    record: (name: string) => void;
    ref: React.RefObject<HTMLOutputElement | null>;
} => {
    const calls = useRef<string[]>([]);
    const ref = useRef<HTMLOutputElement>(null);
    const record = (name: string): void => {
        calls.current.push(name);
        if (ref.current) ref.current.textContent = JSON.stringify(calls.current);
    };
    return { record, ref };
};

const HandlerLog: React.FC<{
    testId: string;
    logRef: React.RefObject<HTMLOutputElement | null>;
}> = ({ testId, logRef }) => (
    <output
        ref={logRef}
        data-testid={testId}
        className="block text-xs font-mono text-grayscale-600"
    >
        []
    </output>
);

// ---------------------------------------------------------------------------------------------
// State matrix
// ---------------------------------------------------------------------------------------------

type MatrixVariant = {
    name: string;
    color?: string;
    className?: string;
    note: string;
};

/**
 * Every color / class combination used by a call site, plus the tenant primary colors T-C can
 * resolve to (colorful indigo-500, formal blue-500, vetpass baltic-blue-500, which has no
 * `.ion-color-*` class). All colored sites pin `mode="ios"`; their md rows are synthetic and exist
 * only to compare the md look. The unpinned T-J/K/L sites use default / ds-toggle.
 */
const MatrixRow: React.FC<{ variant: MatrixVariant; mode: 'ios' | 'md' }> = ({ variant, mode }) => {
    const [off, setOff] = useState(false);
    const [on, setOn] = useState(true);
    const prefix = `t1b-matrix-${variant.name}-${mode}`;
    const cells: { state: string; checked: boolean; disabled: boolean; set?: typeof setOn }[] = [
        { state: 'off', checked: off, disabled: false, set: setOff },
        { state: 'on', checked: on, disabled: false, set: setOn },
        { state: 'disabled-off', checked: false, disabled: true },
        { state: 'disabled-on', checked: true, disabled: true },
    ];

    return (
        <div data-testid={prefix} className="flex items-center gap-5">
            <span className="w-[230px] text-xs font-mono">
                {variant.name} {mode}
                <span className="block text-grayscale-500">{variant.note}</span>
            </span>
            {cells.map(cell => (
                <IonToggle
                    key={cell.state}
                    data-testid={`${prefix}-${cell.state}`}
                    mode={mode}
                    color={variant.color}
                    className={variant.className}
                    checked={cell.checked}
                    disabled={cell.disabled}
                    onIonChange={e => cell.set?.(e.detail.checked)}
                    aria-label={`${variant.name} ${mode} ${cell.state}`}
                />
            ))}
            <Value testId={`${prefix}-value`} value={{ off, on }} />
        </div>
    );
};

const ToggleMatrix: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const variants: MatrixVariant[] = [
        { name: 'emerald-700', color: 'emerald-700', note: 'T-A/D/H/I/M' },
        { name: 'indigo-700', color: 'indigo-700', note: 'T-B' },
        { name: 'theme-primary', color: primaryColor, note: `T-C (${primaryColor})` },
        { name: 'indigo-500', color: 'indigo-500', note: 'T-C colorful' },
        { name: 'blue-500', color: 'blue-500', note: 'T-C formal' },
        { name: 'baltic-blue-500', color: 'baltic-blue-500', note: 'T-C vetpass' },
        {
            name: 'emerald-500-family-cms',
            color: 'emerald-500',
            className: 'family-cms-toggle rounded-full',
            note: 'T-G',
        },
        { name: 'family-cms', className: 'family-cms-toggle', note: 'T-F' },
        { name: 'ds-toggle', className: 'ds-toggle', note: 'T-K' },
        { name: 'default', note: 'T-J/L' },
    ];

    return (
        <div className="bg-white rounded-[15px] p-4 flex flex-col gap-3">
            <p className="text-xs text-grayscale-600">
                Columns: off, on, disabled-off, disabled-on. Colored md rows are synthetic (every
                colored call site pins ios).
            </p>
            {(['ios', 'md'] as const).flatMap(mode =>
                variants.map(variant => (
                    <MatrixRow key={`${variant.name}-${mode}`} variant={variant} mode={mode} />
                ))
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-A  mode="ios" color="emerald-700", onIonChange ignores the detail and flips app state
// ---------------------------------------------------------------------------------------------

/** src/components/boost/boostCMS/boostCMSForms/boostCMSBasicInfo/BoostCMSBasicInfoForm.tsx:184-202 */
const BasicInfoCredentialExpires: React.FC<{ testId: string; disabled?: boolean }> = ({
    testId,
    disabled = false,
}) => {
    const [basicInfo, setBasicInfo] = useState<{
        credentialExpires: boolean;
        expirationDate: string | null;
    }>({ credentialExpires: disabled, expirationDate: '2026-12-01' });
    const handleStateChange = (propName: string, value: boolean | string | null): void =>
        setBasicInfo(prev => ({ ...prev, [propName]: value }));

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                <p className="text-grayscale-900 font-medium w-10/12">
                    {m['boost.cms.basicInfo.credentialExpires']()}
                </p>
                <IonToggle
                    data-testid={`${testId}-toggle`}
                    mode="ios"
                    color="emerald-700"
                    onIonChange={() => {
                        const expiresValue = !basicInfo?.credentialExpires;
                        handleStateChange('credentialExpires', expiresValue);
                        //if we are toggling the value to false (eg does not expire, clear expiration date if exists)
                        if (!expiresValue) {
                            handleStateChange('expirationDate', null);
                        }
                    }}
                    checked={basicInfo?.credentialExpires}
                    disabled={disabled}
                />
            </div>
            <Value testId={`${testId}-value`} value={basicInfo} />
        </div>
    );
};

/** src/components/boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode.tsx:398-431 */
const ShareableGenerateClaimLink: React.FC = () => {
    const [toggle, setToggle] = useState<boolean>(false);
    return (
        <div className="flex flex-col gap-[20px] items-center justify-center bg-white w-full max-w-[600px] rounded-[20px] ion-padding">
            <div className="w-full flex items-center justify-between">
                <p className="text-grayscale-900 font-medium w-10/12">
                    {m['boost.cms.issueTo.generateClaimLink']()}
                </p>
                <IonToggle
                    data-testid="t1b-a-shareable-claim-link-toggle"
                    mode="ios"
                    color="emerald-700"
                    onIonChange={() => {
                        setToggle(!toggle);
                    }}
                    checked={toggle}
                />
            </div>
            <Value testId="t1b-a-shareable-claim-link-value" value={toggle} />
        </div>
    );
};

/** src/components/boost/boostCMS/BoostIDCardCMS/BoostIDCardCMSForms/BoostIDCardCMSIssuerThumbnailForm.tsx:53-66 */
const IdCardIssuerThumbnail: React.FC = () => {
    const [state, setState] = useState({ appearance: { showIdIssuerImage: true } });
    const disabled = false;
    const handleStateChange = (propName: string, value: boolean): void =>
        setState(prev => ({ ...prev, appearance: { ...prev.appearance, [propName]: value } }));

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-2 mb-4 rounded-[20px]">
            <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                <p className="text-grayscale-900 font-medium w-10/12">Show Issuer Thumbnail</p>
                <IonToggle
                    data-testid="t1b-a-idcard-issuer-thumbnail-toggle"
                    mode="ios"
                    color="emerald-700"
                    onIonChange={() => {
                        const showIdIssuerImage = !state?.appearance?.showIdIssuerImage;
                        handleStateChange('showIdIssuerImage', showIdIssuerImage);
                    }}
                    checked={state?.appearance?.showIdIssuerImage}
                    disabled={disabled}
                />
            </div>
            <Value testId="t1b-a-idcard-issuer-thumbnail-value" value={state.appearance} />
        </IonRow>
    );
};

/** src/components/boost-endorsements/EndorsementsList/EndorsementFullView.tsx:186-225 (toggle row) */
const EndorsementShowToggle: React.FC = () => {
    const [showEndorsement, setShowEndorsement] = useState(true);
    const [visibilityCalls, setVisibilityCalls] = useState<boolean[]>([]);
    const setVisibility = (value: boolean): void => setVisibilityCalls(prev => [...prev, value]);

    return (
        <div className="py-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4 relative">
            <div className="w-full border-b border-grayscale-200 pb-2">
                <div className="flex items-center justify-between w-full px-4">
                    <div>
                        <p
                            className={`text-xs font-semibold ${
                                showEndorsement ? 'text-emerald-500' : 'text-grayscale-600'
                            }`}
                        >
                            {showEndorsement
                                ? m['endorsement.fullview.active']()
                                : m['endorsement.fullview.hidden']()}
                        </p>
                        <h1 className="text-sm font-semibold text-grayscale-900">
                            {m['endorsement.fullview.showEndorsement']()}
                        </h1>
                    </div>

                    <IonToggle
                        data-testid="t1b-a-endorsement-toggle"
                        mode="ios"
                        color="emerald-700"
                        onIonChange={() => {
                            const showEndorsementValue = showEndorsement;
                            setShowEndorsement(!showEndorsementValue);
                            setVisibility?.(!showEndorsementValue);
                            // updateIndexRecordVisibility(!showEndorsementValue): network, omitted
                        }}
                        checked={showEndorsement}
                    />
                </div>
            </div>
            <div className="px-4">
                <Value
                    testId="t1b-a-endorsement-value"
                    value={{ showEndorsement, visibilityCalls }}
                />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-B  color="indigo-700"; T-C  color={theme primaryColor}; both bound to basicInfo.credentialExpires
// ---------------------------------------------------------------------------------------------

/** Real BoostCMSAIMissionForm (:37, h1 row) and BoostCMSAddChatForm (:40), enabled and disabled. */
const RealCredentialExpiresForm: React.FC<{
    testId: string;
    Form: typeof BoostCMSAIMissionForm;
    disabled?: boolean;
}> = ({ testId, Form, disabled }) => {
    const [state, setState] = useState<BoostCMSState>({
        ...initialBoostCMSState,
        basicInfo: { ...initialBoostCMSState.basicInfo, credentialExpires: Boolean(disabled) },
    });
    return (
        <div data-testid={testId}>
            <Form state={state} setState={setState} disabled={disabled} />
            <Value
                testId={`${testId}-value`}
                value={{
                    credentialExpires: state.basicInfo.credentialExpires,
                    expirationDate: state.basicInfo.expirationDate,
                }}
            />
        </div>
    );
};

/**
 * src/components/boost/boostCMS/boostCMSForms/boostCMSUserPermissions/BoostCMSUserPermissions.tsx:36-91
 * (first two rows). Both toggles are bound to `basicInfo.credentialExpires` in the source (an
 * existing copy-paste bug), so they move together.
 */
const UserPermissionsRows: React.FC = () => {
    const [basicInfo, setBasicInfo] = useState<{
        credentialExpires: boolean;
        expirationDate: string | null;
    }>({ credentialExpires: false, expirationDate: null });
    const disabled = false;
    const handleStateChange = (propName: string, value: boolean | null): void =>
        setBasicInfo(prev => ({ ...prev, [propName]: value }));
    const onIonChange = (): void => {
        const expiresValue = !basicInfo?.credentialExpires;
        handleStateChange('credentialExpires', expiresValue);
        //if we are toggling the value to false (eg does not expire, clear expiration date if exists)
        if (!expiresValue) {
            handleStateChange('expirationDate', null);
        }
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-black text-2xl p-0 m-0">
                    {m['boost.cms.userPermissions.title']()}
                </h1>
            </IonCol>
            <IonCol size="12" className="w-full bg-white">
                <div className="w-full flex items-center justify-between py-[8px]">
                    <p className="text-grayscale-900 font-medium w-10/12">
                        {m['boost.cms.userPermissions.createCustomBoosts']()}
                    </p>
                    <IonToggle
                        data-testid="t1b-b-user-permissions-custom-toggle"
                        mode="ios"
                        color="indigo-700"
                        onIonChange={onIonChange}
                        checked={basicInfo?.credentialExpires}
                        disabled={disabled}
                    />
                </div>
            </IonCol>
            <IonCol size="12" className="w-full bg-white">
                <div className="w-full flex items-center justify-between py-[8px]">
                    <p className="text-grayscale-900 font-medium w-10/12">
                        {m['boost.cms.userPermissions.createIDs']()}
                    </p>
                    <IonToggle
                        data-testid="t1b-b-user-permissions-ids-toggle"
                        mode="ios"
                        color="indigo-700"
                        onIonChange={onIonChange}
                        checked={basicInfo?.credentialExpires}
                        disabled={disabled}
                    />
                </div>
            </IonCol>
            <IonCol size="12">
                <Value testId="t1b-b-user-permissions-value" value={basicInfo} />
            </IonCol>
        </IonRow>
    );
};

// ---------------------------------------------------------------------------------------------
// T-D  color="emerald-700", onIonChange reads e.detail.checked
// ---------------------------------------------------------------------------------------------

/** Real BoostCMSPermissionsForm (:46, :73, :104). */
const RealPermissionsForm: React.FC<{ testId: string; disabled?: boolean }> = ({
    testId,
    disabled,
}) => {
    const [state, setState] = useState<BoostCMSState>(initialBoostCMSState);
    return (
        <div data-testid={testId}>
            <BoostCMSPermissionsForm state={state} setState={setState} disabled={disabled} />
            <Value testId={`${testId}-value`} value={state.boostPermissions} />
        </div>
    );
};

/**
 * src/components/boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode.tsx:445-471, the
 * amber "claim links unavailable" card. `handleCanViewToggle` (:349) is replaced by a synchronous
 * stand-in that keeps its early return on `!checked` (turning it off does nothing) and skips the
 * wallet call. The source unmounts this card once `canViewEnabled` is true; the fixture keeps it so
 * the checked look can be captured. `updating` shows the `disabled={isUpdatingPermissions}` state.
 */
const ShareableCanViewAmber: React.FC<{ testId: string; updating?: boolean }> = ({
    testId,
    updating = false,
}) => {
    const [canViewEnabled, setCanViewEnabled] = useState(false);
    const isUpdatingPermissions = updating;
    const handleCanViewToggle = (checked: boolean): void => {
        if (!checked) return;
        if (isUpdatingPermissions) return;
        setCanViewEnabled(true);
    };

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <div className="w-full flex flex-col gap-[12px] bg-amber-50 border border-amber-200 rounded-[15px] p-[14px] mb-2">
                <p className="text-amber-900 font-poppins text-[16px] font-[600] m-0">
                    {m['boost.cms.issueTo.claimLinksUnavailable']()}
                </p>
                <p className="text-amber-800 text-sm m-0">
                    {m['boost.cms.issueTo.cannotGenerateClaimLinks']()}
                </p>
                <div className="w-full flex items-center justify-between pt-1">
                    <p className="text-amber-900 font-medium w-10/12 m-0">
                        {m['boost.cms.issueTo.anyoneCanView']()}
                    </p>
                    <IonToggle
                        data-testid={`${testId}-toggle`}
                        mode="ios"
                        color="emerald-700"
                        checked={canViewEnabled}
                        disabled={isUpdatingPermissions}
                        onIonChange={e => handleCanViewToggle(Boolean(e.detail.checked))}
                    />
                </div>
            </div>
            <Value testId={`${testId}-value`} value={{ canViewEnabled, isUpdatingPermissions }} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-E  mode="ios", no color, host bg-* / rounded-full / opacity-50, LockBold overlay
// ---------------------------------------------------------------------------------------------

/**
 * src/components/boost/boostCMS/boostCMSForms/boostCMSMedia/BoostCMSMediaForm.tsx:90-163. The
 * derived flags are computed exactly as in the source from `displayType`, the attachment count and
 * `previewType`.
 */
const MediaOnlyToggle: React.FC<{
    testId: string;
    displayType: 'media' | 'badge';
    attachmentCount: number;
}> = ({ testId, displayType, attachmentCount }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const [previewType, setPreviewType] = useState<BoostCMSAppearancePreviewTypeEnum | undefined>(
        BoostCMSAppearancePreviewTypeEnum.Default
    );

    const isMediaDisplayType = displayType === 'media';
    const noAttachments = attachmentCount === 0;
    const hasAttachments = attachmentCount > 0;
    const isMediaPreviewType = previewType === BoostCMSAppearancePreviewTypeEnum.Media;
    const isToggleDisabled =
        isMediaDisplayType || noAttachments || (isMediaPreviewType && !hasAttachments);
    let isChecked = previewType !== BoostCMSAppearancePreviewTypeEnum.Default;
    if (isMediaDisplayType) isChecked = true;

    const toggleRequirementsText = isMediaDisplayType
        ? m['boost.cms.media.requiredForMediaDisplay']()
        : m['boost.cms.media.addMediaToEnable']();

    let lockIconPosition = '';
    if (isToggleDisabled && isMediaDisplayType) lockIconPosition = 'right-[6px]';
    if (isToggleDisabled && !isMediaDisplayType) lockIconPosition = 'left-[6px]';

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white rounded-[20px] py-4">
                <div className="w-full flex items-center justify-between px-4">
                    <div>
                        <p className="font-poppins text-grayscale-900 text-[17px] p-0 m-0">
                            {m['boost.cms.media.showOnlyMedia']()}
                        </p>
                        <p className="font-poppins text-grayscale-600 font-semibold text-xs p-0 m-0">
                            {toggleRequirementsText}
                        </p>
                    </div>

                    <div className="flex items-center justify-center relative rounded-full">
                        <IonToggle
                            data-testid={`${testId}-toggle`}
                            onIonChange={e => {
                                if (e.detail.checked) {
                                    setPreviewType(BoostCMSAppearancePreviewTypeEnum.Media);
                                } else {
                                    setPreviewType(BoostCMSAppearancePreviewTypeEnum.Default);
                                }
                            }}
                            checked={isChecked}
                            disabled={isToggleDisabled}
                            mode="ios"
                            className={`rounded-full ${
                                isChecked ? `bg-${primaryColor}` : 'bg-grayscale-100'
                            } ${isToggleDisabled ? 'opacity-50' : ''}`}
                        />
                        {isToggleDisabled && (
                            <LockBold
                                className={`h-[18px] w-[18px] text-grayscale-700/80 absolute ${lockIconPosition} z-10`}
                            />
                        )}
                    </div>
                </div>
                <div className="px-4">
                    <Value
                        testId={`${testId}-value`}
                        value={{ previewType, isChecked, isToggleDisabled }}
                    />
                </div>
            </IonCol>
        </IonRow>
    );
};

// ---------------------------------------------------------------------------------------------
// T-F  mode="ios" className="family-cms-toggle", no color
// ---------------------------------------------------------------------------------------------

/** src/components/familyCMS/FamilyCMSAppearanceForm/FamilyCMSAppearanceForm.tsx:56-106 (toggles only). */
const FamilyAppearanceToggles: React.FC = () => {
    const [fadeBackground, setFadeBackground] = useState(true);
    const [repeatBackground, setRepeatBackground] = useState(false);
    const [appearance, setAppearance] = useState<Record<string, boolean>>({});
    const handleSetState = (_section: string, key: string, value: boolean): void =>
        setAppearance(prev => ({ ...prev, [key]: value }));

    return (
        <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full ion-padding">
            <h3 className="text-grayscale-900 font-poppins font-normal text-left w-full text-[20px]">
                {m['family.appearance.wallpaper']()}
            </h3>

            <div className="flex flex-col items-center justify-center w-full bg-grayscale-100 rounded-[15px] mt-4 py-2">
                <div className="flex items-center justify-between w-full bg-grayscale-100 p-2 border-b-white border-b-solid border-b-2">
                    <div className="flex items-center justify-between w-full pb-2 pl-[4px]">
                        <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                            {m['family.appearance.fadeBackground']()}
                        </p>
                        <IonToggle
                            data-testid="t1b-f-family-appearance-fade-toggle"
                            mode="ios"
                            className="family-cms-toggle"
                            onIonChange={() => {
                                setFadeBackground(!fadeBackground);
                                handleSetState(
                                    'appearance',
                                    'fadeBackgroundImage',
                                    !fadeBackground
                                );
                            }}
                            checked={fadeBackground}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-[15px] p-2">
                    <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                        <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                            {m['family.appearance.repeatBackground']()}
                        </p>
                        <IonToggle
                            data-testid="t1b-f-family-appearance-repeat-toggle"
                            mode="ios"
                            className="family-cms-toggle"
                            onIonChange={() => {
                                setRepeatBackground(!repeatBackground);
                                handleSetState(
                                    'appearance',
                                    'repeatBackgroundImage',
                                    !repeatBackground
                                );
                            }}
                            checked={repeatBackground}
                        />
                    </div>
                </div>
            </div>
            <Value
                testId="t1b-f-family-appearance-value"
                value={{ fadeBackground, repeatBackground, appearance }}
            />
        </div>
    );
};

/** src/components/learncardID-CMS/LearnCardIDCMS.tsx:186-207 (`checked` derived from fontColor). */
const LearnCardIdDarkText: React.FC = () => {
    const [learnCardID, setLearnCardID] = useState({ fontColor: '#EFF0F5' });
    const handleSetState = (key: string, value: string): void =>
        setLearnCardID(prev => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <div className="flex items-center justify-between w-full p-2 mt-2">
                <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                    <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                        {m['learnCardId.darkText']()}
                    </p>
                    <IonToggle
                        data-testid="t1b-f-learncardid-dark-text-toggle"
                        mode="ios"
                        className="family-cms-toggle"
                        onIonChange={() => {
                            handleSetState(
                                'fontColor',
                                learnCardID.fontColor === '#EFF0F5' ? '#353E64' : '#EFF0F5'
                            );
                        }}
                        checked={learnCardID.fontColor === '#353E64' ? true : false}
                    />
                </div>
            </div>
            <Value testId="t1b-f-learncardid-dark-text-value" value={learnCardID} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-G  real ResumeBuilderToggle (emerald-500 + family-cms-toggle, HiddenIcon overlay)
// ---------------------------------------------------------------------------------------------

const ResumeBuilderToggles: React.FC = () => {
    const [on, setOn] = useState(true);
    const [off, setOff] = useState(false);
    return (
        <div className="bg-white rounded-[20px] ion-padding flex flex-col gap-3">
            {[
                { name: 'on', checked: on, onChange: setOn, disabled: false },
                { name: 'off', checked: off, onChange: setOff, disabled: false },
                { name: 'disabled-on', checked: true, onChange: () => undefined, disabled: true },
                {
                    name: 'disabled-off',
                    checked: false,
                    onChange: () => undefined,
                    disabled: true,
                },
            ].map(row => (
                <div
                    key={row.name}
                    data-testid={`t1b-g-resume-builder-${row.name}`}
                    className="flex items-center justify-between"
                >
                    <span className="text-grayscale-900 font-poppins text-sm">{row.name}</span>
                    <ResumeBuilderToggle
                        checked={row.checked}
                        onChange={row.onChange}
                        disabled={row.disabled}
                    />
                </div>
            ))}
            <Value testId="t1b-g-resume-builder-value" value={{ on, off }} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-H  mode="ios" color="emerald-700", onClick only
// ---------------------------------------------------------------------------------------------

/**
 * Real NetworkSettings (:23). The parent handler is copied from
 * src/components/user-profile/UserProfileSetup.tsx:58-63, 100-105 (mutates, then spreads).
 */
const NetworkSettingsFixture: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [networkSettings, setNetworkSettings] = useState<NetworkSettingsState>({
        sendRequests: true,
        receiveRequests: true,
        showDisplayName: true,
        showProfilePicture: false,
    });
    const handleStateChange = (settingsType: NetworkSettingsEnum, settingState: boolean): void => {
        record(`${settingsType}:${settingState}`);
        const _settings = networkSettings;

        // eslint-disable-next-line react-hooks/immutability -- copied verbatim from UserProfileSetup.tsx:100-105, which mutates the state object before spreading it; the fixture keeps that wiring
        _settings[settingsType] = !settingState;
        setNetworkSettings({ ..._settings });
    };

    return (
        <div className="bg-white rounded-[20px]">
            <NetworkSettings
                handleCloseModal={() => undefined}
                settings={networkSettings}
                handleStateChange={handleStateChange}
            />
            <div className="px-6 pb-4">
                <Value testId="t1b-h-network-settings-value" value={networkSettings} />
                <HandlerLog testId="t1b-h-network-settings-handler-calls" logRef={ref} />
            </div>
        </div>
    );
};

/** src/pages/adminToolsPage/CreateContractModal.tsx:576-597 (IonLabel + `title`) and :646-662. */
const CreateContractToggles: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [contract, setContract] = useState({
        needsGuardianConsent: false,
        contract: { read: { anonymize: true } },
    });
    const updateSlice = (key: 'needsGuardianConsent', value: boolean): void => {
        record(`${key}:${value}`);
        setContract(prev => ({ ...prev, [key]: value }));
    };
    const updateRead = (key: 'anonymize', value: boolean): void => {
        record(`read.${key}:${value}`);
        setContract(prev => ({
            ...prev,
            contract: { read: { ...prev.contract.read, [key]: value } },
        }));
    };

    return (
        <div className="bg-white rounded-[20px] ion-padding flex flex-col gap-[20px]">
            <div className="flex gap-[10px] items-center">
                <IonLabel
                    className="font-medium text-base text-grayscale-800 font-notoSans tracking-wide"
                    title="If this contract is (potentially) intended for minors. Triggers a flow where users are asked to get a guardian/adult when viewing the contract."
                >
                    Needs Guardian Consent (GameFlow)
                </IonLabel>
                <IonToggle
                    data-testid="t1b-h-create-contract-guardian-toggle"
                    mode="ios"
                    color="emerald-700"
                    onClick={() =>
                        updateSlice('needsGuardianConsent', !contract.needsGuardianConsent)
                    }
                    checked={contract.needsGuardianConsent}
                    title="If this contract is (potentially) intended for minors. Triggers a flow where users are asked to get a guardian/adult when viewing the contract."
                />
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-[20px]">
                    Read{' '}
                    <span className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        - Anonymize
                    </span>
                </h3>
                <IonToggle
                    data-testid="t1b-h-create-contract-anonymize-toggle"
                    mode="ios"
                    color="emerald-700"
                    onClick={() => updateRead('anonymize', !contract.contract.read.anonymize)}
                    checked={contract.contract.read.anonymize}
                />
            </div>
            <div>
                <Value testId="t1b-h-create-contract-value" value={contract} />
                <HandlerLog testId="t1b-h-create-contract-handler-calls" logRef={ref} />
            </div>
        </div>
    );
};

/**
 * Real ConsentFlowCredentialAccessToggles (:69). `anonymize` with a `Name` key gives the
 * `isAnonymousName` disabled + unchecked row; a `required` row gives disabled + checked.
 */
const CredentialAccessTogglesFixture: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [terms, setTerms] = useImmer<Record<string, boolean>>({
        [BoostCategoryOptionsEnum.achievement]: false,
        [BoostCategoryOptionsEnum.socialBadge]: true,
        Name: true,
    });
    const setStateLogged: typeof setTerms = arg => {
        record('setState');
        setTerms(arg);
    };

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <ConsentFlowCredentialAccessToggles
                anonymize
                contract={{
                    [BoostCategoryOptionsEnum.achievement]: { required: false },
                    [BoostCategoryOptionsEnum.socialBadge]: { required: true },
                    Name: { required: false },
                }}
                terms={terms}
                setState={setStateLogged}
            />
            <Value testId="t1b-h-credential-access-value" value={terms} />
            <HandlerLog testId="t1b-h-credential-access-handler-calls" logRef={ref} />
        </div>
    );
};

/**
 * Real ConsentFlowPersonalAccessToggles (:73). `useCurrentUser()` is null here; the handler's
 * `getPersonalEntry` tolerates that and returns the anonymized values.
 */
const PersonalAccessTogglesFixture: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [terms, setTerms] = useImmer<Record<string, string>>({
        Name: 'Anonymous',
        Email: '',
        Image: 'image.png',
    });
    const setStateLogged: typeof setTerms = arg => {
        record('setState');
        setTerms(arg);
    };

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <ConsentFlowPersonalAccessToggles
                contract={{
                    Name: { required: false },
                    Email: { required: false },
                    Image: { required: true },
                }}
                terms={terms}
                setState={setStateLogged}
            />
            <Value testId="t1b-h-personal-access-value" value={terms} />
            <HandlerLog testId="t1b-h-personal-access-handler-calls" logRef={ref} />
        </div>
    );
};

/**
 * src/pages/consentFlow/ConsentFlowReadSharingModal.tsx:258-289. The sibling `<label onClick>`
 * (no htmlFor) runs the same `setTerm` as the toggle's `onClick`. `moment().add(30, 'days')` is
 * replaced by a fixed date so the output is stable.
 */
const SHARE_UNTIL_FIXED = '2026-12-26T00:00:00.000Z';
const ReadSharingExpiration: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [term, setTerm] = useState({ sharing: true, shareAll: true, shareUntil: '' });

    return (
        <div className="bg-white rounded-[15px] shadow-box-bottom py-2 px-5">
            <fieldset className="w-full flex flex-col gap-3 py-3">
                {term.shareAll && (
                    <section className="w-full items-center justify-between flex gap-3">
                        <label
                            data-testid="t1b-h-read-sharing-expiration-label"
                            onClick={() => {
                                record('label');
                                setTerm({
                                    ...term,
                                    shareAll: term.shareAll || !term.shareUntil,
                                    shareUntil: term.shareUntil ? '' : SHARE_UNTIL_FIXED,
                                });
                            }}
                            className="text-sm font-poppins text-grayscale-900"
                        >
                            {m['arabicFixes.setExpirationDate']()}
                        </label>
                        <IonToggle
                            data-testid="t1b-h-read-sharing-expiration-toggle"
                            color="emerald-700"
                            className="shrink-0"
                            mode="ios"
                            checked={Boolean(term.shareUntil)}
                            onClick={() => {
                                record('toggle');
                                setTerm({
                                    ...term,
                                    shareAll: term.shareAll || !term.shareUntil,
                                    shareUntil: term.shareUntil ? '' : SHARE_UNTIL_FIXED,
                                });
                            }}
                        />
                    </section>
                )}
            </fieldset>
            <Value testId="t1b-h-read-sharing-expiration-value" value={term} />
            <HandlerLog testId="t1b-h-read-sharing-expiration-handler-calls" logRef={ref} />
        </div>
    );
};

/** src/pages/launchPad/ConsentFlowEditAccess.tsx:361-381 (white card, no className). */
const EditAccessAnonymizeCard: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [anonymize, setAnonymize] = useState(true);
    const handleToggleAnonymize = (): void => {
        record('anonymize');
        setAnonymize(!anonymize);
    };

    return (
        <div className="bg-grayscale-900 p-4 rounded-[20px]">
            <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] rounded-[20px]">
                <IonCol
                    size="12"
                    className="flex items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                >
                    <div className="flex items-center justify-between w-full">
                        <h1 className="font-poppins text-black text-lg p-0 m-0 normal">
                            Anonymize Data
                        </h1>
                    </div>

                    <IonToggle
                        data-testid="t1b-h-edit-access-anonymize-toggle"
                        mode="ios"
                        color="emerald-700"
                        onClick={handleToggleAnonymize}
                        checked={anonymize}
                    />
                </IonCol>
            </IonRow>
            <div className="bg-white rounded-[10px] mt-2 px-2">
                <Value testId="t1b-h-edit-access-anonymize-value" value={anonymize} />
                <HandlerLog testId="t1b-h-edit-access-anonymize-handler-calls" logRef={ref} />
            </div>
        </div>
    );
};

/**
 * src/components/boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode.tsx:623-646.
 * Inverted: `checked={!claimLimitToggle}`, and `onClick` flips `claimLimitToggle`. The "Set Claim
 * Limit" IonInput (:645) is omitted: IonInput is a later PR in this batch.
 */
const ShareableUnlimitedClaims: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const [claimLimitToggle, setClaimLimitToggle] = useState<boolean>(false);
    const [claimLimit, setClaimLimit] = useState<number | undefined>(5);
    const [isManuallyChangingParameters, setIsManuallyChangingParameters] = useState(false);

    return (
        <div className="bg-white rounded-[20px] ion-padding">
            <div className="w-full flex flex-col gap-[10px]">
                <div className="flex w-full items-center justify-between">
                    <p className="text-grayscale-900 font-poppins text-[17px] font-[600]">
                        Unlimited Claims
                    </p>
                    <IonToggle
                        data-testid="t1b-h-shareable-unlimited-toggle"
                        mode="ios"
                        color="emerald-700"
                        onClick={() => {
                            record('unlimitedClaims');
                            setClaimLimit(undefined);
                            setIsManuallyChangingParameters(true);
                            setClaimLimitToggle(!claimLimitToggle);
                        }}
                        checked={!claimLimitToggle}
                    />
                </div>

                {claimLimitToggle && (
                    <div className="flex flex-col gap-[10px]">
                        <p className="text-grayscale-900 font-poppins text-[17px] font-[600]">
                            Set Claim Limit
                        </p>
                    </div>
                )}
            </div>
            <Value
                testId="t1b-h-shareable-unlimited-value"
                value={{
                    claimLimitToggle,
                    checked: !claimLimitToggle,
                    claimLimit,
                    isManuallyChangingParameters,
                }}
            />
            <HandlerLog testId="t1b-h-shareable-unlimited-handler-calls" logRef={ref} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-I  mode="ios" color="emerald-700" className="[--background:white]", onClick only
// ---------------------------------------------------------------------------------------------

type CategoryReadState = Record<string, { sharing: boolean; shareAll: boolean }>;

/**
 * src/pages/consentFlow/ConsentFlowPrivacyAndData.tsx:246-294 (handlers) and :371-526 (the three
 * toggle cards). The contract has one non-required and one required category per direction.
 */
const PrivacyAndDataCards: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const brand = 'LearnCard';
    const required: Record<string, boolean> = { Achievement: false, Skill: true };
    const [readCategories, setReadCategories] = useImmer<CategoryReadState>({
        Achievement: { sharing: false, shareAll: false },
        Skill: { sharing: true, shareAll: true },
    });
    const [anonymize, setAnonymize] = useState(true);
    const [writeCategories, setWriteCategories] = useImmer<Record<string, boolean>>({
        Achievement: true,
        Skill: true,
    });

    const allReadToggle = Object.keys(readCategories).every(category =>
        Boolean(readCategories[category]?.sharing && readCategories[category].shareAll)
    );
    const allWriteToggle = Object.values(writeCategories).every(Boolean);

    const handleToggleAllCategoryReadToggles = (): void => {
        record('allRead');
        setReadCategories(old => {
            Object.keys(old).forEach(key => {
                const category = old[key];
                category.sharing = !allReadToggle || category.sharing || required[key];
                category.shareAll = !allReadToggle || required[key];
            });
        });
    };
    const handleToggleAnonymize = (): void => {
        record('anonymize');
        setAnonymize(!anonymize);
    };
    const handleToggleAllWriteToggles = (): void => {
        record('allWrite');
        setWriteCategories(old => {
            Object.keys(old).forEach(key => {
                old[key] = !allWriteToggle || required[key];
            });
        });
    };

    return (
        <div className="flex flex-col gap-4 bg-grayscale-50 rounded-[20px] p-4">
            <div className="text-sm leading-relaxed text-grayscale-600 rounded-2xl border border-grayscale-200 bg-white w-full p-4 flex flex-col gap-4">
                <h4 className="text-grayscale-900 text-sm font-medium leading-relaxed">
                    {m['consentFlow.privacyData.shareData']({ brand })}
                </h4>
                <div className="flex flex-col">
                    <div className="w-full flex justify-between items-center">
                        <label className="flex flex-col gap-[2px]">
                            <output
                                className={`font-[600] text-sm font-poppins ${
                                    allReadToggle ? 'text-emerald-700' : 'text-grayscale-500'
                                }`}
                            >
                                {allReadToggle
                                    ? m['consentFlow.status.active']()
                                    : m['consentFlow.status.off']()}
                            </output>
                            <p className="text-grayscale-900 text-sm font-medium">
                                {m['consentFlow.liveSyncAll']()}
                            </p>
                        </label>

                        <IonToggle
                            data-testid="t1b-i-privacy-and-data-live-sync-toggle"
                            mode="ios"
                            className="[--background:white]"
                            color="emerald-700"
                            onClick={handleToggleAllCategoryReadToggles}
                            checked={allReadToggle}
                        />
                    </div>
                </div>
            </div>

            <div className="text-sm leading-relaxed text-grayscale-600 rounded-2xl border border-grayscale-200 bg-white w-full p-4 flex flex-col gap-4">
                <h4 className="text-grayscale-900 text-sm font-medium leading-relaxed">
                    {m['consentFlow.privacyData.sharePersonalData']()}
                </h4>
                <div className="flex flex-col">
                    <div className="w-full flex justify-between items-center">
                        <label className="flex flex-col gap-[2px]">
                            <output
                                className={`font-[600] text-sm font-poppins ${
                                    anonymize ? 'text-emerald-700' : 'text-grayscale-500'
                                }`}
                            >
                                {anonymize
                                    ? m['consentFlow.status.on']()
                                    : m['consentFlow.status.off']()}
                            </output>
                            <p className="text-grayscale-900 text-sm font-medium">
                                {m['consentFlow.anonymize']()}
                            </p>
                        </label>

                        <IonToggle
                            data-testid="t1b-i-privacy-and-data-anonymize-toggle"
                            mode="ios"
                            className="[--background:white]"
                            color="emerald-700"
                            onClick={handleToggleAnonymize}
                            checked={anonymize}
                        />
                    </div>
                </div>
            </div>

            <div className="text-sm leading-relaxed text-grayscale-600 rounded-2xl border border-grayscale-200 bg-white w-full p-4 flex flex-col gap-4">
                <h4 className="text-grayscale-900 text-sm font-medium leading-relaxed">
                    {m['consentFlow.privacyData.allowAddData']({
                        name: 'Community Academy',
                        brand,
                    })}
                </h4>
                <div className="flex flex-col">
                    <div className="w-full flex justify-between items-center">
                        <label className="flex flex-col gap-[2px]">
                            <output
                                className={`font-[600] text-sm font-poppins ${
                                    allWriteToggle ? 'text-emerald-700' : 'text-grayscale-500'
                                }`}
                            >
                                {allWriteToggle
                                    ? m['consentFlow.status.active']()
                                    : m['consentFlow.status.off']()}
                            </output>
                            <p className="text-grayscale-900 text-sm font-medium">
                                {m['consentFlow.allowAll']()}
                            </p>
                        </label>

                        <IonToggle
                            data-testid="t1b-i-privacy-and-data-allow-all-toggle"
                            mode="ios"
                            className="[--background:white]"
                            color="emerald-700"
                            onClick={handleToggleAllWriteToggles}
                            checked={allWriteToggle}
                        />
                    </div>
                </div>
            </div>

            <Value
                testId="t1b-i-privacy-and-data-value"
                value={{
                    allReadToggle,
                    anonymize,
                    allWriteToggle,
                    readCategories,
                    writeCategories,
                }}
            />
            <HandlerLog testId="t1b-i-privacy-and-data-handler-calls" logRef={ref} />
        </div>
    );
};

/**
 * src/pages/launchPad/ConsentFlowEditAccess.tsx:64-89 (handlers) and :233-344 (the two toggles on
 * the page's `bg-grayscale-900` surface with `text-grayscale-100` labels).
 */
const EditAccessDarkToggles: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const brand = 'LearnCard';
    const required: Record<string, boolean> = { Achievement: false, Skill: true };
    const [readCategories, setReadCategories] = useImmer<CategoryReadState>({
        Achievement: { sharing: true, shareAll: true },
        Skill: { sharing: true, shareAll: true },
    });
    const [writeCategories, setWriteCategories] = useImmer<Record<string, boolean>>({
        Achievement: false,
        Skill: true,
    });

    const allReadToggle = Object.values(readCategories).every(
        category => category.sharing && category.shareAll
    );
    const allWriteToggle = Object.values(writeCategories).every(Boolean);

    const handleToggleAllReadToggles = (): void => {
        record('allRead');
        setReadCategories(old => {
            Object.keys(old).forEach(key => {
                old[key].sharing = !allReadToggle || old[key].sharing || required[key];
                old[key].shareAll = !allReadToggle;
            });
        });
    };
    const handleToggleAllWriteToggles = (): void => {
        record('allWrite');
        setWriteCategories(old => {
            Object.keys(old).forEach(key => {
                old[key] = !allWriteToggle || required[key];
            });
        });
    };

    return (
        <div className="bg-grayscale-900 rounded-[20px] px-4 py-2">
            <IonRow className="w-full max-w-[600px]">
                <IonCol
                    size="12"
                    className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                >
                    <h4 className="text-white text-xl tracking-normal w-full text-left mb-4 font-medium font-poppins">
                        Share Data in Your {brand}
                    </h4>
                    <fieldset className="w-full flex flex-col gap-1">
                        <section className="w-full flex justify-between items-center">
                            <label className="flex flex-col gap-1">
                                <output
                                    className={`font-semibold text-sm ${
                                        allReadToggle ? 'text-emerald-700' : 'text-grayscale-400'
                                    }`}
                                >
                                    {allReadToggle ? 'Active' : 'Off'}
                                </output>
                                <p className="font-poppins text-grayscale-100 text-xl">
                                    Live Sync All
                                </p>
                            </label>

                            <IonToggle
                                data-testid="t1b-i-edit-access-dark-live-sync-toggle"
                                mode="ios"
                                className="[--background:white]"
                                color="emerald-700"
                                onClick={handleToggleAllReadToggles}
                                checked={allReadToggle}
                            />
                        </section>
                    </fieldset>
                </IonCol>
            </IonRow>
            <IonRow className="w-full max-w-[600px]">
                <IonCol
                    size="12"
                    className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                >
                    <h4 className="text-white text-xl tracking-normal w-full text-left mb-4 font-medium font-poppins">
                        Allow Data to be Added to Your {brand}
                    </h4>
                    <fieldset className="w-full flex flex-col gap-1">
                        <section className="w-full flex justify-between items-center">
                            <label className="flex flex-col gap-1">
                                <output
                                    className={`font-semibold text-sm ${
                                        allWriteToggle ? 'text-emerald-700' : 'text-grayscale-400'
                                    }`}
                                >
                                    {allWriteToggle ? 'Active' : 'Off'}
                                </output>
                                <p className="font-poppins text-grayscale-100 text-xl">Allow All</p>
                            </label>

                            <IonToggle
                                data-testid="t1b-i-edit-access-dark-allow-all-toggle"
                                mode="ios"
                                className="[--background:white]"
                                color="emerald-700"
                                onClick={handleToggleAllWriteToggles}
                                checked={allWriteToggle}
                            />
                        </section>
                    </fieldset>
                </IonCol>
            </IonRow>
            <div className="bg-white rounded-[10px] my-2 px-2">
                <Value
                    testId="t1b-i-edit-access-dark-value"
                    value={{ allReadToggle, allWriteToggle, readCategories, writeCategories }}
                />
                <HandlerLog testId="t1b-i-edit-access-dark-handler-calls" logRef={ref} />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-J  global mode, no color, slot="end", onClick only
// ---------------------------------------------------------------------------------------------

/**
 * src/components/creds-bundle/ShareBoostsBundle.tsx:181-191 ("Share all" row) and :204-224
 * (per-type "All" span with `ml-[5px]` and `aria-label="${vcType} toggle"`). The select-all
 * handlers are reduced to flipping the selection they derive `checked` from.
 */
const ShareBoostsBundleToggles: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const name = 'Boost';
    const vcType = 'achievements';
    const [selected, setSelected] = useState<Record<string, boolean>>({
        achievements: false,
        skills: true,
    });
    const allSelected = Object.values(selected).every(Boolean);
    const getAllSelected = (type: string): boolean => selected[type];
    const handleToggleSelectAll = (): void => {
        record('selectAll');
        setSelected({ achievements: !allSelected, skills: !allSelected });
    };
    const handleToggleSelectAllType = (type: string): void => {
        record(`selectAllType:${type}`);
        setSelected(prev => ({ ...prev, [type]: !prev[type] }));
    };

    return (
        <div className="bg-white rounded-[20px] p-4">
            <div className="flex items-center justify-center text-[13px] mt-[25px]">
                <span className="mr-[10px] text-[14px] font-semibold">Share all {name}s</span>
                <IonToggle
                    data-testid="t1b-j-share-boosts-all-toggle"
                    slot="end"
                    checked={allSelected}
                    onClick={() => handleToggleSelectAll()}
                />
            </div>

            <div className="flex justify-between items-center mx-[10px] mt-[20px]">
                <h2 className="text-[20px] font-bold text-gray-900">Achievements</h2>
                <span className="flex justify-center items-center font-medium">
                    All
                    <IonToggle
                        data-testid="t1b-j-share-boosts-type-toggle"
                        onClick={() => handleToggleSelectAllType(vcType)}
                        slot="end"
                        className="ml-[5px]"
                        checked={getAllSelected(vcType)}
                        aria-label={`${vcType} toggle`}
                    />
                </span>
            </div>
            <Value testId="t1b-j-share-boosts-value" value={{ selected, allSelected }} />
            <HandlerLog testId="t1b-j-share-boosts-handler-calls" logRef={ref} />
        </div>
    );
};

/** src/pages/consentFlow/ConsentFlowShareCredentialCards.tsx:197-229 (`ml-[10px]`). */
const ConsentShareCredentialCardsToggle: React.FC = () => {
    const { record, ref } = useHandlerLog();
    const vcType = 'Achievement';
    const credentials = [{ uri: 'lc:fixture:1' }, { uri: 'lc:fixture:2' }];
    const [category, setCategory] = useState<{ shareAll: boolean; shared: string[] }>({
        shareAll: false,
        shared: ['lc:fixture:1'],
    });
    const [shareAll, setShareAll] = useState(true);

    return (
        <div className="bg-white rounded-[20px] py-4">
            <section data-testid={`${vcType}-section`}>
                <div className="flex justify-between items-center mx-[20px] mt-[20px]">
                    <h2 className="text-[20px] font-bold text-gray-900">
                        {category.shared.length} Achievements
                    </h2>

                    <span className="flex justify-center items-center font-medium">
                        All
                        <IonToggle
                            data-testid="t1b-j-consent-share-cards-toggle"
                            onClick={() => {
                                record('shareAll');
                                if (!category?.shareAll) {
                                    setCategory(prev => ({
                                        ...prev,
                                        shared: Array.from(
                                            new Set([
                                                ...(prev.shared ?? []),
                                                ...credentials.map(vc => vc.uri),
                                            ])
                                        ),
                                    }));
                                } else {
                                    setShareAll(false);
                                }
                                setCategory(prev => ({ ...prev, shareAll: !category?.shareAll }));
                            }}
                            slot="end"
                            className="ml-[10px]"
                            checked={category?.shareAll}
                            aria-label={`${vcType} toggle`}
                        />
                    </span>
                </div>
            </section>
            <div className="px-[20px]">
                <Value testId="t1b-j-consent-share-cards-value" value={{ category, shareAll }} />
                <HandlerLog testId="t1b-j-consent-share-cards-handler-calls" logRef={ref} />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-K  global mode, className="ds-toggle", onIonChange reads e.detail.checked
// ---------------------------------------------------------------------------------------------

/** Real SettingRow (:42): on, off, and disabled with a locked note (AnnouncementPreferences use). */
const SettingRows: React.FC = () => {
    const [on, setOn] = useState(true);
    const [off, setOff] = useState(false);
    return (
        <div className="ds-content-bg rounded-[20px] p-4">
            <GlassCard className="overflow-hidden divide-y divide-grayscale-100">
                <SettingRow
                    title="Product updates"
                    description="News about features and improvements."
                    checked={on}
                    onChange={setOn}
                />
                <SettingRow
                    title="Partner offers"
                    description="Occasional offers from partners."
                    checked={off}
                    onChange={setOff}
                />
                <SettingRow
                    title="Security alerts"
                    description="Sign-ins and account changes."
                    checked
                    disabled
                    lockedNote="Required for your account's safety."
                    onChange={() => undefined}
                />
            </GlassCard>
            <Value testId="t1b-k-setting-row-value" value={{ on, off }} />
        </div>
    );
};

/**
 * src/pages/privacy-settings/components/ProfileVisibilityCard.tsx:94-110 (show-email row, inside
 * the real GlassCard) and src/pages/privacy-settings/components/AiPersonalizationCard.tsx:123-146
 * (disabled with a locked note).
 */
const DataSharingCards: React.FC<{ saving?: boolean }> = ({ saving = false }) => {
    const [showEmail, setShowEmail] = useState(false);
    const [aiToggleChecked, setAiToggleChecked] = useState(true);
    const savingField = saving ? 'showEmail' : undefined;
    const disabled = true;
    const lockedNote = 'Managed by your guardian.';
    const suffix = saving ? '-saving' : '';

    return (
        <div className="ds-content-bg rounded-[20px] p-4 flex flex-col gap-4">
            <GlassCard className="p-5 flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 pr-4">
                        <p className="text-[15px] font-medium text-grayscale-900">
                            {m['settings.privacy.showEmail']()}
                        </p>
                        <p className="text-sm text-grayscale-600 mt-0.5">
                            {m['settings.privacy.showEmailHint']()}
                        </p>
                    </div>
                    <IonToggle
                        data-testid={`t1b-k-profile-visibility${suffix}-toggle`}
                        className="ds-toggle"
                        checked={showEmail}
                        disabled={savingField === 'showEmail'}
                        onIonChange={e => setShowEmail(e.detail.checked)}
                        aria-label={m['settings.privacy.showEmail']()}
                    />
                </div>
            </GlassCard>
            {!saving && (
                <GlassCard className="overflow-hidden">
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                {m['settings.aiFeatures']()}
                            </p>
                            <p className="text-sm text-grayscale-600 mt-0.5 leading-relaxed">
                                {m['dataShareCenter.aiFeaturesDesc']()}
                            </p>
                            {lockedNote && (
                                <p className="flex items-center gap-1.5 text-xs text-sky-700 mt-2 leading-relaxed">
                                    <Lock aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                                    {lockedNote}
                                </p>
                            )}
                        </div>
                        <IonToggle
                            data-testid="t1b-k-ai-personalization-toggle"
                            className="ds-toggle"
                            checked={aiToggleChecked}
                            disabled={disabled}
                            onIonChange={e => !disabled && setAiToggleChecked(e.detail.checked)}
                            aria-label={m['settings.aiFeatures']()}
                        />
                    </div>
                </GlassCard>
            )}
            <Value
                testId={`t1b-k-data-sharing-cards${suffix}-value`}
                value={{ showEmail, aiToggleChecked }}
            />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-L  global mode, no class, onIonChange reads e.detail.checked
// ---------------------------------------------------------------------------------------------

/** src/pages/appStoreDeveloper/components/LaunchConfigStep.tsx:253-277 (no `disabled`). */
const LaunchConfigSkipInstallation: React.FC = () => {
    const [config, setConfig] = useState<{ skipInstallation?: boolean }>({});
    const updateConfig = (patch: { skipInstallation: boolean }): void =>
        setConfig(prev => ({ ...prev, ...patch }));

    return (
        <div className="bg-white rounded-[20px] p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-gray-700">
                        {m['developerPortal.components.launchConfigStep.skipInstallation']()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {m['developerPortal.components.launchConfigStep.skipInstallationDesc']()}
                    </p>
                </div>
                <IonToggle
                    data-testid="t1b-l-launch-config-toggle"
                    checked={config.skipInstallation || false}
                    onIonChange={e => updateConfig({ skipInstallation: e.detail.checked })}
                    aria-label={m['developerPortal.components.launchConfigStep.skipInstallation']()}
                />
            </div>
            <Value testId="t1b-l-launch-config-value" value={config} />
        </div>
    );
};

/** src/pages/privacy-settings/PrivacySettingsModal.tsx:336-351 (idle and while saving). */
const PrivacyModalShowEmail: React.FC<{ testId: string; saving?: boolean }> = ({
    testId,
    saving = false,
}) => {
    const [showEmail, setShowEmail] = useState(saving);
    const savingProfileField = saving ? 'showEmail' : undefined;
    const handleShowEmailToggle = (checked: boolean): void => setShowEmail(checked);

    return (
        <div className="bg-white rounded-[20px] p-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 pr-4">
                    <p className="text-[15px] font-medium text-grayscale-900">
                        {m['settings.privacy.showEmail']()}
                    </p>
                    <p className="text-sm text-grayscale-600 mt-0.5">
                        {m['settings.privacy.showEmailDesc']()}
                    </p>
                </div>
                <IonToggle
                    data-testid={`${testId}-toggle`}
                    checked={showEmail}
                    disabled={savingProfileField === 'showEmail'}
                    onIonChange={e => handleShowEmailToggle(e.detail.checked)}
                    aria-label={m['settings.privacy.showEmail']()}
                />
            </div>
            <Value testId={`${testId}-value`} value={showEmail} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// T-M  mode="ios" color="emerald-700", no checked, no handler (uncontrolled)
// ---------------------------------------------------------------------------------------------

/**
 * Fixture-only observer for the uncontrolled T-M toggles, which have no handler to report through.
 * A MutationObserver on a wrapper writes every `[role="switch"]` element's `aria-checked` into the
 * output whenever that attribute changes. It watches the attribute rather than `ionChange`: Ionic
 * emits `ionChange` before its async re-render updates `aria-checked`, and an app-owned toggle will
 * not emit `ionChange` at all. The IonToggle props stay exactly as at the source.
 */
const UncontrolledObserver: React.FC<{ testId: string; children: React.ReactNode }> = ({
    testId,
    children,
}) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const output = useRef<HTMLOutputElement>(null);

    useEffect(() => {
        const element = wrapper.current;
        if (!element) return undefined;
        const report = (): void => {
            const states = Array.from(element.querySelectorAll('[role="switch"]')).map(
                toggle => toggle.getAttribute('aria-checked') === 'true'
            );
            if (output.current) output.current.textContent = JSON.stringify(states);
        };
        const observer = new MutationObserver(report);
        observer.observe(element, {
            attributes: true,
            attributeFilter: ['aria-checked'],
            subtree: true,
        });
        report();
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={wrapper}>
            {children}
            <output
                ref={output}
                data-testid={testId}
                className="block text-xs font-mono text-grayscale-600"
            >
                []
            </output>
        </div>
    );
};

/** src/components/my-data/MyDataSettings.tsx:73-93 ("Turn All On") and :101-142 (`.map` rows). */
const MyDataSettingsToggles: React.FC = () => (
    <UncontrolledObserver testId="t1b-m-my-data-value">
        <div className="bg-grayscale-900 rounded-[20px] p-4">
            <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                <IonCol
                    size="12"
                    className="flex items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                >
                    <div className="flex items-center justify-between w-full">
                        <h1 className="font-poppins text-black text-lg p-0 m-0 normal">
                            Turn All On
                        </h1>
                    </div>

                    <IonToggle
                        data-testid="t1b-m-my-data-turn-all-on-toggle"
                        mode="ios"
                        color="emerald-700"
                        // onIonInput={() => {
                        //     setToggle(!toggle);
                        // }}
                        // checked={toggle}
                    />
                </IonCol>
            </IonRow>

            <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                <IonCol
                    size="12"
                    className="flex flex-col w-full bg-white rounded-[20px] ion-padding"
                >
                    {boostVCTypeOptions?.someone?.slice(1, 3).map(option => {
                        const { IconComponent, title, type, iconClassName, iconCircleClass } =
                            option;

                        return (
                            <div
                                key={type}
                                className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100"
                            >
                                <div className="flex">
                                    <div
                                        className={`flex items-center justify-center h-[40px] w-[40px] left-1 rounded-full ${iconCircleClass}`}
                                    >
                                        <IconComponent className={`h-[30px] ${iconClassName}`} />
                                    </div>
                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        {title}
                                    </h3>
                                </div>

                                <IonToggle
                                    data-testid={`t1b-m-my-data-${type}-toggle`}
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                        );
                    })}
                </IonCol>
            </IonRow>
        </div>
    </UncontrolledObserver>
);

export const TogglesVisualFixture: React.FC = () => (
    <main className="mx-auto flex w-full max-w-[860px] flex-col items-stretch gap-6 p-6 font-poppins">
        {/*
         * IonApp starts Ionic's focus-visible (`.ion-focused`) and tap-click (`.ion-activated`)
         * utilities, as it does at the real app root. Its host CSS (absolute, contain, overflow)
         * would clip this long page, so it is mounted empty and hidden instead of as a wrapper.
         */}
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="t1b-matrix" title="IonToggle states × colors × modes">
            <ToggleMatrix />
        </Block>

        <Block testId="t1b-a-basic-info" title="T-A BoostCMSBasicInfoForm credentialExpires">
            <BasicInfoCredentialExpires testId="t1b-a-basic-info" />
        </Block>
        <Block
            testId="t1b-a-basic-info-disabled"
            title="T-A BoostCMSBasicInfoForm credentialExpires (disabled)"
        >
            <BasicInfoCredentialExpires testId="t1b-a-basic-info-disabled" disabled />
        </Block>
        <Block testId="t1b-a-shareable-claim-link" title="T-A BoostShareableCode generate link">
            <ShareableGenerateClaimLink />
        </Block>
        <Block testId="t1b-a-idcard-issuer-thumbnail" title="T-A BoostIDCardCMSIssuerThumbnailForm">
            <IdCardIssuerThumbnail />
        </Block>
        <Block testId="t1b-a-endorsement" title="T-A EndorsementFullView">
            <EndorsementShowToggle />
        </Block>

        <Block testId="t1b-b-ai-mission" title="T-B BoostCMSAIMissionForm (real, h1 row)">
            <RealCredentialExpiresForm
                testId="t1b-b-ai-mission-form"
                Form={BoostCMSAIMissionForm}
            />
        </Block>
        <Block testId="t1b-b-ai-mission-disabled" title="T-B BoostCMSAIMissionForm (disabled)">
            <RealCredentialExpiresForm
                testId="t1b-b-ai-mission-disabled-form"
                Form={BoostCMSAIMissionForm}
                disabled
            />
        </Block>
        <Block testId="t1b-b-user-permissions" title="T-B BoostCMSUserPermissions (shared binding)">
            <UserPermissionsRows />
        </Block>

        <Block testId="t1b-c-add-chat" title="T-C BoostCMSAddChatForm (real, theme primary)">
            <RealCredentialExpiresForm testId="t1b-c-add-chat-form" Form={BoostCMSAddChatForm} />
        </Block>
        <Block testId="t1b-c-add-chat-disabled" title="T-C BoostCMSAddChatForm (disabled)">
            <RealCredentialExpiresForm
                testId="t1b-c-add-chat-disabled-form"
                Form={BoostCMSAddChatForm}
                disabled
            />
        </Block>

        <Block testId="t1b-d-permissions" title="T-D BoostCMSPermissionsForm (real)">
            <RealPermissionsForm testId="t1b-d-permissions-form" />
        </Block>
        <Block testId="t1b-d-permissions-disabled" title="T-D BoostCMSPermissionsForm (disabled)">
            <RealPermissionsForm testId="t1b-d-permissions-disabled-form" disabled />
        </Block>
        <Block testId="t1b-d-shareable-can-view" title="T-D BoostShareableCode amber card">
            <ShareableCanViewAmber testId="t1b-d-shareable-can-view" />
        </Block>
        <Block
            testId="t1b-d-shareable-can-view-updating"
            title="T-D BoostShareableCode amber card (updating)"
        >
            <ShareableCanViewAmber testId="t1b-d-shareable-can-view-updating" updating />
        </Block>

        <Block testId="t1b-e-media-enabled" title="T-E BoostCMSMediaForm (enabled)">
            <MediaOnlyToggle testId="t1b-e-media-enabled" displayType="badge" attachmentCount={2} />
        </Block>
        <Block
            testId="t1b-e-media-disabled-on"
            title="T-E BoostCMSMediaForm (media display, lock right)"
        >
            <MediaOnlyToggle
                testId="t1b-e-media-disabled-on"
                displayType="media"
                attachmentCount={0}
            />
        </Block>
        <Block
            testId="t1b-e-media-disabled-off"
            title="T-E BoostCMSMediaForm (no media, lock left)"
        >
            <MediaOnlyToggle
                testId="t1b-e-media-disabled-off"
                displayType="badge"
                attachmentCount={0}
            />
        </Block>

        <Block testId="t1b-f-family-appearance" title="T-F FamilyCMSAppearanceForm">
            <FamilyAppearanceToggles />
        </Block>
        <Block testId="t1b-f-learncardid-dark-text" title="T-F LearnCardIDCMS dark text">
            <LearnCardIdDarkText />
        </Block>

        <Block testId="t1b-g-resume-builder" title="T-G ResumeBuilderToggle (real)">
            <ResumeBuilderToggles />
        </Block>

        <Block testId="t1b-h-network-settings" title="T-H NetworkSettings (real)">
            <NetworkSettingsFixture />
        </Block>
        <Block testId="t1b-h-create-contract" title="T-H CreateContractModal">
            <CreateContractToggles />
        </Block>
        <Block
            testId="t1b-h-credential-access"
            title="T-H ConsentFlowCredentialAccessToggles (real)"
        >
            <CredentialAccessTogglesFixture />
        </Block>
        <Block testId="t1b-h-personal-access" title="T-H ConsentFlowPersonalAccessToggles (real)">
            <PersonalAccessTogglesFixture />
        </Block>
        <Block
            testId="t1b-h-read-sharing-expiration"
            title="T-H ConsentFlowReadSharingModal expiration"
        >
            <ReadSharingExpiration />
        </Block>
        <Block testId="t1b-h-edit-access-anonymize" title="T-H ConsentFlowEditAccess anonymize">
            <EditAccessAnonymizeCard />
        </Block>
        <Block
            testId="t1b-h-shareable-unlimited"
            title="T-H BoostShareableCode unlimited claims (inverted)"
        >
            <ShareableUnlimitedClaims />
        </Block>

        <Block testId="t1b-i-privacy-and-data" title="T-I ConsentFlowPrivacyAndData">
            <PrivacyAndDataCards />
        </Block>
        <Block testId="t1b-i-edit-access-dark" title="T-I ConsentFlowEditAccess (dark)">
            <EditAccessDarkToggles />
        </Block>

        <Block testId="t1b-j-share-boosts" title="T-J ShareBoostsBundle (global mode)">
            <ShareBoostsBundleToggles />
        </Block>
        <Block
            testId="t1b-j-consent-share-cards"
            title="T-J ConsentFlowShareCredentialCards (global mode)"
        >
            <ConsentShareCredentialCardsToggle />
        </Block>

        <Block testId="t1b-k-setting-row" title="T-K SettingRow (real, ds-toggle, global mode)">
            <SettingRows />
        </Block>
        <Block
            testId="t1b-k-data-sharing-cards"
            title="T-K ProfileVisibilityCard / AiPersonalizationCard"
        >
            <DataSharingCards />
        </Block>
        <Block testId="t1b-k-data-sharing-cards-saving" title="T-K ProfileVisibilityCard (saving)">
            <DataSharingCards saving />
        </Block>

        <Block testId="t1b-l-launch-config" title="T-L LaunchConfigStep (global mode)">
            <LaunchConfigSkipInstallation />
        </Block>
        <Block testId="t1b-l-privacy-modal" title="T-L PrivacySettingsModal show email">
            <PrivacyModalShowEmail testId="t1b-l-privacy-modal" />
        </Block>
        <Block testId="t1b-l-privacy-modal-saving" title="T-L PrivacySettingsModal (saving)">
            <PrivacyModalShowEmail testId="t1b-l-privacy-modal-saving" saving />
        </Block>

        <Block testId="t1b-m-my-data" title="T-M MyDataSettings (uncontrolled)">
            <MyDataSettingsToggles />
        </Block>
    </main>
);
