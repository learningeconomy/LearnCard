/** Local-only provisioning for the pre-created dev-email realm fixture. */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const composeFile = new URL('../../apps/learn-card-app/compose-local.yaml', import.meta.url)
    .pathname;
const email = 'dev-email@example.com';
const subject = execFileSync(
    'docker',
    [
        'compose',
        '-f',
        composeFile,
        'exec',
        '-T',
        'mongodb',
        'mongosh',
        '--quiet',
        '--eval',
        `const now = new Date(); const row = db.getSiblingDB('lca-api').authsubjects.findOneAndUpdate(
        { identityKey: 'email:${email}' },
        { $setOnInsert: { subject: '${randomUUID()}', identityKey: 'email:${email}',
            email: '${email}', emailVerified: true, createdAt: now, lastLoginAt: now } },
        { upsert: true, returnDocument: 'after' }); print(row.subject);`,
    ],
    { encoding: 'utf8' }
).trim();
if (!/^[0-9a-f-]{36}$/.test(subject)) throw new Error('Invalid local subject');

const origin = 'http://localhost:8081';
const tokenResponse = await fetch(`${origin}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin',
        grant_type: 'password',
    }),
});
if (!tokenResponse.ok) throw new Error('Local Keycloak admin sign-in failed');
const { access_token: accessToken } = await tokenResponse.json();
const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
const adminUrl = `${origin}/admin/realms/learncard`;
const users = await fetch(`${adminUrl}/users?username=dev-email&exact=true`, { headers }).then(
    response => response.json()
);
const user = users[0];
if (users.length !== 1 || user.email !== email)
    throw new Error('Expected synthetic dev-email fixture');
const linkUrl = `${adminUrl}/users/${user.id}/federated-identity`;
const links = await fetch(linkUrl, { headers }).then(response => response.json());
const existing = links.find(link => link.identityProvider === 'lca-api');
if (existing && existing.userId !== subject)
    throw new Error('Existing link differs; refusing to overwrite it');
if (!existing) {
    const response = await fetch(`${linkUrl}/lca-api`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ identityProvider: 'lca-api', userId: subject, userName: subject }),
    });
    if (!response.ok) throw new Error(`Local fixture linking failed (${response.status})`);
}
process.stdout.write('Local dev-email federated identity is provisioned.\n');
