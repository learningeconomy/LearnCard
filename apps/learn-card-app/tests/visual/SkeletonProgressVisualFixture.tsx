import React from 'react';
import { IonAvatar, IonItem, IonLabel, IonThumbnail } from '@ionic/react';

import TopicsItemSkeleton from '../../src/components/ai-passport-apps/AiPassportAppProfileTopics/TopicsItemSkeleton';
import AiSessionItemSkeleton from '../../src/components/ai-sessions/AiSessions/AiSessionItemSkeleton';
import AiSessionsHeaderSkeleton from '../../src/components/ai-sessions/AiSessionsHeader/AiSessionsHeaderSkeleton';
import AiSessionTopicItemSkeleton from '../../src/components/ai-sessions/AiSessionTopics/AiSessionTopicItemSkeleton';
import EndorsementRequestModalSkeletonLoader from '../../src/components/boost-endorsements/EndorsementRequestModal/EndorsementRequestModalSkeletonLoader';
import CheckListItemSkeleton from '../../src/components/learncard/checklist/checklist-steps/CheckListItemSkeleton';
import AiSessionLearningPathwayItemSkeleton from '../../src/components/new-ai-session/AiSessionLearningPathways/AiSessionLearningPathwayItemSkeleton';
import AdminToolsConsentFlowContractSkeletonLoader from '../../src/pages/adminToolsPage/AdminToolsConsentFlow/AdminToolsConsentFlowContractSkeletonLoader';
import AdminToolsApiTokenItemSkeleton from '../../src/pages/adminToolsPage/api-tokens/AdminToolsApiTokenItemSkeleton';
import AdminToolsSigningAuthorityItemSkeleton from '../../src/pages/adminToolsPage/signingAuthority/AdminToolsSigningAuthorityItemSkeleton';
import AiInsightsLearningSnapshotsSkeletonLoader from '../../src/pages/ai-insights/AiInsightsLearningSnapshotSkeletonLoader';
import RequestInsightsSkeletonLoader from '../../src/pages/ai-insights/request-insights/RequestInsightsSkeletonLoader';
import AiPathwayCareerItemSkeleton from '../../src/pages/ai-pathways/ai-pathway-careers/AiPathwayCareerItemSkeletonLoader';
import AiPathwayCourseItemSkeletonLoader from '../../src/pages/ai-pathways/ai-pathway-courses/AiPathwayCourseItemSkeletonLoader';
import AiPathwayContentListItemSkeleton from '../../src/pages/ai-pathways/ai-pathway-explore-content/AiPathwayContentItemSkeletonLoader';
import AiPathwaySessionItemSkeleton from '../../src/pages/ai-pathways/ai-pathway-sessions/AiPathwaySessionItemSkeleton';
import AiPathwaySessionsSkeletonLoader from '../../src/pages/ai-pathways/ai-pathway-sessions/AiPathwaySessionsSkeletonLoader';
import { AppProgressBar } from 'learn-card-base/ui/feedback/AppProgressBar';
import { AppSkeletonText } from 'learn-card-base/ui/feedback/AppSkeletonText';

/**
 * `feedback-2`: the app's IonSkeletonText and IonProgressBar call sites (phase 4 feedback, skeleton and
 * progress batch), rendered with fixed local data and no backend.
 * - A state matrix covers what the call sites pass (animated, style/className sizes, radii, margins),
 *   the Ionic contexts that change the look (ion-avatar / ion-thumbnail `in-media`, ion-item, ion-label),
 *   the `--background`, `--background-rgb` and `--border-radius` custom properties, and progress bars
 *   (determinate, clamped values, buffer, reversed, indeterminate, colors, custom properties, sizes).
 * - The 17 standalone loader components render for real. Other call sites are excerpts copied from the
 *   cited source lines, with their pending branch forced.
 * - One block sits inside an element with `id="app-router"`, so index.scss's reduced-motion rule
 *   applies there as it does in the app.
 *
 * Deterministic frames: the capture pauses every animation (document and shadow roots) at a fixed time.
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

const Cell: React.FC<{ label: string; dark?: boolean; children: React.ReactNode }> = ({
    label,
    dark,
    children,
}) => (
    <div
        className={`flex flex-col gap-2 rounded-xl p-3 w-[180px] ${
            dark ? 'bg-grayscale-900 text-white' : 'bg-white text-grayscale-900'
        }`}
    >
        <div className="w-full min-h-[24px]">{children}</div>
        <span className="text-[10px] font-mono">{label}</span>
    </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-wrap gap-2">{children}</div>
);

export const SkeletonProgressVisualFixture: React.FC = () => (
    <main className="flex flex-col items-center gap-6 p-4 bg-grayscale-100">
        <Block testId="f2-skel-matrix" title="IonSkeletonText states (synthetic)">
            <Row>
                <Cell label="static (default)">
                    <AppSkeletonText />
                </Cell>
                <Cell label="animated">
                    <AppSkeletonText animated />
                </Cell>
                <Cell label="animated={false}">
                    <AppSkeletonText animated={false} />
                </Cell>
                <Cell label="style w60% h20 r4">
                    <AppSkeletonText
                        animated
                        style={{ width: '70%', height: '20px', borderRadius: '4px' }}
                    />
                </Cell>
                <Cell label="style 35x35 r999 (numbers)">
                    <AppSkeletonText
                        animated
                        style={{ width: 35, height: 35, borderRadius: 999 }}
                    />
                </Cell>
                <Cell label="style margin 0">
                    <AppSkeletonText
                        animated
                        style={{ width: '90%', height: '22px', margin: '0' }}
                    />
                </Cell>
                <Cell label="className w h rounded">
                    <AppSkeletonText animated className="w-[85%] h-[14px] rounded-sm" />
                </Cell>
                <Cell label="className mt-2 w-24">
                    <AppSkeletonText animated className="mt-2 w-24" />
                </Cell>
                <Cell label="className h-[45px] r25">
                    <AppSkeletonText animated className="h-[45px] w-full rounded-[25px]" />
                </Cell>
                <Cell label="inline-block (span text)">
                    <span>
                        a <AppSkeletonText animated className="inline-block w-10" /> b
                    </span>
                </Cell>
                <Cell label="in h2 / p (ion-label)">
                    <IonLabel>
                        <h2>
                            <AppSkeletonText animated style={{ width: '150px', height: '14px' }} />
                        </h2>
                        <p>
                            <AppSkeletonText animated style={{ width: '100px', height: '12px' }} />
                        </p>
                    </IonLabel>
                </Cell>
                <Cell label="in ion-avatar (in-media)">
                    <IonAvatar style={{ width: 60, height: 60 }}>
                        <AppSkeletonText animated style={{ width: '100%', height: '100%' }} />
                    </IonAvatar>
                </Cell>
                <Cell label="in ion-thumbnail (in-media)">
                    <IonThumbnail>
                        <AppSkeletonText
                            animated
                            style={{ width: '55px', height: '55px', borderRadius: '8px' }}
                        />
                    </IonThumbnail>
                </Cell>
                <Cell label="in ion-avatar, no size">
                    <IonAvatar>
                        <AppSkeletonText />
                    </IonAvatar>
                </Cell>
                <Cell label="--background">
                    <AppSkeletonText
                        style={
                            {
                                '--background': 'rgba(255, 0, 0, 0.3)',
                                height: '16px',
                            } as React.CSSProperties
                        }
                    />
                </Cell>
                <Cell label="--background-rgb animated">
                    <AppSkeletonText
                        animated
                        style={
                            {
                                '--background-rgb': '0, 0, 255',
                                height: '16px',
                            } as React.CSSProperties
                        }
                    />
                </Cell>
                <Cell label="--border-radius">
                    <AppSkeletonText
                        animated
                        style={{ '--border-radius': '8px', height: '16px' } as React.CSSProperties}
                    />
                </Cell>
                <Cell label="inherited radius">
                    <div className="rounded-full overflow-hidden w-12 h-12">
                        <AppSkeletonText animated className="h-full m-0" />
                    </div>
                </Cell>
                <Cell label="dark background" dark>
                    <AppSkeletonText animated style={{ width: '80%', height: '14px' }} />
                </Cell>
                <Cell label="in ion-item">
                    <IonItem lines="none">
                        <AppSkeletonText animated className="w-36 h-[15px]" />
                    </IonItem>
                </Cell>
            </Row>
        </Block>

        <Block testId="f2-loaders-a" title="Standalone loaders (real components) A">
            <TopicsItemSkeleton />
            <AiSessionItemSkeleton />
            <AiSessionsHeaderSkeleton />
            <AiSessionTopicItemSkeleton />
            <AiSessionLearningPathwayItemSkeleton />
            <CheckListItemSkeleton />
        </Block>
        <Block testId="f2-loaders-b" title="Standalone loaders (real components) B">
            <EndorsementRequestModalSkeletonLoader />
            <AdminToolsConsentFlowContractSkeletonLoader />
            <AdminToolsApiTokenItemSkeleton />
            <AdminToolsSigningAuthorityItemSkeleton />
        </Block>
        <Block testId="f2-loaders-c" title="Standalone loaders (real components) C">
            <AiInsightsLearningSnapshotsSkeletonLoader />
            <RequestInsightsSkeletonLoader />
        </Block>
        <Block testId="f2-loaders-d" title="Standalone loaders (real components) D">
            <AiPathwayCareerItemSkeleton />
            <AiPathwayCourseItemSkeletonLoader />
            <AiPathwayContentListItemSkeleton />
            <AiPathwaySessionItemSkeleton />
            <AiPathwaySessionsSkeletonLoader />
        </Block>

        {/* src/components/new-ai-session/LearnCardAiChatBot/AiSessionPlan.tsx:58-192 (pending plan). */}
        <Block testId="f2-x-session-plan" title="AiSessionPlan pending (excerpt)">
            <div className="px-4 pb-6 gap-4 flex flex-col bg-white">
                <section>
                    <div className="flex flex-col gap-2">
                        <AppSkeletonText animated style={{ width: '85%', height: 28 }} />
                        <AppSkeletonText animated style={{ width: '60%', height: 28 }} />
                    </div>
                </section>
                <section>
                    <div className="flex flex-col gap-2">
                        <AppSkeletonText animated />
                        <AppSkeletonText animated />
                        <AppSkeletonText animated />
                    </div>
                </section>
                <section className="flex flex-col gap-8 mt-4">
                    <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                        Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(i => (
                            <AppSkeletonText
                                key={i}
                                animated
                                style={{
                                    width: `${60 + i * 10}px`,
                                    height: 28,
                                    borderRadius: 10,
                                }}
                            />
                        ))}
                    </div>
                </section>
                <ul className="list-decimal list-inside flex flex-col gap-3 text-grayscale-900">
                    <li>
                        <div className="flex flex-col gap-2">
                            <AppSkeletonText animated style={{ width: '60%' }} />
                            <AppSkeletonText animated style={{ width: '80%' }} />
                            <AppSkeletonText animated style={{ width: '70%' }} />
                        </div>
                    </li>
                </ul>
            </div>
        </Block>

        {/* src/components/boost/boost-template/BoostTemplateListItem.tsx:89-120 (showSkeleton). */}
        <Block testId="f2-x-boost-template" title="BoostTemplateListItem skeleton (excerpt)">
            <div className="flex items-center gap-[10px] w-full p-[10px] rounded-[15px] bg-white shadow-bottom-2-4">
                <AppSkeletonText
                    animated={true}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '100%',
                        margin: '0',
                        flexShrink: 0,
                    }}
                />
                <div className="flex flex-col font-poppins grow">
                    <AppSkeletonText
                        animated={true}
                        style={{ width: '90%', height: '22px', margin: '0' }}
                    />
                    <AppSkeletonText
                        animated={true}
                        style={{
                            width: '60%',
                            height: '19px',
                            marginTop: '2px',
                            marginBottom: '0',
                        }}
                    />
                </div>
            </div>
        </Block>

        {/* WalletPageSquare.tsx:146-151 count bubble; ConsentFlowSyncCard.tsx:125-158; ConsentFlowSyncButton
            (h-[45px] rounded-[25px]); LaunchPadContractListItem.tsx:45-64 (inside IonItem). */}
        <Block testId="f2-x-wallet-consent" title="Wallet / consent / launchpad pending (excerpts)">
            <div className="flex gap-4 items-center bg-white p-4">
                <div className="flex items-center justify-center rounded-full mt-1 relative h-[30px] w-[60px] bg-grayscale-200">
                    <div className="absolute top-[-3px] right-[-3px] border-2 rounded-full border-solid z-10 border-white w-[20px] h-[20px]">
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                            <AppSkeletonText className="h-full m-0" animated />
                        </div>
                    </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center mt-8 px-4">
                    <div className="h-[60px] w-[60px] rounded-[12px] overflow-hidden">
                        <AppSkeletonText animated className="h-full w-full m-0" />
                    </div>
                    <AppSkeletonText animated className="mt-2 w-64" />
                    <AppSkeletonText animated className="mt-4 w-[calc(100%-32px)]" />
                    <AppSkeletonText animated className="w-[calc(100%-32px)]" />
                    <AppSkeletonText animated className="h-[45px] w-full rounded-[25px]" />
                </div>
            </div>
            <IonItem
                lines="none"
                className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex  bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-xs"
            >
                <div className="flex items-center justify-start w-full bg-white">
                    <div className="rounded-lg shadow-3xl w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                        <AppSkeletonText animated className="w-full h-full" />
                    </div>
                    <div className="right-side flex justify-between w-full">
                        <div className="flex flex-col items-start justify-center text-left w-full">
                            <AppSkeletonText animated className="w-36 h-[15px]" />
                            <AppSkeletonText animated className="w-5/6 h-[12px]" />
                        </div>
                    </div>
                </div>
            </IonItem>
        </Block>

        <Block testId="f2-bar-matrix" title="IonProgressBar states (synthetic)">
            <Row>
                <Cell label="determinate 0 (default)">
                    <AppProgressBar />
                </Cell>
                <Cell label="value 0.25">
                    <AppProgressBar value={0.25} />
                </Cell>
                <Cell label="value 0.5">
                    <AppProgressBar value={0.5} />
                </Cell>
                <Cell label="value 1">
                    <AppProgressBar value={1} />
                </Cell>
                <Cell label="value 1.4 (clamped)">
                    <AppProgressBar value={1.4} />
                </Cell>
                <Cell label="value -0.2 (clamped)">
                    <AppProgressBar value={-0.2} />
                </Cell>
                <Cell label="value NaN">
                    <AppProgressBar value={Number.NaN} />
                </Cell>
                <Cell label="buffer 0.6 value 0.3">
                    <AppProgressBar value={0.3} buffer={0.6} />
                </Cell>
                <Cell label="buffer 0 value 0">
                    <AppProgressBar value={0} buffer={0} />
                </Cell>
                <Cell label="reversed 0.3">
                    <AppProgressBar value={0.3} reversed />
                </Cell>
                <Cell label="reversed buffer">
                    <AppProgressBar value={0.3} buffer={0.6} reversed />
                </Cell>
                <Cell label="indeterminate">
                    <AppProgressBar type="indeterminate" />
                </Cell>
                <Cell label="indeterminate reversed">
                    <AppProgressBar type="indeterminate" reversed />
                </Cell>
                <Cell label="grayscale-800 0.42">
                    <AppProgressBar color="grayscale-800" value={0.42} />
                </Cell>
                <Cell label="danger buffer">
                    <AppProgressBar color="danger" value={0.3} buffer={0.6} />
                </Cell>
                <Cell label="primary indeterminate">
                    <AppProgressBar color="primary" type="indeterminate" />
                </Cell>
                <Cell label="dark" dark>
                    <AppProgressBar color="light" value={0.6} />
                </Cell>
                <Cell label="--progress-background --background">
                    <AppProgressBar
                        value={0.5}
                        style={
                            {
                                '--progress-background': '#16a34a',
                                '--background': '#fde68a',
                            } as React.CSSProperties
                        }
                    />
                </Cell>
                <Cell label="className h-2 rounded">
                    <AppProgressBar value={0.7} className="h-2 rounded-full" />
                </Cell>
                <Cell label="aria-label value 0.5">
                    <AppProgressBar value={0.5} aria-label="Upload progress" />
                </Cell>
            </Row>
        </Block>

        {/* EndorsementMediaAttachmentButtons.tsx:38-45 and CreateMediaAttachmentForm.tsx:343-350. */}
        <Block testId="f2-x-upload" title="Upload progress (excerpts)">
            <div className="w-full flex flex-col items-start gap-2 justify-start py-4 px-4 bg-white rounded-[20px] shadow-bottom-2-4">
                <div className="w-full px-4">
                    <AppProgressBar color="grayscale-800" value={42 / 100} />
                </div>
                <div className="w-full px-4">
                    <AppProgressBar color="grayscale-800" value={87 / 100} />
                </div>
            </div>
        </Block>

        {/* src/components/main-header/MainHeader.tsx:110-118 (loading and idle). */}
        <Block testId="f2-x-main-header" title="MainHeader loading bar (excerpt)">
            <div className="relative h-[56px] bg-white">
                <AppProgressBar
                    type="indeterminate"
                    aria-label="Loading"
                    aria-hidden={false}
                    className="absolute top-0 z-9999 transition-opacity opacity-100"
                />
            </div>
            <div className="relative h-[56px] bg-white">
                <AppProgressBar
                    type="indeterminate"
                    aria-label="Loading"
                    aria-hidden={true}
                    className="absolute top-0 z-9999 transition-opacity opacity-0"
                />
            </div>
        </Block>

        <Block testId="f2-app-router" title="Inside #app-router (index.scss reduced-motion rule)">
            <div id="app-router" className="flex flex-col gap-3 bg-white p-3">
                <AppSkeletonText animated style={{ width: '80%', height: '14px' }} />
                <AppProgressBar type="indeterminate" />
                <AppProgressBar value={0.3} buffer={0.6} />
            </div>
        </Block>
    </main>
);
