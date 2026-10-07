#!/usr/bin/env bun
import { execFileSync } from 'node:child_process';

interface ClientRepresentation {
    id: string;
    clientId: string;
}
interface RoleRepresentation {
    id: string;
    name: string;
}

/** Provision a narrowly scoped master service account, without granting master admin. */
export const provisionRealmAutomation = async (
    url: string,
    password: string,
    realms: string[]
): Promise<string> => {
    const tokenResponse = await fetch(`${url}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: 'admin',
            password,
        }),
    });
    if (!tokenResponse.ok) throw new Error(`Bootstrap sign-in failed (${tokenResponse.status}).`);
    const token: { access_token: string } = await tokenResponse.json();
    const request = async <T>(path: string, method = 'GET', body?: unknown): Promise<T> => {
        const response = await fetch(`${url}/admin/realms/master/${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!response.ok)
            throw new Error(`Bootstrap ${method} ${path} failed (${response.status}).`);
        return response.status === 204 || response.status === 201
            ? (undefined as T)
            : ((await response.json()) as T);
    };
    // Validate every existing target before creating a privileged automation client.
    const targets: ClientRepresentation[] = [];
    for (const realm of realms) {
        if (realm === 'master' || !/^[a-zA-Z0-9_-]+$/.test(realm))
            throw new Error('Invalid application realm.');
        const clients = await request<ClientRepresentation[]>(
            `clients?clientId=${encodeURIComponent(`${realm}-realm`)}`
        );
        if (clients.length !== 1)
            throw new Error(`Apply application realm ${realm} with bootstrap admin first.`);
        targets.push(clients[0]);
    }
    let clients = await request<ClientRepresentation[]>('clients?clientId=terraform-realm');
    if (clients.length === 0) {
        await request('clients', 'POST', {
            clientId: 'terraform-realm',
            protocol: 'openid-connect',
            enabled: true,
            publicClient: false,
            serviceAccountsEnabled: true,
            standardFlowEnabled: false,
            directAccessGrantsEnabled: false,
            implicitFlowEnabled: false,
        });
        clients = await request<ClientRepresentation[]>('clients?clientId=terraform-realm');
    }
    if (clients.length !== 1) throw new Error('Expected exactly one terraform-realm client.');
    const client = clients[0];
    const account = await request<{ id: string }>(`clients/${client.id}/service-account-user`);
    // create-realm grants administration of newly created realms to their creator.
    // Existing realms receive only the management roles needed by this module.
    const createRealm = await request<RoleRepresentation>('roles/create-realm');
    await request(`users/${account.id}/role-mappings/realm`, 'POST', [createRealm]);
    for (const target of targets) {
        const roles: RoleRepresentation[] = [];
        for (const name of [
            'view-realm',
            'manage-realm',
            'view-clients',
            'manage-clients',
            'manage-identity-providers',
            'view-events',
            'manage-events',
        ]) {
            roles.push(await request<RoleRepresentation>(`clients/${target.id}/roles/${name}`));
        }
        await request(`users/${account.id}/role-mappings/clients/${target.id}`, 'POST', roles);
    }
    const secret = await request<{ value: string }>(`clients/${client.id}/client-secret`);
    return secret.value;
};

const aws = (args: string[], input?: string): string =>
    execFileSync('aws', args, {
        encoding: 'utf8',
        input,
        stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

const main = async (): Promise<void> => {
    const [environment, ...realms] = process.argv.slice(2);
    const accounts: Record<string, string> = {
        staging: '281762601323',
        production: '206533012615',
    };
    if (!accounts[environment] || realms.length === 0) {
        throw new Error(
            'Usage: bun infra/keycloak/scripts/bootstrap-realm.ts staging|production <realm...>'
        );
    }
    if (
        aws(['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text']) !==
        accounts[environment]
    ) {
        throw new Error('Wrong AWS account.');
    }
    const prefix = `learncard-keycloak/${environment}`;
    const url =
        process.env.KEYCLOAK_ADMIN_URL ??
        aws([
            'ssm',
            'get-parameter',
            '--name',
            `/${prefix}/service/admin_api_url`,
            '--query',
            'Parameter.Value',
            '--output',
            'text',
        ]);
    if (!url.startsWith('https://'))
        throw new Error('Bootstrap requires HTTPS and private admin connectivity.');
    const password = aws([
        'secretsmanager',
        'get-secret-value',
        '--secret-id',
        `${prefix}/bootstrap-admin`,
        '--query',
        'SecretString',
        '--output',
        'text',
    ]);
    const secret = await provisionRealmAutomation(url, password, realms);
    // The human creates the secret container beforehand. Values go through stdin,
    // never command arguments, stdout, a temporary file or Terraform output.
    aws(
        [
            'secretsmanager',
            'put-secret-value',
            '--secret-id',
            `${prefix}/terraform-realm`,
            '--secret-string',
            'file:///dev/stdin',
        ],
        secret
    );
    process.stdout.write(
        'Automation credentials stored. Verify a client-credentials plan before manually deleting admin.\n'
    );
};

if (import.meta.main) {
    main().catch((error: unknown): void => {
        // Subprocess errors may carry secret-bearing output; never print them.
        process.stderr.write(
            error instanceof Error && !('stderr' in error)
                ? `${error.message}\n`
                : 'Bootstrap AWS operation failed; check account, region and permissions.\n'
        );
        process.exitCode = 1;
    });
}
