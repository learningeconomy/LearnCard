import React from 'react';
import { AppSpinner } from '../../src/components/feedback/AppSpinner';

import * as m from '../../src/paraglide/messages.js';
import ReducedMotionManager from '../../src/components/accessibility/ReducedMotionManager';
import MediaLoader from '../../src/components/boost/boostCMS/BoostPreview/helpers/MediaLoader';
import AdminToolsOptionItemLoader from '../../src/pages/adminToolsPage/AdminToolsModal/helpers/AdminToolsOptionItemLoader';
import { ResumeBuilderLoader } from '../../src/components/resume-builder/ResumeBuilderLoader';

/**
 * `feedback-1`: the app's IonSpinner call sites (phase 4 feedback, spinner batch), rendered with fixed
 * local data and no backend. It covers every spinner name, every `color` value, and the size and
 * `text-*` contexts used. It also includes representative excerpts copied from the cited source lines.
 * Standalone loaders render the real component.
 *
 * Deterministic frames: the capture emulates `prefers-reduced-motion: reduce`. The production
 * ReducedMotionManager is mounted here, as in AppRouter, so every spinner is paused on its first
 * frame (t=0, which includes the per-element negative animation delays). This fixture root is not
 * inside `#app-router`, so index.scss's reduced-motion `animation: none` does not apply here.
 * Ionic's animations run inside shadow roots, which a light-DOM `*` freeze rule could not reach.
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
        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 min-w-[96px] min-h-[96px] ${
            dark ? 'bg-grayscale-900 text-white' : 'bg-white text-grayscale-900'
        }`}
    >
        <div className="flex items-center justify-center min-h-[40px]">{children}</div>
        <span className="text-[10px] font-mono text-center">{label}</span>
    </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-wrap gap-2">{children}</div>
);

export const FeedbackVisualFixture: React.FC = () => (
    <main className="flex flex-col items-center gap-6 p-4">
        <ReducedMotionManager />

        <Block testId="f1-names" title="IonSpinner names (default = circular md / lines ios)">
            <Row>
                <Cell label="(default)">
                    <AppSpinner />
                </Cell>
                <Cell label="crescent">
                    <AppSpinner name="crescent" />
                </Cell>
                <Cell label="lines">
                    <AppSpinner name="lines" />
                </Cell>
                <Cell label="dots">
                    <AppSpinner name="dots" />
                </Cell>
                <Cell label="circular">
                    <AppSpinner name="circular" />
                </Cell>
                <Cell label="lines-small">
                    <AppSpinner name="lines-small" />
                </Cell>
                <Cell label="lines-sharp">
                    <AppSpinner name="lines-sharp" />
                </Cell>
                <Cell label="lines-sharp-small">
                    <AppSpinner name="lines-sharp-small" />
                </Cell>
                <Cell label="bubbles">
                    <AppSpinner name="bubbles" />
                </Cell>
                <Cell label="circles">
                    <AppSpinner name="circles" />
                </Cell>
            </Row>
        </Block>

        <Block testId="f1-colors" title="IonSpinner color prop (default name and crescent)">
            <Row>
                <Cell label='color="dark"'>
                    <AppSpinner color="dark" />
                </Cell>
                <Cell label="crescent dark">
                    <AppSpinner color="dark" name="crescent" />
                </Cell>
                <Cell label='color="black"'>
                    <AppSpinner color="black" />
                </Cell>
                <Cell label="black in text-indigo-600">
                    <span className="text-indigo-600">
                        <AppSpinner color="black" />
                    </span>
                </Cell>
                <Cell label='color="light"' dark>
                    <AppSpinner color="light" />
                </Cell>
                <Cell label="crescent light" dark>
                    <AppSpinner name="crescent" color="light" aria-hidden="true" />
                </Cell>
                <Cell label='color="grayscale-900"'>
                    <AppSpinner color="grayscale-900" />
                </Cell>
                <Cell label="crescent grayscale-100" dark>
                    <AppSpinner name="crescent" color="grayscale-100" />
                </Cell>
                <Cell label="crescent indigo-600">
                    <AppSpinner name="crescent" color="indigo-600" />
                </Cell>
                <Cell label="(none) inherits">
                    <span className="text-emerald-600">
                        <AppSpinner name="crescent" />
                    </span>
                </Cell>
            </Row>
        </Block>

        <Block testId="f1-text-colors" title="IonSpinner className text-* colors (currentColor)">
            <Row>
                <Cell label="text-grayscale-700">
                    <AppSpinner name="crescent" className="text-grayscale-700" />
                </Cell>
                <Cell label="h-4 w-4 text-grayscale-900">
                    <AppSpinner className="h-4 w-4 text-grayscale-900" />
                </Cell>
                <Cell label="w-6 h-6 text-indigo-400">
                    <AppSpinner name="crescent" className="w-6 h-6 text-indigo-400" />
                </Cell>
                <Cell label="w-6 h-6 text-grayscale-500">
                    <AppSpinner name="crescent" className="w-6 h-6 text-grayscale-500" />
                </Cell>
                <Cell label="w-5 h-5 text-gray-400">
                    <AppSpinner name="crescent" className="w-5 h-5 text-gray-400" />
                </Cell>
                <Cell label="w-12 h-12 text-cyan-500">
                    <AppSpinner name="crescent" className="w-12 h-12 text-cyan-500" />
                </Cell>
                <Cell label="h-10 w-10 text-indigo-500">
                    <AppSpinner name="crescent" className="h-10 w-10 text-indigo-500" />
                </Cell>
                <Cell label="text-emerald-600 w-8 h-8">
                    <AppSpinner name="crescent" className="text-emerald-600 w-8 h-8 mb-4" />
                </Cell>
                <Cell label="text-white" dark>
                    <AppSpinner
                        name="crescent"
                        aria-label={m['common.loading']()}
                        className="text-white w-[20px] h-[20px] mr-[5px]"
                    />
                </Cell>
            </Row>
        </Block>

        <Block testId="f1-sizes" title="IonSpinner sizes (w/h utilities, scale, inline style)">
            <Row>
                <Cell label="h-3 w-3">
                    <AppSpinner name="crescent" className="h-3 w-3" />
                </Cell>
                <Cell label="w-4 h-4">
                    <AppSpinner name="crescent" className="w-4 h-4" />
                </Cell>
                <Cell label="dots w-4 h-4">
                    <AppSpinner name="dots" className="w-4 h-4" />
                </Cell>
                <Cell label="h-5 w-5">
                    <AppSpinner className="h-5 w-5" />
                </Cell>
                <Cell label="dots w-5 h-5">
                    <AppSpinner name="dots" className="w-5 h-5" />
                </Cell>
                <Cell label="lines w-[20px]">
                    <AppSpinner name="lines" className="w-[20px] h-[20px]" />
                </Cell>
                <Cell label="h-[34px]">
                    <AppSpinner className="h-[34px] w-[34px]" />
                </Cell>
                <Cell label="h-[20px] scale-[0.75]">
                    <AppSpinner name="crescent" className="h-[20px] w-[20px] scale-[0.75]" />
                </Cell>
                <Cell label="scale-[0.8] mr-1">
                    <AppSpinner name="crescent" color="dark" className="scale-[0.8] mr-1" />
                </Cell>
                <Cell label="scale-[1] mr-1">
                    <AppSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                </Cell>
                <Cell label="scale-[1.75]">
                    <AppSpinner name="crescent" color="dark" className="scale-[1.75]" />
                </Cell>
                <Cell label="style 50px">
                    <AppSpinner name="crescent" style={{ width: '50px', height: '50px' }} />
                </Cell>
                <Cell label="h-[60px]">
                    <AppSpinner name="crescent" color="dark" className="h-[60px] w-[60px]" />
                </Cell>
                <Cell label="inline mr-2">
                    <span className="text-sm">
                        <AppSpinner name="crescent" className="inline mr-2" />
                        Saving
                    </span>
                </Cell>
            </Row>
            <Row>
                <Cell label="scale-[2] mb-8 mt-6">
                    <AppSpinner
                        name="crescent"
                        color="grayscale-900"
                        className="scale-[2] mb-8 mt-6"
                    />
                </Cell>
                <Cell label="scale-[4] mb-8">
                    <div className="w-[160px] h-[160px] flex items-center justify-center">
                        <AppSpinner
                            name="crescent"
                            color="grayscale-900"
                            className="scale-[4] mb-8"
                        />
                    </div>
                </Cell>
                <Cell label="lines mt-8">
                    <AppSpinner className="mt-8" name="lines" />
                </Cell>
            </Row>
        </Block>

        <Block testId="f1-a11y" title="IonSpinner role / aria pass-through">
            <Row>
                <Cell label="role=status lines">
                    <AppSpinner name="lines" role="status" aria-label={m['common.loading']()} />
                </Cell>
                <Cell label="role=status dark">
                    <AppSpinner role="status" aria-label={m['common.loading']()} color="dark" />
                </Cell>
                <Cell label="aria-hidden">
                    <AppSpinner aria-hidden="true" />
                </Cell>
                <Cell label="aria-hidden black">
                    <AppSpinner aria-hidden="true" color="black" />
                </Cell>
            </Row>
        </Block>

        {/* src/pages/connectPage/ConnectPage.tsx:109-114 (IonContent omitted). */}
        <Block testId="f1-connect-page" title="ConnectPage loading (IonSpinner color=black)">
            <div className="bg-white h-[180px]">
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                    <AppSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">{m['common.loading']()}</p>
                </section>
            </div>
        </Block>

        {/* src/pages/approveAccount/ApproveAccount.tsx:108-113 (dark page background). */}
        <Block testId="f1-approve-account" title="ApproveAccount loading (IonSpinner color=light)">
            <div className="bg-grayscale-900 p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                    <AppSpinner color="light" />
                    <p className="font-semibold text-lg text-white">Approving…</p>
                </div>
            </div>
        </Block>

        {/* src/components/boost/boostCMS/BoostCMSFooter/BoostCMSFooter.tsx:52-66 (save button). */}
        <Block testId="f1-boost-cms-footer" title="BoostCMSFooter save button (scale-[1] mr-1)">
            <div className="bg-grayscale-200 p-4 flex">
                <button className="flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-poppins text-xl shadow-lg normal tracking-wide mr-3 text-center boost-save-quit-btn">
                    <>
                        <AppSpinner name="crescent" color="dark" className="scale-[1] mr-1" />{' '}
                        <p className="w-full line-clamp-1 font-poppins normal tracking-wide">
                            Saving...
                        </p>
                    </>
                </button>
            </div>
        </Block>

        {/* src/components/learncardID-CMS/LearnCardIDWallpaperSelect.tsx:66-70. */}
        <Block testId="f1-wallpaper-upload" title="Wallpaper upload overlay (scale-[1.75])">
            <div className="relative h-[90px] w-[90px] bg-indigo-300 rounded-full flex items-center justify-center">
                <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                    <AppSpinner name="crescent" color="dark" className="scale-[1.75]" />
                </div>
            </div>
        </Block>

        {/* src/pages/launchPad/AppListingPage.tsx:754-772 (dots inside buttons). */}
        <Block testId="f1-app-listing-buttons" title="AppListingPage buttons (dots)">
            <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-4">
                <button
                    disabled
                    className="flex-1 sm:flex-none px-8 py-3 rounded-full bg-gray-100 text-gray-400 font-semibold"
                >
                    <AppSpinner name="dots" className="w-5 h-5" />
                </button>
                <button
                    disabled
                    className="flex-1 sm:flex-none px-8 py-3 bg-grayscale-900 text-white rounded-[20px] font-semibold hover:opacity-90 disabled:opacity-40"
                >
                    <AppSpinner name="dots" />
                </button>
            </div>
        </Block>

        {/* src/pages/wallet/WalletPageSquare.tsx:148-157 (count bubble; skeleton replaced by a gray fill). */}
        <Block testId="f1-wallet-count" title="WalletPageSquare count loader (text-* h-5 w-5)">
            <div className="bg-white p-4">
                <div className="h-[44px] w-[44px]">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-grayscale-200">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AppSpinner
                                name="crescent"
                                role="status"
                                aria-label={m['common.loading']()}
                                className="text-grayscale-900 h-5 w-5"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Block>

        {/* src/pages/wallet/activity-feed/PassportActivityFeed.tsx:183-191. */}
        <Block testId="f1-activity-feed" title="PassportActivityFeed waiting (lines, role=status)">
            <div className="bg-white h-[120px] flex">
                <div className="flex-1 flex items-center justify-center">
                    <AppSpinner name="lines" role="status" aria-label={m['common.loading']()} />
                </div>
            </div>
        </Block>

        {/* src/components/main-subheader/MainSubHeader.tsx:162-172 (count loading, white text). */}
        <Block testId="f1-main-subheader" title="MainSubHeader count loading (text-white)">
            <div className="bg-emerald-700 p-4">
                <h2 className="select-none whitespace-nowrap flex flex-col gap-[4px] text-white">
                    <span className="font-poppins text-[30px] leading-[100%] flex items-center">
                        <AppSpinner
                            name="crescent"
                            aria-label={m['common.loading']()}
                            className="text-white w-[20px] h-[20px] mr-[5px]"
                        />{' '}
                        Boosts
                    </span>
                </h2>
            </div>
        </Block>

        {/* src/components/new-ai-session/TopicNewSessionGate.tsx:166-173 (icon replaced by a disc). */}
        <Block testId="f1-ai-session-gate" title="TopicNewSessionGate (absolute -inset-3 96px)">
            <div className="bg-white h-[160px] flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                    <div className="w-[72px] h-[72px] rounded-full bg-indigo-200" />
                    <AppSpinner
                        name="crescent"
                        color="dark"
                        className="absolute -inset-3 w-[96px] h-[96px] opacity-70"
                    />
                </div>
            </div>
        </Block>

        {/* src/pages/consentFlow/ConsentFlowConnecting.tsx:31-45 (images replaced by discs). */}
        <Block testId="f1-consent-connecting" title="ConsentFlowConnecting (style color, 94px)">
            <div className="bg-white h-[200px] flex items-center">
                <div className="relative w-full flex items-center justify-center">
                    <div className="h-[70px] w-[70px] rounded-full z-50 bg-indigo-200 border-white border-solid border-[6px] box-content" />
                    <AppSpinner
                        name="crescent"
                        style={{
                            color: '#6366F1',
                            '--spinner-duration': '6s', // ... this does nothing. Was trying to slow it down
                        }}
                        className="z-[100] absolute h-[94px] w-[94px]"
                    />
                </div>
            </div>
        </Block>

        {/* src/components/generic/RouteTransitionLoader.tsx:24 (fixed overlay replaced by a box). */}
        <Block testId="f1-route-transition" title="RouteTransitionLoader (inline style color/size)">
            <div className="h-[100px] flex items-center justify-center bg-white">
                <AppSpinner name="crescent" style={{ color: '#8B5CF6', width: 36, height: 36 }} />
            </div>
        </Block>

        <Block
            testId="f1-real-loaders"
            title="Real loaders: ResumeBuilderLoader, MediaLoader, AdminToolsOptionItemLoader"
        >
            <div className="h-[160px] bg-white">
                <ResumeBuilderLoader />
            </div>
            <div className="h-[220px]">
                <MediaLoader text="Video" />
            </div>
            <AdminToolsOptionItemLoader />
        </Block>
    </main>
);
