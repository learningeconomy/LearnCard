/**
 * Extension seams named by follow-up tickets. Each is typed and wired today with a
 * default, so the follow-up changes one implementation, not every call site.
 */
import type { HcpV1Store, StoredEvent } from '../store/port';
import type { Category } from '../schemas';

/** Records audit events. v1 records lifecycle events (Draft 3 §8.1) through it. */
export interface ActivitySink {
    record(event: StoredEvent): Promise<void>;
    // TODO(LC-2422): access log. Record `context.read` (with `disclosed`) on query and
    // get entry, and denial events, through this same sink.
}

export const createStoreActivitySink = (store: HcpV1Store): ActivitySink => ({
    record: event => store.appendEvent(event),
});

export type WriteRequest = {
    operation: 'create' | 'revise';
    subjectDid: string;
    actorDid: string;
    grantId: string | null;
    categories: readonly Category[];
};

/**
 * Decides how an authorized write lands. Only `write` exists today.
 * TODO(LC-2423): add `{ kind: 'suggest' }`, where a client's write is held for the
 * Context Subject to accept instead of becoming an active entry.
 */
export type WriteDecision = { kind: 'write' };

export type WritePolicy = (request: WriteRequest) => Promise<WriteDecision>;

export const directWritePolicy: WritePolicy = async () => ({ kind: 'write' });
