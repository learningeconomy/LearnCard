import type { ConsentFlowContractHcp } from '@learncard/types';

import type { HcpV1Store } from '../store/port';
import type { ActivitySink, WritePolicy } from './seams';

/** Everything the v1 service needs, passed in. No module-level state. */
export type HcpV1Deps = {
    store: HcpV1Store;
    /** ConsentFlow contracts with an HCP section (LC-2421). */
    contracts: HcpContracts;
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

/** A ConsentFlow contract as this brain holds it now, for its HCP section (LC-2421). */
export type HcpContract = {
    uri: string;
    /** The contract's current version. */
    version: number;
    name: string;
    owner: { profileId: string; displayName: string };
    status: 'active' | 'retired';
    expiresAt: string | null;
    hcp: ConsentFlowContractHcp | null;
};

export interface HcpContracts {
    /** The contract's current version, or null when it does not exist. */
    current(contractUri: string): Promise<HcpContract | null>;
}
