import type { Collection, UpdateFilter } from 'mongodb';
import mongodb from '@mongo';

export const TRANSCRIPT_REQUESTS_COLLECTION = 'transcriptrequests';
export type TranscriptRequestStatus = 'requested' | 'none_yet' | 'failed';

export interface MongoTranscriptRequestType {
    jti: string;
    firebaseUid: string;
    did: string;
    identityKey: string;
    state: string;
    consentAt: Date;
    requestedAt: Date;
    status: TranscriptRequestStatus;
    issuerHttpStatus?: number;
    issuerResponseCode?: string;
}

export type TranscriptRequestInput = Omit<MongoTranscriptRequestType, 'requestedAt'>;

export const getTranscriptRequestsCollection = (): Collection<MongoTranscriptRequestType> =>
    mongodb.collection<MongoTranscriptRequestType>(TRANSCRIPT_REQUESTS_COLLECTION);

let transcriptRequestIndexesReady: Promise<void> | undefined;

export const ensureTranscriptRequestIndexes = (): Promise<void> => {
    if (!transcriptRequestIndexesReady) {
        transcriptRequestIndexesReady = Promise.all([
            getTranscriptRequestsCollection().createIndex({ jti: 1 }, { unique: true }),
            getTranscriptRequestsCollection().createIndex({ firebaseUid: 1 }),
        ])
            .then(() => undefined)
            .catch(error => {
                transcriptRequestIndexesReady = undefined;
                throw error;
            });
    }
    return transcriptRequestIndexesReady;
};

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

export const findLatestTranscriptRequest = (
    firebaseUid: string,
    state: string
): Promise<MongoTranscriptRequestType | null> =>
    getTranscriptRequestsCollection()
        .find({ firebaseUid, state })
        .sort({ requestedAt: -1, _id: -1 })
        .limit(1)
        .next();

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
