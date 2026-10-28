import { describe, expect, mock, test } from 'bun:test';

import {
    hasLeadingAiPassportProtocol,
    getWebSocketTicketProtocol,
    issueWebSocketTicket,
} from './websocketTicket';

const allowedOrigin = 'https://wallet.example.test';
const isAllowedOrigin = (origin: string) => origin === allowedOrigin;

describe('WebSocket ticket endpoint', () => {
    test('mints a ticket for an authenticated session and allowed origin', async () => {
        const createWebSocketTicket = mock(async () => ({
            expiresAt: 46_000,
            ticket: 'ticket-value',
        }));

        await expect(
            issueWebSocketTicket({
                did: 'did:key:holder',
                isAllowedOrigin,
                method: 'POST',
                origin: allowedOrigin,
                service: { createWebSocketTicket },
                sessionId: 'session-value',
            })
        ).resolves.toEqual({
            body: { expiresAt: 46_000, ticket: 'ticket-value' },
            status: 200,
        });
        expect(createWebSocketTicket).toHaveBeenCalledWith({
            did: 'did:key:holder',
            origin: allowedOrigin,
            sessionId: 'session-value',
        });
    });

    test('rejects unauthenticated callers before minting', async () => {
        const createWebSocketTicket = mock(async () => ({
            expiresAt: 46_000,
            ticket: 'ticket-value',
        }));

        await expect(
            issueWebSocketTicket({
                isAllowedOrigin,
                method: 'POST',
                origin: allowedOrigin,
                service: { createWebSocketTicket },
            })
        ).resolves.toEqual({
            body: { error: 'Authentication required' },
            status: 401,
        });
        expect(createWebSocketTicket).not.toHaveBeenCalled();
    });

    test('rejects wrong origins and methods', async () => {
        const createWebSocketTicket = mock(async () => ({
            expiresAt: 46_000,
            ticket: 'ticket-value',
        }));
        const service = { createWebSocketTicket };

        await expect(
            issueWebSocketTicket({
                did: 'did:key:holder',
                isAllowedOrigin,
                method: 'POST',
                origin: 'https://attacker.example.test',
                service,
                sessionId: 'session-value',
            })
        ).resolves.toMatchObject({ status: 403 });
        await expect(
            issueWebSocketTicket({
                did: 'did:key:holder',
                isAllowedOrigin,
                method: 'GET',
                origin: allowedOrigin,
                service,
                sessionId: 'session-value',
            })
        ).resolves.toMatchObject({ status: 405 });
        expect(createWebSocketTicket).not.toHaveBeenCalled();
    });

    test('accepts only ticket protocols, never durable session protocols', () => {
        expect(getWebSocketTicketProtocol('ai-passport, ai-passport-ticket.one-time-ticket')).toBe(
            'one-time-ticket'
        );
        expect(
            getWebSocketTicketProtocol('ai-passport, ai-passport-session.durable-session')
        ).toBeUndefined();
    });

    test('requires ai-passport to be the first offered protocol', () => {
        expect(
            hasLeadingAiPassportProtocol('ai-passport, ai-passport-ticket.one-time-ticket')
        ).toBeTrue();
        expect(
            hasLeadingAiPassportProtocol('ai-passport-ticket.one-time-ticket, ai-passport')
        ).toBeFalse();
        expect(hasLeadingAiPassportProtocol('ai-passport-ticket.only')).toBeFalse();
        expect(hasLeadingAiPassportProtocol(null)).toBeFalse();
    });
});
