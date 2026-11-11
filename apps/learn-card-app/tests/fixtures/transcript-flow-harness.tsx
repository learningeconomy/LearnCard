import React, { createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { VC } from '@learncard/types';

import '../../src/tailwind.css';
import '../../src/index.scss';

import {
    ModalsProvider,
    Modals,
    TenantConfigProvider,
    DEFAULT_LEARNCARD_TENANT_CONFIG,
    walletStore,
} from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { clrStudentOfficialAcademicTranscript } from '@learncard/credential-library';
import { LocaleProvider } from '../../src/i18n';
import { AnalyticsContextProvider } from '../../src/analytics';
import { TranscriptRequestFlow } from '../../src/components/classlink/TranscriptRequestFlow';
import type { AppAuthContextValue } from '../../src/providers/AuthCoordinatorProvider';

/**
 * Visual harness for the guided transcript flow. Query params:
 * - `outcome`: requested | none_yet | failed | error (what the request returns)
 * - `arrive`: 1 to report the transcript as received right after the request
 * - `variant`: onboarding | modal
 * - `expect`: the school's delivery estimate in seconds (e.g. 120, or 86400 for a day)
 */
setupIonicReact();

const params = new URLSearchParams(window.location.search);
const outcome = params.get('outcome') ?? 'requested';
const arrive = params.get('arrive') === '1';
const variant = (params.get('variant') ?? 'onboarding') as 'onboarding' | 'modal';
const expectSeconds = Number(params.get('expect') ?? '');
const expectedBy = (from: string): string | undefined =>
    expectSeconds > 0 ? new Date(Date.parse(from) + expectSeconds * 1000).toISOString() : undefined;

const USER_DID = 'did:key:z6MkFlowHarnessUser';
const ISSUER_DID = 'did:web:records.example.org';
const REQUEST_ID = 'req-flow-1';
const TRANSCRIPT_URI = 'lc:credential:flow-transcript';

const transcript = {
    ...clrStudentOfficialAcademicTranscript.credential,
    issuer: ISSUER_DID,
} as unknown as VC;

let requestedAt: string | undefined;

const APP_AUTH_CONTEXT_KEY = '__learncardAppAuthContext__';
const globalScope = globalThis as typeof globalThis & {
    [APP_AUTH_CONTEXT_KEY]?: React.Context<AppAuthContextValue | null>;
};
globalScope[APP_AUTH_CONTEXT_KEY] ??= createContext<AppAuthContextValue | null>(null);
const AppAuthContext = globalScope[APP_AUTH_CONTEXT_KEY];
const fakeAppAuthValue = {
    state: { status: 'ready', did: USER_DID },
} as unknown as AppAuthContextValue;

const fakeWallet = {
    id: { did: () => USER_DID },
    read: { get: async (uri: string) => (uri === TRANSCRIPT_URI ? transcript : null) },
    index: {
        LearnCloud: {
            get: async () =>
                requestedAt && arrive
                    ? [{ id: 't', uri: TRANSCRIPT_URI, category: 'Learning History' }]
                    : [],
            add: async () => true,
        },
    },
    invoke: {
        transcriptsGetStatus: async () => ({
            eligible: true,
            stateDisplayName: 'Example State',
            issuerDid: ISSUER_DID,
            issuerProfileId: 'example-records',
            latest: requestedAt
                ? {
                      status: 'requested' as const,
                      requestedAt,
                      requestId: REQUEST_ID,
                      expectedBy: expectedBy(requestedAt),
                      ...(arrive ? { receivedAt: new Date().toISOString() } : {}),
                  }
                : undefined,
        }),
        transcriptsRequest: async () => {
            await new Promise(resolve => setTimeout(resolve, 600));
            if (outcome === 'error') throw new Error('offline');
            requestedAt = new Date().toISOString();
            return {
                status: outcome,
                requestedAt,
                requestId: REQUEST_ID,
                expectedBy: expectedBy(requestedAt),
            };
        },
        transcriptsMarkReceived: async () => undefined,
        getIncomingCredentials: async () => [],
        getReceivedCredentials: async () => [],
        getProfile: async (profileId: string) => ({ profileId }),
        verifyCredential: async () => ({ warnings: [], errors: [] }),
        acceptCredential: async () => true,
        queryNotifications: async () => ({ notifications: [] }),
        getConsentedContracts: async () => ({ records: [], hasMore: false }),
    },
};
walletStore.set.wallet(fakeWallet as unknown as BespokeLearnCard);

const tenantConfig = {
    ...DEFAULT_LEARNCARD_TENANT_CONFIG,
    features: { ...DEFAULT_LEARNCARD_TENANT_CONFIG.features, classlinkTranscriptOptIn: true },
};
const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    variant === 'modal' ? (
        <div className="min-h-screen bg-grayscale-900/40 flex items-end md:items-center justify-center">
            <div className="w-full md:max-w-[480px] bg-white rounded-t-[20px] md:rounded-[20px] p-6 shadow-2xl">
                {children}
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 py-10">
            {children}
        </div>
    );

const root = document.getElementById('root');
if (!root) throw new Error('Missing harness root');
createRoot(root).render(
    <QueryClientProvider client={queryClient}>
        <AnalyticsContextProvider>
            <LocaleProvider>
                <TenantConfigProvider config={tenantConfig}>
                    <AppAuthContext.Provider value={fakeAppAuthValue}>
                        <MemoryRouter>
                            <ModalsProvider>
                                <div className="font-poppins">
                                    <Frame>
                                        <TranscriptRequestFlow
                                            variant={variant}
                                            stateDisplayName="Example State"
                                            onDone={() => undefined}
                                        />
                                    </Frame>
                                </div>
                                <Modals />
                            </ModalsProvider>
                        </MemoryRouter>
                    </AppAuthContext.Provider>
                </TenantConfigProvider>
            </LocaleProvider>
        </AnalyticsContextProvider>
    </QueryClientProvider>
);
