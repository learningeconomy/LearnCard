import Fastify from 'fastify';
import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';
import Redis from 'ioredis';

const fastify = Fastify({ logger: true });

// Database connection configurations
const mongoUrl = process.env.__DELETE_SERVICE__MONGO_URI || 'mongodb://mongo:27017';
const mongoDbName1 = process.env.__DELETE_SERVICE__MONGO_DB_NAME1 || 'learn-cloud';
const mongoDbName2 = process.env.__DELETE_SERVICE__MONGO_DB_NAME2 || 'lca-api';

const mongoDbs = [mongoDbName1, mongoDbName2];

const neo4jUrl = process.env.__DELETE_SERVICE__NEO4J_URI || 'bolt://neo4j:7687';
const neo4jUsername = process.env.__DELETE_SERVICE__NEO4J_USERNAME || 'neo4j';
const neo4jPassword = process.env.__DELETE_SERVICE__NEO4J_PASSWORD || 'this-is-the-password';

const REDIS1_HOST = process.env.__DELETE_SERVICE__REDIS1_HOST || 'redis';
const REDIS1_PORT = process.env.__DELETE_SERVICE__REDIS1_PORT || '6379';
const REDIS2_HOST = process.env.__DELETE_SERVICE__REDIS2_HOST || 'redis2';
const REDIS2_PORT = process.env.__DELETE_SERVICE__REDIS2_PORT || '6379';
const REDIS3_HOST = process.env.__DELETE_SERVICE__REDIS3_HOST || 'redis3';
const REDIS3_PORT = process.env.__DELETE_SERVICE__REDIS3_PORT || '6379';

const redisInfos = [
    { host: REDIS1_HOST, port: REDIS1_PORT },
    { host: REDIS2_HOST, port: REDIS2_PORT },
    { host: REDIS3_HOST, port: REDIS3_PORT },
];

// Create database connections

// Connect to MongoDB
const mongoClient = new MongoClient(mongoUrl, { ssl: false });

// Connect to Neo4j
const neo4jDriver = neo4j.driver(neo4jUrl, neo4j.auth.basic(neo4jUsername, neo4jPassword));

fastify.get('/health', async () => ({ success: true, message: 'Healthy and Well!' }));

// Delete everything endpoint
fastify.post('/delete-all', async (request, reply) => {
    try {
        for (const mongodb of mongoDbs) {
            console.log('Deleting', mongodb, mongoUrl);
            const db = mongoClient.db(mongodb);

            const collections = await db.listCollections().toArray();

            await Promise.all(
                collections.map(async collection => {
                    return db.collection(collection.name).deleteMany({});
                })
            );
        }

        for (const redisInfo of redisInfos) {
            console.log('Deleting', redisInfo);
            const redis = new Redis({ host: redisInfo.host, port: redisInfo.port });

            await redis.flushall();

            redis.quit();
        }

        console.log('Deleting neo4j (except test account)');
        const session = neo4jDriver.session();

        await session.run(
            'MATCH (n) WHERE n.profileId IS NULL OR NOT n.profileId STARTS WITH "test" DETACH DELETE n'
        );

        await session.run('MATCH ()-[r]-() DELETE r');

        await session.close();

        return { success: true, message: 'All data deleted except the test account' };
    } catch (error) {
        fastify.log.error(error);
        console.log(error);
        return reply.code(500).send({ error: 'An error occurred while deleting data' });
    }
});

// Start the server
const start = async () => {
    try {
        await fastify.listen({
            port: process.env.PORT ? Number(process.env.PORT) : 3100,
            host: '0.0.0.0',
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
