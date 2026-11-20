import React from 'react';

import ClrIssuerAddress from './ClrIssuerAddress';
import ClrTranscriptSourceField from './ClrTranscriptSourceField';
import ClrTranscriptTrustBadge from './ClrTranscriptTrustBadge';

import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrVerificationSummary } from './ClrVerificationSummary';
import { hasSignedClrCredentials } from 'learn-card-base/helpers/credentials/clr/verification';

const ClrTranscriptHeader: React.FC<{
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
    onRetryVerification?: () => void;
}> = ({ model, showSource = false, onRetryVerification }) => {
    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 space-y-v3-4">
            {model.meta.partial && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-medium text-amber-800">
                        Partial transcript — the issuer indicated this record does not contain all
                        known achievements.
                    </p>
                </div>
            )}
            <div className="space-y-v3-2">
                <ClrTranscriptSourceField
                    label="Credential"
                    field={model.header.title}
                    showSource={showSource}
                />
                {model.header.description && (
                    <ClrTranscriptSourceField
                        label="Description"
                        field={model.header.description}
                        showSource={showSource}
                    />
                )}
                <ClrTranscriptSourceField
                    label="Issuer"
                    field={model.header.issuerName}
                    showSource={showSource}
                />
                {model.header.issuerAddress && (
                    <ClrIssuerAddress
                        address={model.header.issuerAddress}
                        showSource={showSource}
                    />
                )}
                <ClrTranscriptSourceField
                    label="Learner"
                    field={model.header.learnerName}
                    showSource={showSource}
                />
                {model.header.issuedAt && (
                    <ClrTranscriptSourceField
                        label="Issued"
                        field={model.header.issuedAt}
                        showSource={showSource}
                    />
                )}
                {model.header.validFrom && (
                    <ClrTranscriptSourceField
                        label="Valid from"
                        field={model.header.validFrom}
                        showSource={showSource}
                    />
                )}
                {model.header.awardedDate && (
                    <ClrTranscriptSourceField
                        label="Awarded"
                        field={model.header.awardedDate}
                        showSource={showSource}
                    />
                )}
                {model.header.validUntil && (
                    <ClrTranscriptSourceField
                        label="Valid until"
                        field={model.header.validUntil}
                        showSource={showSource}
                    />
                )}
            </div>
            <ClrTranscriptTrustBadge
                verification={model.verification}
                evidenceCount={model.summary.evidenceCount}
                hideStatus={Boolean(
                    model.verification.snapshot &&
                    hasSignedClrCredentials(model.verification.snapshot)
                )}
            />
            <ClrVerificationSummary
                snapshot={model.verification.snapshot}
                publisherDid={model.canonical.collection.publisher?.id?.value}
                model={model}
                retry={onRetryVerification}
            />
        </div>
    );
};

export default ClrTranscriptHeader;
