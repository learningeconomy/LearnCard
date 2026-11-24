import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../../src/tailwind.css';
import '../../src/index.scss';

import { LocaleProvider } from '../../src/i18n';
import { AnalyticsContextProvider } from '../../src/analytics';
import { SchoolConnectView } from '../../src/pages/schoolConnect/SchoolConnectView';
import { KeepAccountStep } from '../../src/components/classlink/KeepAccountStep';
import { installKeepAccountFake } from './keep-account-fake';

declare global {
    interface Window {
        schoolConnectHarness: { connectCalls: number };
    }
}

setupIonicReact();
window.schoolConnectHarness = { connectCalls: 0 };

const params = new URLSearchParams(window.location.search);
const state = params.get('state') ?? 'intro';
// `keepAccount=shown` fills the keep-account slot; `empty` passes a slot that renders nothing;
// `real` renders the real inline step against the fake lca-api (`step`, `reason`, ... as in
// keep-account-fake.ts).
const keepAccount = params.get('keepAccount');
const EmptySlot: React.FC = () => null;
const { AppAuthContext, appAuthValue } = installKeepAccountFake(params);
const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const connection = {
    available: state !== 'unavailable',
    canConnect: state !== 'unavailable',
    connected: state === 'connected',
    isStudent: params.get('student') === '1',
    ...(state === 'connected'
        ? { schoolName: 'Example Unified School District', lastConnectedAt: '2026-11-02T15:00:00Z' }
        : {}),
};

const Harness: React.FC = () => {
    const [connecting, setConnecting] = useState(false);
    return (
        <div className="min-h-screen bg-grayscale-100 font-poppins">
            <SchoolConnectView
                connection={state === 'loading' || state === 'error' ? undefined : connection}
                isLoading={state === 'loading'}
                isError={state === 'error'}
                isLocked={params.get('locked') === '1'}
                supportEmail={params.get('support') === '0' ? undefined : 'support@example.org'}
                connecting={connecting}
                connectError={params.get('connectError') === '1' ? 'Something went wrong.' : ''}
                onConnect={() => {
                    window.schoolConnectHarness.connectCalls += 1;
                    setConnecting(true);
                }}
                onRetry={() => undefined}
                formatDate={iso =>
                    new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso))
                }
                keepAccountSlot={
                    keepAccount === 'real' ? (
                        <KeepAccountStep
                            variant="inline"
                            source="school_connect"
                            onAddBirthDate={() => {
                                window.keepAccountHarness.birthDateOpened += 1;
                            }}
                        />
                    ) : keepAccount === 'shown' ? (
                        <section
                            data-testid="keep-account-slot"
                            className="rounded-[20px] bg-white p-6 text-sm text-grayscale-600 shadow-sm border border-grayscale-200"
                        >
                            Keep your account
                        </section>
                    ) : keepAccount === 'empty' ? (
                        <EmptySlot />
                    ) : undefined
                }
                transcriptSlot={
                    <section
                        data-testid="transcript-slot"
                        className="rounded-[20px] bg-white p-6 text-sm text-grayscale-600 shadow-sm border border-grayscale-200"
                    >
                        Transcript request
                    </section>
                }
            />
        </div>
    );
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing harness root');
createRoot(root).render(
    <QueryClientProvider client={queryClient}>
        <AnalyticsContextProvider>
            <LocaleProvider>
                <AppAuthContext.Provider value={appAuthValue}>
                    <Harness />
                </AppAuthContext.Provider>
            </LocaleProvider>
        </AnalyticsContextProvider>
    </QueryClientProvider>
);
