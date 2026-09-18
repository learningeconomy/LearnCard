import { inject } from 'vitest';

declare module 'vitest' {
    export interface ProvidedContext {
        'inbox-redis-host': string;
        'inbox-redis-port': number;
    }
}

// Set before importing the app, which captures its validated environment once.
process.env.REDIS_HOST = inject('inbox-redis-host');
process.env.REDIS_PORT = String(inject('inbox-redis-port'));
process.env.NEO4J_URI = inject('neo4j-uri');
process.env.NEO4J_USERNAME = 'neo4j';
process.env.NEO4J_PASSWORD = inject('neo4j-password');
