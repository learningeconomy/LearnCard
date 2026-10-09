import type { VC } from '@learncard/types';
import type {
    ClrTranscriptDisplayModel,
    ClrLayoutKind,
    ClrRecordSection,
    ClrNavigableRecord,
    ViewOptions,
} from 'learn-card-base/helpers/credentials/clr/renderer';

export interface ClrRendererProps {
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
    boost?: VC;
    boostUri?: string;
    insetTop?: boolean;
    onViewDetails?: () => void;
}

/** Derived once per display model and shared by the renderer's composed views. */
export interface ClrPresentation {
    kind: ClrLayoutKind;
    sections: ClrRecordSection[];
    records: ReadonlyMap<string, ClrNavigableRecord>;
}
