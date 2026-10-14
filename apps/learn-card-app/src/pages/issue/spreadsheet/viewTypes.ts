import type { ReactNode } from 'react';

export interface SpreadsheetView {
    controls: ReactNode;
    onPaste: (text: string) => void;
    sourceName?: string;
    details: ReactNode;
    results: ReactNode;
    previewControls: ReactNode;
    templateLocked: boolean;
    busy: boolean;
    locked?: (rowId: string) => boolean;
}
