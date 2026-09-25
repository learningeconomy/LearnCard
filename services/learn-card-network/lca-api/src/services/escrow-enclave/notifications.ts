import type { EscrowHold } from '../../models/EscrowHold';
import type { MongoUserKeyType } from '../../models/UserKey';

export interface EscrowHoldEvent {
    kind: 'started' | 'cancelled' | 'completed';
    hold: EscrowHold;
    userKey: MongoUserKeyType;
    reason?: 'superseded';
    /** Plaintext single-use cancel-link token for 'started' events. Never log this. */
    cancelToken?: string;
}

/** Placeholder for notification fan-out. Never log the supplied account or hold. */
export const notifyEscrowHoldEvent = async (event: EscrowHoldEvent): Promise<void> => {
    console.info('[Escrow hold notification]', { kind: event.kind, reason: event.reason });
};
