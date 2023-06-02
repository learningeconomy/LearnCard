import { MongoCustomDocumentType } from '@models';
import { CustomDocuments } from '.';

export const createCustomDocument = async (
    did: string,
    document: MongoCustomDocumentType
): Promise<string | false> => {
    try {
        return (await CustomDocuments.insertOne({ ...document, did })).insertedId.toString();
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createCustomDocuments = async (
    did: string,
    _documents: MongoCustomDocumentType[]
): Promise<number> => {
    try {
        const documents = _documents.map(document => ({ ...document, did }));

        return (await CustomDocuments.insertMany(documents)).insertedCount;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
