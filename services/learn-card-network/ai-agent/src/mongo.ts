import { Db, MongoClient } from 'mongodb';

import type { ServiceConfig } from './config';

export interface MongoStatus {
    configured: boolean;
    connected: boolean;
    dbName: string;
    error?: string;
}

export interface MongoRuntime {
    getClient: () => Promise<MongoClient>;
    getDb: () => Promise<Db>;
    getStatus: () => Promise<MongoStatus>;
    close: () => Promise<void>;
}

export const createMongoRuntime = ({
    mongoUri,
    mongoDbName,
}: Pick<ServiceConfig, 'mongoUri' | 'mongoDbName'>): MongoRuntime => {
    let clientPromise: Promise<MongoClient> | undefined;

    const getClient = async (): Promise<MongoClient> => {
        if (!mongoUri) throw new Error('AI_AGENT_MONGO_URI or MONGO_URI must be set.');

        if (!clientPromise) {
            const client = new MongoClient(mongoUri, {
                connectTimeoutMS: 1_000,
                serverSelectionTimeoutMS: 1_000,
                maxPoolSize: 10,
                minPoolSize: 0,
            });

            clientPromise = client.connect().then(
                () => client,
                error => {
                    clientPromise = undefined;
                    throw error;
                }
            );
        }

        return clientPromise;
    };

    const getDb = async (): Promise<Db> => {
        const client = await getClient();

        return client.db(mongoDbName);
    };

    const getStatus = async (): Promise<MongoStatus> => {
        if (!mongoUri) {
            return {
                configured: false,
                connected: false,
                dbName: mongoDbName,
            };
        }

        try {
            const db = await getDb();
            await db.command({ ping: 1 });

            return {
                configured: true,
                connected: true,
                dbName: mongoDbName,
            };
        } catch (error) {
            return {
                configured: true,
                connected: false,
                dbName: mongoDbName,
                error: error instanceof Error ? error.message : 'Could not connect to MongoDB.',
            };
        }
    };

    const close = async (): Promise<void> => {
        const client = await clientPromise;
        clientPromise = undefined;

        await client?.close();
    };

    return {
        getClient,
        getDb,
        getStatus,
        close,
    };
};
