import { describe, expect, it } from 'vitest';
import {
    decodeHeaderWords,
    findMessage,
    InboxError,
    isTrusted,
    MAX_MESSAGE_BYTES,
    parseMessage,
    parseTemplate,
    type InboxObject,
    type InboxStore,
    type TrustPolicy,
} from './inbox';
import {
    buildEmail,
    codeEmail,
    DKIM_DOMAIN,
    SENDER,
    startedEmail,
    warningEmail,
    type EmailOptions,
} from './test-fakes';

const TO = 'canary+1@inbox.example.com';
const policy: TrustPolicy = {
    expectedSenders: [SENDER],
    expectedDkimDomain: DKIM_DOMAIN,
    requireDmarc: true,
    recoveryEmail: TO,
};
const parse = (options: EmailOptions) =>
    parseMessage(new TextEncoder().encode(buildEmail(options)));
const trusted = (options: EmailOptions, p = policy) => isTrusted(parse(options), p);

describe('canary inbox trust checks', () => {
    it('accepts the enclave code email and extracts the code', () => {
        const message = parse(codeEmail(TO, '01234567'));
        expect(isTrusted(message, policy)).toBe(true);
        expect(parseTemplate(message)).toEqual({
            kind: 'code',
            brand: 'LearnCard',
            code: '01234567',
        });
    });

    it.each(['quoted-printable', 'base64'] as const)('decodes %s bodies', encoding => {
        expect(parseTemplate(parse({ ...codeEmail(TO, '76543210'), encoding }))).toMatchObject({
            code: '76543210',
        });
    });

    it('decodes RFC 2047 UTF-8 subjects', () => {
        expect(
            decodeHeaderWords('=?UTF-8?B?WW91ciBMZWFybkNhcmQ=?= =?UTF-8?Q?_recovery_code?=')
        ).toBe('Your LearnCard recovery code');
    });

    it('captures the brand rather than hardcoding it', () => {
        expect(parseTemplate(parse(codeEmail(TO, '11112222', 'ScoutPass')))).toMatchObject({
            brand: 'ScoutPass',
        });
    });

    it('parses the warning hours and recognises the started email', () => {
        expect(parseTemplate(parse(warningEmail(TO, 24)))).toEqual({
            kind: 'warning',
            brand: 'LearnCard',
            hours: 24,
        });
        expect(parseTemplate(parse(warningEmail(TO, 12)))).toMatchObject({ hours: 12 });
        expect(parseTemplate(parse(startedEmail(TO)))).toEqual({
            kind: 'started',
            brand: 'LearnCard',
        });
    });

    it.each([
        [
            'brand mismatch',
            {
                subject: 'Your LearnCard recovery code',
                body: 'Your Other recovery code is: 12345678',
            },
        ],
        [
            'short code',
            {
                subject: 'Your LearnCard recovery code',
                body: 'Your LearnCard recovery code is: 1234567',
            },
        ],
        [
            'second code',
            {
                subject: 'Your LearnCard recovery code',
                body: 'Your LearnCard recovery code is: 12345678\n\n87654321',
            },
        ],
        [
            'warning without hours',
            { subject: 'Your LearnCard recovery completes soon', body: 'Soon.' },
        ],
    ])('rejects a malformed template: %s', (_name, content) => {
        expect(() => parseTemplate(parse({ to: TO, ...content }))).toThrow(InboxError);
    });

    it.each([
        [
            'Spanish code email',
            {
                subject: 'Tu código de recuperación de LearnCard',
                body: 'Tu código ... es: 12345678',
            },
        ],
    ])('does not accept other languages: %s', (_name, content) => {
        expect(parseTemplate(parse({ to: TO, ...content }))).toBeUndefined();
    });

    it('skips mail from other senders silently', () => {
        expect(
            trusted({ ...codeEmail(TO, '12345678'), from: 'noreply@postmark.example.com' })
        ).toBe(false);
    });

    it.each<[string, Partial<EmailOptions>]>([
        ['no Authentication-Results', { authResults: null }],
        [
            'amazonses.com DKIM only',
            {
                authResults:
                    'amazonses.com; spf=pass; dkim=pass header.i=@amazonses.com; dmarc=pass',
            },
        ],
        [
            'DKIM for another domain',
            {
                authResults:
                    'amazonses.com; spf=pass; dkim=pass header.i=@evil.example.net; dmarc=pass',
            },
        ],
        [
            'DKIM fail',
            {
                authResults: `amazonses.com; spf=pass; dkim=fail header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            },
        ],
        [
            'SPF fail',
            {
                authResults: `amazonses.com; spf=fail; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            },
        ],
        [
            'DMARC fail',
            {
                authResults: `amazonses.com; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=fail`,
            },
        ],
        [
            'wrong authserv-id',
            {
                authResults: `mx.example.net; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            },
        ],
        ['spam verdict', { spam: 'FAIL' }],
        ['virus verdict', { virus: 'GRAY' }],
        ['To mismatch', { to: 'someone@inbox.example.com' }],
        [
            'forged Authentication-Results above the SES block',
            {
                authResults: `amazonses.com; spf=fail; dkim=fail; dmarc=fail`,
                prepend: [
                    `Authentication-Results: amazonses.com; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
                ],
            },
        ],
        ['second From header', { original: [`From: ${SENDER}`] }],
        // A genuine enclave message for another user, relayed with our address added.
        ['relayed with an extra To', { to: 'someone@users.example.org', original: [`To: ${TO}`] }],
        ['To listing a second address', { to: `${TO}, someone@users.example.org` }],
        ['a Cc header', { original: [`Cc: ${TO}`] }],
        [
            'result segments injected in a quoted envelope-from',
            {
                authResults: `amazonses.com; spf=pass (spfCheck: synthetic) smtp.mailfrom="x;dkim=pass header.d=${DKIM_DOMAIN};dmarc=pass"@attacker.example.net; dkim=fail header.i=@${DKIM_DOMAIN}; dmarc=fail header.from=${DKIM_DOMAIN};`,
            },
        ],
        [
            'result segments injected in a comment',
            {
                authResults: `amazonses.com; spf=pass (x;dkim=pass header.d=${DKIM_DOMAIN};dmarc=pass) smtp.mailfrom=a@attacker.example.net; dkim=fail header.i=@${DKIM_DOMAIN}; dmarc=fail;`,
            },
        ],
        [
            'unquoted injected segments next to the real failures',
            {
                authResults: `amazonses.com; spf=pass smtp.helo=x; dkim=pass header.d=${DKIM_DOMAIN}; dmarc=pass; dkim=fail header.i=@${DKIM_DOMAIN}; dmarc=fail;`,
            },
        ],
        [
            'two SPF results',
            {
                authResults: `amazonses.com; spf=fail; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            },
        ],
        [
            'an unbalanced quoted string',
            {
                authResults: `amazonses.com; spf=pass smtp.mailfrom="x; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            },
        ],
    ])('rejects enclave-looking mail with %s', (_name, override) => {
        expect(() => trusted({ ...codeEmail(TO, '12345678'), ...override })).toThrow(
            expect.objectContaining({ reason: 'email_untrusted' })
        );
    });

    it('rejects an Authentication-Results header that only appears in the original message', () => {
        const forged = {
            ...codeEmail(TO, '12345678'),
            authResults: null,
            original: [
                `Authentication-Results: amazonses.com; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=pass`,
            ],
        };
        expect(() => trusted(forged)).toThrow(InboxError);
    });

    it('DMARC can be made optional when the sending stack does not publish it', () => {
        const options = {
            ...codeEmail(TO, '12345678'),
            authResults: `amazonses.com; spf=pass; dkim=pass header.i=@${DKIM_DOMAIN}; dmarc=none`,
        };
        expect(() => trusted(options)).toThrow(InboxError);
        expect(trusted(options, { ...policy, requireDmarc: false })).toBe(true);
    });

    it('accepts either configured sender during a rollout', () => {
        const next = 'recovery@new.vault.notify.example.com';
        expect(
            trusted(
                { ...codeEmail(TO, '12345678'), from: next },
                { ...policy, expectedSenders: [SENDER, next] }
            )
        ).toBe(true);
    });

    it('rejects oversized input before parsing', () => {
        expect(() => parseMessage(new Uint8Array(MAX_MESSAGE_BYTES + 1))).toThrow(InboxError);
    });
});

describe('canary inbox message selection', () => {
    const store = (
        messages: Array<{ key: string; at: number; options?: EmailOptions; size?: number }>
    ): InboxStore & {
        reads: string[];
    } => {
        const reads: string[] = [];
        return {
            reads,
            list: async prefix =>
                messages
                    .filter(m => m.key.startsWith(prefix))
                    .map((m): InboxObject => ({
                        key: m.key,
                        lastModified: m.at,
                        size: m.size ?? 100,
                    })),
            get: async key => {
                reads.push(key);
                const message = messages.find(m => m.key === key)!;
                return new TextEncoder().encode(buildEmail(message.options!));
            },
        };
    };

    it('returns the newest trusted message of the requested kind after the request time', async () => {
        const inbox = store([
            { key: 'inbox/hold-01/old', at: 1_000, options: codeEmail(TO, '11111111') },
            { key: 'inbox/hold-01/started', at: 5_000, options: startedEmail(TO) },
            { key: 'inbox/hold-01/new', at: 4_000, options: codeEmail(TO, '22222222') },
            {
                key: 'inbox/hold-01/foreign',
                at: 6_000,
                options: { ...codeEmail(TO, '33333333'), from: 'x@postmark.example.com' },
            },
            { key: 'inbox/hold-01/AMAZON_SES_SETUP_NOTIFICATION', at: 7_000 },
            { key: 'inbox/hold-10/other', at: 8_000, options: codeEmail(TO, '44444444') },
        ]);
        const result = await findMessage(inbox, 'inbox/hold-01/', 'code', 3_000, policy);
        expect(result.found).toMatchObject({
            key: 'inbox/hold-01/new',
            template: { code: '22222222' },
        });
        expect(result.untrusted).toBe(0);
        expect(inbox.reads).not.toContain('inbox/hold-01/old');
        expect(inbox.reads).not.toContain('inbox/hold-01/AMAZON_SES_SETUP_NOTIFICATION');
    });

    it('counts untrusted and oversized candidates without satisfying the step', async () => {
        const inbox = store([
            {
                key: 'inbox/hold-01/forged',
                at: 4_000,
                options: { ...codeEmail(TO, '12345678'), spam: 'FAIL' },
            },
            { key: 'inbox/hold-01/huge', at: 5_000, size: MAX_MESSAGE_BYTES + 1 },
        ]);
        const result = await findMessage(inbox, 'inbox/hold-01/', 'code', 0, policy);
        expect(result).toEqual({ untrusted: 2 });
        expect(inbox.reads).toEqual(['inbox/hold-01/forged']);
    });

    it('reads at most ten candidates per poll', async () => {
        const inbox = store(
            Array.from({ length: 15 }, (_, index) => ({
                key: `inbox/hold-01/${index}`,
                at: 10_000 + index,
                options: startedEmail(TO),
            }))
        );
        await findMessage(inbox, 'inbox/hold-01/', 'code', 0, policy);
        expect(inbox.reads).toHaveLength(10);
    });
});
