import cache from '@cache';

// The in-process scenario must never reach a developer's Redis: its locks and kill switch
// would then be shared with a running brain.
if (cache.redis) {
    throw new Error(
        'scenario preflight: cache.redis is set; REDIS_HOST/REDIS_PORT must be empty for the in-process driver.'
    );
}
