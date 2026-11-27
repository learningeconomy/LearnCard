import React from 'react';
import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';
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

import 'learn-card-base/ui/global/core.css';
import 'learn-card-base/ui/global/normalize.css';
import 'learn-card-base/ui/global/structure.css';
import 'learn-card-base/ui/global/typography.css';

// Keep the renderer and host stylesheet order aligned with App.tsx.
import '@learncard/react/main.css';
import '../src/tailwind.css';
import '../src/index.scss';
import './preview.css';

initAppPlatform();

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
            options: {
                app: { name: 'app', value: '#EFF0F5' },
                white: { name: 'white', value: '#FFFFFF' },
            },
        },
    },

    decorators: [
        Story => (
            <AppRoot>
                <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
                    <LocaleProvider>
                        <QueryClientProvider client={queryClient}>
                            <AnalyticsContextProvider>
                                <MemoryRouter>
                                    <ModalsProvider>
                                        <div className="font-poppins bg-grayscale-100 h-screen overflow-y-auto">
                                            <Story />
                                        </div>
                                        <Modals />
                                    </ModalsProvider>
                                </MemoryRouter>
                            </AnalyticsContextProvider>
                        </QueryClientProvider>
                    </LocaleProvider>
                </TenantConfigProvider>
            </AppRoot>
        ),
    ],

    initialGlobals: {
        backgrounds: {
            value: 'app',
        },
    },
};

export default preview;
