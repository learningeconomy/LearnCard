import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), profile: vi.fn() }));
vi.mock('learn-card-base', async () => {
    const { default: Toggle } =
        await import('../../../../../packages/learn-card-base/src/components/form-inputs/Toggle');
    return {
        Toggle,
        useWallet: () => ({
            initWallet: async () => ({
                invoke: {
                    getAnnouncementPreferences: mocks.get,
                    updateAnnouncementPreferences: mocks.update,
                    getProfile: mocks.profile,
                },
            }),
        }),
    };
});
import { AnnouncementPreferences } from './AnnouncementPreferences';
const show = () =>
    render(
        <QueryClientProvider
            client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
            <AnnouncementPreferences profileId="learner" />
        </QueryClientProvider>
    );
beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockResolvedValue({ profileId: 'learner' });
    mocks.get.mockResolvedValue({ announcementEmailOptOut: false, announcementPushOptOut: true });
    mocks.update.mockResolvedValue({});
});
afterEach(cleanup);
describe('announcement settings', () => {
    it('reflects opt-outs and patches only the selected channel', async () => {
        show();
        await waitFor(() =>
            expect(screen.getByRole('switch', { name: 'Email' }).getAttribute('aria-checked')).toBe(
                'true'
            )
        );
        expect(
            screen.getByRole('switch', { name: 'Push notifications' }).getAttribute('aria-checked')
        ).toBe('false');
        mocks.get.mockResolvedValue({
            announcementEmailOptOut: true,
            announcementPushOptOut: true,
        });
        fireEvent.click(screen.getByRole('switch', { name: 'Email' }));
        await waitFor(() =>
            expect(mocks.update).toHaveBeenCalledWith({ announcementEmailOptOut: true })
        );
        await waitFor(() =>
            expect(screen.getByRole('switch', { name: 'Email' }).getAttribute('aria-checked')).toBe(
                'false'
            )
        );
    });
    it('does not write to a different active profile', async () => {
        mocks.profile.mockResolvedValue({ profileId: 'other' });
        show();
        await waitFor(() => expect(screen.getByRole('switch', { name: 'Email' })).toBeTruthy());
        fireEvent.click(screen.getByRole('switch', { name: 'Email' }));
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        expect(mocks.update).not.toHaveBeenCalled();
    });
    it('offers retry when preferences cannot load', async () => {
        mocks.get.mockRejectedValueOnce(new Error('offline'));
        show();
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() => expect(screen.getByRole('switch', { name: 'Email' })).toBeTruthy());
    });
});
