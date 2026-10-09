import React from 'react';
import * as m from '../../paraglide/messages.js';
import type { VerificationSummary } from 'learn-card-base/helpers/credentials/clr/renderer';

const ClrTranscriptTrustBadge: React.FC<{
    verification: VerificationSummary;
    evidenceCount?: number;
}> = ({ verification, evidenceCount = 0 }) => {
    const statusLabel = (verification: VerificationSummary): string => {
        if (verification.credentialVerified) return m['clrRenderer.verified']();
        if (verification.credentialSigned) return m['clrRenderer.signedUnverified']();
        return m['clrRenderer.unsigned']();
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                {statusLabel(verification)}
            </span>
            {evidenceCount > 0 && (
                <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                    {m['clrRenderer.evidenceAttached']()}
                </span>
            )}
            {verification.hasCredentialStatus && (
                <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                    {verification.credentialStatusType
                        ? m['clrRenderer.status']({ status: verification.credentialStatusType })
                        : m['clrRenderer.revocationCheck']()}
                </span>
            )}
        </div>
    );
};

export default ClrTranscriptTrustBadge;
