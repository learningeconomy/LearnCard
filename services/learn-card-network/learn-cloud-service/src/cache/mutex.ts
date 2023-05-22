import { lock as _lock } from 'simple-redis-mutex';
import cache from '@cache';

export const lock = (resource: string) => _lock(cache.redis ?? cache.node, resource, {});
