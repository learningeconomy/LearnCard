import { describe, expect, it } from 'vitest';
import { IssueInboxCredentialValidator } from './lcn';

describe('single inbox issuance idempotency input', () => {
    const request = {
        recipient: { type: 'email', value: 'holder@example.com' },
        templateUri: 'lc:network:network.example/trpc:boost:template',
    };

    it.each([undefined, false, true])('accepts the existing key field with refresh=%s', refresh => {
        expect(
            IssueInboxCredentialValidator.parse({
                ...request,
                refresh,
                idempotencyKey: 'request-1',
            }).idempotencyKey
        ).toBe('request-1');
    });
    it('leaves an unkeyed request unkeyed', () => {
        expect(IssueInboxCredentialValidator.parse(request)).not.toHaveProperty('idempotencyKey');
    });
    it('still requires a credential or template', () => {
        expect(
            IssueInboxCredentialValidator.safeParse({
                recipient: request.recipient,
                idempotencyKey: 'request-1',
            }).success
        ).toBe(false);
    });
});
