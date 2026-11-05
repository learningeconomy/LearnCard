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
import { LocaleProvider } from '../../src/i18n';
import { AnalyticsContextProvider } from '../../src/analytics';
import { TranscriptOptInCard } from '../../src/components/classlink/TranscriptOptInCard';
import type { AppAuthContextValue } from '../../src/providers/AuthCoordinatorProvider';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

setupIonicReact();

const params = new URLSearchParams(window.location.search);
const scenario = params.get('scenario') ?? 'requesting';

const USER_DID = 'did:key:z6MkHarnessUser';
const ISSUER_DID = 'did:key:z6MkHarnessIssuer';
const REQUEST_ID = 'req-harness-1';
const REQUESTED_AT = '2026-01-01T00:00:00.000Z';
const STATE_DISPLAY_NAME = 'Example State';

/**
 * Real production code reads `useAppAuth()` via a `React.Context` cached on
 * `globalThis` under this key (see `AuthCoordinatorProvider.tsx`). Recreating the
 * same lazily-created context here — instead of mounting the real provider, which
 * requires a live Firebase/SSS backend this mocked tier does not run — lets the
 * harness supply a plain `.Provider` value that `useAppAuth()` reads normally.
 */
const APP_AUTH_CONTEXT_KEY = '__learncardAppAuthContext__';
const getAppAuthContext = (): React.Context<AppAuthContextValue | null> => {
    const globalScope = globalThis as typeof globalThis & {
        [APP_AUTH_CONTEXT_KEY]?: React.Context<AppAuthContextValue | null>;
    };
    if (!globalScope[APP_AUTH_CONTEXT_KEY]) {
        globalScope[APP_AUTH_CONTEXT_KEY] = createContext<AppAuthContextValue | null>(null);
    }
    return globalScope[APP_AUTH_CONTEXT_KEY];
};
const AppAuthContext = getAppAuthContext();

// Only `state.status` is read by the surfaces under test; every other field is an
// inert stub satisfying the production type for this harness-only fixture.
const fakeAppAuthValue = {
    state: { status: 'ready', did: USER_DID },
} as unknown as AppAuthContextValue;

type IndexRecord = { id: string; uri: string; category?: string; __v?: number };

const indexRecords: IndexRecord[] = [];
const credentialsByUri = new Map<string, VC>();
let receivedAt: string | undefined;
const markReceivedCalls: string[] = [];

const CLR_VC: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:transcript-harness',
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: ISSUER_DID, name: 'Example High School' },
    issuanceDate: REQUESTED_AT,
    validFrom: '2026-01-02T00:00:00.000Z',
    credentialSubject: {
        id: USER_DID,
        achievement: { name: 'Example High School' },
    },
} as unknown as VC;

if (scenario === 'arrived-sheet') {
    receivedAt = '2026-01-03T00:00:00.000Z';
    indexRecords.push({ id: 'transcript-1', uri: 'lc:credential:transcript', __v: 1 });
    credentialsByUri.set('lc:credential:transcript', CLR_VC);
}

const transcriptsGetStatus = async () => ({
    eligible: true,
    stateDisplayName: STATE_DISPLAY_NAME,
    issuerDid: ISSUER_DID,
    latest: {
        status: 'requested' as const,
        requestedAt: REQUESTED_AT,
        requestId: REQUEST_ID,
        receivedAt,
    },
});

const getIncomingCredentials = async () => {
    if (scenario === 'non-matching-sender') {
        return [{ uri: 'lc:credential:wrong-sender', from: 'did:key:z6MkSomeoneElse' }];
    }
    if (scenario === 'requesting-arrived') {
        credentialsByUri.set('lc:credential:transcript', CLR_VC);
        return [{ uri: 'lc:credential:transcript', from: ISSUER_DID }];
    }
    return [];
};

const fakeWallet = {
    id: { did: () => USER_DID },
    read: {
        get: async (uri: string) => credentialsByUri.get(uri) ?? null,
    },
    index: {
        LearnCloud: {
            get: async <T,>() => indexRecords as unknown as T[],
            add: async (record: IndexRecord) => {
                indexRecords.push(record);
                credentialsByUri.set(
                    record.uri,
                    credentialsByUri.get(record.uri) ?? ({ ...CLR_VC, id: record.uri } as VC)
                );
                return true;
            },
        },
    },
    invoke: {
        transcriptsGetStatus,
        transcriptsRequest: async () => ({
            status: 'requested' as const,
            requestedAt: REQUESTED_AT,
        }),
        transcriptsMarkReceived: async ({ requestId }: { requestId: string }) => {
            markReceivedCalls.push(requestId);
            receivedAt = new Date().toISOString();
        },
        getIncomingCredentials,
        verifyCredential: async () => ({ warnings: [], errors: [] }),
        acceptCredential: async () => true,
        queryNotifications: async () => ({ notifications: [] }),
        updateNotificationMeta: async () => true,
        getConsentedContracts: async () => ({ records: [], hasMore: false }),
    },
};

declare global {
    interface Window {
        transcriptArrivalHarness: {
            markReceivedCalls: string[];
        };
    }
}
window.transcriptArrivalHarness = { markReceivedCalls };

walletStore.set.wallet(fakeWallet as unknown as BespokeLearnCard);

const tenantConfig = {
    ...DEFAULT_LEARNCARD_TENANT_CONFIG,
    features: { ...DEFAULT_LEARNCARD_TENANT_CONFIG.features, classlinkTranscriptOptIn: true },
};

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

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
                                <div className="min-h-screen bg-grayscale-100 font-poppins p-4">
                                    <TranscriptOptInCard source="wallet" />
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
