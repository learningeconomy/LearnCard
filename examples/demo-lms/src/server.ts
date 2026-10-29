import { createHandler } from './app';
import { loadConfig } from './config';

const config = loadConfig();

Bun.serve({ port: config.port, fetch: createHandler(config) });

console.log(`Demo LMS listening on http://localhost:${config.port}`);
