const WEBSOCKET_TICKET_PROTOCOL_PREFIX = 'ai-passport-ticket.';

export type WebSocketTicketIssuer = {
    createWebSocketTicket(input: {
        did: string;
        origin: string;
        sessionId: string;
    }): Promise<{ expiresAt: number; ticket: string }>;
};

export type WebSocketTicketRouteResult = {
    body: unknown;
    status: number;
};

export const hasLeadingAiPassportProtocol = (protocolHeader: string | null): boolean =>
    protocolHeader?.split(',', 1)[0]?.trim() === 'ai-passport';

export const getWebSocketTicketProtocol = (protocolHeader: string | null): string | undefined =>
    protocolHeader
        ?.split(',')
        .map(protocol => protocol.trim())
        .find(protocol => protocol.startsWith(WEBSOCKET_TICKET_PROTOCOL_PREFIX))
        ?.slice(WEBSOCKET_TICKET_PROTOCOL_PREFIX.length);

export const issueWebSocketTicket = async ({
    did,
    isAllowedOrigin,
    method,
    origin,
    service,
    sessionId,
}: {
    did?: string;
    isAllowedOrigin(origin: string): boolean;
    method: string;
    origin: string | null;
    service: WebSocketTicketIssuer;
    sessionId?: string;
}): Promise<WebSocketTicketRouteResult> => {
    if (method !== 'POST') {
        return { body: { error: 'Method not allowed' }, status: 405 };
    }

    if (!origin || !isAllowedOrigin(origin)) {
        return { body: { error: 'Origin not allowed' }, status: 403 };
    }

    if (!did || !sessionId) {
        return { body: { error: 'Authentication required' }, status: 401 };
    }

    return {
        body: await service.createWebSocketTicket({ did, origin, sessionId }),
        status: 200,
    };
};
