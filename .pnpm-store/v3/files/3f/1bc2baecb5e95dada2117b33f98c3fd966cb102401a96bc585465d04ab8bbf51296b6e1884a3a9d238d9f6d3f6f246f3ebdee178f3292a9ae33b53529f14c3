import { Config } from '../setup';
import { EventTypeInit } from './createEvent';
import { EventType, PointerCoords } from './types';
export type { EventType, PointerCoords };
export declare function dispatchUIEvent<K extends EventType>(config: Config, target: Element, type: K, init?: EventTypeInit<K>, preventDefault?: boolean): boolean;
export declare function bindDispatchUIEvent(config: Config): (target: Element, type: keyof DocumentEventMap, init?: InputEventInit | UIEventInit | EventInit | ClipboardEventInit | MouseEventInit | PointerEventInit | KeyboardEventInit | undefined, preventDefault?: boolean | undefined) => boolean;
