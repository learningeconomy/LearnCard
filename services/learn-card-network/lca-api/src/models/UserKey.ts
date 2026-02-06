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

    const result = await collection.findOneAndUpdate(
        {
            'contactMethod.type': contactMethod.type,
            'contactMethod.value': contactMethod.value,
        },
        {
            $set: {
                ...data,
                updatedAt: now,
            },
            $setOnInsert: {
                contactMethod,
                createdAt: now,
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
        }
    );

    return result!;
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
