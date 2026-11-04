#!/usr/bin/env bun
import {
    cleanupOrphanClassLinkData,
    clearExpiredClassLinkStateIds,
} from '../src/helpers/classlinkCleanup.helpers';

if (import.meta.main) {
    const apply = process.argv.includes('--apply');
    cleanupOrphanClassLinkData(apply)
        .then(async deleted => {
            const cleared = await clearExpiredClassLinkStateIds(apply);
            console.log(`deleted=${deleted} stateIdsCleared=${cleared}`);
        })
        .catch(async error => {
            console.error('cleanup-orphan-classlink-data failed:', error);
            process.exit(1);
        });
}
