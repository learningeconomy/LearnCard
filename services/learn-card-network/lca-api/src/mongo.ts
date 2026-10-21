import { environment } from '@environment';
// Import the MongoDB driver
import { MongoClient } from 'mongodb';

const isTest = environment.NODE_ENV === 'test';
const testMongo = globalThis as typeof globalThis & {
    __MONGO_URI__?: string;
    __MONGO_DB_NAME__?: string;
};
const uri = isTest ? testMongo.__MONGO_URI__ : environment.MONGO_URI;
const dbName = isTest ? testMongo.__MONGO_DB_NAME__ : environment.MONGO_DB_NAME;

if (!uri || !dbName) {
    throw new Error('Mongo test globals must be initialized before loading the LCA API database');
}

export const client = new MongoClient(uri, { connectTimeoutMS: 30_000 });
export const mongodb = client.db(dbName);

export default mongodb;
