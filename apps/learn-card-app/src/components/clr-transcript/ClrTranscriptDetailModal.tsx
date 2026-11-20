import React from 'react';
import ClrTranscriptFullPage from './surfaces/ClrTranscriptFullPage';
import type {
    ClrTranscriptDisplayModel,
    ViewOptions,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import type { VC } from '@learncard/types';
import type { ClrVerificationSession } from './useClrVerification';

const ClrTranscriptDetailModal: React.FC<{
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
    boost: VC;
    boostUri?: string;
    onRetryVerification?: () => void;
    verificationSession?: ClrVerificationSession;
}> = ({ model, options, boost, boostUri, onRetryVerification, verificationSession }) => (
    <div className="h-full overflow-y-auto pb-[100px]">
        <ClrTranscriptFullPage
            model={model}
            options={options}
            boost={boost}
            boostUri={boostUri}
            verification={model.verification.snapshot}
            onRetryVerification={onRetryVerification}
            verificationSession={verificationSession}
        />
    </div>
);

export default ClrTranscriptDetailModal;
