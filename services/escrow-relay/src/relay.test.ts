import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
    bufferToBase64,
    encryptEmailRelayPayload,
    type EmailRelayEnvelope,
} from '@learncard/sss-key-manager';

import type { EscrowRelayConfig } from './config';
import { createEscrowRelayHandler, type RelayPostmarkSender } from './relay';

const AUTHORIZATION = 'Bearer relay-auth-token';
const KEY_ID = 'relay-test-key';

describe('escrow relay', () => {
    let publicKey = '';
    let config: EscrowRelayConfig;

    beforeAll(async () => {
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
        );
        const [publicKeyBytes, privateKeyBytes] = await Promise.all([
            crypto.subtle.exportKey('spki', keyPair.publicKey),
            crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
        ]);

        publicKey = bufferToBase64(publicKeyBytes);
        config = {
            privateKeys: { [KEY_ID]: bufferToBase64(privateKeyBytes) },
            relayAuthToken: 'relay-auth-token',
            postmarkServerToken: 'POSTMARK_TEST',
            defaultFromDomain: 'learncard.com',
            allowedFromDomains: new Set(['learncard.com', 'tenant.example']),
        };
    });

    const encryptPayload = async (
        targetEmail = 'recovery@example.com'
    ): Promise<EmailRelayEnvelope> =>
        encryptEmailRelayPayload(
            {
                targetEmail,
                recoveryKey: `0001${'ab'.repeat(48)}`,
                confirmationCode: '654321',
                branding: { brandName: 'Relay Tenant', fromDomain: 'tenant.example' },
            },
            publicKey,
            KEY_ID
        );

    it('decrypts, renders, and returns synchronous Postmark acceptance', async () => {
        const sendEmail = vi.fn<RelayPostmarkSender['sendEmail']>(async () => ({
            messageId: 'postmark-message-id',
            errorCode: 0,
            message: 'OK',
        }));
        const sender: RelayPostmarkSender = { sendEmail };
        const payload = await encryptPayload();
        const response = await createEscrowRelayHandler(
            config,
            sender
        )({
            authorization: AUTHORIZATION,
            body: { payload, expectedRecipient: 'recovery@example.com' },
        });

        expect(response).toEqual({
            statusCode: 200,
            body: { accepted: true, messageId: 'postmark-message-id', error: '' },
        });
        expect(sendEmail).toHaveBeenCalledOnce();
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                From: 'Relay Tenant <recovery@tenant.example>',
                To: 'recovery@example.com',
                TextBody: expect.stringContaining('654321'),
            })
        );
        expect(sendEmail.mock.calls[0]?.[0].TextBody).toContain(`0001${'ab'.repeat(48)}`);
    });

    it('fails closed when Postmark throws', async () => {
        const sender: RelayPostmarkSender = {
            sendEmail: vi.fn().mockRejectedValue(new Error('Postmark unavailable')),
        };
        const payload = await encryptPayload();
        const response = await createEscrowRelayHandler(
            config,
            sender
        )({
            authorization: AUTHORIZATION,
            body: { payload, expectedRecipient: 'recovery@example.com' },
        });

        expect(response.statusCode).toBe(502);
        expect(response.body.accepted).toBe(false);
    });

    it('fails closed when Postmark returns an error acceptance', async () => {
        const sender: RelayPostmarkSender = {
            sendEmail: vi.fn().mockResolvedValue({
                messageId: '',
                errorCode: 300,
                message: 'Inactive recipient',
            }),
        };
        const payload = await encryptPayload();
        const response = await createEscrowRelayHandler(
            config,
            sender
        )({
            authorization: AUTHORIZATION,
            body: { payload, expectedRecipient: 'recovery@example.com' },
        });

        expect(response.statusCode).toBe(502);
        expect(response.body.accepted).toBe(false);
    });

    it('rejects recipient substitution before sending', async () => {
        const sender: RelayPostmarkSender = {
            sendEmail: vi
                .fn()
                .mockResolvedValue({ messageId: 'unused', errorCode: 0, message: 'OK' }),
        };
        const payload = await encryptPayload('intended@example.com');
        const response = await createEscrowRelayHandler(
            config,
            sender
        )({
            authorization: AUTHORIZATION,
            body: { payload, expectedRecipient: 'attacker@example.com' },
        });

        expect(response.statusCode).toBe(400);
        expect(sender.sendEmail).not.toHaveBeenCalled();
    });

    it('rejects plaintext share requests and unauthenticated callers', async () => {
        const sender: RelayPostmarkSender = {
            sendEmail: vi
                .fn()
                .mockResolvedValue({ messageId: 'unused', errorCode: 0, message: 'OK' }),
        };
        const relay = createEscrowRelayHandler(config, sender);

        await expect(
            relay({
                authorization: AUTHORIZATION,
                body: { emailShare: `0001${'ab'.repeat(48)}`, expectedRecipient: 'x@example.com' },
            })
        ).resolves.toMatchObject({ statusCode: 400, body: { accepted: false } });
        await expect(
            relay({
                body: {
                    payload: await encryptPayload(),
                    expectedRecipient: 'recovery@example.com',
                },
            })
        ).resolves.toMatchObject({ statusCode: 401, body: { accepted: false } });
        expect(sender.sendEmail).not.toHaveBeenCalled();
    });
});
