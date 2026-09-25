import type { Document, ObjectId } from 'mongodb';
import type { EncryptedSigningAuthoritySeed } from './seed-encryption';

export type SeedMigrationPhase = 'dry-run' | 'prepare' | 'verify' | 'purge';

export interface SeedMigrationRequest {
    phase: SeedMigrationPhase;
    batchSize?: number;
}

export interface SeedMigrationCounts {
    total: number;
    encrypted: number;
    legacyOnly: number;
    malformed: number;
    plaintextRemaining: number;
}

export interface SeedMigrationResult {
    phase: SeedMigrationPhase;
    done: boolean;
    processed: number;
    counts: SeedMigrationCounts;
}

/** Read the historical Mongo shape without coercing BSON IDs or changing metadata. */
export interface MigrationSigningAuthority extends Document {
    _id: string | ObjectId;
    ownerDid: string;
    name: string;
    did?: string;
    seed?: string;
}

export interface SeedMigrationState {
    _id: string;
    leaseOwner?: string;
    leaseExpiresAt?: Date;
    phase?: SeedMigrationPhase;
    epoch?: string;
    verifiedEpoch?: string;
    status?: 'running' | 'complete' | 'failed';
    processed?: number;
    counts?: SeedMigrationCounts;
    updatedAt?: Date;
}

/** Ciphertext-only receipt: exact comparisons make changed rows pending again without a cursor. */
export interface SeedMigrationReceipt extends EncryptedSigningAuthoritySeed {
    _id: string | ObjectId;
    epoch: string;
    ownerDid: string;
    name: string;
    did: string | null;
}
