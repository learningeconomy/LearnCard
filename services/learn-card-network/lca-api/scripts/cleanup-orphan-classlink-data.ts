#!/usr/bin/env bun
import {
    deleteClassLinkIdentitiesByFirebaseUid,
    getClassLinkIdentitiesCollection,
} from '../src/models/ClassLinkIdentity';
import {
    deleteTranscriptRequestsByFirebaseUid,
    getTranscriptRequestsCollection,
} from '../src/models/TranscriptRequest';
import { findUserKeyByAuthProvider } from '../src/models/UserKey';

export const cleanupOrphanClassLinkData = async (apply: boolean): Promise<number> => {
    const [identityUids, requestUids] = await Promise.all([
        getClassLinkIdentitiesCollection().distinct('firebaseUid'),
        getTranscriptRequestsCollection().distinct('firebaseUid'),
    ]);
    const uids = new Set([...identityUids, ...requestUids]);
    let deleted = 0;
    for (const uid of uids) {
        if (await findUserKeyByAuthProvider('firebase', uid)) continue;
        const count = apply
            ? (await deleteClassLinkIdentitiesByFirebaseUid(uid)) +
              (await deleteTranscriptRequestsByFirebaseUid(uid))
            : 0;
        deleted += count;
        console.log(`${apply ? 'orphan deleted' : 'orphan found'}: ${uid} (${count})`);
    }
    return deleted;
};

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
