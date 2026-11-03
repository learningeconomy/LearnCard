#!/usr/bin/env bun
import { cleanupOrphanClassLinkData } from '../src/helpers/classlinkCleanup.helpers';

if (import.meta.main) {
    cleanupOrphanClassLinkData(process.argv.includes('--apply'))
        .then(async deleted => {
            console.log(`deleted=${deleted}`);
        })
        .catch(async error => {
            console.error('cleanup-orphan-classlink-data failed:', error);
            process.exit(1);
        });
}
