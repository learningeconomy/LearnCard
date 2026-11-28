import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';

import { createTestHistory, TestRouter } from 'learn-card-base/test-utils/testRouter';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import AppUrlListener, { resetRoutedClassLinkLaunchUrls } from './AppUrlListener';
import {
    isClassLinkNativeSessionInFlight,
    setClassLinkNativeSessionInFlight,
} from '../../auth/classlink/classlinkPkce';

const state = vi.hoisted(() => ({
    listener: undefined as undefined | ((event: { url: string }) => void),
    launch: undefined as undefined | { url: string },
    /** Simulates Capacitor's retainUntilConsumed `appUrlOpen` replay on a cold start. */
    retained: undefined as undefined | { url: string },
    remove: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn(async (_name: string, callback: (event: { url: string }) => void) => {
            state.listener = callback;
            const retained = state.retained;
            state.retained = undefined;
            if (retained) callback(retained);
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
vi.mock('../../config/tenantConfigState', () => ({
    getResolvedTenantConfig: () => ({ native: { bundleId: 'com.learncard.app' } }),
}));
beforeEach(() => {
    resetRoutedClassLinkLaunchUrls();
    state.listener = undefined;
    state.launch = undefined;
    state.retained = undefined;
    state.remove.mockClear();
    while (isClassLinkNativeSessionInFlight()) setClassLinkNativeSessionInFlight(false);
});
afterEach(cleanup);

it('routes cold tenant message links before claim-like query parameters', async () => {
    state.launch = { url: 'https://tenant.example/m/welcome?boostUri=x&challenge=y' };
    const history = createTestHistory();
    const view = render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/m/welcome'));
    expect(history.location.search).toBe('');
    view.unmount();
    expect(state.remove).toHaveBeenCalledOnce();
});

it('accepts warm tenant links, rejects other origins and ignores callbacks after unmount', async () => {
    const history = createTestHistory();
    const view = render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
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

it.each(['guide/intro', 'discount%off', 'literal%2Fvalue'])(
    'preserves the encoded message ID %s for the shared route decoder',
    async messageId => {
        const path = `/m/${encodeURIComponent(messageId)}/`;
        state.launch = { url: `https://tenant.example${path}` };
        const history = createTestHistory();
        render(
            <TestRouter history={history}>
                <AppUrlListener />
            </TestRouter>
        );
        await waitFor(() => expect(history.location.pathname).toBe(path));
        act(() => state.listener?.({ url: `https://tenant.example${path}` }));
        expect(history.location.pathname).toBe(path);
    }
);

const CLASSLINK_LAUNCH = 'com.learncard.app://auth/classlink/callback?code=x&state=y';

it('routes a cold-start ClassLink callback to the callback route once', async () => {
    state.launch = { url: CLASSLINK_LAUNCH };
    const history = createTestHistory();
    const first = render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/auth/classlink/callback'));
    expect(history.location.search).toBe('?code=x&state=y');
    first.unmount();

    // A remount in the same JS context must not replay the consumed callback.
    await act(() => history.replace('/wallet'));
    render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(state.listener).toBeDefined());
    await act(async () => undefined);
    expect(history.location.pathname).toBe('/wallet');
});

it('routes a retained cold-start ClassLink appUrlOpen event once, not again from the launch URL', async () => {
    // Real cold start: Capacitor replays the callback to the first listener AND getLaunchUrl
    // returns the same URL.
    state.retained = { url: CLASSLINK_LAUNCH };
    state.launch = { url: CLASSLINK_LAUNCH };
    const history = createTestHistory();
    render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/auth/classlink/callback'));
    expect(history.location.search).toBe('?code=x&state=y');
    await act(async () => undefined);
    // A duplicate delivery of the same URL is not routed again.
    act(() => state.listener?.({ url: CLASSLINK_LAUNCH }));
    expect(history.entries).toEqual(['REPLACE /auth/classlink/callback?code=x&state=y']);
});

it('leaves ClassLink callbacks to an in-flight native auth session', async () => {
    setClassLinkNativeSessionInFlight(true);
    const history = createTestHistory();
    render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(state.listener).toBeDefined());
    act(() => state.listener?.({ url: CLASSLINK_LAUNCH }));
    expect(history.location.pathname).toBe('/');
});

it('ignores other custom-scheme paths on the bundle ID', async () => {
    state.launch = { url: 'com.learncard.app://auth/classlink/callbackX?code=x' };
    const history = createTestHistory();
    render(
        <TestRouter history={history}>
            <AppUrlListener />
        </TestRouter>
    );
    await waitFor(() => expect(state.listener).toBeDefined());
    await act(async () => undefined);
    expect(history.location.pathname).toBe('/');
});
