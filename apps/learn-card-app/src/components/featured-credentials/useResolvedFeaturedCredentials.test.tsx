import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import type { VC } from '@learncard/types';

type ResolveResult = { uri: string; data?: VC; isPending: boolean; isError: boolean };

const mocks = vi.hoisted(() => ({
    useResolveBoosts: vi.fn<(uris: string[]) => ResolveResult[]>(() => []),
}));

vi.mock('learn-card-base', () => ({ useResolveBoosts: mocks.useResolveBoosts }));

import { useResolvedFeaturedCredentials } from './useResolvedFeaturedCredentials';

const credential = (name: string): VC => ({ name }) as unknown as VC;

const resolved = (uri: string, data: VC): ResolveResult => ({
    uri,
    data,
    isPending: false,
    isError: false,
});
const failed = (uri: string): ResolveResult => ({ uri, isPending: false, isError: true });
const pending = (uri: string): ResolveResult => ({ uri, isPending: true, isError: false });

beforeEach(() => {
    mocks.useResolveBoosts.mockReset();
    mocks.useResolveBoosts.mockReturnValue([]);
});
afterEach(cleanup);

describe('useResolvedFeaturedCredentials', () => {
    it('resolves nothing for a profile without featured credentials', () => {
        const { result } = renderHook(() => useResolvedFeaturedCredentials(undefined));

        expect(mocks.useResolveBoosts).toHaveBeenCalledWith([]);
        expect(result.current).toEqual({ credentials: [], isResolving: false });
    });

    it('only resolves the stored selection, once per URI, in the owner order', () => {
        renderHook(() =>
            useResolvedFeaturedCredentials(['lc:boost:b', 'lc:boost:a', 'lc:boost:b'])
        );

        expect(mocks.useResolveBoosts).toHaveBeenCalledWith(['lc:boost:b', 'lc:boost:a']);
    });

    it('returns resolved credentials in the stored order and omits failures', () => {
        mocks.useResolveBoosts.mockReturnValue([
            resolved('lc:boost:b', credential('Second')),
            failed('lc:boost:missing'),
            resolved('lc:boost:a', credential('First')),
        ]);

        const { result } = renderHook(() =>
            useResolvedFeaturedCredentials(['lc:boost:b', 'lc:boost:missing', 'lc:boost:a'])
        );

        expect(result.current.credentials.map(item => item.uri)).toEqual([
            'lc:boost:b',
            'lc:boost:a',
        ]);
        expect(result.current.credentials.map(item => item.credential.name)).toEqual([
            'Second',
            'First',
        ]);
        expect(result.current.isResolving).toBe(false);
    });

    it('reports in-flight resolution without exposing unresolved entries', () => {
        mocks.useResolveBoosts.mockReturnValue([
            pending('lc:boost:slow'),
            resolved('lc:boost:a', credential('First')),
        ]);

        const { result } = renderHook(() =>
            useResolvedFeaturedCredentials(['lc:boost:slow', 'lc:boost:a'])
        );

        expect(result.current.credentials.map(item => item.uri)).toEqual(['lc:boost:a']);
        expect(result.current.isResolving).toBe(true);
    });
});
