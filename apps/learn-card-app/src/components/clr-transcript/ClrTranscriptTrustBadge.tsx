import type { VerificationSummary } from '../../helpers/clrRenderer.helpers';

const ClrTranscriptTrustBadge: React.FC<{
    verification: VerificationSummary;
    evidenceCount?: number;
}> = ({ verification, evidenceCount = 0 }) => {
    const statusLabel = (verification: VerificationSummary): string => {
        if (verification.credentialVerified) return 'Verified signed payload';
        if (verification.credentialSigned) return 'Signed, not verified';
        return 'Unsigned credential';
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                {statusLabel(verification)}
            </span>
            {evidenceCount > 0 && (
                <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                    Evidence attached
                </span>
            )}
            {verification.hasCredentialStatus && (
                <span className="text-xs font-medium text-grayscale-700 px-2.5 py-1 rounded-full bg-grayscale-100">
                    {verification.credentialStatusType
                        ? `Status: ${verification.credentialStatusType}`
                        : 'Revocation check available'}
                </span>
            )}
        </div>
    );
};

export default ClrTranscriptTrustBadge;
