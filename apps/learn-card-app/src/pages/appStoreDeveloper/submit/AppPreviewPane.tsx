import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { playOutline } from 'ionicons/icons';

import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import type { LaunchConfig } from '../types';
import { TestAddressBar } from './TestAddressBar';
import { useTestAddress } from './useTestAddress';

interface AppPreviewPaneProps {
    listingId: string;
    appName: string;
    /** Whether the app runs inside LearnCard, so it can be tried here. */
    runsInside: boolean;
    /** The address the app is listed under, if it has one yet. */
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
    runsInside,
    liveAddress,
    launchConfig,
    storePreview,
}) => {
    const [tab, setTab] = useState<'store' | 'try'>('store');
    const [isRunning, setIsRunning] = useState(false);
    const { test, saveTest, activeTestAddress } = useTestAddress(listingId);
    const previewAddress = activeTestAddress ?? liveAddress;

    return (
        <div className="h-full rounded-[20px] border border-grayscale-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="h-12 border-b border-grayscale-200 bg-grayscale-10 flex items-center px-3 shrink-0">
                {runsInside ? (
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

            {tab === 'try' && runsInside && (
                <div className="border-b border-grayscale-100 px-4 py-2.5 shrink-0">
                    <TestAddressBar
                        test={test}
                        onChange={saveTest}
                        defaultAddress={liveAddress}
                        resetLabel="Use live address"
                    />
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
                {tab === 'try' && !isRunning && previewAddress && (
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
                {tab === 'try' && !previewAddress && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                        <p className="text-sm text-grayscale-600 max-w-xs">
                            Add your app's address under How it opens, or use a test address to try
                            a version you're working on.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
