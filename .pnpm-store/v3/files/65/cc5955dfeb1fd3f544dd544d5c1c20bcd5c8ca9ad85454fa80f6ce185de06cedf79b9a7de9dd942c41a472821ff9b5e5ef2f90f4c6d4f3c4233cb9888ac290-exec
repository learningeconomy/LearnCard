import { CID } from 'multiformats/cid';
import type { StreamState, Stream } from '../stream.js';
import { RunningStateLike } from '../running-state-like.js';
import type { CeramicApi } from '../ceramic-api.js';
export declare class TestUtils {
    static waitForState(stream: Stream, timeout: number, predicate: (state: StreamState) => boolean, onFailure: () => void): Promise<void>;
    static runningState(state: StreamState): RunningStateLike;
    static delay(ms: number): Promise<void>;
    static randomCID(): CID;
    static anchorUpdate(ceramic: CeramicApi, stream: Stream): Promise<void>;
}
//# sourceMappingURL=test-utils.d.ts.map