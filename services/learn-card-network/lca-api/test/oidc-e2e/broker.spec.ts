import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import {
    test,
    admin,
    completeLogin,
    issueTicket,
    redeemCode,
    redis,
    rejectTicket,
    subjects,
    usersFor,
} from './fixtures';

test('new and returning users reach the same account without a web form', async ({
    browser,
    request,
    account,
}) => {
    expect(await usersFor(account.email)).toEqual([]);
    const first = await completeLogin(
        browser,
        await issueTicket(request, account.email),
        account.email
    );
    const subject = await subjects.findOne({ identityKey: account.identityKey });
    const returning = await completeLogin(
        browser,
        await issueTicket(request, account.email),
        account.email
    );
    expect(returning).toBe(first);
    expect(await subjects.countDocuments({ identityKey: account.identityKey })).toBe(1);
    expect((await subjects.findOne({ identityKey: account.identityKey }))?.subject).toBe(
        subject?.subject
    );
});

test('a migrated user keeps the pre-linked Keycloak account', async ({
    browser,
    request,
    account,
}) => {
    const subject = randomUUID();
    await subjects.insertOne({
        identityKey: account.identityKey,
        subject,
        email: account.email,
        emailVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
    });
    const response = await admin('users', {
        method: 'POST',
        body: JSON.stringify({
            username: `migrated-${subject}`,
            email: account.email,
            emailVerified: true,
            enabled: true,
            federatedIdentities: [
                { identityProvider: 'lca-api', userId: subject, userName: subject },
            ],
        }),
    });
    expect(response.status).toBe(201);
    const id = response.headers.get('location')!.split('/').at(-1);
    expect(
        await completeLogin(browser, await issueTicket(request, account.email), account.email)
    ).toBe(id);
    expect((await subjects.findOne({ identityKey: account.identityKey }))?.subject).toBe(subject);
});

test('a consumed ticket cannot create another Keycloak session', async ({
    browser,
    request,
    account,
}) => {
    const ticket = await issueTicket(request, account.email);
    const id = await completeLogin(browser, ticket, account.email);
    const before = await (await admin(`users/${id}/sessions`)).json();
    expect(before).toHaveLength(1);
    await rejectTicket(browser, ticket);
    const after = await (await admin(`users/${id}/sessions`)).json();
    expect(after.map((session: { id: string }) => session.id)).toEqual(
        before.map((session: { id: string }) => session.id)
    );
});

test('an expired ticket cannot create a Keycloak user', async ({ browser, request, account }) => {
    const ticket = await issueTicket(request, account.email);
    // issueTicket checks the production 60-second TTL. Shorten this one key to
    // exercise actual Redis expiration without adding a minute to each run.
    expect(await redis.pexpire(`login-ticket:${ticket}`, 1)).toBe(1);
    await expect.poll(() => redis.exists(`login-ticket:${ticket}`)).toBe(0);
    await rejectTicket(browser, ticket);
    expect(await usersFor(account.email)).toEqual([]);
});

test('a wrong email code preserves the correct code, which can be redeemed only once concurrently', async ({
    browser,
    request,
    account,
}) => {
    await redis.set(`login-code:${account.email}`, '123456', 'EX', 300);
    expect(await redeemCode(request, account.email, '000000')).toMatchObject({ success: false });
    expect(await redis.get(`login-code:${account.email}`)).toBe('123456');
    const results = await Promise.all([
        redeemCode(request, account.email, '123456'),
        redeemCode(request, account.email, '123456'),
    ]);
    expect(results.filter(result => result.success)).toHaveLength(1);
    expect(results.filter(result => !result.success)).toHaveLength(1);
    expect(await redis.exists(`login-code:${account.email}`)).toBe(0);
    await completeLogin(browser, results.find(result => result.success)!.ticket!, account.email);
    expect(await subjects.countDocuments({ identityKey: account.identityKey })).toBe(1);
});
