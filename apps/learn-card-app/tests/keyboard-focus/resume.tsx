import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, IonPage, setupIonicReact } from '@ionic/react';
import { ResumeBuilderToolbar } from '../../src/components/resume-builder/ResumeBuilderToolbar';
import { ResumeSummaryField } from '../../src/components/resume-builder/resume-preview/ResumeSummaryField';
import { KeyboardFocusManager } from '../../../../packages/learn-card-base/src/components/keyboard/KeyboardFocusManager';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '../../src/tailwind.css';
import '../../src/index.scss';

setupIonicReact({ mode: 'ios' });
const noop = (): void => {};

const ResumeLayoutReview = () => {
    const [summary, setSummary] = useState('');
    return (
        <IonApp>
            <KeyboardFocusManager />
            <IonPage>
                <div id="app-router" className="flex h-full min-h-0 flex-col bg-grayscale-100">
                    <ResumeBuilderToolbar
                        loadingAction={null}
                        isMobile={window.innerWidth < 800}
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
            </IonPage>
        </IonApp>
    );
};

createRoot(document.getElementById('root')!).render(<ResumeLayoutReview />);
