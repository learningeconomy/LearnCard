import mongodb from '@mongo';

import { CUSTOM_DOCUMENT_COLLECTION, type MongoCustomDocumentType } from '@models';

export const getCustomDocumentCollection = () => {
    return mongodb.collection<MongoCustomDocumentType>(CUSTOM_DOCUMENT_COLLECTION);
};

export const CustomDocuments = getCustomDocumentCollection();

CustomDocuments.createIndex({ did: 1 });
