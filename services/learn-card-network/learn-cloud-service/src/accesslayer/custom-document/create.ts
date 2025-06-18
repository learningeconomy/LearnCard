import { ObjectId } from 'mongodb';
import type { EncryptedRecord } from '@learncard/types';

import { CustomDocuments } from '.';

export const createCustomDocument = async (
    did: string,
    _document: EncryptedRecord
): Promise<string | false> => {
    const { id, ...document } = _document;
    const cursor = new ObjectId().toString();

    try {
        return (
            await CustomDocuments.insertOne({
                ...document,
                did,
                id: id || cursor,
                cursor,
                created: new Date(),
                modified: new Date(),
                ...(typeof document._id === 'string' ? { _id: new ObjectId(document._id) } : {}),
            })
        ).insertedId.toString();
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const createCustomDocuments = async (
    did: string,
    _documents: EncryptedRecord[]
): Promise<number> => {
    try {
        const documents = _documents.map(_document => {
            const { id, ...document } = _document;
            const cursor = new ObjectId().toString();

            return {
                ...document,
                did,
                id: id || cursor,
                cursor,
                created: new Date(),
                modified: new Date(),
                ...(typeof document._id === 'string' ? { _id: new ObjectId(document._id) } : {}),
            };
        });

        return (await CustomDocuments.insertMany(documents)).insertedCount;
    } catch (error) {
        console.error(error);
        return 0;
    }
};
