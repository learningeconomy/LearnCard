import { vi } from 'vitest';
vi.mock('@environment', () => ({ environment: {} }));
import cache from './index';
import { testInboxBatchCache } from './inbox-batch-cache.test-helpers';

testInboxBatchCache(cache);
