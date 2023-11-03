import { isTest } from '@helpers/test.helpers';
import dotenv from 'dotenv';
// Import the MongoDB driver
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = isTest
    ? (global as any).__MONGO_URI__
    : process.env.__MONGO_URI__ || process.env.LEARN_CLOUD_MONGO_URI;

const dbName = isTest
    ? (global as any).__MONGO_DB_NAME__
    : process.env.__MONGO_DB_NAME__ || process.env.LEARN_CLOUD_MONGO_DB_NAME;

export const client = new MongoClient(uri, {
    connectTimeoutMS: 30_000,
    socketTimeoutMS: 30_000,
    maxPoolSize: 5,
    minPoolSize: 1,
    maxIdleTimeMS: 30_000,
    serverSelectionTimeoutMS: 30_000,
});
export const mongodb = client.db(dbName);

client.on('error', error => console.log('Mongo error!', error));

export default mongodb;
