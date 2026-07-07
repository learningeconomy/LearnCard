import React from 'react';
import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp, setupIonicReact } from '@ionic/react';
import {
    ModalsProvider,
    TenantConfigProvider,
    DEFAULT_LEARNCARD_TENANT_CONFIG,
} from 'learn-card-base';
import { Buffer } from 'buffer';

(window as any).Buffer = (window as any).Buffer ?? Buffer;
(window as any).global = (window as any).global ?? window;
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

import './preview.css';

setupIonicReact({ swipeBackEnabled: false });

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
        Story =>
            React.createElement(
                IonApp,
                null,
                React.createElement(
                    TenantConfigProvider,
                    { config: DEFAULT_LEARNCARD_TENANT_CONFIG },
                    React.createElement(
                        QueryClientProvider,
                        { client: queryClient },
                        React.createElement(
                            MemoryRouter,
                            null,
                            React.createElement(
                                ModalsProvider,
                                null,
                                React.createElement(
                                    'div',
                                    {
                                        className:
                                            'font-poppins bg-grayscale-100 h-screen overflow-y-auto',
                                    },
                                    React.createElement(Story)
                                )
                            )
                        )
                    )
                )
            ),
    ],
};

export default preview;
