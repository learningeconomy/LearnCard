import type { ConnectionPromptNotificationCopy } from 'learn-card-base';

import * as m from '../paraglide/messages.js';

export const getConnectionPromptCopy = (): ConnectionPromptNotificationCopy => ({
    title: name => m['connectionPrompts.title']({ name }),
    description: m['connectionPrompts.description'](),
    connect: m['connectionPrompts.connect'](),
    skipForNow: m['connectionPrompts.skipForNow'](),
    connecting: m['connectionPrompts.connecting'](),
    skipping: m['connectionPrompts.skipping'](),
    error: m['connectionPrompts.error'](),
    connected: m['connectionPrompts.connected'](),
    skipped: m['connectionPrompts.skipped'](),
    claimedType: m['connectionPrompts.claimedType'](),
});
