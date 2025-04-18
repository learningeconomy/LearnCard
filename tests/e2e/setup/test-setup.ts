import { clearDatabases } from './db-utils';
import { afterEach } from 'vitest';

afterEach(clearDatabases, 120_000);
beforeAll(clearDatabases, 120_000);
