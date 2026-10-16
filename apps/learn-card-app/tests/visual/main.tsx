import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupIonicReact } from '@ionic/react';
import {
    ModalsProvider,
    TenantConfigProvider,
    DEFAULT_LEARNCARD_TENANT_CONFIG,
} from 'learn-card-base';
import { BoostGenericCard } from '@learncard/react';
import { WalletCategoryTypes } from '../../../../packages/react-learn-card/src/types';
import { AnalyticsContextProvider } from '../../src/analytics';
import { LocaleProvider } from '../../src/i18n';
import DashboardView from '../../src/pages/dashboard/DashboardView';
import {
    DASHBOARD_PERSONAS,
    personaCredentials,
} from '../../src/pages/dashboard/dashboard.personas';

// Keep this order aligned with App.tsx: Ionic, theme, shared cards, then app styles.
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '../../src/theme/variables.css';
import '../../src/theme/floating-tab-bar.css';
import '@learncard/react/main.css';
import '../../src/index.scss';

setupIonicReact({ swipeBackEnabled: false });

const params = new URLSearchParams(location.search);
const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false } },
});
Object.entries(personaCredentials).forEach(([uri, credential]) => {
    client.setQueryData(['useGetResolvedCredential', uri], credential);
});

const states = {
    active: 'Active learner',
    pending: 'Pending actions only',
    empty: 'Brand-new user',
} as const;
const state = params.get('state') ?? 'active';
const persona = DASHBOARD_PERSONAS[states[state as keyof typeof states] ?? states.active];

const SharedComponents: React.FC = () => (
    <main className="mx-auto flex w-full max-w-[900px] flex-col gap-5 p-6 font-poppins">
        <div data-testid="shared-card" className="w-full max-w-[350px]">
            <BoostGenericCard
                title="Community Leadership"
                type={WalletCategoryTypes.skills}
                thumbImgSrc=""
                dateDisplay="October 1, 2026"
                issuerName="Learning Community"
                innerOnClick={() => undefined}
            />
        </div>
        <section
            data-testid="form"
            className="rounded-[20px] border border-grayscale-200 bg-white p-6 space-y-4"
        >
            <h1 className="text-xl font-semibold text-grayscale-900">Account settings</h1>
            <label className="block text-xs font-medium text-grayscale-700">
                Display name
                <input
                    aria-label="Display name"
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </label>
            <button className="rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90">
                Save changes
            </button>
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                Connection issue. Please try again.
            </div>
        </section>
    </main>
);

createRoot(document.getElementById('root')!).render(
    <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
        <LocaleProvider>
            <AnalyticsContextProvider>
                <QueryClientProvider client={client}>
                    <MemoryRouter>
                        <ModalsProvider>
                            <div
                                data-testid="fixture"
                                className="min-h-screen bg-grayscale-100 font-poppins"
                            >
                                {state === 'shared' ? (
                                    <SharedComponents />
                                ) : (
                                    <DashboardView
                                        vm={{
                                            ...persona,
                                            learningProfile: {
                                                ...persona.learningProfile,
                                                updatedAt: '2026-10-01T09:00:00Z',
                                            },
                                        }}
                                    />
                                )}
                            </div>
                        </ModalsProvider>
                    </MemoryRouter>
                </QueryClientProvider>
            </AnalyticsContextProvider>
        </LocaleProvider>
    </TenantConfigProvider>
);
