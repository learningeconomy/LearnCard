import { randomUUID } from 'node:crypto';
import {
    DescribeSecretCommand,
    GetSecretValueCommand,
    PutSecretValueCommand,
    ResourceNotFoundException,
    SecretsManagerClient,
    UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';
import { secretSchema, type AccountSecret } from '../secrets';
import { needsHuman, ProvisionError } from './errors';

/**
 * Staged Secrets Manager writes. Provisioning never writes `AWSCURRENT`
 * directly: every write lands on a new version labelled `PROVISIONING`, which
 * the runner never reads. Only after verification is `AWSCURRENT` moved, with
 * `RemoveFromVersionId` = the placeholder version seen at classification, so a
 * concurrent change to `AWSCURRENT` makes the promotion fail (compare-and-swap).
 */
export const PROVISIONING = 'PROVISIONING';
export const CURRENT = 'AWSCURRENT';

export interface SecretMetadata {
    arn: string;
    name: string;
    /** versionId -> stages */
    versions: Record<string, string[]>;
}
export interface StagedSecretStore {
    describe(secretId: string): Promise<SecretMetadata>;
    /** `undefined` when no version carries the reference. */
    read(
        secretId: string,
        ref: { versionId: string } | { stage: string }
    ): Promise<string | undefined>;
    /** New version labelled only `PROVISIONING`; returns its version id. */
    putProvisioning(secretId: string, value: string, requestToken: string): Promise<string>;
    /** Move `stage` to `to` (or detach when `to` is undefined), removing it from `from`. */
    moveStage(
        secretId: string,
        stage: string,
        to: string | undefined,
        from: string | undefined
    ): Promise<void>;
}

export const versionWith = (metadata: SecretMetadata, stage: string): string | undefined => {
    const matches = Object.entries(metadata.versions).filter(([, stages]) =>
        stages.includes(stage)
    );
    return matches.length === 1 ? matches[0][0] : undefined;
};

export const createStagedSecretStore = (
    client = new SecretsManagerClient({ maxAttempts: 2 })
): StagedSecretStore => ({
    async describe(secretId) {
        const response = await client.send(new DescribeSecretCommand({ SecretId: secretId }));
        if (!response.ARN || !response.Name) throw new ProvisionError('secret', 'describe');
        return {
            arn: response.ARN,
            name: response.Name,
            versions: response.VersionIdsToStages ?? {},
        };
    },
    async read(secretId, ref) {
        try {
            const response = await client.send(
                new GetSecretValueCommand({
                    SecretId: secretId,
                    ...('versionId' in ref
                        ? { VersionId: ref.versionId }
                        : { VersionStage: ref.stage }),
                })
            );
            return response.SecretString;
        } catch (error) {
            if (error instanceof ResourceNotFoundException) return undefined;
            throw new ProvisionError('secret', 'read');
        }
    },
    async putProvisioning(secretId, value, requestToken) {
        const response = await client.send(
            new PutSecretValueCommand({
                SecretId: secretId,
                SecretString: value,
                VersionStages: [PROVISIONING],
                ClientRequestToken: requestToken,
            })
        );
        if (!response.VersionId) throw new ProvisionError('secret', 'write');
        return response.VersionId;
    },
    async moveStage(secretId, stage, to, from) {
        await client.send(
            new UpdateSecretVersionStageCommand({
                SecretId: secretId,
                VersionStage: stage,
                ...(to ? { MoveToVersionId: to } : {}),
                ...(from ? { RemoveFromVersionId: from } : {}),
            })
        );
    },
});

/**
 * One run's handle on its `PROVISIONING` version. Every write checks that the
 * label is still on this run's previous version (or absent before the first
 * write), writes, and confirms the label landed on the new version. A second
 * run on the same label therefore aborts instead of silently re-pointing it.
 */
export class ProvisioningVersion {
    private own: string | undefined;
    private latest: AccountSecret | undefined;

    constructor(
        private readonly store: StagedSecretStore,
        private readonly secretId: string,
        existing?: { versionId: string; secret: AccountSecret },
        private readonly newToken: () => string = randomUUID
    ) {
        this.own = existing?.versionId;
        this.latest = existing ? structuredClone(existing.secret) : undefined;
    }

    get versionId(): string | undefined {
        return this.own;
    }

    async write(secret: AccountSecret): Promise<string> {
        const value = JSON.stringify(secretSchema.parse(secret));
        const before = versionWith(await this.store.describe(this.secretId), PROVISIONING);
        if (before !== this.own) throw needsHuman('secret', 'provisioning_label_moved');
        let versionId: string;
        try {
            versionId = await this.store.putProvisioning(this.secretId, value, this.newToken());
        } catch (error) {
            if (error instanceof ProvisionError) throw error;
            throw new ProvisionError('secret', 'write');
        }
        const after = versionWith(await this.store.describe(this.secretId), PROVISIONING);
        if (after !== versionId) throw needsHuman('secret', 'provisioning_label_moved');
        this.own = versionId;
        this.latest = structuredClone(secret);
        return versionId;
    }

    /** Read this run's version back and require it to equal what was written. */
    async readBack(): Promise<AccountSecret> {
        if (!this.own || !this.latest) throw new ProvisionError('check', 'nothing_written');
        const raw = await this.store.read(this.secretId, { versionId: this.own });
        let parsed: AccountSecret;
        try {
            parsed = secretSchema.parse(JSON.parse(raw ?? 'null'));
        } catch {
            throw needsHuman('check', 'readback_invalid');
        }
        if (JSON.stringify(parsed) !== JSON.stringify(secretSchema.parse(this.latest)))
            throw needsHuman('check', 'readback_mismatch');
        return parsed;
    }

    /**
     * Compare-and-swap promotion: `AWSCURRENT` moves only if it is still on
     * `currentVersionId`; then the `PROVISIONING` label is detached.
     */
    async promote(currentVersionId: string): Promise<void> {
        if (!this.own) throw new ProvisionError('promote', 'nothing_written');
        try {
            await this.store.moveStage(this.secretId, CURRENT, this.own, currentVersionId);
        } catch {
            // The call is not idempotent once committed: if its response was lost and
            // the SDK retried, the retry fails because AWSCURRENT already left
            // `currentVersionId`. Re-read before declaring a conflict.
            const promoted = await this.store
                .describe(this.secretId)
                .then(metadata => versionWith(metadata, CURRENT) === this.own)
                .catch(() => false);
            if (!promoted) throw needsHuman('promote', 'current_changed');
        }
        try {
            await this.store.moveStage(this.secretId, PROVISIONING, undefined, this.own);
        } catch {
            // Promotion already happened; a stale label is harmless and reported by the next run.
        }
    }
}
