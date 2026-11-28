// @vitest-environment jsdom
import React, { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { createTestHistory, TestRouter } from '../../test-utils/testRouter';
import { afterEach, expect, it, vi } from 'vitest';
import { InAppMessageDeepLinkRoute } from '../InAppMessageDeepLinkRoute';
import {
    getInAppMessageEntryPath,
    isSafeInAppMessageAuthRedirect,
    resumeAuthRedirect,
} from '../authRedirectHistory';
import {
    clearInAppMessageRequest,
    getInAppMessageRequest,
    useInAppMessageRequest,
} from '../deepLinkRequestStore';

const branding = vi.hoisted(() => ({ homeRoute: '/campfire' }));
vi.mock('../../config/TenantConfigProvider', () => ({
    useBrandingConfig: () => branding,
}));
afterEach(() => {
    cleanup();
    clearInAppMessageRequest();
    branding.homeRoute = '/campfire';
    window.history.replaceState(null, '', '/');
});

const MessageRoute = () => (
    <Routes>
        <Route path="/m/:messageId" element={<InAppMessageDeepLinkRoute />} />
        <Route path="*" element={null} />
    </Routes>
);

it('requests the message once and replaces the transient route with branded home', async () => {
    const history = createTestHistory({
        initialEntries: ['/previous', '/m/welcome'],
        initialIndex: 1,
    });
    render(
        <React.StrictMode>
            <TestRouter history={history}>
                <MessageRoute />
            </TestRouter>
        </React.StrictMode>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/campfire'));
    expect(getInAppMessageRequest()?.messageId).toBe('welcome');
    await act(() => history.goBack());
    expect(history.location.pathname).toBe('/previous');
});

it('decodes an encoded message ID before requesting it', async () => {
    const history = createTestHistory({ initialEntries: ['/m/guide%2Fintro'] });
    render(
        <TestRouter history={history}>
            <MessageRoute />
        </TestRouter>
    );
    await waitFor(() => expect(getInAppMessageRequest()?.messageId).toBe('guide/intro'));
});

const LoginHandoff = ({ signedIn, signIn }: { signedIn: boolean; signIn: () => void }) => {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const redirectTo = new URLSearchParams(location.search).get('redirectTo');
        if (signedIn && redirectTo) resumeAuthRedirect(navigate, redirectTo);
    }, [signedIn, navigate, location.search]);
    return <button onClick={signIn}>Sign in</button>;
};

const AuthenticatedMessageRoutes = () => {
    const [signedIn, setSignedIn] = useState(false);
    const location = useLocation();
    const request = useInAppMessageRequest();
    return (
        <Routes>
            <Route
                path="/m/:messageId"
                element={
                    signedIn ? (
                        <InAppMessageDeepLinkRoute />
                    ) : (
                        <Navigate
                            replace
                            to={`/login?redirectTo=${encodeURIComponent(getInAppMessageEntryPath(location.pathname))}`}
                        />
                    )
                }
            />
            <Route
                path="/login"
                element={<LoginHandoff signedIn={signedIn} signIn={() => setSignedIn(true)} />}
            />
            <Route
                path={branding.homeRoute}
                element={
                    request && (
                        <button onClick={() => clearInAppMessageRequest()}>Dismiss message</button>
                    )
                }
            />
            <Route path="/previous" element="Previous page" />
        </Routes>
    );
};

it.each([
    ['LearnCard', '/dashboard', '/m/welcome'],
    ['LearnCard', '/dashboard', '/m/welcome/'],
    ['ScoutPass', '/campfire', '/m/welcome'],
    ['ScoutPass', '/campfire', '/m/welcome/'],
])('%s resumes %s from %s without reopening a dismissed message on Back', async (_, home, path) => {
    branding.homeRoute = home;
    const history = createTestHistory({ initialEntries: ['/previous', path], initialIndex: 1 });
    render(
        <TestRouter history={history}>
            <AuthenticatedMessageRoutes />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/login'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(history.location.pathname).toBe(home));
    expect(getInAppMessageRequest()?.messageId).toBe('welcome');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    // Login and the message route were replaced: Back skips straight to the previous page.
    await act(() => history.goBack());
    expect(screen.getByText('Previous page')).toBeTruthy();
    expect(getInAppMessageRequest()).toBeNull();
    expect(history.entries.every(entry => !entry.startsWith('PUSH'))).toBe(true);
});

it.each([
    'guide/intro',
    'discount%off',
    'literal%2Fvalue',
    'literal%25value',
    'hello world',
    'café',
    'section?#',
])('decodes %s exactly once for initial browser entry and in-app navigation', async messageId => {
    const path = `/m/${encodeURIComponent(messageId)}`;
    window.history.replaceState(null, '', path);
    const history = createTestHistory({ browser: true });
    render(
        <TestRouter history={history}>
            <MessageRoute />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/campfire'));
    expect(getInAppMessageRequest()?.messageId).toBe(messageId);
    clearInAppMessageRequest();
    await act(() => history.push(path));
    await waitFor(() => expect(history.location.pathname).toBe('/campfire'));
    expect(getInAppMessageRequest()?.messageId).toBe(messageId);
});

it.each([
    ['/dashboard', 'discount%off'],
    ['/dashboard', 'guide/intro'],
    ['/dashboard', 'literal%2Fvalue'],
    ['/campfire', 'discount%off'],
    ['/campfire', 'guide/intro'],
    ['/campfire', 'literal%2Fvalue'],
])('preserves %s message entry for %s through login and Back', async (home, messageId) => {
    branding.homeRoute = home;
    window.history.replaceState(null, '', '/previous');
    window.history.pushState(null, '', `/m/${encodeURIComponent(messageId)}/?source=email#intro`);
    const history = createTestHistory({ browser: true });
    render(
        <TestRouter history={history}>
            <AuthenticatedMessageRoutes />
        </TestRouter>
    );
    await waitFor(() => expect(history.location.pathname).toBe('/login'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(history.location.pathname).toBe(home));
    expect(getInAppMessageRequest()?.messageId).toBe(messageId);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    await act(() => history.goBack());
    await waitFor(() => expect(history.location.pathname).toBe('/previous'));
    expect(getInAppMessageRequest()).toBeNull();
});

it('preserves push navigation for redirects outside safe message links', async () => {
    const history = createTestHistory({ initialEntries: ['/login'] });

    await act(async () => resumeAuthRedirect(history.router.navigate, '/notifications'));
    await waitFor(() => expect(history.location.pathname).toBe('/notifications'));
    expect(history.action).toBe('PUSH');
    await act(() => history.goBack());
    expect(history.location.pathname).toBe('/login');

    expect(isSafeInAppMessageAuthRedirect('/m/welcome')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/welcome/')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/guide%2Fintro')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/discount%25off/')).toBe(true);
    expect(isSafeInAppMessageAuthRedirect('/m/welcome//')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/m/%2e%2e/')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/m/welcome\\')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/m/invalid%')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/m/../wallet')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('//m/welcome')).toBe(false);
    expect(isSafeInAppMessageAuthRedirect('/wallet')).toBe(false);
});
