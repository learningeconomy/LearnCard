import React from 'react';
import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp, setupIonicReact } from '@ionic/react';
import {
    Modals,
    ModalsProvider,
    TenantConfigProvider,
    DEFAULT_LEARNCARD_TENANT_CONFIG,
} from 'learn-card-base';
import { AnalyticsContextProvider } from '../src/analytics';
import { LocaleProvider } from '../src/i18n';
import { Buffer } from 'buffer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Buffer = (window as any).Buffer ?? Buffer;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = (window as any).global ?? window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).process = (window as any).process ?? {
    env: {},
    browser: true,
    version: '',
    nextTick: (cb: () => void) => setTimeout(cb, 0),
};

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

import '../../../packages/learn-card-base/src/assets/styles/modal.scss';
import './preview.css';

setupIonicReact({ swipeBackEnabled: false });

/**
 * `Modals` portals into `#modal-mid-root` by looking it up with
 * `document.getElementById` during render, so the div must already exist in
 * the DOM before `<Modals />` ever renders (the real app guarantees this by
 * mounting the div ahead of `<Modals />` via its `initLoading` gate). Creating
 * it here, once, at module load — outside the React tree — sidesteps the
 * render/commit ordering problem entirely.
 */
if (typeof document !== 'undefined' && !document.getElementById('modal-mid-root')) {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-mid-root';
    document.body.appendChild(modalRoot);
}

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
        layout: 'fullscreen',
        chromatic: {
            diffThreshold: 0.1,
            diffIncludeAntiAliasing: false,
        },
        backgrounds: {
            default: 'app',
            values: [
                { name: 'app', value: '#EFF0F5' },
                { name: 'white', value: '#FFFFFF' },
            ],
        },
    },
    decorators: [
        Story => (
            <IonApp>
                <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
                    <LocaleProvider>
                        <AnalyticsContextProvider>
                            <QueryClientProvider client={queryClient}>
                                <MemoryRouter>
                                    <ModalsProvider>
                                        <div className="font-poppins bg-grayscale-100 h-screen overflow-y-auto">
                                            <Story />
                                        </div>
                                        <Modals />
                                    </ModalsProvider>
                                </MemoryRouter>
                            </QueryClientProvider>
                        </AnalyticsContextProvider>
                    </LocaleProvider>
                </TenantConfigProvider>
            </IonApp>
        ),
    ],
};

export default preview;
