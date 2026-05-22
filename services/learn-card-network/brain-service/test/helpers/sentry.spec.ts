import { describe, it, expect } from 'vitest';

import { sentryBeforeSend } from '../../src/helpers/sentry.helpers';

describe('sentryBeforeSend', () => {
    it('passes through normal events unchanged', () => {
        const event = {
            extra: {
                requestId: 'abc123',
                status: 'failed',
            },
        } as Parameters<typeof sentryBeforeSend>[0];

        expect(sentryBeforeSend(event, {} as Parameters<typeof sentryBeforeSend>[1])).toBe(event);
    });

    it('removes credentialSubject from event.extra', () => {
        const event = {
            extra: {
                credentialSubject: {
                    id: 'did:key:foo',
                },
            },
        } as Parameters<typeof sentryBeforeSend>[0];

        expect(sentryBeforeSend(event, {} as Parameters<typeof sentryBeforeSend>[1])).toEqual({
            extra: {
                credentialSubject: '[REDACTED]',
            },
        });
    });

    it('removes nested credential objects from event.extra', () => {
        const event = {
            extra: {
                payload: {
                    nested: [
                        {
                            credential: {
                                proof: {
                                    type: 'Ed25519Signature2020',
                                },
                            },
                        },
                    ],
                },
            },
        } as Parameters<typeof sentryBeforeSend>[0];

        expect(sentryBeforeSend(event, {} as Parameters<typeof sentryBeforeSend>[1])).toEqual({
            extra: {
                payload: {
                    nested: [
                        {
                            credential: '[REDACTED]',
                        },
                    ],
                },
            },
        });
    });

    it('scrubs objects with both @context and type fields', () => {
        const event = {
            extra: {
                vc: {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiableCredential'],
                    issuer: 'did:key:issuer',
                },
            },
        } as Parameters<typeof sentryBeforeSend>[0];

        expect(sentryBeforeSend(event, {} as Parameters<typeof sentryBeforeSend>[1])).toEqual({
            extra: {
                vc: '[REDACTED]',
            },
        });
    });
});
