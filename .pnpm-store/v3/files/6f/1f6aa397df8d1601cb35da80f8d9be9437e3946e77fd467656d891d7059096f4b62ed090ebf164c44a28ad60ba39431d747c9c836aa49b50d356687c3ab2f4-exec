import { BehaviorSubject } from 'rxjs';
import { StreamUtils } from './utils/stream-utils.js';
export class StreamStateSubject extends BehaviorSubject {
    next(next) {
        const current = this.value;
        if (!StreamUtils.statesEqual(current, next)) {
            super.next(next);
        }
    }
}
//# sourceMappingURL=stream-state-subject.js.map