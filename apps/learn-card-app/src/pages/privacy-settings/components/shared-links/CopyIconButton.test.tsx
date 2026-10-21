import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import CopyIconButton from './CopyIconButton';

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));
vi.mock('ionicons/icons', () => ({ copyOutline: 'copy', checkmark: 'check' }));

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('CopyIconButton', () => {
    it('morphs to a check after a successful copy, then settles back', async () => {
        vi.useFakeTimers();
        const onCopy = vi.fn(async () => true);
        render(<CopyIconButton label="Copy link for Career" onCopy={onCopy} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy link for Career' }));
        });
        expect(document.querySelector('[data-icon="check"]')).toBeTruthy();

        act(() => vi.advanceTimersByTime(1600));
        expect(document.querySelector('[data-icon="copy"]')).toBeTruthy();
    });

    it('stays on the copy icon when copying fails', async () => {
        const onCopy = vi.fn(async () => false);
        render(<CopyIconButton label="Copy" onCopy={onCopy} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        });
        expect(document.querySelector('[data-icon="check"]')).toBeNull();
    });

    it('still shows the checkmark after a StrictMode double-mount', async () => {
        const onCopy = vi.fn(async () => true);
        render(
            <React.StrictMode>
                <CopyIconButton label="Copy" onCopy={onCopy} />
            </React.StrictMode>
        );

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        });
        expect(document.querySelector('[data-icon="check"]')).toBeTruthy();
    });

    it('does not bubble the click to the row behind it', async () => {
        const onRow = vi.fn();
        render(
            <div onClick={onRow}>
                <CopyIconButton label="Copy" onCopy={async () => true} />
            </div>
        );
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        });
        expect(onRow).not.toHaveBeenCalled();
    });
});
