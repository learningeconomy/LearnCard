import { Instance } from '../setup';
import { PointerAction, PointerActionTarget } from './pointerAction';
import type { pointerState, pointerKey } from './types';
export type { pointerState, pointerKey };
declare type PointerActionInput = string | ({
    keys: string;
} & PointerActionTarget) | PointerAction;
export declare type PointerInput = PointerActionInput | Array<PointerActionInput>;
export declare function pointer(this: Instance, input: PointerInput): Promise<void>;
export declare function createPointerState(document: Document): pointerState;
