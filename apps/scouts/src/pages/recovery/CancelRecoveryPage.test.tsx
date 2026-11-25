// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ configured: true, search: '', fetch: vi.fn() }));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
    useLocation: () => ({ search: mocks.search }),
}));
vi.mock('learn-card-base', () => ({
    getSSSConfig: () => ({ serverUrl: 'https://example.test/api' }),
    networkStore: { get: { tenantId: () => 'scouts' } },
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    isEscrowRecoveryConfigured: () => mocks.configured,
}));
import CancelRecoveryPage from './CancelRecoveryPage';

beforeEach(() => {
    mocks.configured = true;
    mocks.search = `?holdId=12345678-1234-1234-1234-123456789abc&token=${'a'.repeat(64)}`;
    mocks.fetch.mockReset();
    vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it('requires confirmation and sends tenant headers to the configured API', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ cancelled: true }) });
    render(<CancelRecoveryPage />);
    expect(mocks.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
    await waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe('This recovery request was cancelled.')
    );
    expect(mocks.fetch).toHaveBeenCalledWith(
        'https://example.test/api/keys/escrow/cancel-link',
        expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'scouts' },
        })
    );
});

it.each(['disabled', 'invalid'])('does not submit a %s link', reason => {
    if (reason === 'disabled') mocks.configured = false;
    else mocks.search = '?holdId=invalid&token=invalid';
    render(<CancelRecoveryPage />);
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
    expect(mocks.fetch).not.toHaveBeenCalled();
});

it('does not claim cancellation for an expired or already used link', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ cancelled: false }) });
    render(<CancelRecoveryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
    await waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe(
            'This recovery request is no longer valid. Start a new one.'
        )
    );
});

it('shows a retryable generic error without exposing the response', async () => {
    mocks.fetch.mockRejectedValue(new Error('private response'));
    render(<CancelRecoveryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
    await waitFor(() =>
        expect(screen.getByRole('alert').textContent).toBe(
            'Something went wrong. Please try again.'
        )
    );
});
