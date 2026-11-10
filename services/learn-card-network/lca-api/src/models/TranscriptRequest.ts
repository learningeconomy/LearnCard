import type { Collection, Filter, UpdateFilter } from 'mongodb';
import mongodb from '@mongo';

export const TRANSCRIPT_REQUESTS_COLLECTION = 'transcriptrequests';
export type TranscriptRequestStatus = 'requested' | 'none_yet' | 'failed';

export interface MongoTranscriptRequestType {
    jti: string;
    firebaseUid: string;
    /** The DID that made the request. */
    did: string;
    /**
     * The account's `UserKey.primaryDid` when the request was made. Lets the account keep its
     * transcript history after its ClassLink identity is rebound to a different Firebase uid.
     * Absent on requests made before it was recorded.
     */
    primaryDid?: string;
    identityKey: string;
    state: string;
    consentAt: Date;
    requestedAt: Date;
    receivedAt?: Date;
    status: TranscriptRequestStatus;
    issuerHttpStatus?: number;
    issuerResponseCode?: string;
}

export type TranscriptRequestInput = Omit<MongoTranscriptRequestType, 'requestedAt'>;

/**
 * Identifies the account that owns transcript requests. A request belongs to the account when
 * its `primaryDid` or `did` is one of `dids`, or, for a legacy request with no recorded
 * `primaryDid`, its `firebaseUid` is one of `firebaseUids`.
 *
 * A uid never proves ownership of a request that records a `primaryDid`: every current
 * request records the owning account's DID, and a uid can outlive its account's link to it
 * (a recovery rebind or "Secure my account" leaves the old uid usable by a stale session).
 * Enforcing that here, in the same query that reads or deletes, also closes the window
 * between deciding which uids are owned and using them.
 */
export interface TranscriptRequestOwner {
    firebaseUids: string[];
    dids: string[];
}

export const getTranscriptRequestsCollection = (): Collection<MongoTranscriptRequestType> =>
    mongodb.collection<MongoTranscriptRequestType>(TRANSCRIPT_REQUESTS_COLLECTION);

let transcriptRequestIndexesReady: Promise<void> | undefined;

export const ensureTranscriptRequestIndexes = (): Promise<void> => {
    if (!transcriptRequestIndexesReady) {
        transcriptRequestIndexesReady = Promise.all([
            getTranscriptRequestsCollection().createIndex({ jti: 1 }, { unique: true }),
            getTranscriptRequestsCollection().createIndex({ firebaseUid: 1 }),
            getTranscriptRequestsCollection().createIndex({ primaryDid: 1 }),
            getTranscriptRequestsCollection().createIndex({ did: 1 }),
        ])
            .then(() => undefined)
            .catch(error => {
                transcriptRequestIndexesReady = undefined;
                throw error;
            });
    }
    return transcriptRequestIndexesReady;
};

const uniqueNonEmpty = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

/**
 * Mongo filter matching every request owned by `owner`, or null when the owner has no
 * identifiers (so a caller can never match every row with an empty `$or`).
 */
const ownerFilter = (owner: TranscriptRequestOwner): Filter<MongoTranscriptRequestType> | null => {
    const firebaseUids = uniqueNonEmpty(owner.firebaseUids);
    const dids = uniqueNonEmpty(owner.dids);
    const clauses: Filter<MongoTranscriptRequestType>[] = [];
    if (firebaseUids.length > 0)
        clauses.push({
            firebaseUid: { $in: firebaseUids },
            $or: [{ primaryDid: { $exists: false } }, { primaryDid: null }],
        } as Filter<MongoTranscriptRequestType>);
    if (dids.length > 0) clauses.push({ primaryDid: { $in: dids } }, { did: { $in: dids } });
    return clauses.length > 0 ? { $or: clauses } : null;
};

const toOwner = (owner: string | TranscriptRequestOwner): TranscriptRequestOwner =>
    typeof owner === 'string' ? { firebaseUids: [owner], dids: [] } : owner;

export const createTranscriptRequest = async (
    input: TranscriptRequestInput
): Promise<MongoTranscriptRequestType> => {
    await ensureTranscriptRequestIndexes();
    const record = { ...input, requestedAt: new Date() };
    return getTranscriptRequestsCollection()
        .insertOne(record)
        .then(result => ({
            ...record,
            _id: result.insertedId,
        })) as Promise<MongoTranscriptRequestType>;
};

/**
 * The newest request for `state` owned by `owner`. A plain string is treated as a single
 * Firebase uid (legacy callers).
 */
export const findLatestTranscriptRequest = async (
    owner: string | TranscriptRequestOwner,
    state: string
): Promise<MongoTranscriptRequestType | null> => {
    const filter = ownerFilter(toOwner(owner));
    if (!filter) return null;
    return getTranscriptRequestsCollection()
        .find({ $and: [filter, { state }] })
        .sort({ requestedAt: -1, _id: -1 })
        .limit(1)
        .next();
};

export const updateTranscriptRequest = async (
    jti: string,
    partial: Partial<Omit<MongoTranscriptRequestType, 'jti' | 'requestedAt'>>
): Promise<MongoTranscriptRequestType | null> =>
    getTranscriptRequestsCollection().findOneAndUpdate(
        { jti },
        { $set: { ...partial } } as UpdateFilter<MongoTranscriptRequestType>,
        { returnDocument: 'after' }
    );

export const deleteTranscriptRequestsByFirebaseUid = async (firebaseUid: string): Promise<number> =>
    (await getTranscriptRequestsCollection().deleteMany({ firebaseUid })).deletedCount;

/**
 * Delete every transcript request owned by an account, matched by any of its Firebase uids or
 * DIDs (see {@link TranscriptRequestOwner}). Returns the number of rows deleted; an owner with
 * no identifiers deletes nothing.
 */
export const deleteTranscriptRequestsForAccount = async (
    owner: TranscriptRequestOwner
): Promise<number> => {
    const filter = ownerFilter(owner);
    if (!filter) return 0;
    return (await getTranscriptRequestsCollection().deleteMany(filter)).deletedCount;
};

/**
 * Acknowledge an accepted request owned by `owner`. Unknown, other-account, `none_yet` and
 * `failed` requests return null. Concurrent retries preserve the first timestamp.
 */
export const markTranscriptRequestReceived = async (
    jti: string,
    owner: TranscriptRequestOwner
): Promise<MongoTranscriptRequestType | null> => {
    const ownership = ownerFilter(owner);
    if (!ownership) return null;
    const collection = getTranscriptRequestsCollection();
    const filter: Filter<MongoTranscriptRequestType> = {
        $and: [{ jti, status: 'requested' }, ownership],
    };
    const updated = await collection.findOneAndUpdate(
        { $and: [filter, { receivedAt: { $exists: false } }] },
        { $set: { receivedAt: new Date() } },
        { returnDocument: 'after' }
    );
    return updated ?? collection.findOne(filter);
};
