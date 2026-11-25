import type { VC } from '@learncard/types';
import type { ClrVerificationSnapshot } from 'learn-card-base/helpers/credentials/clr/verification.types';
import type { ClrVerificationSession } from '../clr-transcript/useClrVerification';
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
    certifiedWrapper?: VC;
    boostUri?: string;
    verification?: ClrVerificationSnapshot;
    onRetryVerification?: () => void;
    insetTop?: boolean;
    verificationSession?: ClrVerificationSession;
    onViewDetails?: () => void;
}

/** Derived once per display model and shared by the renderer's composed views. */
export interface ClrPresentation {
    kind: ClrLayoutKind;
    sections: ClrRecordSection[];
    records: ReadonlyMap<string, ClrNavigableRecord>;
}
