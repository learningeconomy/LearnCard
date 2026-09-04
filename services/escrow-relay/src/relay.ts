import { timingSafeEqual } from 'node:crypto';

import { renderEmail, resolveBranding } from '@learncard/email-templates';
import {
    decryptEmailRelayPayload,
    parseEmailRelayEnvelope,
    type EmailRelayEnvelope,
} from '@learncard/sss-key-manager';
import { ServerClient } from 'postmark';

import type { EscrowRelayConfig } from './config';

export interface RelayPostmarkMessage {
    From: string;
    To: string;
    Subject: string;
    HtmlBody: string;
    TextBody: string;
    MessageStream?: string;
}

export interface RelayPostmarkAcceptance {
    messageId: string;
    errorCode: number;
    message: string;
}

export interface RelayPostmarkSender {
    sendEmail(message: RelayPostmarkMessage): Promise<RelayPostmarkAcceptance>;
}

export interface EscrowRelayRequest {
    authorization?: string;
    body: unknown;
}

export interface EscrowRelayResponse {
    statusCode: number;
    body: {
        accepted: boolean;
        messageId?: string;
        error: string;
    };
}

interface ParsedRelayRequest {
    payload: EmailRelayEnvelope;
    expectedRecipient: string;
}

const genericResponse = (statusCode: number, error: string): EscrowRelayResponse => ({
    statusCode,
    body: { accepted: false, error },
});

const tokenMatches = (authorization: string | undefined, expectedToken: string): boolean => {
    const suppliedToken = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : '';
    const supplied = Buffer.from(suppliedToken);
    const expected = Buffer.from(expectedToken);

    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
};

const parseRelayRequest = (body: unknown): ParsedRelayRequest => {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new Error('Invalid relay request');
    }

    const record = body as Record<string, unknown>;
    const allowedKeys = new Set(['payload', 'expectedRecipient']);

    if (Object.keys(record).some(key => !allowedKeys.has(key))) {
        throw new Error('Unexpected relay request field');
    }

    const expectedRecipient = record.expectedRecipient;

    if (
        typeof expectedRecipient !== 'string' ||
        expectedRecipient.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedRecipient)
    ) {
        throw new Error('Invalid expected recipient');
    }

    return {
        payload: parseEmailRelayEnvelope(record.payload),
        expectedRecipient: expectedRecipient.trim().toLowerCase(),
    };
};

const createPostmarkSender = (serverToken: string): RelayPostmarkSender => {
    const client = new ServerClient(serverToken);

    return {
        sendEmail: async message => {
            const response = await client.sendEmail(message);

            return {
                messageId: response.MessageID,
                errorCode: response.ErrorCode,
                message: response.Message,
            };
        },
    };
};

const sanitizeDisplayName = (value: string): string =>
    value
        .replace(/[\r\n"]/g, '')
        .trim()
        .slice(0, 128) || 'LearnCard';

/**
 * Build the relay request handler. Plaintext exists only inside this isolated
 * function while rendering the email and is never logged or persisted.
 */
export const createEscrowRelayHandler = (
    config: EscrowRelayConfig,
    sender: RelayPostmarkSender = createPostmarkSender(config.postmarkServerToken)
) => {
    return async (request: EscrowRelayRequest): Promise<EscrowRelayResponse> => {
        if (!tokenMatches(request.authorization, config.relayAuthToken)) {
            return genericResponse(401, 'Unauthorized');
        }

        let parsedRequest: ParsedRelayRequest;

        try {
            parsedRequest = parseRelayRequest(request.body);
        } catch {
            return genericResponse(400, 'Invalid encrypted recovery payload');
        }

        const privateKey = config.privateKeys[parsedRequest.payload.keyId];

        if (!privateKey) return genericResponse(400, 'Unknown relay key');

        let plaintext;

        try {
            plaintext = await decryptEmailRelayPayload(parsedRequest.payload, privateKey);
        } catch {
            return genericResponse(400, 'Invalid encrypted recovery payload');
        }

        if (plaintext.targetEmail !== parsedRequest.expectedRecipient) {
            return genericResponse(400, 'Recipient binding mismatch');
        }

        const branding = resolveBranding(plaintext.branding);
        const requestedFromDomain = branding.fromDomain.toLowerCase();
        const fromDomain = config.allowedFromDomains.has(requestedFromDomain)
            ? requestedFromDomain
            : config.defaultFromDomain;

        try {
            const rendered = await renderEmail('recovery-key', branding, {
                recoveryKey: plaintext.recoveryKey,
                confirmationCode: plaintext.confirmationCode,
            });
            const acceptance = await sender.sendEmail({
                From: `${sanitizeDisplayName(branding.brandName)} <recovery@${fromDomain}>`,
                To: plaintext.targetEmail,
                Subject: rendered.subject,
                HtmlBody: rendered.html,
                TextBody: rendered.text,
                ...(config.messageStream ? { MessageStream: config.messageStream } : {}),
            });

            if (acceptance.errorCode !== 0 || !acceptance.messageId) {
                return genericResponse(502, 'Email provider rejected the recovery email');
            }

            return {
                statusCode: 200,
                body: { accepted: true, messageId: acceptance.messageId, error: '' },
            };
        } catch {
            return genericResponse(502, 'Email provider rejected the recovery email');
        }
    };
};
