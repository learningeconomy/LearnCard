import type { InboxRefreshDemoOptions } from './demo-inbox-refresh';

export type DemoRefreshCommandOptions = InboxRefreshDemoOptions & { inbox?: boolean };

/**
 * Route `demo refresh` to the direct-send demo or the Universal Inbox demo. Kept
 * separate so the command-line forwarding is unit-testable without a live network.
 */
export const runDemoRefreshCommand = async (options: DemoRefreshCommandOptions): Promise<void> => {
    if (options.inbox) {
        const { runInboxRefreshDemo } = await import('./demo-inbox-refresh');
        await runInboxRefreshDemo(options);
        return;
    }
    const { runRefreshDemo } = await import('./demo-refresh');
    await runRefreshDemo(options);
};
