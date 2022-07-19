import { Config } from '../setup';
import { PointerTarget, SelectionTarget } from './types';
export interface PointerMoveAction extends PointerTarget, SelectionTarget {
    pointerName?: string;
}
export declare function pointerMove(config: Config, { pointerName, target, coords, node, offset }: PointerMoveAction): Promise<void>;
