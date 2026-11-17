import React, { createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../../src/tailwind.css';
import '../../src/index.scss';

import { walletStore } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import { LocaleProvider } from '../../src/i18n';
import { AnalyticsContextProvider } from '../../src/analytics';
import { KeepAccountStep } from '../../src/components/classlink/KeepAccountStep';
import type {
    AppAuthContextValue,
    RecoverySetupOptions,
} from '../../src/providers/AuthCoordinatorProvider';

/**
 * Harness for the ClassLink "keep your account" step against a fake lca-api. Query params:
 * - `variant`: inline | sheet (default sheet)
 * - `step`: email | method | done (the server's starting state)
 * - `reason`: a refusal reason (makes the email step not allowed)
 * - `shared`: 1 to report the verified address as another account's recovery email
 */
declare global {
    interface Window {
        keepAccountHarness: { setupOptions: RecoverySetupOptions[]; removed: number };
    }
}

setupIonicReact();
window.keepAccountHarness = { setupOptions: [], removed: 0 };

const params = new URLSearchParams(window.location.search);
const variant = (params.get('variant') ?? 'sheet') as 'inline' | 'sheet';
const startStep = params.get('step') ?? 'email';
const reason = params.get('reason') as ClassLinkAccountContinuity['personalEmail']['reason'];
const shared = params.get('shared') === '1';

const server = {
    email: startStep === 'email' ? undefined : 'student@example.org',
    recoveryEmail: startStep !== 'email',
    method: startStep === 'done',
    pending: undefined as string | undefined,
};

const continuity = (): ClassLinkAccountContinuity => ({
    personalEmail: reason ? { allowed: false, reason } : { allowed: true },
    emailVerified: Boolean(server.email),
    ...(server.email ? { maskedEmail: `${server.email[0]}***@example.org` } : {}),
    recoveryEmailVerified: server.recoveryEmail,
    hasServerConfirmedMethod: server.method,
    hasUserRecoveryMethod: server.method,
    nextStep: !server.email || !server.recoveryEmail ? 'email' : server.method ? 'done' : 'method',
});

const trpcError = (code: string): Error => Object.assign(new Error(code), { data: { code } });

const fakeWallet = {
    id: { did: () => 'did:key:z6MkKeepAccountHarness' },
    invoke: {
        classlinkGetAccountContinuity: async () => continuity(),
        classlinkStartPersonalEmail: async ({ email }: { email: string }) => {
            if (email.endsWith('@school.example')) throw trpcError('BAD_REQUEST');
            server.pending = email;
            return { success: true };
        },
        classlinkVerifyPersonalEmail: async ({ email, code }: { email: string; code: string }) => {
            if (code !== '123456' || email !== server.pending) throw trpcError('BAD_REQUEST');
            server.email = email;
            server.recoveryEmail = !shared;
            return shared
                ? {
                      success: true,
                      recoveryEmailSet: false,
                      recoveryEmailSkipped: 'shared' as const,
                  }
                : { success: true, recoveryEmailSet: true };
        },
        classlinkRemovePersonalEmail: async () => {
            window.keepAccountHarness.removed += 1;
            server.email = undefined;
            server.recoveryEmail = false;
            return { success: true };
        },
    },
};
walletStore.set.wallet(fakeWallet as unknown as BespokeLearnCard);

const APP_AUTH_CONTEXT_KEY = '__learncardAppAuthContext__';
const globalScope = globalThis as typeof globalThis & {
    [APP_AUTH_CONTEXT_KEY]?: React.Context<AppAuthContextValue | null>;
};
globalScope[APP_AUTH_CONTEXT_KEY] ??= createContext<AppAuthContextValue | null>(null);
const AppAuthContext = globalScope[APP_AUTH_CONTEXT_KEY];
// The real overlay is the AuthCoordinator's; this one confirms the method at once.
const fakeAppAuthValue = {
    state: { status: 'ready', did: 'did:key:z6MkKeepAccountHarness' },
    openRecoverySetup: (options: RecoverySetupOptions = {}) => {
        window.keepAccountHarness.setupOptions.push(options);
        server.method = true;
        options.onCompleted?.(options.initialMethod ?? 'passkey');
    },
} as unknown as AppAuthContextValue;

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const root = document.getElementById('root');
if (!root) throw new Error('Missing harness root');
createRoot(root).render(
    <QueryClientProvider client={queryClient}>
        <AnalyticsContextProvider>
            <LocaleProvider>
                <AppAuthContext.Provider value={fakeAppAuthValue}>
                    <div className="min-h-screen bg-grayscale-100 font-poppins flex items-center justify-center p-4">
                        <div
                            className={
                                variant === 'sheet'
                                    ? 'w-full max-w-[480px] bg-white rounded-[20px] p-6 shadow-2xl'
                                    : 'w-full max-w-[480px]'
                            }
                        >
                            <KeepAccountStep
                                variant={variant}
                                source="dashboard"
                                onComplete={() => document.body.setAttribute('data-done', '1')}
                                onDismiss={() => document.body.setAttribute('data-dismissed', '1')}
                            />
                        </div>
                    </div>
                </AppAuthContext.Provider>
            </LocaleProvider>
        </AnalyticsContextProvider>
    </QueryClientProvider>
);
