import Redis from 'ioredis';
import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';
import { Client } from 'pg';
import { getLearnCard } from '../tests/helpers/learncard.helpers';
import { PORTS, URLS } from '../tests/helpers/ports';

const redis1 = new Redis({ port: PORTS.redis1 });
const redis2 = new Redis({ port: PORTS.redis2 });
const mongoClient = new MongoClient(URLS.mongo);
const neo4jDriver = neo4j.driver(URLS.neo4jBolt);

export async function clearDatabases() {
    try {
        // Run all clear operations concurrently
        await Promise.all([
            // Clear Redises 
            redis1.flushall(),
            redis2.flushall(),

            // Clear Didkit Cache in services
            fetch(URLS.brainClearCache),
            fetch(URLS.cloudClearCache),
            fetch(URLS.signingClearCache),

            // Clear Local Didkit Cache
            (async () => {
                const learnCard = await getLearnCard();
                await learnCard.invoke.clearDidWebCache();
            })(),

            // Clear Mongodb
            (async () => {
                const db = mongoClient.db('learn-cloud');
                const collections = await db.listCollections().toArray();
                await Promise.all(
                    collections.map(collection => db.collection(collection.name).deleteMany({}))
                );
            })(),
            (async () => {
                const db = mongoClient.db('simple-signing');
                const collections = await db.listCollections().toArray();
                await Promise.all(
                    collections.map(collection => db.collection(collection.name).deleteMany({}))
                );
            })(),

            // Clear Neo4j
            (async () => {
                const session = neo4jDriver.session();
                try {
                    await session.run('MATCH (n) DETACH DELETE n');

                    await session.run('CALL db.clearQueryCaches()');
                } finally {
                    await session.close();
                }
            })(),

            // Clear Postgres (fresh connection each time to avoid stale TCP sockets)
            (async () => {
                const pgClient = new Client({
                    host: 'localhost',
                    port: PORTS.postgres,
                    user: 'lrsql_user',
                    password: 'lrsql_password',
                    database: 'lrsql_db',
                });

                try {
                    await pgClient.connect();

                    // Get all tables in public schema
                    const result = await pgClient.query(`
                        SELECT tablename FROM pg_tables 
                        WHERE schemaname = 'public'
                    `);

                    // Truncate all tables in a single transaction
                    await pgClient.query('BEGIN');
                    try {
                        for (const row of result.rows) {
                            if (
                                !['lrs_credential', 'credential_to_scope', 'admin_account'].includes(
                                    row.tablename
                                )
                            ) {
                                await pgClient.query(`TRUNCATE TABLE "${row.tablename}" CASCADE`);
                            }
                        }
                        await pgClient.query('COMMIT');
                    } catch (error) {
                        await pgClient.query('ROLLBACK');
                        throw error;
                    }
                } finally {
                    await pgClient.end();
                }
            })(),
        ]);
    } catch (error) {
        console.log(error);
    }
}
