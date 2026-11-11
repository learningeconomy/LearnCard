// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { useInAppMessageActions } from '../useInAppMessageActions';
import { MessageNavigationContext } from '../MessageNavigationContext';
import {
    clearInAppMessageRequest,
    getInAppMessageRequest,
    requestInAppMessage,
} from '../deepLinkRequestStore';
import { parseIframeMessage } from '../iframeBridge';

vi.mock('../../config/TenantConfigProvider', () => ({ useLinksConfig: () => ({}) }));
afterEach(() => {
    cleanup();
    clearInAppMessageRequest();
});

it('only opens apps when the consuming app supplies navigation, with runtime validation', async () => {
    const openApp = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>
            <MessageNavigationContext.Provider value={{ openApp }}>
                {children}
            </MessageNavigationContext.Provider>
        </MemoryRouter>
    );
    const { result } = renderHook(useInAppMessageActions, { wrapper });
    expect(
        await result.current.runAction({ type: 'openApp', listingId: 'app', path: '//evil.test' })
    ).toBe('noop');
    expect(openApp).not.toHaveBeenCalled();
    expect(
        await result.current.runAction({ type: 'openApp', listingId: 'app', path: '/course' })
    ).toBe('closed');
    expect(openApp).toHaveBeenCalledWith('app', '/course');
    const scouts = renderHook(useInAppMessageActions, { wrapper: MemoryRouter });
    expect(await scouts.result.current.runAction({ type: 'openApp', listingId: 'app' })).toBe(
        'noop'
    );
});

it('requests another message and ignores a stale close token', async () => {
    requestInAppMessage('first');
    const old = getInAppMessageRequest()!;
    const { result } = renderHook(useInAppMessageActions, { wrapper: MemoryRouter });
    await act(async () =>
        expect(await result.current.runAction({ type: 'openMessage', messageId: 'next' })).toBe(
            'closed'
        )
    );
    clearInAppMessageRequest(old.token);
    expect(getInAppMessageRequest()?.messageId).toBe('next');
});

it.each([
    { type: 'openMessage', messageId: 'private' },
    { type: 'openApp', listingId: 'app' },
])('denies the new privileged action at the iframe boundary: $type', action => {
    const event = new MessageEvent('message', {
        source: window,
        origin: 'https://partner.test',
        data: { type: 'LC_IN_APP_MESSAGE', event: 'runAction', action },
    });
    expect(parseIframeMessage(event, window, 'https://partner.test')).toBeNull();
});
