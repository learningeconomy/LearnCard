import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    unsubscribe: vi.fn(),
    location: { search: '?token=signed' },
    privacy: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.location }));
vi.mock('learn-card-base', () => ({
    networkStore: { get: { networkUrl: () => 'https://brain.example/trpc' } },
}));
vi.mock('@learncard/network-brain-client', () => ({
    getAnonymousClient: () => ({ campaigns: { unsubscribe: { mutate: mocks.unsubscribe } } }),
}));
vi.mock('../../components/share-links/sharePrivacy', () => ({ enterSharePrivacy: mocks.privacy }));
import UnsubscribePage from './UnsubscribePage';
beforeEach(() => {
    vi.clearAllMocks();
    mocks.location.search = '?token=signed';
});
afterEach(cleanup);
describe('public unsubscribe page', () => {
    it('unsubscribes anonymously and shows progress then success', async () => {
        let finish!: (value: boolean) => void;
        mocks.unsubscribe.mockReturnValue(
            new Promise(resolve => {
                finish = resolve;
            })
        );
        render(<UnsubscribePage />);
        expect(screen.getByText('Unsubscribing…')).toBeTruthy();
        expect(mocks.privacy).toHaveBeenCalled();
        expect(mocks.unsubscribe).toHaveBeenCalledWith({ token: 'signed' });
        finish(true);
        await waitFor(() =>
            expect(screen.getByText('You’re unsubscribed from announcements.')).toBeTruthy()
        );
    });
    it('offers retry without exposing raw errors', async () => {
        mocks.unsubscribe
            .mockRejectedValueOnce(new Error('secret payload'))
            .mockResolvedValueOnce(true);
        render(<UnsubscribePage />);
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        expect(screen.queryByText('secret payload')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() =>
            expect(screen.getByText('You’re unsubscribed from announcements.')).toBeTruthy()
        );
        expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
    });
    it('rejects a missing token locally', async () => {
        mocks.location.search = '';
        render(<UnsubscribePage />);
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        expect(mocks.unsubscribe).not.toHaveBeenCalled();
    });
});
