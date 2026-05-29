import type { VC } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';
import { TrustedIcon } from 'learn-card-base/svgs/TrustedIcon';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import type { ClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';
import { StatCard } from './ClrStatCard';

type Props = {
    model: ClrTranscriptDisplayModel;
    credential: VC;
    adminMode?: boolean;
};

const ClrTranscriptSummaryHeader = ({ model, credential, adminMode = false }: Props) => {
    const initial = model.header.learnerName?.value?.charAt(0).toUpperCase() ?? '?';
    const issuerLogo = model.header.image?.value;
    const transcriptTitle = model.header.title?.value || 'Official Academic Transcript';

    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 space-y-5 relative overflow-hidden">
            {model.meta.partial && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-medium text-amber-800">
                        Partial transcript — the issuer indicated this record does not contain all
                        known achievements.
                    </p>
                </div>
            )}

            {/* Top: avatar + identity + QR */}
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-grayscale-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <span className="text-2xl font-bold text-grayscale-700">{initial}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-2xl font-semibold text-grayscale-900 leading-tight truncate">
                        {model.header.learnerName?.value ?? 'Unknown learner'}
                    </p>
                    <div className="border-t border-grayscale-200 my-2" />
                    {model.header.issuerName?.value && (
                        <p className="text-sm font-bold uppercase text-blue-900 tracking-wide">
                            {model.header.issuerName.value}
                        </p>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-grayscale-500 mt-1">
                        {transcriptTitle}
                        {model.header.issuedAt?.value && (
                            <> • Issued {formatClrDate(model.header.issuedAt.value)}</>
                        )}
                    </p>
                    {adminMode && model.header.issuerId?.value && (
                        <p className="text-[10px] font-mono text-grayscale-400 mt-1 truncate">
                            {model.header.issuerId.value}
                        </p>
                    )}
                </div>

                {/* QR + verification icon */}
                <div className="relative shrink-0 rounded-[16px] border border-grayscale-200 bg-white p-3 pb-8">
                    <QRCodeSVG value={model.header.id.value || getAppBaseUrl()} size={50} />
                    <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2">
                        <CredentialVerificationDisplay
                            credential={credential}
                            iconClassName="w-6 h-6"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3">
                {model.summary.gpa && (
                    <StatCard type="gpa" value={String(model.summary.gpa.value)} />
                )}
                {model.summary.courseCount > 0 && (
                    <StatCard type="courses" value={model.summary.courseCount} />
                )}
                {model.summary.explicitCompetencyCount > 0 && (
                    <StatCard type="competencies" value={model.summary.explicitCompetencyCount} />
                )}
                {model.summary.evidenceCount > 0 && (
                    <StatCard type="evidence" value={model.summary.evidenceCount} />
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-grayscale-200" />

            {/* Awarded date + description */}
            <div className="space-y-2">
                {model.header.awardedDate?.value && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-grayscale-500">
                        Awarded {formatClrDate(model.header.awardedDate.value)}
                    </p>
                )}
                {model.header.description?.value && (
                    <p className="text-sm text-grayscale-700 leading-relaxed">
                        {model.header.description.value}
                    </p>
                )}
                {model.header.validUntil?.value && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-grayscale-500">
                        Expires {formatClrDate(model.header.validUntil.value)}
                    </p>
                )}
            </div>

            {/* Verification badge + issuer logo */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <CredentialVerificationDisplay credential={credential} showText />

                {issuerLogo && (
                    <img
                        src={issuerLogo}
                        alt={model.header.issuerName?.value ?? 'Issuer logo'}
                        className="w-14 h-14 object-contain shrink-0"
                    />
                )}
            </div>
        </div>
    );
};

export default ClrTranscriptSummaryHeader;
