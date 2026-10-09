import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { flaskOutline, playOutline } from 'ionicons/icons';

import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import type { LaunchConfig } from '../types';
import { displayHost, isValidTestAddress, readTestAddress, writeTestAddress } from './testAddress';

interface AppPreviewPaneProps {
    listingId: string;
    appName: string;
    /** The address the app is listed under; null when the app doesn't run inside LearnCard. */
    liveAddress: string | null;
    launchConfig: LaunchConfig;
    storePreview: React.ReactNode;
}

const tabClass = (active: boolean): string =>
    `py-1.5 px-3 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-grayscale-900 text-white' : 'text-grayscale-700 hover:bg-grayscale-200'
    }`;

export const AppPreviewPane: React.FC<AppPreviewPaneProps> = ({
    listingId,
    appName,
    liveAddress,
    launchConfig,
    storePreview,
}) => {
    const [tab, setTab] = useState<'store' | 'try'>('store');
    const [isRunning, setIsRunning] = useState(false);
    const [test, setTest] = useState(() => readTestAddress(listingId));
    const [isEditingTest, setIsEditingTest] = useState(false);
    const [draft, setDraft] = useState(test.address);

    const usingTest = test.enabled && isValidTestAddress(test.address);
    const previewAddress = usingTest ? test.address.trim() : liveAddress;

    const saveTest = (next: typeof test) => {
        setTest(next);
        writeTestAddress(listingId, next);
    };

    const applyDraft = () => {
        if (!isValidTestAddress(draft)) return;
        saveTest({ address: draft.trim(), enabled: true });
        setIsEditingTest(false);
    };

    return (
        <div className="h-full rounded-[20px] border border-grayscale-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="h-12 border-b border-grayscale-200 bg-grayscale-10 flex items-center px-3 shrink-0">
                {liveAddress ? (
                    <div className="flex items-center gap-1 p-1 bg-grayscale-100 rounded-full">
                        <button
                            type="button"
                            onClick={() => setTab('store')}
                            className={tabClass(tab === 'store')}
                        >
                            Store preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('try')}
                            className={tabClass(tab === 'try')}
                        >
                            Try your app
                        </button>
                    </div>
                ) : (
                    <span className="text-xs font-medium text-grayscale-500 px-2">
                        How it looks in the store
                    </span>
                )}
            </div>

            {tab === 'try' && liveAddress && (
                <div className="border-b border-grayscale-100 px-4 py-2.5 shrink-0">
                    {isEditingTest ? (
                        <form
                            className="flex items-center gap-2"
                            onSubmit={event => {
                                event.preventDefault();
                                applyDraft();
                            }}
                        >
                            <input
                                type="url"
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                placeholder="http://localhost:5173"
                                aria-label="Test address"
                                autoFocus
                                className="flex-1 min-w-0 py-2 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                            <button
                                type="submit"
                                disabled={!isValidTestAddress(draft)}
                                className="py-2 px-3 rounded-[20px] bg-grayscale-900 text-white font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                            >
                                Use
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditingTest(false)}
                                className="text-xs text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center justify-between gap-3 text-xs">
                            {usingTest ? (
                                <span className="flex items-center gap-1.5 min-w-0 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium">
                                    <IonIcon icon={flaskOutline} className="shrink-0" />
                                    <span className="truncate">
                                        Test address · {displayHost(test.address)}
                                    </span>
                                </span>
                            ) : (
                                <span className="min-w-0 truncate text-grayscale-600">
                                    Previewing{' '}
                                    <span className="font-medium">{displayHost(liveAddress)}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-3 shrink-0">
                                {usingTest && (
                                    <button
                                        type="button"
                                        onClick={() => saveTest({ ...test, enabled: false })}
                                        className="font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                                    >
                                        Use live address
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft(test.address);
                                        setIsEditingTest(true);
                                    }}
                                    className="font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                                >
                                    {usingTest ? 'Edit' : 'Use a test address'}
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 relative bg-grayscale-100">
                {tab === 'store' && (
                    <div className="absolute inset-0 overflow-y-auto p-6 animate-fade-in-up">
                        {storePreview}
                    </div>
                )}
                {tab === 'try' && previewAddress && isRunning && (
                    <div className="absolute inset-0">
                        <EmbedIframeModal
                            key={previewAddress}
                            embedUrl={previewAddress}
                            appId={listingId}
                            appName={appName}
                            launchConfig={{ ...launchConfig, url: previewAddress }}
                            isInstalled
                            inline
                            launchFeaturesInNewTab
                        />
                    </div>
                )}
                {tab === 'try' && !isRunning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-2">
                            Try your app
                        </h3>
                        <p className="text-sm text-grayscale-600 mb-6 max-w-xs">
                            Run it inside LearnCard. Use a test address to try a version you're
                            still working on. Learners always get the live address.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsRunning(true)}
                            className="flex items-center gap-2 py-3 px-6 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            <IonIcon icon={playOutline} />
                            Start
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
