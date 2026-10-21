// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import App from './App';
import { LocaleProvider, useChangeLocale } from './i18n';
import { setLocale } from './paraglide/runtime.js';

const { fullAppRenderCount } = vi.hoisted(() => ({ fullAppRenderCount: { value: 0 } }));

vi.mock('@sentry/react', () => ({
    withProfiler: <T,>(component: T): T => component,
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@ionic/react', () => ({
    IonApp: ({ children }: { children: React.ReactNode }) => children,
    setupIonicReact: vi.fn(),
}));

vi.mock('@ionic/react-router', () => ({
    IonReactRouter: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('learn-card-base', () => ({
    SCOUTPASS_API_ENDPOINT: '',
    SCOUTPASS_NETWORK_URL: '',
    SCOUTCLOUD_URL: '',
    lazyWithRetry: () => () => {
        fullAppRenderCount.value += 1;

        return null;
    },
    networkStore: {
        set: {
            apiEndpoint: vi.fn(),
            cloudUrl: vi.fn(),
            networkUrl: vi.fn(),
        },
    },
    useIsLoggedIn: () => true,
}));

vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    default: { get: { introSlidesCompleted: () => true } },
    useIntroSlidesCompleted: vi.fn(),
}));

vi.mock('./components/intro-slides/IntroSlides', () => ({ default: () => null }));
vi.mock('./i18n/useLanguageSelectorConfig', () => ({ useEnforceVisibleLocale: vi.fn() }));
vi.mock('./pages/login/LoginPageLoader/LoginLoader', () => ({ default: () => null }));

const LocaleSwitch: React.FC = () => {
    const changeLocale = useChangeLocale();

    return <button onClick={() => changeLocale('ar')}>Switch locale</button>;
};

beforeEach(() => {
    localStorage.clear();
    setLocale('en', { reload: false });
    fullAppRenderCount.value = 0;
});

afterEach(() => {
    cleanup();
    setLocale('en', { reload: false });
});

test('rerenders the application subtree when the locale changes', () => {
    render(
        <LocaleProvider>
            <App />
            <LocaleSwitch />
        </LocaleProvider>
    );

    expect(fullAppRenderCount.value).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Switch locale' }));

    expect(fullAppRenderCount.value).toBe(2);
});
