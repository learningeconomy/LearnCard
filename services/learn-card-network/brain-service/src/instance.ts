import dotenv from 'dotenv';
import { Neogma, QueryBuilder } from 'neogma';

dotenv.config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

if (!uri) throw new Error('Whoops! No URI found');
if (!username) throw new Error('Whoops! No Username found');
if (!password) throw new Error('Whoops! No Password found');

const encryptedInScheme = uri.startsWith('neo4j+s') || uri.startsWith('bolt+s');

export const neogma = new Neogma(
    { url: uri, username, password },
    {
        // When encryption is specified in the URI scheme (+s / +ssc), the driver
        // forbids also setting encrypted/trust in config.
        ...(encryptedInScheme
            ? {}
            : {
                  encrypted: 'ENCRYPTION_OFF' as const,
                  trust: 'TRUST_ALL_CERTIFICATES' as const,
              }),
        maxConnectionLifetime: 8 * 60 * 1000,
        connectionAcquisitionTimeout: 30_000,
        connectionTimeout: 30_000,
        maxConnectionPoolSize: 10,
    }
);

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
