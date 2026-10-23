import { required, record, secureUrl, requestJson } from './support';

/** Read-only A10 checks, using a master-realm service account over private TLS. */
export const checkProduction = async (): Promise<void> => {
    const base = secureUrl(required('KEYCLOAK_BASE_URL'));
    const clientId = required('KEYCLOAK_CLIENT_ID');
    const clientSecret = required('KEYCLOAK_CLIENT_SECRET');
    const realms = (process.env.KEYCLOAK_REALMS ?? 'learncard')
        .split(',')
        .map(value => value.trim());
    if (realms.some(value => !value || value === 'master'))
        throw new Error('Specify managed non-master realms');
    const token = record(
        await requestJson(`${base}/realms/master/protocol/openid-connect/token`, {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }),
        })
    );
    if (typeof token.access_token !== 'string' || !token.access_token)
        throw new Error('Missing access token');
    const admin = async (path: string): Promise<unknown> =>
        requestJson(`${base}/admin/realms/${path}`, {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
    let failures = 0;
    const assertCheck = (condition: boolean, label: string): void => {
        process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
        if (!condition) failures += 1;
    };
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin';
    const users = await admin(
        `master/users?${new URLSearchParams({ username, exact: 'true', max: '1' })}`
    );
    if (!Array.isArray(users)) throw new Error('Invalid users response');
    assertCheck(users.length === 0, 'master: bootstrap administrator absent');
    for (const realm of realms) {
        const path = encodeURIComponent(realm);
        const configuration = record(await admin(path));
        assertCheck(
            configuration.bruteForceProtected === true,
            `${realm}: brute-force protection enabled`
        );
        const events = record(await admin(`${path}/events/config`));
        assertCheck(events.eventsEnabled === true, `${realm}: user events saved`);
        assertCheck(events.adminEventsEnabled === true, `${realm}: admin events saved`);
        assertCheck(
            Array.isArray(events.eventsListeners) &&
                events.eventsListeners.includes('jboss-logging'),
            `${realm}: event logger enabled`
        );
        let foundApp = false;
        let count = 0;
        // Paginate explicitly: never silently check only the first client page.
        for (let first = 0; ; first += 100) {
            const clients = await admin(`${path}/clients?first=${first}&max=100`);
            if (!Array.isArray(clients)) throw new Error('Invalid clients response');
            for (const value of clients) {
                const client = record(value);
                if (typeof client.id !== 'string' || typeof client.clientId !== 'string')
                    throw new Error('Invalid client');
                const detail = record(
                    await admin(`${path}/clients/${encodeURIComponent(client.id)}`)
                );
                assertCheck(
                    detail.directAccessGrantsEnabled === false,
                    `${realm}/${client.clientId}: password grant disabled`
                );
                if (client.clientId === 'learncard-app') {
                    foundApp = true;
                    const attributes = record(detail.attributes ?? {});
                    assertCheck(
                        attributes['pkce.code.challenge.method'] === 'S256',
                        `${realm}/learncard-app: PKCE S256 enforced`
                    );
                }
                count += 1;
            }
            if (clients.length < 100) break;
        }
        assertCheck(count > 0, `${realm}: client inventory is not empty`);
        assertCheck(foundApp, `${realm}: learncard-app exists`);
    }
    process.stdout.write(
        'AWS IAM/state-policy and public-surface checks remain separate A2/A10 gates.\n'
    );
    if (failures > 0) throw new Error(`${failures} security assertions failed`);
};

if (import.meta.main) {
    checkProduction().catch((error: unknown): void => {
        process.stderr.write(
            `${error instanceof Error ? error.message : 'Security check failed'}\n`
        );
        process.exitCode = 1;
    });
}
