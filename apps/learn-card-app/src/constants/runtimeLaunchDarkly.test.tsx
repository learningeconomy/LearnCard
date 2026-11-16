import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LDProvider, useFlags } from 'launchdarkly-react-client-sdk';
import type { LDClient } from 'launchdarkly-js-client-sdk';
import { getLaunchDarklyConfig, getLaunchDarklyProviderProps } from './runtimeLaunchDarkly';

const { ldInitialize } = vi.hoisted(() => ({ ldInitialize: vi.fn() }));

vi.mock('launchdarkly-js-client-sdk', async importOriginal => ({
    ...(await importOriginal<typeof import('launchdarkly-js-client-sdk')>()),
    initialize: ldInitialize,
}));

const launchDarklyEnvironment = vi.hoisted(() => ({
    clientSideIdOverride: undefined as string | undefined,
}));

vi.mock('../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: () => ({
        observability: { launchDarklyClientId: 'test-client' },
    }),
}));

vi.mock('../config/environment', () => ({
    environment: {
        get VITE_LAUNCHDARKLY_CLIENT_ID() {
            return launchDarklyEnvironment.clientSideIdOverride;
        },
    },
}));

afterEach(() => {
    cleanup();
    ldInitialize.mockReset();
    vi.useRealTimers();
    launchDarklyEnvironment.clientSideIdOverride = undefined;
});

it('uses the tenant LaunchDarkly client ID by default', () => {
    expect(getLaunchDarklyConfig().clientSideID).toBe('test-client');
});

it('uses the LaunchDarkly client ID override when configured', () => {
    launchDarklyEnvironment.clientSideIdOverride = 'local-test-client';

    expect(getLaunchDarklyConfig().clientSideID).toBe('local-test-client');
});

type FakeLaunchDarkly = {
    client: LDClient;
    emit: (event: string) => void;
    setFlags: (next: Record<string, unknown>) => void;
    resolveInitialization: () => void;
};

/** A client whose first flag response never arrives until the test says so. */
const createStalledClient = (): FakeLaunchDarkly => {
    const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    let flags: Record<string, unknown> = {};
    let resolveInitialization: () => void = () => {};
    const initialized = new Promise<void>(resolve => {
        resolveInitialization = resolve;
    });
    const client = {
        waitForInitialization: (seconds?: number) =>
            seconds === undefined
                ? initialized
                : Promise.race([
                      initialized,
                      new Promise((_, reject) => {
                          setTimeout(() => {
                              const error = new Error('Flag request timed out');
                              error.name = 'LaunchDarklyTimeoutError';
                              reject(error);
                          }, seconds * 1000);
                      }),
                  ]),
        allFlags: () => flags,
        variation: (_key: string, fallback: unknown) => fallback,
        on: (event: string, callback: (...args: unknown[]) => void) => {
            listeners.set(event, [...(listeners.get(event) ?? []), callback]);
        },
        off: (event: string) => listeners.delete(event),
    } as unknown as LDClient;

    return {
        client,
        emit: event => listeners.get(event)?.forEach(listener => listener()),
        setFlags: next => {
            flags = next;
        },
        resolveInitialization: () => resolveInitialization(),
    };
};

const FlagContent = () => {
    const { enableLearnCardAssistant } = useFlags();
    return <div>{enableLearnCardAssistant ? 'Assistant on' : 'Assistant off'}</div>;
};

it('uses a localStorage bootstrap, never an object bootstrap', () => {
    expect(getLaunchDarklyProviderProps().options?.bootstrap).toBe('localStorage');
});

it('renders on the first frame with default flags while LaunchDarkly stalls', async () => {
    vi.useFakeTimers();
    const launchDarkly = createStalledClient();
    ldInitialize.mockReturnValue(launchDarkly.client);

    render(
        <LDProvider {...getLaunchDarklyProviderProps()}>
            <FlagContent />
        </LDProvider>
    );

    // Synchronously visible: no wait on the flag request at all.
    expect(screen.getByText('Assistant off')).toBeTruthy();

    // The 3 s timeout passes with the app still usable on defaults.
    await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('Assistant off')).toBeTruthy();
    expect(ldInitialize).toHaveBeenCalledWith(
        'test-client',
        expect.objectContaining({ key: 'anonymous' }),
        expect.objectContaining({ bootstrap: 'localStorage' })
    );

    // Live flags arrive late and apply without a remount.
    act(() => {
        launchDarkly.setFlags({ enableLearnCardAssistant: true });
        launchDarkly.emit('ready');
    });
    expect(screen.getByText('Assistant on')).toBeTruthy();
});

it('applies live flags as soon as LaunchDarkly initializes', async () => {
    const launchDarkly = createStalledClient();
    ldInitialize.mockReturnValue(launchDarkly.client);

    render(
        <LDProvider {...getLaunchDarklyProviderProps()}>
            <FlagContent />
        </LDProvider>
    );
    expect(screen.getByText('Assistant off')).toBeTruthy();

    await act(async () => {
        launchDarkly.setFlags({ enableLearnCardAssistant: true });
        launchDarkly.resolveInitialization();
    });
    expect(screen.getByText('Assistant on')).toBeTruthy();
});
