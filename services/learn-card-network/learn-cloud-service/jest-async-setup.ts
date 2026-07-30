import { setup } from 'jest-dev-server';

export default async () => {
    globalThis.servers = await setup({
        command: 'bun run start',
        launchTimeout: 50000,
        port: 3000,
    });
};
