import React, { useState } from 'react';
import { IonApp, IonContent, IonTitle } from '@ionic/react';
import { alertCircleOutline, homeOutline, refreshOutline } from 'ionicons/icons';

import { AppButton } from '../../src/components/controls/AppButton';
import { AppIcon } from '../../src/components/icon';
import {
    AppAvatar,
    AppCard,
    AppCardContent,
    AppRippleEffect,
    AppText,
    AppThumbnail,
} from '../../src/components/widgets';
import FamilyCMSTabs, {
    FamilyCMSTabsEnum,
} from '../../src/components/familyCMS/FamilyCMSTabs/FamilyCMSTabs';
import LearnCardIDCMSTabs, {
    LearnCardIDCMSTabsEnum,
} from '../../src/components/learncardID-CMS/LearnCardIDCMSTabs';
import ContractTypeTabs from '../../src/pages/adminToolsPage/ContractTypeTabs';
import { ContractType } from '../../src/pages/adminToolsPage/CreateContractModal';
import ResumeConfigPanelFAB from '../../src/components/resume-builder/resume-config-panel/ResumeConfigPanelFAB';
import ResumePreviewFAB from '../../src/components/resume-builder/resume-preview/ResumePreviewFAB';
import CheckListItemSkeleton from '../../src/components/learncard/checklist/checklist-steps/CheckListItemSkeleton';
import EndorsementRequestModalSkeletonLoader from '../../src/components/boost-endorsements/EndorsementRequestModal/EndorsementRequestModalSkeletonLoader';

/**
 * `widgets-1`: the app's IonSegment / IonSegmentButton (+ segment IonLabel), IonFab / IonFabButton,
 * IonRippleEffect, IonText, IonThumbnail, IonAvatar and IonCard / IonCardContent call sites
 * (phase 4, small widgets batch), with fixed local data and no backend.
 * - Real components where they render standalone (the three segment tab bars, both FABs, both
 *   skeleton loaders); excerpts copied from the cited source lines where they need app state.
 * - Every interactive piece reports its state in a `data-testid` readout so the capture can click,
 *   drag, press and type and record what changed.
 */

const Block: React.FC<{ testId: string; title: string; children: React.ReactNode }> = ({
    testId,
    title,
    children,
}) => (
    <section data-testid={testId} className="w-full flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grayscale-600">
            {title}
        </h2>
        {children}
    </section>
);

const Readout: React.FC<{ testId: string; children: React.ReactNode }> = ({ testId, children }) => (
    <p data-testid={testId} style={{ fontSize: 11, fontFamily: 'monospace' }}>
        {children}
    </p>
);

const FamilyTabsHarness: React.FC = () => {
    const [tab, setTab] = useState(FamilyCMSTabsEnum.content);
    const [changes, setChanges] = useState(0);
    return (
        <div data-testid="seg-family">
            <FamilyCMSTabs
                activeTab={tab}
                setActiveTab={v => {
                    setChanges(c => c + 1);
                    setTab(v);
                }}
            />
            <Readout testId="seg-family-state">{`value=${tab} changes=${changes}`}</Readout>
        </div>
    );
};

const IdTabsHarness: React.FC = () => {
    const [tab, setTab] = useState(LearnCardIDCMSTabsEnum.light);
    const [changes, setChanges] = useState(0);
    return (
        <div data-testid="seg-id">
            <LearnCardIDCMSTabs
                activeTab={tab}
                handleTabSwitch={v => {
                    setChanges(c => c + 1);
                    setTab(v);
                }}
            />
            <Readout testId="seg-id-state">{`value=${tab} changes=${changes}`}</Readout>
        </div>
    );
};

const ContractTabsHarness: React.FC = () => {
    const [type, setType] = useState<ContractType>(ContractType.classic);
    const [changes, setChanges] = useState(0);
    return (
        <div data-testid="seg-contract">
            <ContractTypeTabs
                contractType={type}
                setContractType={v => {
                    setChanges(c => c + 1);
                    setType(v);
                }}
            />
            <Readout testId="seg-contract-state">{`value=${type} changes=${changes}`}</Readout>
        </div>
    );
};

const FabHarness: React.FC = () => {
    const [opens, setOpens] = useState(0);
    const [previewing, setPreviewing] = useState(false);
    return (
        <>
            {/* ResumeBuilder.tsx:650: the config FAB as a direct child of the page's IonContent. */}
            <div data-testid="fab-config" style={{ height: 160, position: 'relative' }}>
                <IonContent style={{ '--background': '#f1f5f9' } as React.CSSProperties}>
                    <p style={{ padding: 8, fontSize: 12 }}>
                        IonContent with slot=&quot;fixed&quot; FAB
                    </p>
                    <ResumeConfigPanelFAB openResumeConfigPanel={() => setOpens(o => o + 1)} />
                </IonContent>
            </div>
            <Readout testId="fab-config-state">{`opens=${opens}`}</Readout>
            {/* ResumePreviewFAB outside IonContent (positions against the nearest positioned box). */}
            <div
                data-testid="fab-preview"
                style={{ height: 120, position: 'relative', background: '#e2e8f0' }}
            >
                <ResumePreviewFAB isPreviewing={previewing} setIsPreviewing={setPreviewing} />
            </div>
            <Readout testId="fab-preview-state">{`previewing=${previewing}`}</Readout>
        </>
    );
};

/** ConsentFlowReadSharingItem.tsx:68 / ConsentFlowAiSessionsReadItem.tsx:55 / ConsentFlowVerifiableDataSharingItem.tsx:67 (excerpts). */
const RippleRow: React.FC<{
    testId: string;
    className: string;
    label: string;
    ripple?: boolean;
}> = ({ testId, className, label, ripple = true }) => {
    const [clicks, setClicks] = useState(0);
    return (
        <li className="w-full list-none">
            <button
                data-testid={testId}
                onClick={() => setClicks(c => c + 1)}
                className={className}
            >
                <div className="flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 bg-indigo-100" />
                <div className="flex flex-col flex-1 items-start">
                    <h4 className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px] line-clamp-1 grow text-left">
                        {label}
                    </h4>
                    <p className="text-grayscale-600 text-[14px] font-notoSans text-left">
                        {`clicks: ${clicks}`}
                    </p>
                </div>
                {ripple && <AppRippleEffect />}
            </button>
        </li>
    );
};

const IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20'><rect width='20' height='20' fill='%236366f1'/><rect x='20' width='20' height='20' fill='%23fbbf24'/></svg>";

const ROW =
    'w-full h-full flex items-center gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable';

export const WidgetsVisualFixture: React.FC = () => (
    <main className="flex flex-col gap-6 p-4">
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="w1-segments" title="Segment tab bars (real components)">
            <FamilyTabsHarness />
            <IdTabsHarness />
            <ContractTabsHarness />
        </Block>

        <Block testId="w1-fab" title="FABs (real components)">
            <FabHarness />
        </Block>

        <Block testId="w1-ripple" title="Ripple rows (consent flow excerpts)">
            <ul className="w-full bg-white rounded-[20px]">
                <RippleRow
                    testId="ripple-read"
                    label="Read sharing item"
                    className={`${ROW} not:disabled:hover:bg-grayscale-100 disabled:pointer-events-none transition-colors`}
                />
                <RippleRow testId="ripple-ai" label="AI sessions item" className={ROW} />
                <RippleRow
                    testId="ripple-verifiable"
                    label="Verifiable data item"
                    className="w-full h-full flex flex-col gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable not:disabled:hover:bg-grayscale-100 disabled:pointer-events-none transition-colors text-left"
                />
                <RippleRow
                    testId="ripple-none"
                    label="Required item (no ripple)"
                    className={ROW}
                    ripple={false}
                />
            </ul>
        </Block>

        <Block testId="w1-text" title="IonText (InteractionsPage excerpts + colors)">
            {/* InteractionsPage.tsx:162 and :258 */}
            <div className="ion-text-center" style={{ background: '#fff' }}>
                <AppText color="medium">
                    <p className="ion-text-center ion-margin-top">Processing interaction...</p>
                </AppText>
            </div>
            <p style={{ fontSize: 15 }}>
                Inline <AppText color="danger">danger</AppText>,{' '}
                <AppText color="primary">primary</AppText>, <AppText>uncolored</AppText> and{' '}
                <AppText color="medium" className="ion-margin-top ion-margin-bottom">
                    medium with margins
                </AppText>{' '}
                text.
            </p>
        </Block>

        <Block testId="w1-thumb" title="IonThumbnail and IonAvatar">
            <div data-testid="checklist-skeleton" style={{ background: '#fff' }}>
                <CheckListItemSkeleton />
            </div>
            <div data-testid="endorsement-skeleton" style={{ background: '#e2e8f0', padding: 8 }}>
                <EndorsementRequestModalSkeletonLoader />
            </div>
            <div className="flex items-center gap-4" style={{ background: '#fff', padding: 8 }}>
                <AppThumbnail>
                    <img alt="thumb" src={IMG} />
                </AppThumbnail>
                <AppThumbnail
                    style={{ '--size': '72px', '--border-radius': '12px' } as React.CSSProperties}
                >
                    <img alt="thumb custom" src={IMG} />
                </AppThumbnail>
                <AppAvatar>
                    <img alt="avatar" src={IMG} />
                </AppAvatar>
                <AppAvatar style={{ width: 60, height: 60, background: '#c7d2fe' }}>
                    <span />
                </AppAvatar>
            </div>
        </Block>

        <Block testId="w1-card" title="IonCard / IonCardContent (InteractionsPage error state)">
            {/* InteractionsPage.tsx:190-232 */}
            <div style={{ background: '#e2e8f0', padding: 1 }}>
                <AppCard color="light" className="ion-padding">
                    <AppCardContent className="ion-text-center">
                        <AppIcon
                            icon={alertCircleOutline}
                            color="danger"
                            style={{ fontSize: '48px', marginBottom: '16px' }}
                        />
                        <IonTitle color="danger" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Interaction Error
                        </IonTitle>
                        <AppText color="medium" className="ion-margin-top ion-margin-bottom">
                            <p>Something went wrong while processing the interaction.</p>
                        </AppText>
                        <AppButton expand="block" className="ion-margin-top">
                            <AppIcon slot="start" icon={refreshOutline} />
                            Try Again
                        </AppButton>
                        <AppButton
                            expand="block"
                            color="medium"
                            fill="outline"
                            className="ion-margin-top"
                        >
                            <AppIcon slot="start" icon={homeOutline} />
                            Go to Home
                        </AppButton>
                    </AppCardContent>
                </AppCard>
                <AppCard>
                    <AppCardContent>
                        <h1>Heading one</h1>
                        <h2>Heading two</h2>
                        <h3>Heading three</h3>
                        <p>Paragraph in an uncolored card.</p>
                    </AppCardContent>
                </AppCard>
            </div>
        </Block>
    </main>
);

export default WidgetsVisualFixture;
