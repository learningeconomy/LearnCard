import type { VC } from '@learncard/types';
import type {
    ClrTranscriptDisplayModel,
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
