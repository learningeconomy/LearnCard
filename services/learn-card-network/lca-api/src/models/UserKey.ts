import { z } from 'zod';

import mongodb from '@mongo';

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
    type: z.enum(['password', 'passkey', 'backup']),
    createdAt: z.date(),
    credentialId: z.string().optional(),
    encryptedShare: EncryptedShareValidator.optional(),
});

export const MongoUserKeyValidator = z.object({
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

    securityLevel: z.enum(['basic', 'enhanced', 'advanced']).default('basic'),

    recoveryMethods: z.array(RecoveryMethodValidator).default([]),

    migratedFromWeb3Auth: z.boolean().default(false),
    migratedAt: z.date().optional(),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export type MongoUserKeyType = z.infer<typeof MongoUserKeyValidator>;
export type ContactMethod = z.infer<typeof ContactMethodValidator>;
export type AuthProviderMapping = z.infer<typeof AuthProviderMappingValidator>;
export type ServerEncryptedShare = z.infer<typeof ServerEncryptedShareValidator>;
export type EncryptedShare = z.infer<typeof EncryptedShareValidator>;
export type RecoveryMethod = z.infer<typeof RecoveryMethodValidator>;

export const getUserKeysCollection = () => {
    return mongodb.collection<MongoUserKeyType>(USER_KEYS_COLLECTION);
};

export const createUserKeysIndexes = async () => {
    const collection = getUserKeysCollection();

    await collection.createIndex(
        { 'contactMethod.type': 1, 'contactMethod.value': 1 },
        { unique: true }
    );

    await collection.createIndex(
        { 'authProviders.type': 1, 'authProviders.id': 1 }
    );

    await collection.createIndex({ primaryDid: 1 });
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

        // Increment shareVersion when authShare changes
        if (data.authShare) {
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
            migratedFromWeb3Auth: data.migratedFromWeb3Auth ?? false,
            migratedAt: data.migratedAt,
            createdAt: now,
            updatedAt: now,
        };

        await collection.insertOne(newDoc);

        return newDoc;
    }
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
    const collection = getUserKeysCollection();

    // IMPORTANT: Remove ALL existing recovery methods when adding a new one.
    // Each recovery method setup regenerates all SSS shares (device, auth, recovery).
    // Old recovery shares are from different splits and won't work with the new auth share.
    await collection.updateOne(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $set: { recoveryMethods: [] },
        }
    );

    // Now add the new recovery method
    await collection.updateOne(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $push: { recoveryMethods: recoveryMethod },
            $set: { updatedAt: new Date() },
        }
    );
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

export const deleteUserKey = async (contactMethod: ContactMethod): Promise<void> => {
    const collection = getUserKeysCollection();

    await collection.deleteOne({
        'contactMethod.type': contactMethod.type,
        'contactMethod.value': contactMethod.value,
    });
};
