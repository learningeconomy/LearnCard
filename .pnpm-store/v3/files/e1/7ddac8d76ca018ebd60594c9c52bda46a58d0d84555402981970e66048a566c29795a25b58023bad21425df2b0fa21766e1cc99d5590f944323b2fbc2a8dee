import { Config } from '../../setup';
import { ApiLevel } from '..';
export declare function hasPointerEvents(element: Element): boolean;
declare const PointerEventsCheck: unique symbol;
declare global {
    interface Element {
        [PointerEventsCheck]?: {
            [k in ApiLevel]?: object;
        } & {
            result: boolean;
        };
    }
}
export declare function assertPointerEvents(config: Config, element: Element): void;
export {};
