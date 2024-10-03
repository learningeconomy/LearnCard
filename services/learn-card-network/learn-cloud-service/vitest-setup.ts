import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function setup({ provide }) {
    const db = await MongoMemoryReplSet.create();
    await db.waitUntilRunning();
    const uri = db.getUri();

    console.log(provide, uri, typeof uri);

    provide('mongo-uri', uri);

    return () => db?.stop?.();
}
