import { Config } from '../setup';
import { PointerMoveAction } from './pointerMove';
import { PointerPressAction } from './pointerPress';
import { PointerTarget, SelectionTarget } from './types';
export declare type PointerActionTarget = Partial<PointerTarget> & Partial<SelectionTarget>;
export declare type PointerAction = PointerActionTarget & (Omit<PointerPressAction, 'target' | 'coords'> | Omit<PointerMoveAction, 'target' | 'coords'>);
export declare function pointerAction(config: Config, actions: PointerAction[]): Promise<void>;
