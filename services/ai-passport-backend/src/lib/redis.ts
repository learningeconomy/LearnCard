import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env';

// Centralized Redis connection options
export const redisConnectionOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    connectTimeout: 5000, // 5 seconds timeout
    maxRetriesPerRequest: null, // Required by BullMQ
};
