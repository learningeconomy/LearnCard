import { createOwnedServiceFetch } from './cli-verify-fetch';

// Bun loads this before the CLI module graph (including DIDKit WASM initialization).
const services = ['NETWORK_URL', 'CLOUD_URL', 'LCA_API_URL'].map(key => {
    const value = process.env[key];
    if (!value) throw new Error(`CLI verification preload requires ${key}`);
    return value;
});
let violated = false;
globalThis.fetch = createOwnedServiceFetch(services, message => {
    violated = true;
    process.exitCode = 1;
    console.error(message);
});
// Resolvers may convert a rejected fetch into warnings; it must still fail this child.
process.on('beforeExit', () => {
    if (violated) process.exitCode = 1;
});
