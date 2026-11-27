import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { checkmark, copyOutline } from 'learn-card-base/icons/ionicons';

import { AppIcon } from '../../../../components/icon';
import CopyIconButton from './CopyIconButton';

/** The svg markup AppIcon renders for an icon, to tell which icon the button shows. */
const svgMarkup = (icon: string): string => {
    const { container, unmount } = render(<AppIcon icon={icon} />);
    const markup = container.querySelector('svg')?.outerHTML ?? '';
    unmount();
    return markup;
};

const shownIcon = (): string | undefined =>
    document.querySelector('button .app-icon > svg')?.outerHTML;

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('CopyIconButton', () => {
    it('morphs to a check after a successful copy, then settles back', async () => {
        const check = svgMarkup(checkmark);
        const copy = svgMarkup(copyOutline);
        vi.useFakeTimers();
        const onCopy = vi.fn(async () => true);
        render(<CopyIconButton label="Copy link for Career" onCopy={onCopy} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy link for Career' }));
        });
        expect(shownIcon()).toBe(check);

        act(() => vi.advanceTimersByTime(1600));
        expect(shownIcon()).toBe(copy);
    });

    it('stays on the copy icon when copying fails', async () => {
        const copy = svgMarkup(copyOutline);
        const onCopy = vi.fn(async () => false);
        render(<CopyIconButton label="Copy" onCopy={onCopy} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        });
        expect(shownIcon()).toBe(copy);
    });

    it('still shows the checkmark after a StrictMode double-mount', async () => {
        const check = svgMarkup(checkmark);
        const onCopy = vi.fn(async () => true);
        render(
            <React.StrictMode>
                <CopyIconButton label="Copy" onCopy={onCopy} />
            </React.StrictMode>
        );

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        });
        expect(shownIcon()).toBe(check);
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
