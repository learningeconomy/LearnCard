import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../../src/tailwind.css';
import '../../src/index.scss';

import * as m from '../../src/paraglide/messages.js';
import { LocaleProvider } from '../../src/i18n';
import { AnalyticsContextProvider } from '../../src/analytics';
import { KeepAccountStep } from '../../src/components/classlink/KeepAccountStep';
import { installKeepAccountFake } from './keep-account-fake';

/**
 * Harness for the ClassLink "keep your account" step against a fake lca-api (see
 * `keep-account-fake.ts` for the server params). Also:
 * - `variant`: inline | sheet | onboarding (default sheet; onboarding is email-only, as
 *   the onboarding flow uses it)
 */
setupIonicReact();

const params = new URLSearchParams(window.location.search);
const variant = (params.get('variant') ?? 'sheet') as 'inline' | 'sheet' | 'onboarding';
const { AppAuthContext, appAuthValue } = installKeepAccountFake(params);

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

/** The step as its host renders it; copy resolves at render, inside `LocaleProvider`. */
const Step: React.FC = () => (
    <KeepAccountStep
        variant={variant}
        source={variant === 'onboarding' ? 'transcript_onboarding' : 'dashboard'}
        emailOnly={variant === 'onboarding'}
        title={variant === 'onboarding' ? m['classlinkKeepAccount.titleTranscript']() : undefined}
        onComplete={() => document.body.setAttribute('data-done', '1')}
        onDismiss={() => document.body.setAttribute('data-dismissed', '1')}
        onAddBirthDate={() => {
            window.keepAccountHarness.birthDateOpened += 1;
        }}
    />
);
const step = <Step />;

const root = document.getElementById('root');
if (!root) throw new Error('Missing harness root');
createRoot(root).render(
    <QueryClientProvider client={queryClient}>
        <AnalyticsContextProvider>
            <LocaleProvider>
                <AppAuthContext.Provider value={appAuthValue}>
                    {variant === 'onboarding' ? (
                        // The onboarding page: a soft backdrop the frosted card sits on.
                        <div className="fixed inset-0 bg-linear-to-b/srgb from-emerald-50 via-white to-white font-poppins flex flex-col">
                            {step}
                        </div>
                    ) : (
                        <div className="min-h-screen bg-grayscale-100 font-poppins flex items-center justify-center p-4">
                            <div
                                className={
                                    variant === 'sheet'
                                        ? 'w-full max-w-[480px] bg-white rounded-[20px] p-6 shadow-2xl'
                                        : 'w-full max-w-[480px]'
                                }
                            >
                                {step}
                            </div>
                        </div>
                    )}
                </AppAuthContext.Provider>
            </LocaleProvider>
        </AnalyticsContextProvider>
    </QueryClientProvider>
);
