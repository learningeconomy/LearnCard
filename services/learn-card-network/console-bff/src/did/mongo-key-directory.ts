import type { Db } from 'mongodb';

import type { ManagedKeyRef } from '@kms';

import type { MutableManagedKeyDirectory } from './doc-service';

type KeyRecord = { did: string; keyRef: ManagedKeyRef };

export const MANAGED_KEYS_COLLECTION = 'managed_keys';

export class MongoKeyDirectory implements MutableManagedKeyDirectory {
    constructor(
        private readonly find: (did: string) => Promise<ManagedKeyRef | null>,
        private readonly upsert: (record: KeyRecord) => Promise<void>
    ) {}

    async put(did: string, ref: ManagedKeyRef): Promise<void> {
        await this.upsert({ did, keyRef: ref });
    }

    async getKeyRef(did: string): Promise<ManagedKeyRef | null> {
        return this.find(did);
    }
}

export async function createMongoKeyDirectory(
    db: Db,
    collectionName: string = MANAGED_KEYS_COLLECTION
): Promise<MongoKeyDirectory> {
    const collection = db.collection<KeyRecord>(collectionName);

    await collection.createIndex({ did: 1 }, { unique: true });

    return new MongoKeyDirectory(
        async did => {
            const record = await collection.findOne({ did });

            return record?.keyRef ?? null;
        },
        async record => {
            await collection.updateOne({ did: record.did }, { $set: record }, { upsert: true });
        }
    );
}
