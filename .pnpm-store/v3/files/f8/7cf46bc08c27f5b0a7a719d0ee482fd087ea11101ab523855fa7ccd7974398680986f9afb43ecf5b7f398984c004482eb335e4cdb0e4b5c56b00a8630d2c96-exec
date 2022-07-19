import { BehaviorSubject, lastValueFrom, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CID } from 'multiformats/cid';
import * as uint8arrays from 'uint8arrays';
import * as random from '@stablelib/random';
import { StreamID } from '@ceramicnetwork/streamid';
import { decode as decodeMultiHash } from 'multiformats/hashes/digest';
import { AnchorStatus } from '../stream.js';
const SHA256_CODE = 0x12;
class FakeRunningState extends BehaviorSubject {
    constructor(value) {
        super(value);
        this.state = this.value;
        this.id = new StreamID(this.state.type, this.state.log[0].cid);
    }
}
export class TestUtils {
    static async waitForState(stream, timeout, predicate, onFailure) {
        if (predicate(stream.state))
            return;
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout));
        const completionPromise = lastValueFrom(stream.pipe(filter((state) => predicate(state))), {
            defaultValue: undefined,
        });
        await Promise.race([timeoutPromise, completionPromise]);
        if (!predicate(stream.state)) {
            onFailure();
        }
    }
    static runningState(state) {
        return new FakeRunningState(state);
    }
    static async delay(ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }
    static randomCID() {
        const body = uint8arrays.concat([
            uint8arrays.fromString('1220', 'base16'),
            random.randomBytes(32),
        ]);
        return CID.create(1, SHA256_CODE, decodeMultiHash(body));
    }
    static async anchorUpdate(ceramic, stream) {
        const anchorService = ceramic.context.anchorService;
        if ('anchor' in anchorService) {
            const tillAnchored = firstValueFrom(stream.pipe(filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus))));
            await anchorService.anchor();
            await tillAnchored;
        }
    }
}
//# sourceMappingURL=test-utils.js.map