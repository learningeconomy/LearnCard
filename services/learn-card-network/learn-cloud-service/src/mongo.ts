import { environment } from '@environment';
import { Db, MongoClient } from 'mongodb';

let getClient: () => MongoClient;
let client: MongoClient;
let mongodb: Db;

if (environment.CI) {
    // CI only bundles this module; no database operations execute in this branch.
    client = {} as unknown as MongoClient;
    mongodb = {} as unknown as Db;
    getClient = () => client;
} else {
    const uri = environment.LEARN_CLOUD_MONGO_URI;
    const dbName = environment.LEARN_CLOUD_MONGO_DB_NAME;

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
