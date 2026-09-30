import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { asyncWithLDProvider, useFlags } from 'launchdarkly-react-client-sdk';
import type { LDClient } from 'launchdarkly-js-client-sdk';
import { getLaunchDarklyConfig } from './runtimeLaunchDarkly';

vi.mock('../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: () => ({
        observability: { launchDarklyClientId: 'test-client' },
    }),
}));

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('mounts during stalled flag initialization and receives flags when the client recovers', async () => {
    vi.useFakeTimers();
    const listeners = new Map<string, (...args: unknown[]) => void>();
    let flags = {};
    const client = {
        waitForInitialization: (seconds?: number) =>
            new Promise((_, reject) => {
                if (seconds !== undefined) {
                    setTimeout(() => {
                        const error = new Error('Flag request timed out');
                        error.name = 'LaunchDarklyTimeoutError';
                        reject(error);
                    }, seconds * 1000);
                }
            }),
        allFlags: () => flags,
        variation: (_key: string, fallback: unknown) => fallback,
        on: (event: string, callback: (...args: unknown[]) => void) => {
            listeners.set(event, callback);
        },
        off: (event: string) => listeners.delete(event),
    } as unknown as LDClient;

    let mounted = false;
    const Content = () => {
        const { recovered } = useFlags();
        return <div>{recovered ? 'Flags recovered' : 'App available offline'}</div>;
    };
    const boot = asyncWithLDProvider({ ...getLaunchDarklyConfig(), ldClient: client }).then(
        Provider => {
            render(
                <Provider>
                    <Content />
                </Provider>
            );
            mounted = true;
        }
    );

    await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mounted).toBe(true);
    await boot;
    expect(screen.getByText('App available offline')).toBeTruthy();

    act(() => {
        flags = { recovered: true };
        listeners.get('ready')?.();
    });
    expect(screen.getByText('Flags recovered')).toBeTruthy();
});
