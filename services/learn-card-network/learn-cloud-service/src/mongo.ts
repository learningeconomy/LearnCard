import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.__MONGO_URI__ || process.env.LEARN_CLOUD_MONGO_URI;
const dbName = process.env.__MONGO_DB_NAME__ || process.env.LEARN_CLOUD_MONGO_DB_NAME;

if (!uri) throw new Error('No Mongo URI set!');

export const getClient = () => {
    return new MongoClient(uri, {
        connectTimeoutMS: 180_000,
        socketTimeoutMS: 180_000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 180_000,
        serverSelectionTimeoutMS: 180_000,
    });
};

export const client = getClient();
export const mongodb = client.db(dbName);

client.on('error', error => console.log('Mongo error!', error));

export default mongodb;
