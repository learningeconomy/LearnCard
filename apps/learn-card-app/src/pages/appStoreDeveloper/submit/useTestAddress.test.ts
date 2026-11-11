import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { readTestAddress, writeTestAddress } from './testAddress';
import { useTestAddress } from './useTestAddress';

describe('useTestAddress', () => {
    beforeEach(() => localStorage.clear());

    it('only reports a test address while it is switched on', () => {
        const { result } = renderHook(() => useTestAddress('listing-1'));
        expect(result.current.activeTestAddress).toBeNull();

        act(() => result.current.saveTest({ address: 'http://localhost:5173', enabled: true }));
        expect(result.current.activeTestAddress).toBe('http://localhost:5173');
        expect(readTestAddress('listing-1').enabled).toBe(true);

        act(() => result.current.saveTest({ address: 'http://localhost:5173', enabled: false }));
        expect(result.current.activeTestAddress).toBeNull();
    });

    it('carries a draft app’s test address over once it gets a listing', () => {
        const { result, rerender } = renderHook(({ key }) => useTestAddress(key), {
            initialProps: { key: 'app:http://localhost:5173/' as string | null },
        });

        act(() => result.current.saveTest({ address: 'http://localhost:4000', enabled: true }));
        rerender({ key: 'listing-2' });

        expect(result.current.activeTestAddress).toBe('http://localhost:4000');
        expect(readTestAddress('listing-2')).toEqual({
            address: 'http://localhost:4000',
            enabled: true,
        });
    });

    it('prefers the address already saved for the listing', () => {
        writeTestAddress('listing-3', { address: 'https://preview.example.com', enabled: true });
        const { result, rerender } = renderHook(({ key }) => useTestAddress(key), {
            initialProps: { key: 'app:x' as string | null },
        });

        act(() => result.current.saveTest({ address: 'http://localhost:4000', enabled: true }));
        rerender({ key: 'listing-3' });

        expect(result.current.activeTestAddress).toBe('https://preview.example.com');
    });
});
