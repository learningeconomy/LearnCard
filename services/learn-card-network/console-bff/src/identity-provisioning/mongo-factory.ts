import type { Db } from 'mongodb';

import type { ExternalIdentityBinding } from '@learncard/types';

import { MongoBindingRepository, type BindingCollectionLike } from './mongo-binding-repository';

export const BINDINGS_COLLECTION = 'external_identity_bindings';

export async function createMongoBindingRepository(
    db: Db,
    collectionName: string = BINDINGS_COLLECTION
): Promise<MongoBindingRepository> {
    const collection = db.collection<ExternalIdentityBinding>(collectionName);

    await collection.createIndex({ tenantId: 1, issuer: 1, subject: 1 }, { unique: true });

    const adapter: BindingCollectionLike = {
        findOne: filter => collection.findOne(filter) as Promise<ExternalIdentityBinding | null>,
        updateOne: (filter, update, options?) =>
            collection.updateOne(filter, update as never, options ?? {}),
    };

    return new MongoBindingRepository(adapter);
}
