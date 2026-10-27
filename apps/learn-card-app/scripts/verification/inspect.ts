import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { execInOwned, ownedContainer, ownedServices } from './stack';

const NEO4J_AUTH = ['-u', 'neo4j', '-p', 'this-is-the-password'];

/**
 * Read-only Neo4j query (brain-service network graph). `--access-mode read` makes the database
 * reject writes, so this can corroborate side effects without becoming a test-only setter.
 */
export const queryNeo4j = async (directory: string, cypher: string): Promise<string> =>
    execInOwned(directory, 'neo4j', [
        'cypher-shell',
        ...NEO4J_AUTH,
        '--access-mode',
        'read',
        '--format',
        'plain',
        cypher,
    ]);

/**
 * Read-only MongoDB inspection (LearnCloud index, LCA API). Only `listCollections` and a bounded
 * `find` are exposed: there is deliberately no free-form `--eval` that could mutate state.
 */
export const queryMongo = async (
    directory: string,
    database: string,
    collection?: string,
    filter = '{}',
    limit = 20
): Promise<string> => {
    if (!/^[\w-]+$/.test(database)) throw new Error(`Invalid database name: ${database}`);
    if (collection !== undefined && !/^[\w.-]+$/.test(collection)) {
        throw new Error(`Invalid collection name: ${collection}`);
    }
    // Parsed here so malformed input fails before reaching the shell.
    const parsed = JSON.parse(filter) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Mongo filter must be a JSON object');
    }
    const script = collection
        ? `print(EJSON.stringify(db.getCollection(${JSON.stringify(collection)}).find(EJSON.parse(${JSON.stringify(
              filter
          )})).sort({ _id: -1 }).limit(${Math.min(Math.max(limit, 1), 200)}).toArray(), null, 2))`
        : 'print(JSON.stringify(db.getCollectionNames().sort(), null, 2))';
    return execInOwned(directory, 'mongodb', [
        'mongosh',
        '--quiet',
        `mongodb://127.0.0.1:27017/${database}?directConnection=true`,
        '--eval',
        script,
    ]);
};

/** Service logs: Compose services from Docker, the frontend from its retained log file. */
export const serviceLogs = async (
    directory: string,
    service: string,
    tail = 200
): Promise<string> => {
    if (service === 'frontend') {
        const lines = (await readFile(join(directory, 'frontend.log'), 'utf8')).split('\n');
        return lines.slice(-tail).join('\n');
    }
    if (!ownedServices.includes(service)) {
        throw new Error(`Unknown service ${service}; use frontend or ${ownedServices.join(', ')}`);
    }
    const { id } = await ownedContainer(directory, service);
    // docker logs interleaves the container's stdout and stderr; keep both.
    return new Promise((accept, reject) => {
        const child = spawn('docker', ['logs', '--timestamps', '--tail', String(tail), id]);
        let output = '';
        child.stdout.on('data', chunk => (output += String(chunk)));
        child.stderr.on('data', chunk => (output += String(chunk)));
        child.once('error', reject);
        child.once('exit', code =>
            code === 0 ? accept(output) : reject(new Error(`docker logs exited ${code}`))
        );
    });
};
