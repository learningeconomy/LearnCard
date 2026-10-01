import { describe, expect, it } from 'vitest';
import { createHmac, createPrivateKey } from 'node:crypto';
import { SignJWT, decodeJwt, decodeProtectedHeader } from 'jose';
import { environment } from '@environment';
import { ServiceAccount } from '@models';
import { neogma } from '@instance';
import { exchangeServiceAccountCredential } from '@accesslayer/service-account/auth';
import { verifyServiceAccountToken } from '@helpers/service-account-auth.helpers';
import {
    setupServiceAccount,
    partnerContext,
    partnerClient,
} from './helpers/service-account.helpers';
import { getClient } from './helpers/getClient';

describe('ServiceAccount authentication', () => {
    it.each(['audience', 'expiry', 'tampering'])(
        'rejects invalid token %s at context creation',
        async invalid => {
            const { account, client } = await setupServiceAccount();
            const issued = await client.installIntent.issueServiceAccountCredential({
                serviceAccountId: account.id,
            });
            const token = await exchangeServiceAccountCredential(account.id, issued.secret);
            const header = decodeProtectedHeader(token);
            const payload = decodeJwt(token);
            const seed = createHmac('sha256', environment.SEED)
                .update('educationos/v1/integration-signing')
                .digest();
            const key = createPrivateKey({
                key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
                type: 'pkcs8',
                format: 'der',
            });
            let invalidToken = await new SignJWT({
                ...payload,
                ...(invalid === 'audience' ? { aud: 'learncard' } : {}),
                ...(invalid === 'expiry' ? { iat: 0, exp: 1 } : {}),
            })
                .setProtectedHeader({ alg: 'EdDSA', typ: header.typ, kid: header.kid })
                .sign(key);
            if (invalid === 'tampering') {
                const parts = invalidToken.split('.');
                parts[1] = Buffer.from(JSON.stringify({ ...payload, sub: 'forged' })).toString(
                    'base64url'
                );
                invalidToken = parts.join('.');
            }
            await expect(partnerContext(invalidToken)).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        }
    );
    it('preserves delegated API-token scope restrictions for OWNER credential management', async () => {
        const { account, profileId } = await setupServiceAccount();
        const stored = await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: $profileId}) RETURN p.did AS did',
            { profileId }
        );
        const restricted = getClient({
            did: stored.records[0]!.get('did'),
            isChallengeValid: true,
            scope: 'profiles:read',
        });
        await expect(
            restricted.installIntent.issueServiceAccountCredential({ serviceAccountId: account.id })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            restricted.installIntent.emergencyRevokeServiceAccount({ serviceAccountId: account.id })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
    it('issues a once-returned secret, stores only its verifier and exchanges while PROVISIONED', async () => {
        const { account, client } = await setupServiceAccount();
        const issued = await client.installIntent.issueServiceAccountCredential({
            serviceAccountId: account.id,
        });
        expect(Buffer.from(issued.secret, 'base64url').length).toBeGreaterThanOrEqual(32);
        const stored = await ServiceAccount.findOne({ where: { id: account.id }, plain: true });
        expect(JSON.stringify(stored)).not.toContain(issued.secret);
        expect(stored?.credentialVerifier).toMatch(/^[a-f0-9]{64}$/);
        expect(Date.parse(issued.expiresAt) - Date.now()).toBeGreaterThan(89 * 86400000);
        const { token, expiresIn } = await getClient().installIntent.exchangeServiceAccountToken({
            serviceAccountId: account.id,
            secret: issued.secret,
        });
        expect(expiresIn).toBe(300);
        expect(await verifyServiceAccountToken(token)).toMatchObject({
            sub: account.id,
            installId: account.installId,
            ecosystemId: account.ecosystemId,
            gen: 1,
        });
        await expect(exchangeServiceAccountCredential(account.id, 'wrong')).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('requires an operator of the install ecosystem for issuance and emergency revocation', async () => {
        const { account } = await setupServiceAccount();
        const outsider = await setupServiceAccount();
        await expect(
            outsider.client.installIntent.issueServiceAccountCredential({
                serviceAccountId: account.id,
            })
        ).rejects.toThrow();
        await expect(
            outsider.client.installIntent.emergencyRevokeServiceAccount({
                serviceAccountId: account.id,
            })
        ).rejects.toThrow();
        await expect(
            getClient().installIntent.issueServiceAccountCredential({
                serviceAccountId: account.id,
            })
        ).rejects.toThrow();
    });

    it('rejects expired secrets and old secrets after reissue; generation changes invalidate old tokens live', async () => {
        const { account, client } = await setupServiceAccount();
        const first = await client.installIntent.issueServiceAccountCredential({
            serviceAccountId: account.id,
        });
        const oldToken = await exchangeServiceAccountCredential(account.id, first.secret);
        const second = await client.installIntent.issueServiceAccountCredential({
            serviceAccountId: account.id,
        });
        expect(second.secret).not.toBe(first.secret);
        await expect(exchangeServiceAccountCredential(account.id, first.secret)).rejects.toThrow();
        const current = await verifyServiceAccountToken(
            await exchangeServiceAccountCredential(account.id, second.secret)
        );
        expect(current.gen).toBe((await verifyServiceAccountToken(oldToken)).gen + 1);
        await neogma.queryRunner.run(
            'MATCH (sa:ServiceAccount {id: $id}) SET sa.credentialExpiresAt = $expired',
            { id: account.id, expired: new Date(0).toISOString() }
        );
        await expect(exchangeServiceAccountCredential(account.id, second.secret)).rejects.toThrow();
    });

    it.each(['DISABLED', 'REVOKED'])('rejects exchange for %s accounts', async status => {
        const { account, client } = await setupServiceAccount();
        const issued = await client.installIntent.issueServiceAccountCredential({
            serviceAccountId: account.id,
        });
        await neogma.queryRunner.run(
            'MATCH (sa:ServiceAccount {id: $id}) SET sa.status = $status',
            { id: account.id, status }
        );
        await expect(exchangeServiceAccountCredential(account.id, issued.secret)).rejects.toThrow();
    });

    it('never creates a Profile/act-as principal and a normal LearnCard route rejects the token', async () => {
        const { account, client } = await setupServiceAccount();
        const issued = await client.installIntent.issueServiceAccountCredential({
            serviceAccountId: account.id,
        });
        const token = await exchangeServiceAccountCredential(account.id, issued.secret);
        const context = await partnerContext(token);
        expect(context.user).toBeUndefined();
        expect(context.actAs).toBeUndefined();
        expect(context.serviceAccount?.claims.sub).toBe(account.id);
        await expect(
            (await partnerClient(token)).installIntent.listInstallIntents({
                ecosystemId: account.ecosystemId,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('rate limits unauthenticated exchange attempts', async () => {
        const { account } = await setupServiceAccount();
        const anonymous = getClient();
        for (let n = 0; n < 10; n++)
            await expect(
                anonymous.installIntent.exchangeServiceAccountToken({
                    serviceAccountId: account.id,
                    secret: 'wrong',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            anonymous.installIntent.exchangeServiceAccountToken({
                serviceAccountId: account.id,
                secret: 'wrong',
            })
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });
});
