import React from 'react';
import { IonApp, IonCard, IonCardContent, IonFabButton, IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    americanFootballOutline,
    arrowBack,
    arrowDownLeftBox,
    arrowForwardOutline,
    checkmarkCircle,
    chevronDownOutline,
    chevronUpOutline,
    closeOutline,
    eyeOutline,
    flagOutline,
    flame,
    homeOutline,
    informationCircleOutline,
    lockClosed,
    lockClosedOutline,
    refreshOutline,
    star,
    starOutline,
} from 'ionicons/icons';

import { AppButton } from '../../src/components/controls/AppButton';
import StaticStarRating from '../../src/components/ai-passport-apps/helpers/StaticStarRating';
import ResumePreiewEditBlockButton from '../../src/components/resume-builder/resume-preview/ResumePreviewEditBlockButton';
import PreviewVerificationBox from '../../src/components/boost/boostCMS/BoostPreview/PreviewVerificationBox';
import { AppCapabilitiesSummary } from '../../src/pages/appStoreDeveloper/submit/AppCapabilitiesSummary';
import StreakRibbon from '../../src/pages/pathways/today/StreakRibbon';
import { RecoveryPinResetBanner } from '../../src/components/recovery/RecoveryPinResetBanner';
import { AppEmbedOfflineState } from '../../src/pages/launchPad/AppEmbedOfflineState';

/**
 * `icons-1`: the app's IonIcon call sites (phase 4, icon batch), rendered with fixed local data and no
 * backend.
 * - Matrices cover what the call sites pass: ionicons data-URI icons of every shape the package uses
 *   (stroked outline paths, filled paths, circles, rects, ellipses, transforms, fill-rule), inherited
 *   size, Tailwind `text-*` / `w-* h-*` sizing, inline `fontSize`, `color` names, Tailwind colors,
 *   `aria-hidden` / `aria-label` / `role` / `title`, and inline, flex, link and button contexts.
 * - Excerpts are copied from the cited source lines; the components in the last section render for real.
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

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col items-start gap-1 rounded-xl p-2 bg-grayscale-100">
        <div className="flex items-center gap-2 text-grayscale-900">{children}</div>
        <span className="text-[10px] font-mono">{label}</span>
    </div>
);

const SHAPES: [string, string][] = [
    ['alertCircleOutline', alertCircleOutline],
    ['closeOutline', closeOutline],
    ['checkmarkCircle', checkmarkCircle],
    ['star', star],
    ['starOutline', starOutline],
    ['lockClosed', lockClosed],
    ['flame', flame],
    ['chevronDownOutline', chevronDownOutline],
    ['arrowForwardOutline', arrowForwardOutline],
    ['arrowBack (stroke-width attr)', arrowBack],
    ['americanFootballOutline (ellipse, transform)', americanFootballOutline],
    ['arrowDownLeftBox (fill-rule)', arrowDownLeftBox],
];

export const IconsVisualFixture: React.FC = () => (
    <main className="flex flex-col items-center gap-6 p-4">
        {/* IonApp starts Ionic's tap-click / focus utilities, as the app's root IonApp does. */}
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="i1-shapes" title="Icon shapes (synthetic)">
            <div className="flex flex-wrap gap-2">
                {SHAPES.map(([name, icon]) => (
                    <Cell key={name} label={name}>
                        <IonIcon icon={icon} />
                        <IonIcon icon={icon} className="text-4xl" />
                        <IonIcon icon={icon} className="w-[40px] h-[40px] text-emerald-600" />
                    </Cell>
                ))}
            </div>
        </Block>

        <Block testId="i1-sizing" title="Sizing and color (synthetic)">
            <div className="flex flex-wrap gap-2">
                <Cell label="inherited 16px">
                    <IonIcon icon={eyeOutline} />
                </Cell>
                <Cell label="text-xl / text-2xl / text-4xl">
                    <IonIcon icon={eyeOutline} className="text-xl" />
                    <IonIcon icon={eyeOutline} className="text-2xl" />
                    <IonIcon icon={eyeOutline} className="text-4xl" />
                </Cell>
                <Cell label="w-5 h-5 / h-4 w-4 shrink-0">
                    <IonIcon icon={closeOutline} className="w-5 h-5" />
                    <IonIcon icon={closeOutline} aria-hidden="true" className="h-4 w-4 shrink-0" />
                </Cell>
                <Cell label="w-[30px] h-[30px]">
                    <IonIcon icon={lockClosedOutline} className="w-[30px] h-[30px]" />
                </Cell>
                <Cell label="style fontSize 48px">
                    <IonIcon icon={informationCircleOutline} style={{ fontSize: '48px' }} />
                </Cell>
                <Cell label='color="danger" / "primary"'>
                    <IonIcon icon={alertCircleOutline} color="danger" className="text-2xl" />
                    <IonIcon icon={informationCircleOutline} color="primary" className="text-2xl" />
                </Cell>
                <Cell label='color="grayscale-800" / "grayscale-600"'>
                    <IonIcon icon={chevronDownOutline} color="grayscale-800" />
                    <IonIcon icon={chevronUpOutline} color="grayscale-600" className="text-2xl" />
                </Cell>
                <Cell label="color beats text-red-500">
                    <IonIcon icon={star} color="primary" className="text-2xl text-red-500" />
                </Cell>
                <Cell label="text-emerald-500 text-4xl">
                    <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-4xl" />
                </Cell>
                <Cell label="mr-[1px] fontSize 20px x5">
                    {[0, 1, 2, 3, 4].map(i => (
                        <IonIcon
                            key={i}
                            icon={i < 3 ? star : starOutline}
                            color="grayscale-400"
                            style={{ fontSize: '20px' }}
                            className="mr-[1px]"
                        />
                    ))}
                </Cell>
            </div>
        </Block>

        <Block
            testId="i1-contexts"
            title="Inline, flex, link and button contexts (synthetic + excerpts)"
        >
            <div className="flex flex-col gap-3 bg-white p-3">
                <p className="text-base text-grayscale-800">
                    Inline <IonIcon icon={lockClosedOutline} /> icon in a sentence, and a bigger{' '}
                    <IonIcon icon={flame} className="text-2xl text-orange-500" /> one.
                </p>
                {/* ShareLinkViewer.tsx:624-640 */}
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-right">
                        <IonIcon icon={lockClosedOutline} className="shrink-0" />
                        Shared credentials
                    </span>
                    <a
                        href="#close"
                        rel="noreferrer"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700"
                    >
                        <span>Close</span>
                        <IonIcon
                            icon={closeOutline}
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                        />
                    </a>
                </div>
                {/* NodeRow.tsx:126-136 */}
                <button type="button" className="flex items-start gap-2 text-left">
                    <span className="text-sm text-grayscale-900">Destination node</span>
                    <IonIcon
                        icon={flagOutline}
                        aria-hidden
                        title="Destination"
                        className="shrink-0 text-emerald-600 text-xs mt-0.5"
                    />
                </button>
                {/* ResumeConfigPanelUserInfo.tsx:50-62 */}
                <button
                    type="button"
                    className="flex items-center justify-between w-[260px] p-2 bg-grayscale-100 rounded-xl"
                >
                    <span className="text-sm">User info</span>
                    <IonIcon color="grayscale-800" icon={chevronDownOutline} />
                </button>
            </div>
        </Block>

        <Block testId="i1-aria" title="Accessibility attributes (synthetic + excerpts)">
            <div className="flex flex-wrap gap-2">
                <Cell label="no aria">
                    <IonIcon icon={homeOutline} />
                </Cell>
                <Cell label='aria-hidden="true"'>
                    <IonIcon icon={homeOutline} aria-hidden="true" />
                </Cell>
                <Cell label="aria-hidden (bare)">
                    <IonIcon icon={homeOutline} aria-hidden />
                </Cell>
                {/* ShareLinkRow.tsx:61-66 */}
                <Cell label='role="img" aria-label'>
                    <IonIcon
                        icon={lockClosed}
                        role="img"
                        aria-label="Passcode on"
                        className="shrink-0 text-grayscale-500"
                    />
                </Cell>
                {/* RosterDetails.tsx */}
                <Cell label="aria-label only">
                    <IonIcon
                        icon={lockClosedOutline}
                        className="text-grayscale-500"
                        aria-label="Locked"
                    />
                </Cell>
                <Cell label="data-testid">
                    <IonIcon icon={refreshOutline} data-testid="icon-with-testid" />
                </Cell>
            </div>
        </Block>

        {/* InteractionsPage.tsx:192-232 (IonCard error state) and ResumePreviewFAB.tsx:12-14. */}
        <Block testId="i1-x-buttons" title="AppButton slots, IonCard and IonFabButton (excerpts)">
            <div className="flex gap-4 items-start">
                <div className="w-[320px]">
                    <IonCard color="light" className="ion-padding">
                        <IonCardContent className="ion-text-center">
                            <IonIcon
                                icon={alertCircleOutline}
                                color="danger"
                                style={{ fontSize: '48px', marginBottom: '16px' }}
                            />
                            <AppButton expand="block" className="ion-margin-top">
                                <IonIcon slot="start" icon={refreshOutline} />
                                Try Again
                            </AppButton>
                            <AppButton
                                expand="block"
                                color="medium"
                                fill="outline"
                                className="ion-margin-top"
                            >
                                <IonIcon slot="start" icon={homeOutline} />
                                Go to Home
                            </AppButton>
                        </IonCardContent>
                    </IonCard>
                </div>
                <div className="flex gap-3 p-3">
                    <IonFabButton color="light">
                        <IonIcon icon={eyeOutline} />
                    </IonFabButton>
                    <IonFabButton color="light" size="small">
                        <IonIcon icon={eyeOutline} />
                    </IonFabButton>
                </div>
            </div>
        </Block>

        <Block testId="i1-real" title="Real components">
            <div className="flex flex-col gap-3 bg-white p-3 w-[360px]">
                <StaticStarRating rating={3.6} />
                <StaticStarRating rating={4.2} color="grayscale-800" fontSize="24px" />
                <ResumePreiewEditBlockButton isEditing={false} setIsEditing={() => undefined} />
                <ResumePreiewEditBlockButton isEditing setIsEditing={() => undefined} />
                <PreviewVerificationBox />
                <AppCapabilitiesSummary
                    lines={['Reads your profile', 'Sends notifications']}
                    defaultOpen
                >
                    <p className="text-sm">Capability details</p>
                </AppCapabilitiesSummary>
                <StreakRibbon current={4} longest={9} inGraceWindow={false} />
                <RecoveryPinResetBanner onSetAgain={() => undefined} onDismiss={() => undefined} />
                <AppEmbedOfflineState appName="Synthetic App" onRetry={() => undefined} />
            </div>
        </Block>
    </main>
);
