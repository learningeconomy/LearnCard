// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { afterEach, expect, it, vi } from 'vitest';
import AppUrlListener from './AppUrlListener';

const state = vi.hoisted(() => ({
    callback: undefined as undefined | ((event: { url: string }) => void),
    remove: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn(async (_name: string, callback: (event: { url: string }) => void) => {
            state.callback = callback;
            return { remove: state.remove };
        }),
        getLaunchUrl: vi.fn(async () => ({ url: 'https://scout.example/m/welcome' })),
    },
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://scout.example',
}));
vi.mock('learn-card-base', () => ({ getLogger: () => ({ error: vi.fn(), warn: vi.fn() }) }));
afterEach(() => {
    cleanup();
    state.remove.mockClear();
});

it('handles cold and warm message links on the configured ScoutPass origin', async () => {
    const history = createMemoryHistory();
    const view = render(
        <Router history={history}>
            <AppUrlListener />
        </Router>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/m/welcome'));
    state.callback?.({ url: 'https://scout.example/m/next' });
    expect(history.location.pathname).toBe('/m/next');
    state.callback?.({ url: 'https://evil.example/m/private' });
    expect(history.location.pathname).toBe('/m/next');
    view.unmount();
    expect(state.remove).toHaveBeenCalledOnce();
    state.callback?.({ url: 'https://scout.example/m/late' });
    expect(history.location.pathname).toBe('/m/next');
});
