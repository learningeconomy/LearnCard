import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import {
    ModalsProvider,
    TenantConfigProvider,
    DEFAULT_LEARNCARD_TENANT_CONFIG,
} from 'learn-card-base';
import { resolvedCredentialQueryKey } from 'learn-card-base/react-query/queries/credentialResolution';
import { BoostGenericCard } from '@learncard/react';
import { WalletCategoryTypes } from '../../../../packages/react-learn-card/src/types';
import { AnalyticsContextProvider } from '../../src/analytics';
import { LocaleProvider } from '../../src/i18n';
import DashboardView from '../../src/pages/dashboard/DashboardView';
import NewBoostButton from '../../src/components/boost/NewBoostButton';
import { CredentialCategoryEnum } from 'learn-card-base';
import { BoostPageViewMode } from '../../src/components/EarnedAndManagedTabs/EarnedAndManagedTabs';
import { additionalStates, PageFixture, seedPageQueries } from './PageFixtures';
import {
    DASHBOARD_PERSONAS,
    personaCredentials,
} from '../../src/pages/dashboard/dashboard.personas';

// Keep this order aligned with App.tsx: Ionic, theme, shared cards, then app styles.
import 'learn-card-base/ui/global/core.css';
import 'learn-card-base/ui/global/normalize.css';
import 'learn-card-base/ui/global/structure.css';
import 'learn-card-base/ui/global/typography.css';
import 'learn-card-base/ui/global/padding.css';
import 'learn-card-base/ui/global/float-elements.css';
import 'learn-card-base/ui/global/text-alignment.css';
import 'learn-card-base/ui/global/text-transformation.css';
import 'learn-card-base/ui/global/flex-utils.css';
import 'learn-card-base/ui/global/display.css';
import '../../src/theme/variables.css';
import '../../src/theme/floating-tab-bar.css';
import '@learncard/react/main.css';
import '../../src/tailwind.css';
import '../../src/index.scss';

initAppPlatform();

const params = new URLSearchParams(location.search);
const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false } },
});
Object.entries(personaCredentials).forEach(([uri, credential]) => {
    client.setQueryData(resolvedCredentialQueryKey(uri, ''), credential);
});
seedPageQueries(client, params.get('state') ?? undefined);

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
            className="rounded-[20px] border border-grayscale-200 bg-white p-6 space-y-v3-4"
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
    <TenantConfigProvider
        config={
            state === 'my-apps-signed-in'
                ? {
                      ...DEFAULT_LEARNCARD_TENANT_CONFIG,
                      features: {
                          ...DEFAULT_LEARNCARD_TENANT_CONFIG.features,
                          dashboardHome: true,
                      },
                  }
                : DEFAULT_LEARNCARD_TENANT_CONFIG
        }
    >
        <LocaleProvider>
            <QueryClientProvider client={client}>
                <AnalyticsContextProvider>
                    <MemoryRouter
                        initialEntries={[
                            state === 'apps' || state === 'my-apps'
                                ? '/launchpad'
                                : state.startsWith('issue')
                                  ? '/issue'
                                  : '/',
                        ]}
                    >
                        <ModalsProvider>
                            <div
                                data-testid="fixture"
                                className="min-h-screen bg-grayscale-100 font-poppins"
                            >
                                {additionalStates.some(name => name === state) ? (
                                    <PageFixture state={state} />
                                ) : state === 'tints' ? (
                                    <main>
                                        <div data-testid="tint-card">
                                            <NewBoostButton
                                                credentialType={CredentialCategoryEnum.socialBadge}
                                                onClick={() => undefined}
                                            />
                                        </div>
                                        <div data-testid="tint-row">
                                            <NewBoostButton
                                                credentialType={CredentialCategoryEnum.socialBadge}
                                                viewMode={BoostPageViewMode.List}
                                                onClick={() => undefined}
                                            />
                                        </div>
                                        <AppGrid
                                            data-testid="credential-gutters"
                                            className="max-w-[600px] pt-[20px]"
                                        >
                                            <AppRow>
                                                {[0, 1, 2, 3].map(index => (
                                                    <AppCol size="6" key={index}>
                                                        <div
                                                            data-testid="gutter-card"
                                                            className="bg-white h-[100px] w-full"
                                                        />
                                                    </AppCol>
                                                ))}
                                            </AppRow>
                                        </AppGrid>
                                        <AppGrid
                                            data-testid="explicit-grid-spacing"
                                            className="p-0 m-0"
                                        >
                                            <AppRow>
                                                <AppCol className="p-0">No padding</AppCol>
                                            </AppRow>
                                        </AppGrid>
                                        <button
                                            data-testid="ionic-border"
                                            className="border border-grayscale-200"
                                        >
                                            Default border
                                        </button>
                                        <button
                                            data-testid="solid-border"
                                            className="border border-solid border-grayscale-200"
                                        >
                                            Explicit border
                                        </button>
                                    </main>
                                ) : state === 'shared' ? (
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
                </AnalyticsContextProvider>
            </QueryClientProvider>
        </LocaleProvider>
    </TenantConfigProvider>
);
