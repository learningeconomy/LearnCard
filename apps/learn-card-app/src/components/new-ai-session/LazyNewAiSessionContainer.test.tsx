import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({ loaded: vi.fn() }));
vi.mock('./NewAiSessionContainer', () => {
    host.loaded();
    return {
        default: ({ disableEdit }: { disableEdit?: boolean }) => (
            <div>Session loaded {String(disableEdit)}</div>
        ),
    };
});
vi.mock('../../paraglide/messages.js', () => ({ 'common.loading': () => 'Loading...' }));
import LazyNewAiSessionContainer from './LazyNewAiSessionContainer';
afterEach(cleanup);
it('loads the session module on render, forwards props, and shows progress while loading', async () => {
    expect(host.loaded).not.toHaveBeenCalled();
    render(<LazyNewAiSessionContainer disableEdit />);
    expect(screen.getByRole('status').textContent).toContain('Loading...');
    expect(await screen.findByText('Session loaded true')).toBeTruthy();
    expect(host.loaded).toHaveBeenCalledTimes(1);
});
