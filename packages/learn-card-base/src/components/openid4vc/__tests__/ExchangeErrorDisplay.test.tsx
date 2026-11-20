// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExchangeErrorDisplay } from '../ExchangeErrorDisplay';

// What a lazy OpenID4VC method rejects with when its implementation chunk is gone after a deploy.
const staleChunk = new TypeError(
    'Failed to fetch dynamically imported module: https://app.example/assets/plugin-abc123.js'
);

const reload = vi.fn();

beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
});

afterEach(() => {
    cleanup();
    reload.mockReset();
});

describe('ExchangeErrorDisplay stale-chunk recovery', () => {
    it('reloads the app when the exchange failed to load its implementation chunk', () => {
        render(<ExchangeErrorDisplay error={staleChunk} onRetry={() => undefined} />);

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does not reload for an ordinary exchange error', () => {
        render(
            <ExchangeErrorDisplay error={new Error('invalid_grant')} onRetry={() => undefined} />
        );

        expect(reload).not.toHaveBeenCalled();
    });

    it('keeps the error and Try Again on screen once the shared reload budget is spent', () => {
        sessionStorage.setItem('__chunk_reload__', JSON.stringify({ count: 2, ts: Date.now() }));
        const onRetry = vi.fn();

        render(<ExchangeErrorDisplay error={staleChunk} onRetry={onRetry} />);
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));

        expect(reload).not.toHaveBeenCalled();
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
