import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';

import '../../src/tailwind.css';
import '../../src/index.scss';

import { LocaleProvider } from '../../src/i18n';
import { SchoolConnectView } from '../../src/pages/schoolConnect/SchoolConnectView';

declare global {
    interface Window {
        schoolConnectHarness: { connectCalls: number };
    }
}

setupIonicReact();
window.schoolConnectHarness = { connectCalls: 0 };

const params = new URLSearchParams(window.location.search);
const state = params.get('state') ?? 'intro';

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
    <LocaleProvider>
        <Harness />
    </LocaleProvider>
);
