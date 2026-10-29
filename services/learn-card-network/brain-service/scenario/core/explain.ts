/**
 * Runner-side diagnosis for opaque failures. Partners keep seeing brain's deliberately
 * opaque messages; only the runner reads the ServiceAccount and memberships to say which
 * precondition actually failed.
 */
import type { ScenarioPort, ServiceAccountView } from '../port';
import type { ScenarioIds } from './ids';
import { ScenarioError, toScenarioError } from './expect';

const SERVICES: Record<string, { name: string; start: string }> = {
    '4000': {
        name: 'brain',
        start: 'docker compose -f apps/learn-card-app/compose-local.yaml --profile console up brain',
    },
    '5100': {
        name: 'lca-api',
        start: 'docker compose -f apps/learn-card-app/compose-local.yaml up api',
    },
    '3200': {
        name: 'console-bff',
        start: 'bun run dev in services/learn-card-network/console-bff (or compose --profile console)',
    },
    '5173': { name: 'console-web', start: 'bun run dev in apps/learn-cloud-console' },
    '7687': { name: 'neo4j', start: 'compose-local `neo4j` service' },
    '6379': { name: 'redis', start: 'compose-local `redis` service' },
};

const describeAccount = (account: ServiceAccountView): string =>
    `ServiceAccount ${account.id} is ${account.status}` +
    (account.disabledCause ? ` (disabledCause ${account.disabledCause})` : '') +
    (account.enableCause ? ` (enableCause ${account.enableCause})` : '') +
    `, healthFailures ${account.healthFailures ?? 0}, credentialGeneration ${account.credentialGeneration}`;

const recoveryHint = (account: ServiceAccountView): string => {
    if (account.status === 'DISABLED' && account.disabledCause === 'HEALTH') {
        return 'a passing probe re-enables it: run S07 (on-demand probe) with the partner up';
    }
    if (account.status === 'DISABLED') {
        return `no automatic recovery for ${account.disabledCause ?? 'this cause'} (OPERATOR or INVARIANT); re-install`;
    }
    if (account.status === 'PROVISIONED') {
        return 'not enabled yet: issue a credential (S06), then probe (S07)';
    }
    if (account.status === 'REVOKED') return 'the install was removed; plan a new one';
    return 'status allows credentials; check the secret the partner holds';
};

const readAccount = async (
    port: ScenarioPort,
    ids: ScenarioIds
): Promise<ServiceAccountView | null> => {
    if (ids.serviceAccountId) {
        return port.readServiceAccount({ serviceAccountId: ids.serviceAccountId });
    }
    if (ids.installId) return port.readServiceAccount({ installId: ids.installId });
    return null;
};

const explainAccountError = async (
    error: ScenarioError,
    port: ScenarioPort,
    ids: ScenarioIds
): Promise<string> => {
    const account = await readAccount(port, ids);
    if (!account) return 'no ServiceAccount found for this install yet (S05 materialises it)';

    if (error.message === 'Account cannot receive credentials') {
        return `${describeAccount(account)}; ${recoveryHint(account)}`;
    }

    // Invalid integration credential / token.
    const enabledish = account.status === 'PROVISIONED' || account.status === 'ENABLED';
    return enabledish
        ? `${describeAccount(account)}; status is fine, so the secret is wrong or expired, or a health disable bumped credentialGeneration since the token was minted: re-issue (S06) and restart the partner`
        : `${describeAccount(account)}; ${recoveryHint(account)}`;
};

const explainNoGrant = async (port: ScenarioPort, ids: ScenarioIds): Promise<string> => {
    const account = await readAccount(port, ids);
    if (!account) return 'no ServiceAccount for this install';
    if (account.status !== 'ENABLED') {
        return `ServiceAccount is not ENABLED: ${describeAccount(account)}; ${recoveryHint(account)}`;
    }
    if (ids.districtId) {
        const members = await port.listMembers(ids.districtId);
        const missing = [ids.learnerA, ids.learnerB]
            .filter(wallet => wallet !== undefined)
            .filter(wallet => !members.some(member => member.profileId === wallet.profileId))
            .map(wallet => wallet.profileId);
        if (missing.length) {
            return `ServiceAccount is ENABLED; subject not a member of ${ids.districtId}: ${missing.join(', ')}`;
        }
    }
    return `ServiceAccount is ENABLED (generation ${account.credentialGeneration}) and learners are members; the partner's token likely predates a generation bump: re-issue (S06)`;
};

/** Returns a one-line diagnosis, or undefined when there is nothing to add. Never throws. */
export const explainFailure = async (
    thrown: unknown,
    port: ScenarioPort | undefined,
    ids: ScenarioIds
): Promise<string | undefined> => {
    const error = toScenarioError(thrown);

    try {
        if (error.code === 'ECONNREFUSED') {
            const portNumber = /:(\d{2,5})\b/.exec(error.message)?.[1];
            const service = portNumber ? SERVICES[portNumber] : undefined;
            return service
                ? `${service.name} is not listening on :${portNumber}; start it with: ${service.start}`
                : `connection refused${portNumber ? ` on :${portNumber}` : ''}; is the dev stack up? (scenario doctor)`;
        }

        if (error.httpStatus === 401 && error.path?.startsWith('/auth')) {
            return 'console-bff refused the dev login; start it with CONSOLE_BFF_DEV_INSECURE_AUTH=true (its `bun run dev` script sets it)';
        }
        if (error.code === 'HTTP_401') {
            return 'console-bff returned 401; the session expired or the BFF lacks CONSOLE_BFF_DEV_INSECURE_AUTH=true';
        }

        if (!port) return undefined;

        if (
            error.message === 'Account cannot receive credentials' ||
            error.message === 'Invalid integration credential' ||
            error.message === 'Invalid integration token'
        ) {
            return await explainAccountError(error, port, ids);
        }

        if (error.message === 'NO_GRANT_FOR_SUBJECT') return await explainNoGrant(port, ids);
    } catch (explainError) {
        return `(explain failed: ${toScenarioError(explainError).message})`;
    }

    return undefined;
};
