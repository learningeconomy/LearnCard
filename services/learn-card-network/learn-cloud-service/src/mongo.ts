/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { Db, MongoClient } from 'mongodb';

dotenv.config();

let getClient: () => MongoClient;
let client: MongoClient;
let mongodb: Db;

if (process.env.CI) {
	getClient = () => ({} as any);
	client = {} as any;
	mongodb = {} as any;
} else {
	const uri = process.env.__MONGO_URI__ || process.env.LEARN_CLOUD_MONGO_URI;
	const dbName = process.env.__MONGO_DB_NAME__ || process.env.LEARN_CLOUD_MONGO_DB_NAME;

	if (!uri) throw new Error('No Mongo URI set!');

	getClient = () => {
		return new MongoClient(uri, {
			connectTimeoutMS: 180_000,
			socketTimeoutMS: 180_000,
			maxPoolSize: 5,
			minPoolSize: 1,
			maxIdleTimeMS: 180_000,
			serverSelectionTimeoutMS: 180_000,
		});
	};

	client = getClient();
	mongodb = client.db(dbName);

	client.on('error', error => console.log('Mongo error!', error));
}

export { getClient, client, mongodb };

export default mongodb;

