/**
 * Extension seams named by follow-up tickets. Each is typed and wired today with a
 * default, so the follow-up changes one implementation, not every call site.
 */
import type { HcpV1Store, StoredEvent } from '../store/port';
import type { Category } from '../schemas';

/**
 * Records standalone activity: `context.exported`, and the access log
 * (`context.read` and read denials, LC-2422). State-changing lifecycle events go
 * directly to the store alongside their change so both commit atomically; never
 * publish them through this sink. `record` must resolve only once the event is
 * durable: v1 declares synchronous audit durability (Draft 3 §8.4), and a read
 * whose event fails to record fails with it.
 */
export interface ActivitySink {
    record(event: StoredEvent): Promise<void>;
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
