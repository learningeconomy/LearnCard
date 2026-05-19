import React, { useMemo, useState } from 'react';

import { RenderMethodDesigner } from '@learncard/render-method-designer';
import { findFixture, type CredentialFixture } from '@learncard/credential-library';

import { WalletProvider, useWallet } from './context/WalletContext';
import { Header } from './components/Header';
import { AttachAndIssuePanel } from './components/AttachAndIssuePanel';
import { getCuratedSamples } from './lib/sampleFixtures';

const SAMPLES = getCuratedSamples();

const AppInner: React.FC = () => {
    const { status } = useWallet();
    const [savedTemplate, setSavedTemplate] = useState<string | null>(null);
    const [selectedFixtureId, setSelectedFixtureId] = useState<string>(SAMPLES[0]?.id ?? '');
    const [showAttachPanel, setShowAttachPanel] = useState(false);

    const selectedFixture = useMemo<CredentialFixture | null>(
        () => (selectedFixtureId ? findFixture(selectedFixtureId) ?? null : null),
        [selectedFixtureId]
    );

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />

            <main className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col p-3 gap-2 min-w-0 min-h-0">
                    <div className="flex-1 min-h-0 min-w-0 bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <RenderMethodDesigner
                            sampleVCs={SAMPLES}
                            onSave={async ({ svgMustache }) => {
                                setSavedTemplate(svgMustache);
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 px-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span>Pipeline VC</span>
                            <select
                                value={selectedFixtureId}
                                onChange={e => setSelectedFixtureId(e.target.value)}
                                className="px-2 py-1 bg-gray-900 border border-gray-700 rounded-md text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            >
                                {SAMPLES.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex-1" />

                        {savedTemplate && (
                            <span className="text-[11px] text-emerald-400">
                                Staged ({savedTemplate.length} chars)
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowAttachPanel(true)}
                            disabled={!savedTemplate || status !== 'connected'}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                                status !== 'connected'
                                    ? 'Connect a wallet first'
                                    : !savedTemplate
                                        ? 'Click Save in the designer first'
                                        : 'Run the full plugin pipeline'
                            }
                        >
                            Run pipeline →
                        </button>
                    </div>
                </div>
            </main>

            {showAttachPanel && savedTemplate && (
                <AttachAndIssuePanel
                    templateValue={savedTemplate}
                    sampleFixture={selectedFixture}
                    onClose={() => setShowAttachPanel(false)}
                />
            )}
        </div>
    );
};

export const App: React.FC = () => (
    <WalletProvider>
        <AppInner />
    </WalletProvider>
);
