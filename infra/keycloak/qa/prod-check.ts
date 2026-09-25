/**
 * Production security checklist (A10).
 * Asserts via Keycloak admin REST API:
 * - No bootstrap admin user
 * - All clients have directAccessGrantsEnabled=false
 * - learncard-app has PKCE S256
 * - Realm has bruteForceProtected=true
 * - Events enabled
 *
 * Requires: KEYCLOAK_ADMIN_URL, KEYCLOAK_ADMIN_USER, KEYCLOAK_ADMIN_PASSWORD
 * Exit code 1 on any assertion failure.
 */

import { strict as assert } from 'assert';

const adminUrl = process.env.KEYCLOAK_ADMIN_URL || 'https://admin.auth.learncard.app';
const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'terraform-realm';
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || '';
const realm = 'learncard';
const bootstrapAdminUsername = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';

let accessToken: string;

/**
 * Obtain admin access token via password grant.
 */
async function getAdminToken(): Promise<string> {
    const tokenUrl = `${adminUrl}/realms/master/protocol/openid-connect/token`;
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: adminUser,
            password: adminPassword,
        }).toString(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get admin token: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
}

/**
 * Make authenticated admin API call.
 */
async function adminApi(path: string): Promise<unknown> {
    const response = await fetch(`${adminUrl}/admin/realms${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * A10.1: No bootstrap admin user in master realm.
 */
async function checkNoBootstrapAdmin(): Promise<void> {
    console.log('A10.1: Checking no bootstrap admin user...');
    const users = (await adminApi('/master/users')) as Array<{ username: string }>;
    const bootstrapExists = users.some(u => u.username === bootstrapAdminUsername);
    assert(!bootstrapExists, `Bootstrap admin user "${bootstrapAdminUsername}" still exists`);
    console.log('  PASS: No bootstrap admin user');
}

/**
 * A10.2: All clients have directAccessGrantsEnabled=false.
 */
async function checkDirectAccessGrantsDisabled(): Promise<void> {
    console.log('A10.2: Checking directAccessGrantsEnabled=false on all clients...');
    const clients = (await adminApi(`/${realm}/clients`)) as Array<{
        clientId: string;
        directAccessGrantsEnabled?: boolean;
    }>;

    for (const client of clients) {
        const enabled = client.directAccessGrantsEnabled ?? false;
        assert(!enabled, `Client "${client.clientId}" has directAccessGrantsEnabled=true`);
    }
    console.log(`  PASS: All ${clients.length} clients have directAccessGrantsEnabled=false`);
}

/**
 * A10.3: learncard-app has PKCE S256.
 */
async function checkPkceS256(): Promise<void> {
    console.log('A10.3: Checking learncard-app PKCE S256...');
    const clients = (await adminApi(`/${realm}/clients`)) as Array<{
        clientId: string;
        id: string;
    }>;

    const learnCardApp = clients.find(c => c.clientId === 'learncard-app');
    assert(learnCardApp, 'learncard-app client not found');

    const client = (await adminApi(`/${realm}/clients/${learnCardApp.id}`)) as {
        attributes?: { 'pkce.code.challenge.method'?: string };
    };

    const pkceMethod = client.attributes?.['pkce.code.challenge.method'];
    assert(pkceMethod === 'S256', `learncard-app PKCE method is "${pkceMethod}", expected "S256"`);
    console.log('  PASS: learncard-app has PKCE S256');
}

/**
 * A10.4: Realm has bruteForceProtected=true.
 */
async function checkBruteForceProtection(): Promise<void> {
    console.log('A10.4: Checking realm bruteForceProtected=true...');
    const realmData = (await adminApi(`/${realm}`)) as { bruteForceProtected?: boolean };
    assert(realmData.bruteForceProtected === true, 'Realm bruteForceProtected is not true');
    console.log('  PASS: Realm has bruteForceProtected=true');
}

/**
 * A10.5: Events enabled.
 */
async function checkEventsEnabled(): Promise<void> {
    console.log('A10.5: Checking events enabled...');
    const realmData = (await adminApi(`/${realm}`)) as { eventsEnabled?: boolean };
    assert(realmData.eventsEnabled === true, 'Realm eventsEnabled is not true');
    console.log('  PASS: Events enabled');
}

/**
 * Main.
 */
async function main(): Promise<void> {
    try {
        console.log(`Production security checklist (A10) for realm "${realm}"`);
        console.log(`Admin URL: ${adminUrl}\n`);

        accessToken = await getAdminToken();
        console.log('Authenticated as admin\n');

        await checkNoBootstrapAdmin();
        await checkDirectAccessGrantsDisabled();
        await checkPkceS256();
        await checkBruteForceProtection();
        await checkEventsEnabled();

        console.log('\nAll assertions passed.');
        process.exit(0);
    } catch (error) {
        console.error('\nAssertion failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
