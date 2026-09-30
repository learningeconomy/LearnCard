// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ status: 'offline' as 'offline' | 'unknown' | 'online' }));
vi.mock('../stores/connectivityStore', () => ({
    connectivityStore: { use: { status: () => state.status } },
}));

import { useOnReconnect } from './useConnectivity';

beforeEach(() => {
    state.status = 'offline';
});

it('reconnects once through unknown and uses the latest callback', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(({ callback }) => useOnReconnect(callback), {
        initialProps: { callback: first },
    });
    state.status = 'unknown';
    rerender({ callback: latest });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    state.status = 'online';
    rerender({ callback: latest });
    expect(latest).toHaveBeenCalledTimes(1);
    state.status = 'offline';
    rerender({ callback: latest });
    state.status = 'online';
    rerender({ callback: latest });
    expect(latest).toHaveBeenCalledTimes(2);
});
