import { AsyncLocalStorage } from 'async_hooks';

export type BenchContext = { sa_http_ms: number; sa_didauthvp_ms: number };

export const benchContextStorage = new AsyncLocalStorage<BenchContext>();
