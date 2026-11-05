// @vitest-environment happy-dom
// connectionPrompts.ts (needed for connectionPromptKeys) re-exports from the full
// `learn-card-base` barrel, which includes browser-only helpers (e.g. urlHelpers'
// `window.location` read). The package's default vitest preset is `node`, so this
// file opts into happy-dom instead of duplicating the query-key literal.
import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';

import { claimIncomingCredential } from './claimIncomingCredential';
import { connectionPromptKeys } from '../react-query/connectionPrompts';
import type { BespokeLearnCard } from '../types/learn-card';

const URI = 'lc:cred:transcript-1';

const makeQueryClient = (): QueryClient =>
    ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }) as unknown as QueryClient;

const makeWallet = (overrides: Partial<BespokeLearnCard['invoke']> = {}): BespokeLearnCard =>
    ({
        invoke: {
            acceptCredential: vi.fn().mockResolvedValue(true),
            queryNotifications: vi.fn().mockResolvedValue({ notifications: [{ _id: 'notif-1' }] }),
            updateNotificationMeta: vi.fn().mockResolvedValue(true),
            ...overrides,
        },
    }) as unknown as BespokeLearnCard;

describe('claimIncomingCredential', () => {
    it('adds, accepts, and marks the matching notification COMPLETED on the happy path', async () => {
        const wallet = makeWallet();
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        const result = await claimIncomingCredential({
            uri: URI,
            wallet,
            addVCtoWallet,
            queryClient,
        });

        expect(result).toEqual({ added: true, accepted: true });
        expect(addVCtoWallet).toHaveBeenCalledWith({ uri: URI });
        expect(wallet.invoke.acceptCredential).toHaveBeenCalledWith(URI);
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            queryKey: connectionPromptKeys.all,
        });

        // Notification update is fire-and-forget; flush microtasks before asserting.
        await Promise.resolve();
        await Promise.resolve();
        expect(wallet.invoke.updateNotificationMeta).toHaveBeenCalledWith('notif-1', {
            actionStatus: 'COMPLETED',
            read: true,
        });
    });

    it('re-throws when addVCtoWallet rejects, without touching accept/notification state', async () => {
        const wallet = makeWallet();
        const addVCtoWallet = vi.fn().mockRejectedValue(new Error('index.add failed'));
        const queryClient = makeQueryClient();

        await expect(
            claimIncomingCredential({ uri: URI, wallet, addVCtoWallet, queryClient })
        ).rejects.toThrow('index.add failed');
    });

    it('treats a rejected server accept as non-fatal and skips the connection-prompt invalidation', async () => {
        const wallet = makeWallet({
            acceptCredential: vi.fn().mockRejectedValue(new Error('offline')),
        });
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        const result = await claimIncomingCredential({
            uri: URI,
            wallet,
            addVCtoWallet,
            queryClient,
        });

        expect(result).toEqual({ added: true, accepted: false });
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it('treats a false accept result the same as a failed accept', async () => {
        const wallet = makeWallet({ acceptCredential: vi.fn().mockResolvedValue(false) });
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        const result = await claimIncomingCredential({
            uri: URI,
            wallet,
            addVCtoWallet,
            queryClient,
        });

        expect(result).toEqual({ added: true, accepted: false });
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it('does not update a notification when none matches the credential', async () => {
        const wallet = makeWallet({
            queryNotifications: vi.fn().mockResolvedValue({ notifications: [] }),
        });
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        await claimIncomingCredential({ uri: URI, wallet, addVCtoWallet, queryClient });
        await Promise.resolve();

        expect(wallet.invoke.updateNotificationMeta).not.toHaveBeenCalled();
    });

    it('survives a rejected notification lookup', async () => {
        const wallet = makeWallet({
            queryNotifications: vi.fn().mockRejectedValue(new Error('lookup failed')),
        });
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        await expect(
            claimIncomingCredential({ uri: URI, wallet, addVCtoWallet, queryClient })
        ).resolves.toEqual({ added: true, accepted: true });
    });

    it('skips server-side accept and notification lookup when no wallet is available yet', async () => {
        const addVCtoWallet = vi.fn().mockResolvedValue(true);
        const queryClient = makeQueryClient();

        const result = await claimIncomingCredential({
            uri: URI,
            wallet: null,
            addVCtoWallet,
            queryClient,
        });

        expect(result).toEqual({ added: true, accepted: false });
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
});
