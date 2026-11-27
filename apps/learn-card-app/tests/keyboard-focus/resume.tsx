import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';
import { ResumeBuilderToolbar } from '../../src/components/resume-builder/ResumeBuilderToolbar';
import { ResumeSummaryField } from '../../src/components/resume-builder/resume-preview/ResumeSummaryField';
import { KeyboardFocusManager } from '../../../../packages/learn-card-base/src/components/keyboard/KeyboardFocusManager';
import 'learn-card-base/ui/global/core.css';
import 'learn-card-base/ui/global/normalize.css';
import 'learn-card-base/ui/global/structure.css';
import '../../src/tailwind.css';
import '../../src/index.scss';
import { AppPage } from 'learn-card-base/ui/chrome';

initAppPlatform({ mode: 'ios' });
const noop = (): void => {};

const ResumeLayoutReview = () => {
    const [summary, setSummary] = useState('');
    return (
        <AppRoot>
            <KeyboardFocusManager />
            <AppPage>
                <div id="app-router" className="flex h-full min-h-0 flex-col bg-grayscale-100">
                    <ResumeBuilderToolbar
                        loadingAction={null}
                        isMobile={window.innerWidth < 800}
                        isDesktopPanelClosed
                        isEditingExistingResume
                        onBack={noop}
                        onPreview={noop}
                        onDownload={noop}
                        onPublish={noop}
                        onShareCurrentResume={noop}
                        historyControl={
                            <button
                                type="button"
                                aria-label="Resume history"
                                className="min-h-11 min-w-11 rounded-[20px] text-grayscale-700"
                            >
                                1
                            </button>
                        }
                    />
                    <div data-testid="resume-scroll" className="flex-1 min-h-0 overflow-y-auto p-4">
                        <details className="mb-4 rounded-2xl bg-white p-4">
                            <summary>About publishing</summary>
                            <p>Publishing details stay in the scrollable content.</p>
                        </details>
                        <div className="mb-4 h-[400px] rounded-xl bg-white p-4">Resume content</div>
                        <ResumeSummaryField
                            value={summary}
                            placeholder="Brief professional summary..."
                            onChange={setSummary}
                        />
                        <div className="h-8" />
                    </div>
                </div>
            </AppPage>
        </AppRoot>
    );
};

createRoot(document.getElementById('root')!).render(<ResumeLayoutReview />);
