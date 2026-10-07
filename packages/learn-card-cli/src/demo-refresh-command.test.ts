import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ direct: vi.fn(), inbox: vi.fn() }));

vi.mock('./demo-refresh', () => ({ runRefreshDemo: mocks.direct }));
vi.mock('./demo-inbox-refresh', () => ({ runInboxRefreshDemo: mocks.inbox }));

import { runDemoRefreshCommand } from './demo-refresh-command';

beforeEach(() => vi.resetAllMocks());

describe('demo refresh command forwarding', () => {
    it('routes --inbox to the Universal Inbox demonstration', async () => {
        mocks.inbox.mockResolvedValue(undefined);
        const options = { inbox: true, network: 'http://localhost:4000/trpc' };
        await runDemoRefreshCommand(options);
        expect(mocks.inbox).toHaveBeenCalledWith(options);
        expect(mocks.direct).not.toHaveBeenCalled();
    });

    it('runs the existing direct-send demonstration when --inbox is absent', async () => {
        mocks.direct.mockResolvedValue(undefined);
        const options = { network: 'http://localhost:4000/trpc' };
        await runDemoRefreshCommand(options);
        expect(mocks.direct).toHaveBeenCalledWith(options);
        expect(mocks.inbox).not.toHaveBeenCalled();
    });

    it('rejects --email without --inbox before loading a demo', async () => {
        await expect(
            runDemoRefreshCommand({ email: 'owner@example.com', ui: true })
        ).rejects.toThrow('--email requires --inbox');
        expect(mocks.inbox).not.toHaveBeenCalled();
        expect(mocks.direct).not.toHaveBeenCalled();
    });

    it('rejects --email without --ui', async () => {
        await expect(
            runDemoRefreshCommand({ email: 'owner@example.com', inbox: true })
        ).rejects.toThrow('--email requires --ui');
        expect(mocks.inbox).not.toHaveBeenCalled();
        expect(mocks.direct).not.toHaveBeenCalled();
    });

    it('routes --email with --inbox --ui to the Universal Inbox demonstration', async () => {
        mocks.inbox.mockResolvedValue(undefined);
        const options = {
            inbox: true,
            ui: true,
            email: 'owner@example.com',
            network: 'http://localhost:4000/trpc',
        };
        await runDemoRefreshCommand(options);
        expect(mocks.inbox).toHaveBeenCalledWith(options);
        expect(mocks.direct).not.toHaveBeenCalled();
    });
});
