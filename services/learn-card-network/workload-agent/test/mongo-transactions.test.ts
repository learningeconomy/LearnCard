import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { runDocker } from '../src/compose-driver';
import {
    DCC_MONGO_IMAGE,
    DCC_MONGO_INIT_SCRIPT,
    DCC_STATUS_SERVICE_IMAGE,
} from '../../brain-service/scripts/fixtures/dcc-workload';

it.skipIf(process.env.DCC_MONGO_SMOKE !== '1')(
    'commits and aborts real Mongo transactions using the pinned status image driver',
    async (): Promise<void> => {
        const name = `dcc-rs-${randomUUID().slice(0, 8)}`;
        const network = `${name}-network`;
        try {
            await runDocker(['network', 'create', '--internal', network], 10000);
            await runDocker(
                [
                    'run',
                    '-d',
                    '--name',
                    name,
                    '--network',
                    network,
                    '--user',
                    '999:999',
                    '--read-only',
                    '--cap-drop',
                    'ALL',
                    '--security-opt',
                    'no-new-privileges',
                    '--tmpfs',
                    '/tmp:rw,noexec,nosuid,size=64m',
                    '--mount',
                    `type=volume,source=${name}-db,target=/data/db`,
                    '--mount',
                    `type=volume,source=${name}-config,target=/data/configdb`,
                    DCC_MONGO_IMAGE,
                    'mongod',
                    '--replSet',
                    'rs0',
                    '--bind_ip_all',
                ],
                30000
            );
            let ping = false;
            for (let attempt = 0; attempt < 30 && !ping; attempt++) {
                try {
                    await runDocker(
                        ['exec', name, 'mongosh', '--quiet', '--eval', 'db.adminCommand({ping:1})'],
                        3000
                    );
                    ping = true;
                } catch {
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, 500);
                    });
                }
            }
            expect(ping).toBe(true);
            await runDocker(
                [
                    'run',
                    '--rm',
                    '--network',
                    network,
                    '--user',
                    '999:999',
                    '--read-only',
                    '--cap-drop',
                    'ALL',
                    '--tmpfs',
                    '/tmp:rw,noexec,nosuid,size=64m',
                    '-e',
                    'HOME=/tmp',
                    '-e',
                    `MONGO_HOSTPORT=${name}:27017`,
                    DCC_MONGO_IMAGE,
                    'mongosh',
                    '--nodb',
                    '--quiet',
                    '--eval',
                    DCC_MONGO_INIT_SCRIPT,
                ],
                120000
            );
            const program = [
                'const {MongoClient}=require("/app/node_modules/mongodb");',
                '(async()=>{ const client = new MongoClient(process.env.MONGO_URL); await client.connect(); const session=client.startSession();',
                'try { const collection=client.db("smoke").collection("transactions"); await collection.insertOne({_id:"setup"});',
                'session.startTransaction(); await collection.insertOne({_id:"commit"},{session}); await session.commitTransaction(); if (!(await collection.findOne({_id:"commit"}))) throw new Error("Commit missing");',
                'session.startTransaction(); await collection.insertOne({_id:"abort"},{session}); await session.abortTransaction(); if (await collection.findOne({_id:"abort"})) throw new Error("Abort leaked insert"); console.log("TRANSACTION_COMMIT_READBACK_AND_ABORT_OK");',
                '} finally { await session.endSession(); await client.close(); } })().catch(()=>{process.exitCode=1;});',
            ].join(' ');
            const output = await runDocker(
                [
                    'run',
                    '--rm',
                    '--network',
                    network,
                    '--user',
                    '1000:1000',
                    '--read-only',
                    '--cap-drop',
                    'ALL',
                    '-e',
                    `MONGO_URL=mongodb://${name}:27017/smoke?directConnection=true&replicaSet=rs0`,
                    '--entrypoint',
                    '/nodejs/bin/node',
                    DCC_STATUS_SERVICE_IMAGE,
                    '-e',
                    program,
                ],
                30000
            );
            expect(output.trim()).toBe('TRANSACTION_COMMIT_READBACK_AND_ABORT_OK');
        } finally {
            await runDocker(['rm', '-f', name], 10000).catch((): string => '');
            await runDocker(['network', 'rm', network], 10000).catch((): string => '');
            // Named volumes intentionally retained, including on failure.
        }
    },
    180000
);
