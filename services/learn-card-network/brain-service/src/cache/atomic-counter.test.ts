import { vi } from 'vitest';
vi.mock('@environment', () => ({ environment: {} }));
import cache from './index';
import { testAtomicCacheCounter } from './atomic-counter.test-helpers';

testAtomicCacheCounter(cache);
