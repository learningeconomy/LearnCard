import { MongoClient } from 'mongodb';

// Only selected by the explicitly opted-in broker integration configuration.
if (!process.env.MONGO_URI || !process.env.MONGO_DB_NAME) {
    throw new Error('Live broker tests require MONGO_URI and MONGO_DB_NAME for the running API');
}
export const client = new MongoClient(process.env.MONGO_URI);
export const mongodb = client.db(process.env.MONGO_DB_NAME);
export default mongodb;
