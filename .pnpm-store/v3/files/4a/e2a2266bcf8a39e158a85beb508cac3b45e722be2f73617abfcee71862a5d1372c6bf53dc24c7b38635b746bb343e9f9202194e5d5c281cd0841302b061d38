declare const UIValue: unique symbol;
declare const InitialValue: unique symbol;
declare const TrackChanges: unique symbol;
declare global {
    interface Element {
        [UIValue]?: string;
        [InitialValue]?: string;
        [TrackChanges]?: {
            previousValue?: string;
            tracked?: string[];
            nextValue?: string;
        };
    }
}
export declare function prepareValueInterceptor(element: HTMLInputElement): void;
export declare function setUIValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void;
export declare function getUIValue(element: HTMLInputElement | HTMLTextAreaElement): string;
export declare function clearInitialValue(element: HTMLInputElement | HTMLTextAreaElement): void;
export declare function getInitialValue(element: HTMLInputElement | HTMLTextAreaElement): string | undefined;
export declare function startTrackValue(element: HTMLInputElement | HTMLTextAreaElement): void;
/**
 * @returns `true` if we recognize a React state reset and update
 */
export declare function endTrackValue(element: HTMLInputElement | HTMLTextAreaElement): boolean;
export {};
