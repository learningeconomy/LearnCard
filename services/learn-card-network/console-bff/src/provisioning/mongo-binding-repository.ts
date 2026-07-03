import type { ExternalIdentityBinding } from '@learncard/types';

import type { BindingRepository } from './types';

type BindingKey = { tenantId: string; issuer: string; subject: string };

export interface BindingCollectionLike {
    findOne(filter: BindingKey): Promise<ExternalIdentityBinding | null>;
    updateOne(
        filter: BindingKey,
        update: { $set: ExternalIdentityBinding },
        options: { upsert: true }
    ): Promise<unknown>;
    updateOne(
        filter: BindingKey,
        update: { $set: Partial<ExternalIdentityBinding> }
    ): Promise<unknown>;
}

export class MongoBindingRepository implements BindingRepository {
    constructor(private readonly collection: BindingCollectionLike) {}

    async findBySubject(
        tenantId: string,
        issuer: string,
        subject: string
    ): Promise<ExternalIdentityBinding | null> {
        return this.collection.findOne({ tenantId, issuer, subject });
    }

    async save(binding: ExternalIdentityBinding): Promise<ExternalIdentityBinding> {
        await this.collection.updateOne(
            { tenantId: binding.tenantId, issuer: binding.issuer, subject: binding.subject },
            { $set: binding },
            { upsert: true }
        );

        return binding;
    }

    async touchLastLogin(
        tenantId: string,
        issuer: string,
        subject: string,
        at: string
    ): Promise<void> {
        await this.collection.updateOne(
            { tenantId, issuer, subject },
            { $set: { lastLoginAt: at } }
        );
    }
}
