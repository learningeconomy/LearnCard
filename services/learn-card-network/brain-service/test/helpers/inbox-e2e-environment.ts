import { inject } from 'vitest';

declare module 'vitest' {
    export interface ProvidedContext {
        'inbox-redis-host': string;
        'inbox-redis-port': number;
        'inbox-queue-endpoint': string;
        'inbox-queue-url': string;
        'inbox-dead-letter-url': string;
    }
}

// Set before importing the app, which captures its validated environment once.
process.env.REDIS_HOST = inject('inbox-redis-host');
process.env.INBOX_QUEUE_ENDPOINT = inject('inbox-queue-endpoint');
process.env.INBOX_QUEUE_URL = inject('inbox-queue-url');
process.env.INBOX_DEAD_LETTER_QUEUE_URL = inject('inbox-dead-letter-url');
process.env.REDIS_PORT = String(inject('inbox-redis-port'));
process.env.NEO4J_URI = inject('neo4j-uri');
process.env.NEO4J_USERNAME = 'neo4j';
process.env.NEO4J_PASSWORD = inject('neo4j-password');
