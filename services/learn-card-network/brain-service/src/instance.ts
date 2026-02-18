import dotenv from 'dotenv';
import { Neogma, QueryBuilder } from 'neogma';

dotenv.config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

if (!uri) throw new Error('Whoops! No URI found');
if (!username) throw new Error('Whoops! No Username found');
if (!password) throw new Error('Whoops! No Password found');

const encrypted = uri.startsWith('neo4j+s') || uri.startsWith('bolt+s');

export const neogma = new Neogma(
    { url: uri, username, password },
    {
        encrypted: encrypted ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF',
        trust: encrypted ? 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES' : 'TRUST_ALL_CERTIFICATES',
        maxConnectionLifetime: 8 * 60 * 1000,
        connectionAcquisitionTimeout: 30_000,
        connectionTimeout: 30_000,
        maxConnectionPoolSize: 10,
    }
);

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
