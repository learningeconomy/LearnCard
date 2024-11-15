import Redis from 'ioredis';
import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';
import { Client } from 'pg';

const redis1 = new Redis();
const redis2 = new Redis({ port: 6380 });
const mongoClient = new MongoClient('mongodb://localhost:27017');
const neo4jDriver = neo4j.driver('bolt://localhost:7687');
const pgClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'lrsql_user',
    password: 'lrsql_password',
    database: 'lrsql_db',
});

export async function clearDatabases() {
    try {
        // Connect to Postgres
        try {
            await pgClient.connect();
        } catch (error) { }

        // Run all clear operations concurrently
        await Promise.all([
            // Redis operations
            redis1.flushall(),
            redis2.flushall(),

            // MongoDB operation
            (async () => {
                const db = mongoClient.db('test');
                const collections = await db.listCollections().toArray();
                await Promise.all(
                    collections.map(collection => db.collection(collection.name).deleteMany({}))
                );
            })(),

            // Neo4j operation
            (async () => {
                const session = neo4jDriver.session();
                try {
                    await session.run('MATCH (n) DETACH DELETE n');
                } finally {
                    await session.close();
                }
            })(),

            // Postgres operation
            (async () => {
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
            })(),
        ]);
    } catch (error) {
        console.log(error);
    }
}
