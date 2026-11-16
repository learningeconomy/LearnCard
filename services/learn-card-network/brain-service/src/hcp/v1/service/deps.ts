import type { HcpV1Store } from '../store/port';
import type { ActivitySink, WritePolicy } from './seams';

/** Everything the v1 service needs, passed in. No module-level state. */
export type HcpV1Deps = {
    store: HcpV1Store;
    activity: ActivitySink;
    writePolicy: WritePolicy;
    /** `record.provenance.recordedByProvider` and the audit `provider.id`. */
    providerId: string;
    now: () => Date;
    newId: () => string;
};

/**
 * The authenticated caller, as the transport resolved it.
 * `did` is the DID that passed DID-auth. `subjectDid` is the DID of the LearnCard
 * profile behind it, or null when the caller has no profile (an agent).
 */
export type HcpV1Caller = { did: string; subjectDid: string | null };

export const urn = (id: string): string => `urn:uuid:${id}`;
