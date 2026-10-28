import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useSpreadsheetDialog } from './SpreadsheetDialog';

const modal = vi.hoisted(() => ({
    open: vi.fn((..._args: unknown[]) => ({ id: 1, generation: 1 })),
    close: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModalWithToken: modal.open, forceCloseModalByToken: modal.close }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
afterEach(() => vi.clearAllMocks());

it('keeps the opener stable while an open dialog receives current content', () => {
    const hook = renderHook(({ label }) => useSpreadsheetDialog(() => <p>{label}</p>), {
        initialProps: { label: 'Sending' },
    });
    const open = hook.result.current;
    act(() => open());
    render(modal.open.mock.lastCall?.[0] as React.ReactElement);
    expect(screen.getByText('Sending')).toBeVisible();

    hook.rerender({ label: 'All credentials sent' });
    expect(hook.result.current).toBe(open);
    expect(screen.getByText('All credentials sent')).toBeVisible();
    expect(modal.open).toHaveBeenCalledTimes(1);
    expect(modal.close).not.toHaveBeenCalled();

    hook.unmount();
    expect(modal.close).toHaveBeenCalledExactlyOnceWith({ id: 1, generation: 1 });
});
