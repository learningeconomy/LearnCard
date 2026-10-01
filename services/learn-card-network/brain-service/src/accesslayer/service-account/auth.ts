import { randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { neogma } from '@instance';
import { ServiceAccount } from '@models';
import { getInstallIntentReconcilerRuntimeEnvironment } from '@environment';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import {
    matchesRenewalSecret,
    renewalSecretVerifier,
    signServiceAccountToken,
} from '@helpers/service-account-auth.helpers';

export const readServiceAccount = async (id: string) =>
    ServiceAccount.findOne({ where: { id }, plain: true });

export const issueServiceAccountCredential = async (id: string, actorProfileId: string) => {
    const secret = randomBytes(32).toString('base64url');
    const configuredDays = Number(
        getInstallIntentReconcilerRuntimeEnvironment().SERVICE_ACCOUNT_CREDENTIAL_DAYS ?? 90
    );
    if (!Number.isFinite(configuredDays) || configuredDays <= 0 || configuredDays > 365)
        throw new Error('SERVICE_ACCOUNT_CREDENTIAL_DAYS must be in (0, 365]');
    const expiresAt = new Date(Date.now() + configuredDays * 86400000).toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (sa:ServiceAccount {id: $id}) WHERE sa.status IN ['PROVISIONED', 'ENABLED']
         SET sa.credentialGeneration = sa.credentialGeneration + 1.0
         WITH sa WHERE sa.status IN ['PROVISIONED', 'ENABLED']
         SET sa.credentialVerifier = $verifier, sa.credentialExpiresAt = $expiresAt
         RETURN sa.ecosystemId AS ecosystemId`,
        { id, verifier: renewalSecretVerifier(id, secret), expiresAt }
    );
    if (!result.records.length)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Account cannot receive credentials' });
    await createInstallIntentAuditEvent({
        action: 'SERVICE_ACCOUNT_CREDENTIAL_ISSUED',
        ecosystemId: result.records[0]!.get('ecosystemId'),
        actorProfileId,
        afterSummary: { serviceAccountId: id, expiresAt },
    });
    return { serviceAccountId: id, secret, expiresAt };
};

export const emergencyRevokeServiceAccount = async (
    id: string,
    actorProfileId: string
): Promise<void> => {
    const result = await neogma.queryRunner.run(
        `MATCH (sa:ServiceAccount {id: $id}) WHERE sa.status <> 'REVOKED'
         SET sa.status = 'DISABLED', sa.disabledCause = 'OPERATOR', sa.credentialGeneration = sa.credentialGeneration + 1.0
         REMOVE sa.credentialVerifier, sa.credentialExpiresAt
         RETURN sa.ecosystemId AS ecosystemId`,
        { id }
    );
    if (!result.records.length) throw new TRPCError({ code: 'NOT_FOUND' });
    await createInstallIntentAuditEvent({
        action: 'SERVICE_ACCOUNT_EMERGENCY_REVOKED',
        ecosystemId: result.records[0]!.get('ecosystemId'),
        actorProfileId,
        afterSummary: { serviceAccountId: id },
    });
};

export const exchangeServiceAccountCredential = async (
    id: string,
    secret: string
): Promise<string> => {
    const account = await readServiceAccount(id);
    const matches = matchesRenewalSecret(id, secret, account?.credentialVerifier);
    if (
        !account ||
        !matches ||
        !['PROVISIONED', 'ENABLED'].includes(account.status) ||
        !account.credentialExpiresAt ||
        !(Date.parse(account.credentialExpiresAt) > Date.now())
    )
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid integration credential' });
    return signServiceAccountToken(account);
};
