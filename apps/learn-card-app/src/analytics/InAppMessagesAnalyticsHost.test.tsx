import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { InAppMessageHostProps, InAppMessagePresentationEvent } from 'learn-card-base';
import { InAppMessagesAnalyticsHost } from './InAppMessagesAnalyticsHost';

const state = vi.hoisted(() => ({
    track: vi.fn(),
    onEvent: undefined as InAppMessageHostProps['onEvent'],
}));
vi.mock('learn-card-base', () => ({
    InAppMessageHost: (props: InAppMessageHostProps) => {
        state.onEvent = props.onEvent;
        return null;
    },
}));
vi.mock('./context', () => ({ useAnalytics: () => ({ track: state.track }) }));
afterEach(() => {
    cleanup();
    state.track.mockClear();
});

it('forwards only allowlisted metadata and excludes previews', () => {
    render(<InAppMessagesAnalyticsHost />);
    const event: InAppMessagePresentationEvent & { credential: string; url: string } = {
        type: 'action',
        messageId: 'intro',
        presentation: 'story',
        source: 'flag',
        actionIndex: 0,
        actionType: 'dismiss',
        stepIndex: 1,
        credential: 'private',
        url: 'private',
    };
    state.onEvent?.(event);
    expect(state.track).toHaveBeenCalledWith('in_app_message_action', {
        messageId: 'intro',
        presentation: 'story',
        source: 'flag',
        actionIndex: 0,
        actionType: 'dismiss',
        stepIndex: 1,
    });
    state.onEvent?.({ ...event, source: 'override' });
    expect(state.track).toHaveBeenCalledOnce();
});
