import { EventType } from './types';
export declare type EventTypeInit<K extends EventType> = SpecificEventInit<FixedDocumentEventMap[K]>;
interface FixedDocumentEventMap extends DocumentEventMap {
    input: InputEvent;
}
declare type SpecificEventInit<E extends Event> = E extends InputEvent ? InputEventInit : E extends ClipboardEvent ? ClipboardEventInit : E extends KeyboardEvent ? KeyboardEventInit : E extends PointerEvent ? PointerEventInit : E extends MouseEvent ? MouseEventInit : E extends UIEvent ? UIEventInit : EventInit;
export declare function createEvent<K extends EventType>(type: K, target: Element, init?: EventTypeInit<K>): DocumentEventMap[K];
export {};
