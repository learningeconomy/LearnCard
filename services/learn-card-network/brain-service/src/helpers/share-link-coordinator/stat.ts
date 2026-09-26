import type { ShareLinkReservationRecord } from '../../accesslayer/share-link';
import type { ShareContentStatValue } from '../share-content-client/types';

/**
 * True only when an exact-object `stat` proves the immutable reserved object is
 * still active with the full expected tuple, payload hash and byte sizes.
 *
 * Both the create/update coordinator and the durable recovery runner use this
 * predicate so a recovered finalize applies exactly the same acceptance rule: a
 * mismatch is never finalized and never destroys the staged content.
 */
export const verifyShareContentActiveStat = (
    stat: ShareContentStatValue,
    reservation: ShareLinkReservationRecord
): boolean => {
    if (stat.kind !== 'active') return false;
    if (reservation.objectRef === null || reservation.contentVersion === null) return false;

    return (
        stat.namespace === reservation.namespace &&
        stat.ownerProfileId === reservation.ownerProfileId &&
        stat.shareId === reservation.shareId &&
        stat.objectId === reservation.objectRef &&
        stat.operationId === reservation.operationId &&
        stat.contentVersion === reservation.contentVersion &&
        stat.payloadHash === reservation.contentHash &&
        (reservation.contentBytes === null || stat.ciphertextBytes === reservation.contentBytes) &&
        (reservation.recoveryBytes === null || stat.recoveryBytes === reservation.recoveryBytes)
    );
};
