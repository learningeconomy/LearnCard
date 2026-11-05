#!/usr/bin/env bun
/**
 * Backfill `web3AuthLogin` on accounts migrated from Web3Auth before `/keys/migrate`
 * started recording it.
 *
 * `web3AuthLogin` lets a Web3Auth-mode client sign an SSS account in through the
 * login its Web3Auth key was migrated from (`isWeb3AuthLogin` in
 * `src/models/UserKey.ts`). A wrong value would let a Web3Auth client derive a
 * different, empty identity for that account, so a record is only backfilled when
 * its single login provably did the migration:
 *
 *   - `migratedFromWeb3Auth` is true and `web3AuthLogin` is not set;
 *   - `sssActivationState` is `active`: only `activateUserKeyByAuthProvider` writes
 *     it together with the migration flag, i.e. the record went through the
 *     login-keyed `/keys/migrate` → `/keys/activate` flow. Older migrations
 *     (keyed by contact method) leave it unset and are skipped;
 *   - exactly one login is linked: a PIN sign-in adds a login;
 *   - the security epoch is 0: an identity rebind or a revoke (which can replace
 *     the login) increments it.
 *
 * Skipped records keep no `web3AuthLogin`, so Web3Auth-mode clients keep stopping
 * them (the safe default). This script never prints PII, only counts.
 *
 * Usage:
 *   bun scripts/backfill-web3auth-login.ts            # dry run: counts only
 *   bun scripts/backfill-web3auth-login.ts --apply    # write eligible records
 *
 * Environment: only `MONGO_URI` and `MONGO_DB_NAME` (it connects directly, so the
 * rest of the server config is not needed), e.g. via `infisical run` against the
 * lca-api runtime secrets. Each write re-checks every condition in its filter, so a
 * record that changes between the read and the write is left alone.
 */

import { MongoClient, type Filter } from 'mongodb';

import type { AuthProviderMapping, MongoUserKeyType } from '../src/models/UserKey';

export type BackfillSkipReason =
    | 'not_migrated'
    | 'already_recorded'
    | 'legacy_migration_flow'
    | 'login_count_not_one'
    | 'security_epoch_changed';

export type BackfillDecision =
    | { eligible: true; login: AuthProviderMapping }
    | { eligible: false; reason: BackfillSkipReason };

type BackfillCandidate = Pick<
    MongoUserKeyType,
    | 'migratedFromWeb3Auth'
    | 'web3AuthLogin'
    | 'sssActivationState'
    | 'authProviders'
    | 'securityEpoch'
>;

export const classifyForBackfill = (record: BackfillCandidate): BackfillDecision => {
    if (record.migratedFromWeb3Auth !== true) return { eligible: false, reason: 'not_migrated' };
    if (record.web3AuthLogin) return { eligible: false, reason: 'already_recorded' };
    if (record.sssActivationState !== 'active') {
        return { eligible: false, reason: 'legacy_migration_flow' };
    }
    if ((record.authProviders ?? []).length !== 1) {
        return { eligible: false, reason: 'login_count_not_one' };
    }
    if ((record.securityEpoch ?? 0) !== 0) {
        return { eligible: false, reason: 'security_epoch_changed' };
    }

    return { eligible: true, login: record.authProviders[0]! };
};

/** Write filter: every eligibility condition, re-checked atomically. */
export const backfillFilter = (
    id: unknown,
    login: AuthProviderMapping
): Filter<MongoUserKeyType> => ({
    _id: id as MongoUserKeyType['_id'],
    migratedFromWeb3Auth: true,
    web3AuthLogin: { $exists: false },
    sssActivationState: 'active',
    authProviders: { $size: 1, $elemMatch: { type: login.type, id: login.id } },
    securityEpoch: { $not: { $gt: 0 } },
});

const main = async (): Promise<void> => {
    const apply = process.argv.slice(2).includes('--apply');
    const { MONGO_URI, MONGO_DB_NAME } = process.env;
    if (!MONGO_URI || !MONGO_DB_NAME) throw new Error('MONGO_URI and MONGO_DB_NAME are required');

    const mongoClient = new MongoClient(MONGO_URI);
    const collection = mongoClient.db(MONGO_DB_NAME).collection<MongoUserKeyType>('userkeys');

    try {
        await mongoClient.connect();
        const records = await collection
            .find(
                { migratedFromWeb3Auth: true },
                {
                    projection: {
                        migratedFromWeb3Auth: 1,
                        web3AuthLogin: 1,
                        sssActivationState: 1,
                        authProviders: 1,
                        securityEpoch: 1,
                    },
                }
            )
            .toArray();

        const counts: Record<string, number> = {};
        let written = 0;

        for (const record of records) {
            const decision = classifyForBackfill(record);
            const key = decision.eligible ? 'eligible' : decision.reason;
            counts[key] = (counts[key] ?? 0) + 1;

            if (apply && decision.eligible) {
                const result = await collection.updateOne(
                    backfillFilter(record._id, decision.login),
                    { $set: { web3AuthLogin: decision.login, updatedAt: new Date() } }
                );
                written += result.modifiedCount;
            }
        }

        console.log(`Migrated records: ${records.length}`);
        for (const [key, count] of Object.entries(counts).sort()) console.log(`  ${key}: ${count}`);
        console.log(apply ? `Written: ${written}` : 'Dry run: nothing written (pass --apply).');
    } finally {
        await mongoClient.close();
    }
};

if (import.meta.main) {
    main().catch(err => {
        console.error('backfill-web3auth-login failed:', err);
        process.exit(1);
    });
}
