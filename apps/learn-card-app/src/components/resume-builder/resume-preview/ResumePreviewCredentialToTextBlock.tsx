import React from 'react';

import { useGetResolvedCredential } from 'learn-card-base';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

type ResumePreviewCredentialBlockProps = {
    uri: string;
};

const ResumePreviewCredentialToTextBlock: React.FC<ResumePreviewCredentialBlockProps> = ({
    uri,
}) => {
    const { data: vc } = useGetResolvedCredential(uri);

    const info = vc ? getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false }) : null;
    const rawIssuer =
        vc && typeof vc.issuer === 'string'
            ? vc.issuer
            : (vc?.issuer as any)?.name ?? (vc?.issuer as any)?.id ?? '';
    const issuerStr = rawIssuer.startsWith('did:') ? '' : rawIssuer;
    const subject = vc
        ? Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject
        : null;

    return (
        <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-grayscale-800">
                    {info?.title || 'Credential'}
                </p>
                {(issuerStr || info?.createdAt) && (
                    <p className="text-xs text-grayscale-500">
                        {[issuerStr, info?.createdAt].filter(Boolean).join(' · ')}
                    </p>
                )}
                {(subject as any)?.achievement?.description && (
                    <p className="text-xs text-grayscale-600 mt-0.5">
                        {(subject as any).achievement.description}
                    </p>
                )}
                {(subject as any)?.achievement?.criteria?.narrative && (
                    <p className="text-xs text-grayscale-500 mt-0.5 italic">
                        {(subject as any).achievement.criteria.narrative}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResumePreviewCredentialToTextBlock;
