import type { ServerWebSocket } from 'bun';

export type StartupSocketData = {
    did: string;
    type?: string;
    threadId?: string;
    /**
     * BCP-47 language carried from the `?locale=` upgrade query param (LC-1901).
     * Chat turns run per-message, outside the upgrade request, so the socket is
     * where the locale has to live.
     */
    locale?: string | null;
};

export type StartupSocket = ServerWebSocket<StartupSocketData>;

export type ActiveStartup = {
    requestId: string;
    controller: AbortController;
    ws: StartupSocket;
};

export const activeStartups = new Map<string, ActiveStartup>();

export const isStartupOwner = (did: string, requestId: string, ws: StartupSocket): boolean => {
    const current = activeStartups.get(did);

    return current?.requestId === requestId && current.ws === ws;
};

export const isCurrentStartup = (did: string, requestId: string, ws: StartupSocket): boolean => {
    const current = activeStartups.get(did);

    return isStartupOwner(did, requestId, ws) && current?.controller.signal.aborted === false;
};
