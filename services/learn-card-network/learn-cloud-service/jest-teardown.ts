import { teardown } from 'jest-dev-server';

export default async () => {
    teardown(await globalThis.servers);
};
