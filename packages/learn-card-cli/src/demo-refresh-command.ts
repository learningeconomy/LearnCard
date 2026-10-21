import type { InboxRefreshDemoOptions } from './demo-inbox-refresh';

export type DemoRefreshCommandOptions = InboxRefreshDemoOptions & { inbox?: boolean };

/**
 * Route `demo refresh` to the direct-send demo, the Universal Inbox demo, or the
 * opt-in real-email walkthrough. Kept separate so the command-line forwarding is
 * unit-testable without a live network.
 */
export const runDemoRefreshCommand = async (options: DemoRefreshCommandOptions): Promise<void> => {
    if (options.email !== undefined) {
        if (!options.inbox) throw new Error('--email requires --inbox.');
        if (!options.ui) throw new Error('--email requires --ui.');
    }
    if (options.inbox) {
        const { runInboxRefreshDemo } = await import('./demo-inbox-refresh');
        await runInboxRefreshDemo(options);
        return;
    }
    const { runRefreshDemo } = await import('./demo-refresh');
    await runRefreshDemo(options);
};
