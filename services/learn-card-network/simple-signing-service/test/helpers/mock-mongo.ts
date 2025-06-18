declare module 'vitest' {
    export type ProvidedContext = {
        'mongo-uri': string;
    }
}

import { MongoClient } from 'mongodb';
import { inject } from 'vitest';

const uri = inject('mongo-uri');
const dbName = 'test';

export const client = new MongoClient(uri, {
    connectTimeoutMS: 180_000,
    socketTimeoutMS: 180_000,
    maxPoolSize: 5,
    minPoolSize: 1,
    maxIdleTimeMS: 180_000,
    serverSelectionTimeoutMS: 180_000,
});
export const mongodb = client.db(dbName);

client.on('error', error => console.log('Mongo error!', error));

export default mongodb;
