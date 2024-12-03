import { clearDatabases } from './db-utils';
import { afterEach } from 'vitest';

afterEach(clearDatabases);
beforeAll(clearDatabases);
