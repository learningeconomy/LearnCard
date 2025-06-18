import { setup } from 'jest-dev-server';

export default async () => {
    globalThis.servers = await setup({ command: 'pnpm start', launchTimeout: 50_000, port: 3000 });
};
