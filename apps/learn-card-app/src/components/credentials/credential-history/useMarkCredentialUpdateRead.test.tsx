// @vitest-environment jsdom

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LCR } from 'learn-card-base/types/credential-records';

const walletHost = vi.hoisted(() => ({
    get: vi.fn(),
    update: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: vi.fn() }),
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { get: walletHost.get, update: walletHost.update } },
        }),
    }),
}));

import { useMarkCredentialUpdateRead } from './useMarkCredentialUpdateRead';

const makeRecord = (overrides: Partial<LCR> = {}): LCR =>
    ({
        id: 'record-1',
        uri: 'lc:cloud:version-2',
        category: 'Achievement',
        refresh: {
            serviceId: 'https://example.com/refresh/abc',
            serviceType: '1EdTechCredentialRefresh',
            credentialId: 'urn:uuid:credential-1',
            managedVersion: 2,
            unreadUpdate: true,
            history: [],
        },
        ...overrides,
    }) as LCR;

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useMarkCredentialUpdateRead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        walletHost.update.mockResolvedValue(true);
    });

    it('does not clear a newer version that arrived after the rendered record', async () => {
        const renderedRecord = makeRecord();
        const newerRecord = makeRecord({
            uri: 'lc:cloud:version-3',
            refresh: {
                ...renderedRecord.refresh!,
                managedVersion: 3,
                etag: 'version-3',
                history: [{ uri: renderedRecord.uri, capturedAt: '2026-09-03T00:00:00Z' }],
            },
        });
        walletHost.get.mockResolvedValue([newerRecord]);

        const { result } = renderHook(() => useMarkCredentialUpdateRead(renderedRecord), {
            wrapper,
        });

        let markedRead = true;
        await act(async () => {
            markedRead = await result.current();
        });

        expect(markedRead).toBe(false);
        expect(walletHost.update).not.toHaveBeenCalled();
    });

    it('clears only the current version while preserving freshly read metadata', async () => {
        const renderedRecord = makeRecord();
        const currentRecord = makeRecord({
            refresh: {
                ...renderedRecord.refresh!,
                etag: 'fresh-etag',
                lastCheckedAt: '2026-09-03T01:00:00Z',
            },
        });
        walletHost.get.mockResolvedValue([currentRecord]);

        const { result } = renderHook(() => useMarkCredentialUpdateRead(renderedRecord), {
            wrapper,
        });

        await act(async () => {
            expect(await result.current()).toBe(true);
        });

        expect(walletHost.update).toHaveBeenCalledWith('record-1', {
            refresh: { ...currentRecord.refresh, unreadUpdate: false },
        });
    });
});
