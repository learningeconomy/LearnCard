import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import AppUrlListener from './AppUrlListener';

const state = vi.hoisted(() => ({
    listener: undefined as undefined | ((event: { url: string }) => void),
    launch: undefined as undefined | { url: string },
    remove: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn(async (_name: string, callback: (event: { url: string }) => void) => {
            state.listener = callback;
            return { remove: state.remove };
        }),
        getLaunchUrl: vi.fn(async () => state.launch),
    },
}));
vi.mock('../../hooks/resolveTenantParseConfig', () => ({
    resolveTenantParseConfig: () => ({ httpsDomains: ['tenant.example'] }),
}));
vi.mock('learn-card-base', () => ({ getLogger: () => ({ error: vi.fn(), warn: vi.fn() }) }));
vi.mock('../share-links/sharePrivacy', () => ({ enterSharePrivacy: vi.fn() }));
beforeEach(() => {
    state.listener = undefined;
    state.launch = undefined;
    state.remove.mockClear();
});
afterEach(cleanup);

it('routes cold tenant message links before claim-like query parameters', async () => {
    state.launch = { url: 'https://tenant.example/m/welcome?boostUri=x&challenge=y' };
    const history = createMemoryHistory();
    const view = render(
        <Router history={history}>
            <AppUrlListener />
        </Router>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/m/welcome'));
    expect(history.location.search).toBe('');
    view.unmount();
    expect(state.remove).toHaveBeenCalledOnce();
});

it('accepts warm tenant links, rejects other origins and ignores callbacks after unmount', async () => {
    const history = createMemoryHistory();
    const view = render(
        <Router history={history}>
            <AppUrlListener />
        </Router>
    );
    await waitFor(() => expect(state.listener).toBeDefined());
    act(() => state.listener?.({ url: 'https://evil.example/m/private' }));
    expect(history.location.pathname).toBe('/');
    act(() => state.listener?.({ url: 'https://tenant.example/m/welcome' }));
    expect(history.location.pathname).toBe('/m/welcome');
    view.unmount();
    state.listener?.({ url: 'https://tenant.example/m/late' });
    expect(history.location.pathname).toBe('/m/welcome');
});
