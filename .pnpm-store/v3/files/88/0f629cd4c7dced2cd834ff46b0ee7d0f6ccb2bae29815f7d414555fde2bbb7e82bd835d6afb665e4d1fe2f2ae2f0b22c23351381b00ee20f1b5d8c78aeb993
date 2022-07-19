declare const UISelection: unique symbol;
export interface UISelectionRange {
    startOffset: number;
    endOffset: number;
}
export interface UISelection {
    anchorOffset: number;
    focusOffset: number;
}
declare global {
    interface Element {
        [UISelection]?: UISelection;
    }
}
export declare function prepareSelectionInterceptor(element: HTMLInputElement | HTMLTextAreaElement): void;
export declare function setUISelection(element: HTMLInputElement | HTMLTextAreaElement, { focusOffset: focusOffsetParam, anchorOffset: anchorOffsetParam, }: {
    anchorOffset?: number;
    focusOffset: number;
}, mode?: 'replace' | 'modify'): void;
export declare function getUISelection(element: HTMLInputElement | HTMLTextAreaElement): {
    startOffset: number;
    endOffset: number;
    anchorOffset: number;
    focusOffset: number;
};
export {};
