import { Config } from '../setup';
import type { pointerKey, PointerTarget, SelectionTarget } from './types';
export interface PointerPressAction extends PointerTarget, SelectionTarget {
    keyDef: pointerKey;
    releasePrevious: boolean;
    releaseSelf: boolean;
}
export declare function pointerPress(config: Config, action: PointerPressAction): Promise<void>;
