import { renderEmail } from '@learncard/email-templates';
import { describe, expect, it } from 'vitest';
import { findParsed, InboxError, parseMessage, type InboxStore } from '../tier3/inbox';
import { buildEmail, codeEmail, SENDER, type EmailOptions } from '../tier3/test-fakes';
import { loginTrustPolicy, parseLoginCode, waitForLoginCode } from './login-mail';
import { LOGIN_DKIM_DOMAIN, LOGIN_SENDER, loginBody, loginEmail, loginMail } from './test-world';

const TO = 'canary-staging+1@inbox.example.com';
const PREFIX = 'inbox/hold-01/';
const policy = loginTrustPolicy(loginMail, TO);
const parse = (options: EmailOptions) =>
    parseMessage(new TextEncoder().encode(buildEmail(options)));

const storeOf = (messages: { at: number; options: EmailOptions }[]): InboxStore => {
    const entries = messages.map((message, index) => ({
        key: `${PREFIX}${String(index).padStart(4, '0')}`,
        lastModified: message.at,
        body: buildEmail(message.options),
    }));
    return {
        list: async prefix =>
            entries
                .filter(entry => entry.key.startsWith(prefix))
                .map(entry => ({
                    key: entry.key,
                    lastModified: entry.lastModified,
                    size: entry.body.length,
                })),
        get: async key => new TextEncoder().encode(entries.find(entry => entry.key === key)!.body),
    };
};
const find = (messages: { at: number; options: EmailOptions }[], since = 0) =>
    findParsed(storeOf(messages), PREFIX, since, policy, parseLoginCode);

describe('login-code mail parser', () => {
    it('extracts the code from the rendered template shape', () => {
        expect(parseLoginCode(parse(loginEmail(TO, '482913')))).toEqual({
            brand: 'LearnCard',
            code: '482913',
        });
    });

    it.each(['quoted-printable', 'base64'] as const)('decodes %s bodies', encoding => {
        expect(parseLoginCode(parse({ ...loginEmail(TO, '104729'), encoding }))?.code).toBe(
            '104729'
        );
    });

    it('ignores mail with another subject', () => {
        expect(parseLoginCode(parse(codeEmail(TO, '12345678')))).toBeUndefined();
    });

    it.each([
        ['two 6-digit runs', loginBody('482913').replace('Hello,', 'Hello, 777777')],
        [
            'code not alone on its line',
            loginBody('482913').replace('\n482913\n', '\nCode: 482913\n'),
        ],
        [
            'no Verification code label',
            loginBody('482913').replace('Verification code', 'Your code'),
        ],
        ['hosted fallback template', 'Your login code is 482913. It expires in 5 minutes.'],
        ['no code', loginBody('48291')],
    ])('rejects %s as malformed', (_name, body) => {
        expect(() => parseLoginCode(parse({ ...loginEmail(TO, '0'), body }))).toThrow(InboxError);
    });

    it('drift: parses the real login-verification-code template', async () => {
        const rendered = await renderEmail(
            'login-verification-code',
            {},
            { verificationCode: '904152', verificationEmail: TO, recipient: { name: TO } } as never,
            'en'
        );
        const message = parse({
            from: LOGIN_SENDER,
            to: TO,
            subject: rendered.subject,
            body: rendered.text,
        });
        expect(parseLoginCode(message)).toMatchObject({ code: '904152' });
    });
});

describe('login-code mail trust and selection', () => {
    it('finds a trusted login mail', async () => {
        const result = await find([{ at: 1_000, options: loginEmail(TO, '482913') }]);
        expect(result.found?.value.code).toBe('482913');
    });

    it('skips a non-allowlisted sender silently', async () => {
        const result = await find([
            {
                at: 1_000,
                options: { ...loginEmail(TO, '482913'), from: 'login@other.example.org' },
            },
        ]);
        expect(result).toEqual({ untrusted: 0, malformed: 0 });
    });

    it('skips enclave recovery mail (other sender, 8 digits)', async () => {
        const result = await find([
            { at: 1_000, options: { ...codeEmail(TO, '12345678'), from: SENDER } },
        ]);
        expect(result.found).toBeUndefined();
    });

    const untrusted: [string, Partial<EmailOptions>][] = [
        ['a forged second From', { prepend: [`From: ${LOGIN_SENDER}`] }],
        [
            'unaligned DKIM',
            {
                authResults: `amazonses.com; spf=pass smtp.mailfrom=b@x.example.org; dkim=pass header.i=@other.example.org; dmarc=pass header.from=${LOGIN_DKIM_DOMAIN};`,
            },
        ],
        [
            'a second failing DKIM',
            {
                authResults: `amazonses.com; spf=pass smtp.mailfrom=b@${LOGIN_DKIM_DOMAIN}; dkim=pass header.i=@${LOGIN_DKIM_DOMAIN}; dkim=fail header.i=@pm.example.net; dmarc=pass header.from=${LOGIN_DKIM_DOMAIN};`,
            },
        ],
        [
            'DMARC fail',
            {
                authResults: `amazonses.com; spf=pass smtp.mailfrom=b@${LOGIN_DKIM_DOMAIN}; dkim=pass header.i=@${LOGIN_DKIM_DOMAIN}; dmarc=fail header.from=${LOGIN_DKIM_DOMAIN};`,
            },
        ],
        ['a To mismatch', { to: 'canary-staging+2@inbox.example.com' }],
        ['a Cc', { original: [`Cc: ${TO}`] }],
        ['a spam verdict', { spam: 'FAIL' }],
    ];
    it.each(untrusted)(
        'counts %s as untrusted and never returns its code',
        async (_name, change) => {
            const result = await find([
                { at: 1_000, options: { ...loginEmail(TO, '482913'), ...change } },
            ]);
            expect(result.found).toBeUndefined();
            expect(result.untrusted).toBe(1);
        }
    );

    it('counts malformed trusted mail separately', async () => {
        const result = await find([
            {
                at: 1_000,
                options: { ...loginEmail(TO, '482913'), body: 'Your code is 482913 or 111111' },
            },
        ]);
        expect(result).toEqual({ untrusted: 0, malformed: 1 });
    });

    it('ignores mail older than the send', async () => {
        const result = await find([{ at: 1_000, options: loginEmail(TO, '482913') }], 60_000);
        expect(result.found).toBeUndefined();
    });

    it('takes the newest trusted code (each send replaces the previous one)', async () => {
        const result = await find([
            { at: 1_000, options: loginEmail(TO, '111222') },
            { at: 5_000, options: loginEmail(TO, '333444') },
        ]);
        expect(result.found?.value.code).toBe('333444');
    });

    it('polls until the deadline, then gives up', async () => {
        let now = 0;
        const store = storeOf([]);
        const result = await waitForLoginCode({
            store,
            prefix: PREFIX,
            since: 0,
            policy,
            timeoutMs: 60_000,
            pollMs: 10_000,
            now: () => now,
            sleep: async ms => {
                now += ms;
            },
        });
        expect(result.code).toBeUndefined();
        expect(now).toBe(60_000);
    });
});
