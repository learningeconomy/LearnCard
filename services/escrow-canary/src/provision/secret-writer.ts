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
 * directly, and never moves `PROVISIONING` unconditionally:
 * 1. `PutSecretValue` creates a new version labelled only `PROVISIONING_PENDING`
 *    (a scratch label nothing reads; `PutSecretValue` cannot create an
 *    unlabelled version and would move its labels unconditionally).
 * 2. The run CLAIMS that version with `UpdateSecretVersionStage(PROVISIONING,
 *    MoveToVersionId=new, RemoveFromVersionId=<this run's previous version>)`,
 *    or with no `RemoveFromVersionId` for its first write. Secrets Manager
 *    rejects the call when the label is attached to any other version, so of
 *    two runs that both saw the same state, exactly one claim succeeds.
 * 3. Only after verification is `AWSCURRENT` moved, with `RemoveFromVersionId` =
 *    the placeholder version seen at classification (the same compare-and-swap).
 * The runner reads only `AWSCURRENT`.
 *
 * A claim is also a LEASE: a later run may take a claimed version over only once
 * it is `LEASE_MS` old (or with `--takeover`), and the owner starts a server change
 * only while its claim is younger than `RENEW_MS`, re-claiming (a new conditional
 * write) otherwise. A takeover therefore cannot overlap the owner's server changes
 * as long as one server call finishes within `LEASE_MS - RENEW_MS` (minus clock skew).
 */
export const PROVISIONING = 'PROVISIONING';
export const PENDING = 'PROVISIONING_PENDING';
export const CURRENT = 'AWSCURRENT';
export const LEASE_MS = 15 * 60_000;
export const RENEW_MS = 2 * 60_000;
/**
 * Backoff between `DescribeSecret` re-reads while its `VersionIdsToStages` may
 * still lag a label move (DescribeSecret is eventually consistent). Bounded at
 * 4 s in total.
 */
export const DESCRIBE_LAG_BACKOFF_MS: readonly number[] = [250, 500, 750, 1_000, 1_500];

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
    /** The version's `CreatedDate` (epoch ms); `undefined` when unknown. */
    createdAt(secretId: string, versionId: string): Promise<number | undefined>;
    /** New version labelled only `PROVISIONING_PENDING`; returns its version id. */
    putPending(secretId: string, value: string, requestToken: string): Promise<string>;
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
    async createdAt(secretId, versionId) {
        try {
            const response = await client.send(
                new GetSecretValueCommand({ SecretId: secretId, VersionId: versionId })
            );
            return response.CreatedDate?.getTime();
        } catch {
            throw new ProvisionError('secret', 'read');
        }
    },
    async putPending(secretId, value, requestToken) {
        const response = await client.send(
            new PutSecretValueCommand({
                SecretId: secretId,
                SecretString: value,
                VersionStages: [PENDING],
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
 * Whether a `PROVISIONING` version written at `createdAt` may still belong to a
 * live run. Unknown age counts as held (fail closed).
 */
export const leaseHeld = (createdAt: number | undefined, now: number): boolean =>
    createdAt === undefined || now - createdAt < LEASE_MS;

/**
 * One run's handle on its `PROVISIONING` version. Every write puts a pending
 * version and then claims it with a conditional label move from this run's
 * previous version (or from nowhere, for the first write). The claim is the
 * guard: a second run that observed the same state fails its claim and stops
 * before any server change, instead of re-pointing the label. `fence()` keeps
 * the claim a live lease before each server change and before promotion.
 */
export class ProvisioningVersion {
    private own: string | undefined;
    private latest: AccountSecret | undefined;
    /** Local time taken before this run's latest put (never later than its CreatedDate). */
    private claimedAt: number | undefined;
    /**
     * Every version this run has held or created (the resumed version and each put).
     * Decides only the exit code once reads have settled: a holder outside this set
     * is another run's version (exit 3); absent or one of these is lag (exit 1).
     */
    private readonly known = new Set<string>();
    private readonly newToken: () => string;
    private readonly now: () => number;
    private readonly sleep: (ms: number) => Promise<void>;

    constructor(
        private readonly store: StagedSecretStore,
        private readonly secretId: string,
        existing?: { versionId: string; secret: AccountSecret },
        clock: {
            newToken?: () => string;
            now?: () => number;
            sleep?: (ms: number) => Promise<void>;
        } = {}
    ) {
        this.own = existing?.versionId;
        if (existing) this.known.add(existing.versionId);
        this.latest = existing ? structuredClone(existing.secret) : undefined;
        this.newToken = clock.newToken ?? randomUUID;
        this.now = clock.now ?? Date.now;
        this.sleep = clock.sleep ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)));
    }

    /** A holder that is not absent and not a version this run created or resumed. */
    private foreign(holder: string | undefined): boolean {
        return holder !== undefined && !this.known.has(holder);
    }

    /**
     * Reads the `PROVISIONING` holder until it is `expected` or the bounded backoff
     * runs out, and returns the last holder read. Any other holder is re-read, even
     * one this run never saw: a stale read can show the label absent, on this run's
     * previous version, or where it was before this run started (e.g. a holder an
     * operator or an earlier promote just detached). Proceeding still requires a
     * read showing `expected`, so re-reading only delays a stop, never skips one.
     */
    private async settledHolder(
        expected: string | undefined,
        read: () => Promise<string | undefined>
    ): Promise<string | undefined> {
        for (let attempt = 0; ; attempt += 1) {
            const holder = await read();
            if (holder === expected || attempt >= DESCRIBE_LAG_BACKOFF_MS.length) return holder;
            await this.sleep(DESCRIBE_LAG_BACKOFF_MS[attempt]);
        }
    }

    /** Requires `PROVISIONING` on this run's current version (`this.own`, or none yet). */
    private async requireOwnHolder(read: () => Promise<string | undefined>): Promise<void> {
        const holder = await this.settledHolder(this.own, read);
        if (holder === this.own) return;
        if (this.foreign(holder)) throw needsHuman('secret', 'provisioning_label_moved');
        throw new ProvisionError('secret', 'provisioning_label_lag');
    }

    get versionId(): string | undefined {
        return this.own;
    }

    async write(secret: AccountSecret): Promise<string> {
        const value = JSON.stringify(secretSchema.parse(secret));
        // Early exit only (saves a version); the claim below is what is atomic.
        await this.requireOwnHolder(async () =>
            versionWith(await this.store.describe(this.secretId), PROVISIONING)
        );
        const startedAt = this.now();
        let versionId: string;
        try {
            versionId = await this.store.putPending(this.secretId, value, this.newToken());
        } catch (error) {
            if (error instanceof ProvisionError) throw error;
            throw new ProvisionError('secret', 'write');
        }
        this.known.add(versionId);
        await this.claim(versionId);
        this.own = versionId;
        this.latest = structuredClone(secret);
        this.claimedAt = startedAt;
        return versionId;
    }

    /**
     * Call immediately before a server change or promotion. Requires that this run
     * still holds `PROVISIONING`; a claim older than `RENEW_MS` is renewed first by
     * re-writing the latest value (the conditional claim fails if another run took
     * over), so the change starts well inside the lease.
     */
    async fence(): Promise<void> {
        if (!this.own || !this.latest || this.claimedAt === undefined)
            throw new ProvisionError('secret', 'not_claimed');
        if (this.now() - this.claimedAt >= RENEW_MS) {
            await this.write(this.latest);
            return;
        }
        await this.requireOwnHolder(async () => {
            try {
                return versionWith(await this.store.describe(this.secretId), PROVISIONING);
            } catch {
                throw new ProvisionError('secret', 'describe');
            }
        });
    }

    /** Conditional move of `PROVISIONING` from this run's version (or nowhere) to `versionId`. */
    private async claim(versionId: string): Promise<void> {
        try {
            await this.store.moveStage(this.secretId, PROVISIONING, versionId, this.own);
            return;
        } catch {
            // Fall through: decide from the label's actual position.
        }
        // `versionId` was just created and is known only to this run, so the label on
        // it means our claim committed (response lost, SDK retry rejected). Any other
        // read may lag a committed claim, so it is re-read before concluding.
        const last: { read: boolean; holder?: string } = { read: false };
        let holder: string | undefined;
        try {
            holder = await this.settledHolder(versionId, async () => {
                const seen = versionWith(await this.store.describe(this.secretId), PROVISIONING);
                last.read = true;
                last.holder = seen;
                return seen;
            });
        } catch {
            // A re-read failed. If an earlier read already showed the label absent or on
            // this run's own version, nothing points at another run: retryable. With no
            // successful read (as before the re-reads existed) or another run's version
            // last seen, stop for a human.
            if (last.read && !this.foreign(last.holder))
                throw new ProvisionError('secret', 'claim');
            throw needsHuman('secret', 'provisioning_label_moved');
        }
        if (holder === versionId) return;
        if (this.foreign(holder)) throw needsHuman('secret', 'provisioning_label_moved');
        // Still where this run left it (or still absent): a transient failure,
        // nothing changed as far as this run can tell. Re-run.
        throw new ProvisionError('secret', 'claim');
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
     * Compare-and-swap promotion, fenced: this run must still hold `PROVISIONING`
     * (a run whose claim was taken over never promotes its superseded version);
     * `AWSCURRENT` moves only if it is still on `currentVersionId`; then the
     * staging labels are detached.
     */
    async promote(currentVersionId: string): Promise<void> {
        if (!this.own) throw new ProvisionError('promote', 'nothing_written');
        await this.fence();
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
            // Already detached (lost response) or unreadable: harmless, the next run reports
            // a stale label. On ANOTHER version it means a run took over after the fence:
            // AWSCURRENT is this run's version, but that run may still be changing the server.
            // Re-read while it shows a holder: the read may lag the detach.
            const holder = await this.settledHolder(undefined, () =>
                this.store
                    .describe(this.secretId)
                    .then(metadata => versionWith(metadata, PROVISIONING))
                    .catch(() => undefined)
            );
            if (this.foreign(holder)) throw needsHuman('promote', 'provisioning_label_moved');
        }
        try {
            await this.store.moveStage(this.secretId, PENDING, undefined, this.own);
        } catch {
            // Already moved by a later put (another run's unclaimed version): nothing reads it.
        }
    }
}
