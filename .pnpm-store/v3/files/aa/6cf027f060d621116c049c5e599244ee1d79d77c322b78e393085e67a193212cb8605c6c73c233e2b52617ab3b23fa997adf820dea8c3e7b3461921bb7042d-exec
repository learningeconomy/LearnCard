import { StreamID } from './stream-id.js';
import { CommitID } from './commit-id.js';
function tryCatch(f) {
    try {
        return f();
    }
    catch {
        return null;
    }
}
export var StreamRef;
(function (StreamRef) {
    function from(input) {
        if (StreamID.isInstance(input)) {
            return input;
        }
        else if (CommitID.isInstance(input)) {
            return input;
        }
        else if (input instanceof Uint8Array) {
            const commitId = CommitID.fromBytesNoThrow(input);
            if (commitId instanceof Error) {
                return StreamID.fromBytes(input);
            }
            return commitId;
        }
        else if (typeof input === 'string') {
            const commitId = CommitID.fromStringNoThrow(input);
            if (commitId instanceof Error) {
                return StreamID.fromString(input);
            }
            return commitId;
        }
        else {
            throw new Error(`Can not build CommitID or StreamID`);
        }
    }
    StreamRef.from = from;
})(StreamRef || (StreamRef = {}));
//# sourceMappingURL=stream-ref.js.map