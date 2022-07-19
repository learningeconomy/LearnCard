import { Config } from '../setup';
import { keyboardKey } from './types';
export interface KeyboardAction {
    keyDef: keyboardKey;
    releasePrevious: boolean;
    releaseSelf: boolean;
    repeat: number;
}
export declare function keyboardAction(config: Config, actions: KeyboardAction[]): Promise<void>;
export declare function releaseAllKeys(config: Config): Promise<void>;
