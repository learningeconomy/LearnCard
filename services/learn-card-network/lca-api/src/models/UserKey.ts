import { z } from 'zod';
import type { Filter } from 'mongodb';

import mongodb from '@mongo';
import { pruneOrphanedRecoveryMethods } from './pruneOrphanedRecoveryMethods';

export const USER_KEYS_COLLECTION = 'userkeys';

export const ContactMethodValidator = z.object({
    type: z.enum(['email', 'phone']),
    value: z.string(),
});

export const AuthProviderMappingValidator = z.object({
    type: z.enum(['firebase', 'supertokens', 'keycloak', 'oidc']),
    id: z.string(),
});

export const ServerEncryptedShareValidator = z.object({
    encryptedData: z.string(),
    encryptedDek: z.string(),
    iv: z.string(),
});

export const EncryptedShareValidator = z.object({
    encryptedData: z.string(),
    iv: z.string(),
    salt: z.string().optional(),
});

export const RecoveryMethodValidator = z.object({
    type: z.enum(['passkey', 'backup', 'phrase', 'email']),
    createdAt: z.date(),
    confirmationStatus: z.enum(['pending', 'confirmed']).optional(),
    confirmedAt: z.date().optional(),
    credentialId: z.string().optional(),
    encryptedShare: EncryptedShareValidator.optional(),
    shareVersion: z.number().optional(),
    confirmationCodeHash: z.string().optional(),
    confirmationCodeExpiresAt: z.date().optional(),
    confirmationAttempts: z.number().int().nonnegative().optional(),
    confirmationEmail: z.string().email().optional(),
});

export const PreviousAuthShareValidator = z.object({
    authShare: ServerEncryptedShareValidator,
    shareVersion: z.number(),
    createdAt: z.date(),
});

const MongoUserKeyBaseValidator = z.object({
    _id: z.string().optional(),

    contactMethod: ContactMethodValidator,

    authProviders: z.array(AuthProviderMappingValidator).default([]),

    primaryDid: z.string(),
    linkedDids: z.array(z.string()).default([]),

    keyProvider: z.enum(['web3auth', 'sss']).default('sss'),

    authShare: ServerEncryptedShareValidator.optional(),

    // Share versioning for optimistic locking and audit trail
    shareVersion: z.number().default(1),
    shareUpdatedAt: z.date().optional(),

    // Previous auth shares kept for cross-device and recovery compatibility.
    // Each entry preserves the auth share + its version so that device shares
    // and recovery methods from older splits can still reconstruct.
    // Capped at MAX_PREVIOUS_AUTH_SHARES entries.
    previousAuthShares: z.array(PreviousAuthShareValidator).default([]),

    securityLevel: z.enum(['basic', 'enhanced', 'advanced']).default('basic'),

    recoveryMethods: z.array(RecoveryMethodValidator).default([]),

    // Verified secondary email for email-based recovery.
    // The encrypted share is sent to this address during setup;
    // it is never stored server-side.
    recoveryEmail: z.string().email().optional(),
    recoveryEmailVerifiedAt: z.date().optional(),

    migratedFromWeb3Auth: z.boolean().default(false),
    migratedAt: z.date().optional(),

    sssActivationState: z.enum(['provisional', 'active']).optional(),
    provisionalCreatedAt: z.date().optional(),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export const MongoUserKeyValidator = MongoUserKeyBaseValidator.passthrough();

export type MongoUserKeyType = z.infer<typeof MongoUserKeyBaseValidator>;
export type ContactMethod = z.infer<typeof ContactMethodValidator>;
export type AuthProviderMapping = z.infer<typeof AuthProviderMappingValidator>;
export type ServerEncryptedShare = z.infer<typeof ServerEncryptedShareValidator>;
export type EncryptedShare = z.infer<typeof EncryptedShareValidator>;
export type RecoveryMethod = z.infer<typeof RecoveryMethodValidator>;
export type PreviousAuthShare = z.infer<typeof PreviousAuthShareValidator>;

export const MAX_PREVIOUS_AUTH_SHARES = 5;
export const PROVISIONAL_MIGRATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class UserKeyVersionConflictError extends Error {
    constructor() {
        super('User key share version changed during update');
        this.name = 'UserKeyVersionConflictError';
    }
}

/**
 * Records created before activation state tracking are grandfathered as active.
 * This preserves existing SSS users while new writes use the explicit state machine.
 */
export const getSssActivationState = (userKey: MongoUserKeyType): 'provisional' | 'active' =>
    userKey.sssActivationState ?? 'active';

/** New methods are pending until receipt is proved. Methods without confirmation
 * metadata on already-active records predate this protocol and are grandfathered. */
export const isRecoveryMethodConfirmed = (
    userKey: MongoUserKeyType,
    method: RecoveryMethod
): boolean => {
    if (method.confirmedAt) return true;
    if (method.confirmationStatus) return false;

    return getSssActivationState(userKey) === 'active';
};

export const hasActivatableRecoveryMethod = (userKey: MongoUserKeyType): boolean =>
    (userKey.recoveryMethods ?? []).some(
        method =>
            method.shareVersion === (userKey.shareVersion ?? 1) &&
            isRecoveryMethodConfirmed(userKey, method)
    );

export { pruneOrphanedRecoveryMethods };

export const getUserKeysCollection = () => {
    return mongodb.collection<MongoUserKeyType>(USER_KEYS_COLLECTION);
};

const getMongoErrorCode = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;

    return typeof error.code === 'number' ? error.code : undefined;
};

const runIndexMigrationOperation = async (
    operationName: string,
    operation: () => Promise<unknown>,
    options: { duplicateRequiresManualDedupe?: boolean } = {}
): Promise<void> => {
    try {
        await operation();
    } catch (error) {
        const code = getMongoErrorCode(error);

        if (code === 11000) {
            if (options.duplicateRequiresManualDedupe) {
                console.error(
                    `[UserKey indexes] ${operationName} found duplicate provider identities; ` +
                        'manual dedupe is required before the unique index can be created.',
                    { code }
                );
            } else {
                console.error(
                    `[UserKey indexes] ${operationName} encountered duplicate data; continuing startup.`,
                    { code }
                );
            }

            return;
        }

        // IndexNotFound and index option/spec conflicts are expected when cold starts race.
        if (code === 27 || code === 85 || code === 86) {
            console.warn(
                `[UserKey indexes] ${operationName} raced another index migration; continuing startup.`,
                { code }
            );
            return;
        }

        throw error;
    }
};

export const createUserKeysIndexes = async (): Promise<void> => {
    const collection = getUserKeysCollection();

    const indexes = await collection
        .listIndexes()
        .toArray()
        .catch((error: unknown) => {
            const code = getMongoErrorCode(error);

            if (code === 26) return [];
            throw error;
        });

    const contactIndex = indexes.find(
        index => index.key?.['contactMethod.type'] === 1 && index.key?.['contactMethod.value'] === 1
    );

    // Contact methods are mutable and can be recycled. They remain searchable,
    // but are deliberately non-unique and never serve as account identity.
    if (contactIndex?.unique && contactIndex.name) {
        await runIndexMigrationOperation('drop unique contact-method index', () =>
            collection.dropIndex(contactIndex.name!)
        );
    }

    if (!contactIndex || contactIndex.unique) {
        await runIndexMigrationOperation('create contact-method lookup index', () =>
            collection.createIndex(
                { 'contactMethod.type': 1, 'contactMethod.value': 1 },
                { name: 'contact_method_lookup' }
            )
        );
    }

    const providerIndex = indexes.find(
        index => index.key?.['authProviders.type'] === 1 && index.key?.['authProviders.id'] === 1
    );

    if (providerIndex && !providerIndex.unique && providerIndex.name) {
        await runIndexMigrationOperation('drop non-unique provider identity index', () =>
            collection.dropIndex(providerIndex.name!)
        );
    }

    if (!providerIndex || !providerIndex.unique) {
        await runIndexMigrationOperation(
            'create unique provider identity index',
            () =>
                collection.createIndex(
                    { 'authProviders.type': 1, 'authProviders.id': 1 },
                    { name: 'auth_provider_identity_unique', unique: true }
                ),
            { duplicateRequiresManualDedupe: true }
        );
    }

    await runIndexMigrationOperation('create primary DID index', () =>
        collection.createIndex({ primaryDid: 1 })
    );
    await runIndexMigrationOperation('create verified recovery email index', () =>
        collection.createIndex(
            { recoveryEmail: 1, recoveryEmailVerifiedAt: 1 },
            { name: 'verified_recovery_email_lookup' }
        )
    );
};

let userKeysIndexesPromise: Promise<void> | undefined;

/** Runs the production index migration at most once per warm process. */
export const ensureUserKeysIndexes = (): Promise<void> => {
    // Never let an index-migration failure take the API down: log it, and clear the
    // memo so the next request/boot retries instead of failing on a poisoned promise.
    userKeysIndexesPromise ??= createUserKeysIndexes().catch((error: unknown) => {
        console.error(
            '[UserKey indexes] migration failed; requests will proceed and the migration will retry.',
            error
        );
        userKeysIndexesPromise = undefined;
    });

    return userKeysIndexesPromise;
};

export const findUserKeyByContactMethod = async (
    contactMethod: ContactMethod
): Promise<MongoUserKeyType | null> => {
    const collection = getUserKeysCollection();
    return collection.findOne({
        'contactMethod.type': contactMethod.type,
        'contactMethod.value': contactMethod.value,
    });
};

export const findUserKeyByAuthProvider = async (
    providerType: string,
    providerId: string
): Promise<MongoUserKeyType | null> => {
    const collection = getUserKeysCollection();
    return collection.findOne({
        authProviders: {
            $elemMatch: {
                type: providerType,
                id: providerId,
            },
        },
    });
};

export const findUserKeyByDid = async (did: string): Promise<MongoUserKeyType | null> => {
    const collection = getUserKeysCollection();
    return collection.findOne({
        $or: [{ primaryDid: did }, { linkedDids: did }],
    });
};

/** Recovery email is a proof channel, never account identity. Ambiguous matches are rejected. */
export const findUniqueUserKeyByVerifiedRecoveryEmail = async (
    email: string
): Promise<MongoUserKeyType | null> => {
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await getUserKeysCollection()
        .find({
            recoveryEmail: { $regex: `^${escapedEmail}$`, $options: 'i' },
            recoveryEmailVerifiedAt: { $exists: true },
        })
        .limit(2)
        .toArray();

    return matches.length === 1 ? matches[0]! : null;
};

/**
 * Look up a specific auth share version from the current or previous shares.
 * Returns the matching auth share, or null if the version is not found.
 */
export const findAuthShareByVersion = (
    userKey: MongoUserKeyType,
    version: number
): ServerEncryptedShare | null => {
    // Check current share first
    if (userKey.shareVersion === version) {
        return userKey.authShare ?? null;
    }

    // Search previous shares
    const prev = (userKey.previousAuthShares ?? []).find(p => p.shareVersion === version);

    return prev?.authShare ?? null;
};

export const upsertUserKey = async (
    contactMethod: ContactMethod,
    data: Partial<Omit<MongoUserKeyType, '_id' | 'contactMethod' | 'createdAt'>>
): Promise<MongoUserKeyType> => {
    const collection = getUserKeysCollection();
    const now = new Date();

    // Check if document exists to handle shareVersion correctly
    const existing = await collection.findOne({
        'contactMethod.type': contactMethod.type,
        'contactMethod.value': contactMethod.value,
    });

    if (existing) {
        // Update existing document
        const updateOps: Record<string, unknown> = {
            $set: {
                ...data,
                updatedAt: now,
            },
        };

        // When authShare changes: push the old share into history, increment version
        if (data.authShare && existing.authShare) {
            updateOps.$inc = { shareVersion: 1 };
            (updateOps.$set as Record<string, unknown>).shareUpdatedAt = now;

            // Push old auth share into previousAuthShares (capped)
            const oldEntry: PreviousAuthShare = {
                authShare: existing.authShare,
                shareVersion: existing.shareVersion ?? 1,
                createdAt: existing.shareUpdatedAt ?? existing.updatedAt ?? now,
            };

            const history = [...(existing.previousAuthShares ?? []), oldEntry];

            // Keep only the most recent MAX_PREVIOUS_AUTH_SHARES entries
            const trimmedHistory = history.slice(-MAX_PREVIOUS_AUTH_SHARES);
            (updateOps.$set as Record<string, unknown>).previousAuthShares = trimmedHistory;

            // The new current version after $inc
            const newCurrentVersion = (existing.shareVersion ?? 1) + 1;
            const survivingVersions = trimmedHistory.map(p => p.shareVersion);

            // Prune recovery methods whose auth share was evicted
            const prunedMethods = pruneOrphanedRecoveryMethods(
                existing.recoveryMethods ?? [],
                newCurrentVersion,
                survivingVersions
            );

            (updateOps.$set as Record<string, unknown>).recoveryMethods = prunedMethods;
        } else if (data.authShare) {
            // First auth share — no history to push
            updateOps.$inc = { shareVersion: 1 };
            (updateOps.$set as Record<string, unknown>).shareUpdatedAt = now;
        }

        const result = await collection.findOneAndUpdate(
            {
                'contactMethod.type': contactMethod.type,
                'contactMethod.value': contactMethod.value,
            },
            updateOps,
            { returnDocument: 'after' }
        );

        return result!;
    } else {
        // Insert new document with shareVersion: 1
        const newDoc: MongoUserKeyType = {
            contactMethod,
            authProviders: data.authProviders ?? [],
            primaryDid: data.primaryDid ?? '',
            linkedDids: data.linkedDids ?? [],
            keyProvider: data.keyProvider ?? 'sss',
            authShare: data.authShare,
            shareVersion: 1,
            shareUpdatedAt: data.authShare ? now : undefined,
            securityLevel: data.securityLevel ?? 'basic',
            recoveryMethods: data.recoveryMethods ?? [],
            previousAuthShares: [],
            migratedFromWeb3Auth: data.migratedFromWeb3Auth ?? false,
            migratedAt: data.migratedAt,
            sssActivationState: data.sssActivationState,
            provisionalCreatedAt: data.provisionalCreatedAt,
            createdAt: now,
            updatedAt: now,
        };

        await collection.insertOne(newDoc);

        return newDoc;
    }
};

/**
 * Create or update a UserKey by immutable provider identity. A contact-method
 * collision intentionally creates a separate record; linking identities is an
 * explicit authenticated flow and never a side effect of lookup.
 */
export const upsertUserKeyByAuthProvider = async (
    contactMethod: ContactMethod,
    authProvider: AuthProviderMapping,
    data: Partial<Omit<MongoUserKeyType, '_id' | 'contactMethod' | 'createdAt' | 'authProviders'>>,
    expectedVersion?: number
): Promise<MongoUserKeyType> => {
    const collection = getUserKeysCollection();
    const now = new Date();
    const providerFilter: Filter<MongoUserKeyType> = {
        authProviders: { $elemMatch: authProvider },
    };
    const existing = await collection.findOne(providerFilter);

    if (existing) {
        const currentVersion = existing.shareVersion ?? 1;

        if (expectedVersion != null && expectedVersion !== currentVersion) {
            throw new UserKeyVersionConflictError();
        }

        const updateOps: Record<string, unknown> = {
            $set: {
                ...data,
                updatedAt: now,
            },
        };

        if (data.authShare && existing.authShare) {
            updateOps.$inc = { shareVersion: 1 };
            (updateOps.$set as Record<string, unknown>).shareUpdatedAt = now;

            const oldEntry: PreviousAuthShare = {
                authShare: existing.authShare,
                shareVersion: existing.shareVersion ?? 1,
                createdAt: existing.shareUpdatedAt ?? existing.updatedAt ?? now,
            };
            const history = [...(existing.previousAuthShares ?? []), oldEntry];
            const trimmedHistory = history.slice(-MAX_PREVIOUS_AUTH_SHARES);
            (updateOps.$set as Record<string, unknown>).previousAuthShares = trimmedHistory;

            const newCurrentVersion = (existing.shareVersion ?? 1) + 1;
            const survivingVersions = trimmedHistory.map(previous => previous.shareVersion);
            (updateOps.$set as Record<string, unknown>).recoveryMethods =
                pruneOrphanedRecoveryMethods(
                    existing.recoveryMethods ?? [],
                    newCurrentVersion,
                    survivingVersions
                );
        } else if (data.authShare) {
            updateOps.$inc = { shareVersion: 1 };
            (updateOps.$set as Record<string, unknown>).shareUpdatedAt = now;
        }

        const result = await collection.findOneAndUpdate(
            { ...providerFilter, shareVersion: expectedVersion ?? currentVersion },
            updateOps,
            {
                returnDocument: 'after',
            }
        );

        if (!result) throw new UserKeyVersionConflictError();

        return result;
    }

    const newDoc: MongoUserKeyType = {
        contactMethod,
        authProviders: [authProvider],
        primaryDid: data.primaryDid ?? '',
        linkedDids: data.linkedDids ?? [],
        keyProvider: data.keyProvider ?? 'sss',
        authShare: data.authShare,
        shareVersion: 1,
        shareUpdatedAt: data.authShare ? now : undefined,
        securityLevel: data.securityLevel ?? 'basic',
        recoveryMethods: data.recoveryMethods ?? [],
        previousAuthShares: [],
        recoveryEmail: data.recoveryEmail,
        recoveryEmailVerifiedAt: data.recoveryEmailVerifiedAt,
        migratedFromWeb3Auth: data.migratedFromWeb3Auth ?? false,
        migratedAt: data.migratedAt,
        sssActivationState: data.sssActivationState,
        provisionalCreatedAt: data.provisionalCreatedAt,
        createdAt: now,
        updatedAt: now,
    };

    await collection.insertOne(newDoc);

    return newDoc;
};

export const addAuthProviderToUserKey = async (
    contactMethod: ContactMethod,
    authProvider: AuthProviderMapping
): Promise<void> => {
    const collection = getUserKeysCollection();

    await collection.updateOne(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $addToSet: { authProviders: authProvider },
            $set: { updatedAt: new Date() },
        }
    );
};

export const addRecoveryMethodToUserKey = async (
    contactMethod: ContactMethod,
    recoveryMethod: RecoveryMethod
): Promise<void> => {
    await addRecoveryMethodWithFilter(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        recoveryMethod
    );
};

const getAuthProviderFilter = (authProvider: AuthProviderMapping): Filter<MongoUserKeyType> => ({
    authProviders: { $elemMatch: authProvider },
});

const addRecoveryMethodWithFilter = async (
    filter: Filter<MongoUserKeyType>,
    recoveryMethod: RecoveryMethod
): Promise<void> => {
    const collection = getUserKeysCollection();
    const now = new Date();

    // For passkeys, scope the $pull by credentialId so multiple passkeys
    // (each with a unique credentialId) can coexist. For other types
    // (backup, phrase, email) there is at most one per type.
    const keepExistingMethod =
        recoveryMethod.type === 'passkey'
            ? {
                  $or: [
                      { $ne: ['$$method.type', recoveryMethod.type] },
                      {
                          $ne: [
                              { $ifNull: ['$$method.credentialId', null] },
                              recoveryMethod.credentialId ?? null,
                          ],
                      },
                  ],
              }
            : { $ne: ['$$method.type', recoveryMethod.type] };

    await collection.updateOne(filter, [
        {
            $set: {
                recoveryMethods: {
                    $concatArrays: [
                        {
                            $filter: {
                                input: { $ifNull: ['$recoveryMethods', []] },
                                as: 'method',
                                cond: keepExistingMethod,
                            },
                        },
                        [{ $literal: recoveryMethod }],
                    ],
                },
                updatedAt: now,
            },
        },
    ]);
};

export const addRecoveryMethodToUserKeyByAuthProvider = async (
    authProvider: AuthProviderMapping,
    recoveryMethod: RecoveryMethod
): Promise<void> => {
    await addRecoveryMethodWithFilter(getAuthProviderFilter(authProvider), recoveryMethod);
};

export const removeRecoveryMethodFromUserKeyByAuthProvider = async (
    authProvider: AuthProviderMapping,
    type: RecoveryMethod['type'],
    credentialId?: string
): Promise<void> => {
    const pullFilter: Record<string, unknown> = { type };

    if (type === 'passkey' && credentialId) pullFilter.credentialId = credentialId;

    await getUserKeysCollection().updateOne(getAuthProviderFilter(authProvider), {
        $pull: { recoveryMethods: pullFilter },
        $set: { updatedAt: new Date() },
    });
};

const getRecoveryMethodSelector = (
    type: RecoveryMethod['type'],
    shareVersion: number,
    credentialId?: string
): Record<string, unknown> => ({
    type,
    shareVersion,
    confirmationStatus: 'pending',
    ...(type === 'passkey' && credentialId ? { credentialId } : {}),
});

export const incrementRecoveryConfirmationAttemptsByAuthProvider = async (
    authProvider: AuthProviderMapping,
    shareVersion: number
): Promise<boolean> => {
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            recoveryMethods: {
                $elemMatch: getRecoveryMethodSelector('email', shareVersion),
            },
        },
        {
            $inc: { 'recoveryMethods.$.confirmationAttempts': 1 },
            $set: { updatedAt: new Date() },
        }
    );

    return result.modifiedCount === 1;
};

export const confirmRecoveryMethodByAuthProvider = async (
    authProvider: AuthProviderMapping,
    type: RecoveryMethod['type'],
    shareVersion: number,
    credentialId?: string
): Promise<boolean> => {
    const selector = getRecoveryMethodSelector(type, shareVersion, credentialId);
    const now = new Date();
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            recoveryMethods: { $elemMatch: selector },
        },
        {
            $set: {
                'recoveryMethods.$.confirmationStatus': 'confirmed',
                'recoveryMethods.$.confirmedAt': now,
                updatedAt: now,
            },
            $unset: {
                'recoveryMethods.$.confirmationCodeHash': '',
                'recoveryMethods.$.confirmationCodeExpiresAt': '',
                'recoveryMethods.$.confirmationAttempts': '',
                'recoveryMethods.$.confirmationEmail': '',
            },
        }
    );

    return result.modifiedCount === 1;
};

export const markUserKeyMigrated = async (contactMethod: ContactMethod): Promise<void> => {
    const collection = getUserKeysCollection();

    await collection.updateOne(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $set: {
                migratedFromWeb3Auth: true,
                migratedAt: new Date(),
                keyProvider: 'sss',
                updatedAt: new Date(),
            },
        }
    );
};

export const markUserKeyMigratedByAuthProvider = async (
    authProvider: AuthProviderMapping
): Promise<void> => {
    await getUserKeysCollection().updateOne(getAuthProviderFilter(authProvider), {
        $set: {
            migratedFromWeb3Auth: true,
            migratedAt: new Date(),
            keyProvider: 'sss',
            updatedAt: new Date(),
        },
    });
};

export const markUserKeyMigrationProvisionalByAuthProvider = async (
    authProvider: AuthProviderMapping,
    provisionalCreatedAt: Date
): Promise<boolean> => {
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            keyProvider: 'web3auth',
        },
        {
            $set: {
                sssActivationState: 'provisional',
                provisionalCreatedAt,
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount > 0 || result.matchedCount > 0;
};

/**
 * Commit activation in one document update. The recovery-method predicate is
 * included in the update filter so a concurrent removal cannot violate the
 * activation invariant between validation and commit.
 */
export const activateUserKeyByAuthProvider = async (
    authProvider: AuthProviderMapping,
    shareVersion: number,
    isMigration: boolean
): Promise<boolean> => {
    const now = new Date();
    const migrationFields = isMigration ? { migratedFromWeb3Auth: true, migratedAt: now } : {};
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            shareVersion,
            sssActivationState: 'provisional',
            recoveryMethods: { $elemMatch: { shareVersion, confirmedAt: { $exists: true } } },
        },
        {
            $set: {
                sssActivationState: 'active',
                keyProvider: 'sss',
                ...migrationFields,
                updatedAt: now,
            },
            $unset: { provisionalCreatedAt: '' },
        }
    );

    return result.modifiedCount === 1;
};

/**
 * Lazily discard abandoned migration shares after the P0-1 TTL. New-user
 * provisional records are excluded because their keyProvider is already SSS.
 */
export const purgeExpiredProvisionalMigrationByAuthProvider = async (
    authProvider: AuthProviderMapping,
    now = new Date()
): Promise<boolean> => {
    const cutoff = new Date(now.getTime() - PROVISIONAL_MIGRATION_TTL_MS);
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            keyProvider: 'web3auth',
            sssActivationState: 'provisional',
            provisionalCreatedAt: { $lte: cutoff },
        },
        {
            $set: {
                recoveryMethods: [],
                previousAuthShares: [],
                updatedAt: now,
            },
            $unset: {
                authShare: '',
                shareUpdatedAt: '',
                sssActivationState: '',
                provisionalCreatedAt: '',
            },
        }
    );

    return result.modifiedCount === 1;
};

export const setRecoveryEmail = async (
    contactMethod: ContactMethod,
    email: string
): Promise<void> => {
    const collection = getUserKeysCollection();

    await collection.updateOne(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $set: {
                recoveryEmail: email.trim().toLowerCase(),
                recoveryEmailVerifiedAt: new Date(),
                updatedAt: new Date(),
            },
        }
    );
};

export const setRecoveryEmailByAuthProvider = async (
    authProvider: AuthProviderMapping,
    email: string
): Promise<void> => {
    await getUserKeysCollection().updateOne(getAuthProviderFilter(authProvider), {
        $set: {
            recoveryEmail: email.trim().toLowerCase(),
            recoveryEmailVerifiedAt: new Date(),
            updatedAt: new Date(),
        },
    });
};

export const upgradeContactMethod = async (
    oldContactMethod: ContactMethod,
    newContactMethod: ContactMethod
): Promise<boolean> => {
    const collection = getUserKeysCollection();

    // Check that the new contact method isn't already in use by another UserKey
    const conflict = await collection.findOne({
        'contactMethod.type': newContactMethod.type,
        'contactMethod.value': newContactMethod.value,
    });

    if (conflict) {
        return false;
    }

    const result = await collection.updateOne(
        {
            'contactMethod.type': oldContactMethod.type,
            'contactMethod.value': oldContactMethod.value,
        },
        {
            $set: {
                contactMethod: newContactMethod,
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount > 0;
};

export const upgradeContactMethodByAuthProvider = async (
    authProvider: AuthProviderMapping,
    expectedOldContactMethod: ContactMethod,
    newContactMethod: ContactMethod
): Promise<boolean> => {
    const result = await getUserKeysCollection().updateOne(
        {
            ...getAuthProviderFilter(authProvider),
            'contactMethod.type': expectedOldContactMethod.type,
            'contactMethod.value': expectedOldContactMethod.value,
        },
        {
            $set: {
                contactMethod: newContactMethod,
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount > 0;
};

export const deleteUserKey = async (contactMethod: ContactMethod): Promise<void> => {
    const collection = getUserKeysCollection();

    await collection.deleteOne({
        'contactMethod.type': contactMethod.type,
        'contactMethod.value': contactMethod.value,
    });
};

export const deleteUserKeyByAuthProvider = async (
    authProvider: AuthProviderMapping
): Promise<void> => {
    await getUserKeysCollection().deleteOne(getAuthProviderFilter(authProvider));
};

export interface CompleteIdentityRebindInput {
    oldAuthProvider: AuthProviderMapping;
    newAuthProvider: AuthProviderMapping;
    newContactMethod: ContactMethod;
    primaryDid: string;
    authShare: ServerEncryptedShare;
}

/**
 * Atomically bind a replacement login identity and commit a security rotation.
 * Historical auth shares are purged. Existing recovery methods are retained only
 * as unconfirmed descriptors because their external shares belong to the old split.
 */
export const completeIdentityRebind = async (
    input: CompleteIdentityRebindInput
): Promise<{
    shareVersion: number;
    methodsRequiringConfirmation: RecoveryMethod['type'][];
} | null> => {
    const collection = getUserKeysCollection();
    const existing = await collection.findOne({
        ...getAuthProviderFilter(input.oldAuthProvider),
        primaryDid: input.primaryDid,
    });

    if (!existing) return null;

    const providerConflict = await collection.findOne({
        ...getAuthProviderFilter(input.newAuthProvider),
        ...(existing._id ? { _id: { $ne: existing._id } } : {}),
    });

    if (providerConflict) return null;

    const now = new Date();
    const shareVersion = (existing.shareVersion ?? 1) + 1;
    const remainingAuthProviders = (existing.authProviders ?? []).filter(
        provider =>
            provider.type !== input.oldAuthProvider.type || provider.id !== input.oldAuthProvider.id
    );
    const authProviders = remainingAuthProviders.some(
        provider =>
            provider.type === input.newAuthProvider.type && provider.id === input.newAuthProvider.id
    )
        ? remainingAuthProviders
        : [...remainingAuthProviders, input.newAuthProvider];
    const recoveryMethods = (existing.recoveryMethods ?? []).map(method => ({
        type: method.type,
        createdAt: now,
        confirmationStatus: 'pending' as const,
        credentialId: method.credentialId,
        shareVersion,
    }));
    const result = await collection.findOneAndUpdate(
        {
            ...getAuthProviderFilter(input.oldAuthProvider),
            primaryDid: input.primaryDid,
            shareVersion: existing.shareVersion ?? 1,
        },
        {
            $set: {
                authProviders,
                contactMethod: input.newContactMethod,
                authShare: input.authShare,
                shareVersion,
                shareUpdatedAt: now,
                previousAuthShares: [],
                recoveryMethods,
                keyProvider: 'sss',
                sssActivationState: 'active',
                updatedAt: now,
            },
            $unset: { provisionalCreatedAt: '' },
        },
        { returnDocument: 'after' }
    );

    if (!result) return null;

    return {
        shareVersion,
        methodsRequiringConfirmation: recoveryMethods.map(method => method.type),
    };
};
