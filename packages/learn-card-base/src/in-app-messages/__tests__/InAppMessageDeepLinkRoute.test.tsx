// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { afterEach, expect, it, vi } from 'vitest';
import { InAppMessageDeepLinkRoute } from '../InAppMessageDeepLinkRoute';
import { clearInAppMessageRequest, getInAppMessageRequest } from '../deepLinkRequestStore';

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
