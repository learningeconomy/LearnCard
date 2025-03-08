import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup({ provide }) {
    const db = await MongoMemoryServer.create();
    const uri = db.getUri();

    console.log(provide, uri, typeof uri);

    provide('mongo-uri', uri);

    return () => db?.stop?.();
}
