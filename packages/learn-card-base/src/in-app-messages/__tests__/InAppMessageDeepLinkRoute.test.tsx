// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { afterEach, expect, it, vi } from 'vitest';
import { InAppMessageDeepLinkRoute } from '../InAppMessageDeepLinkRoute';
import { isSafeInAppMessageAuthRedirect, resumeAuthRedirect } from '../authRedirectHistory';
import {
    clearInAppMessageRequest,
    getInAppMessageRequest,
    requestInAppMessage,
} from '../deepLinkRequestStore';

vi.mock('../../config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ homeRoute: '/campfire' }),
}));
afterEach(() => {
    cleanup();
    clearInAppMessageRequest();
});

it('requests the message once and replaces the transient route with branded home', async () => {
    const history = createMemoryHistory({
        initialEntries: ['/previous', '/m/welcome'],
        initialIndex: 1,
    });
    render(
        <React.StrictMode>
            <Router history={history}>
                <Route path="/m/:messageId" component={InAppMessageDeepLinkRoute} />
            </Router>
        </React.StrictMode>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/campfire'));
    expect(getInAppMessageRequest()?.messageId).toBe('welcome');
    history.goBack();
    expect(history.location.pathname).toBe('/previous');
});

it('decodes an encoded message ID before requesting it', async () => {
    const history = createMemoryHistory({ initialEntries: ['/m/guide%2Fintro'] });
    render(
        <Router history={history}>
            <Route path="/m/:messageId" component={InAppMessageDeepLinkRoute} />
        </Router>
    );
    await waitFor(() => expect(getInAppMessageRequest()?.messageId).toBe('guide/intro'));
});

it('replaces the signed-out login handoff so Back cannot request a dismissed message again', () => {
    const history = createMemoryHistory({
        initialEntries: ['/previous', '/m/welcome'],
        initialIndex: 1,
    });

    history.replace('/login?redirectTo=%2Fm%2Fwelcome');
    resumeAuthRedirect(history, '/m/welcome');
    expect(history.location.pathname).toBe('/m/welcome');

    requestInAppMessage('welcome');
    expect(getInAppMessageRequest()?.messageId).toBe('welcome');
    clearInAppMessageRequest();
    history.replace('/campfire');
    history.goBack();

    expect(history.location.pathname).toBe('/previous');
    expect(getInAppMessageRequest()).toBeNull();
});

it('preserves push navigation for redirects outside safe message links', () => {
    const history = createMemoryHistory({ initialEntries: ['/login'] });

    resumeAuthRedirect(history, '/notifications');
    expect(history.location.pathname).toBe('/notifications');
    history.goBack();
    expect(history.location.pathname).toBe('/login');

    expect(isSafeInAppMessageAuthRedirect('/m/welcome')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/guide%2Fintro')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/../wallet')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('//m/welcome')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/wallet')).toBe(false);
});
