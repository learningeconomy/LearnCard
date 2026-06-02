import React from 'react';

import { ModalTypes, useModal } from 'learn-card-base';
import { QRCodeSVG } from 'qrcode.react';
import { StatCard } from './ClrStatCard';
import ClrIssuerBadge from './ClrIssuerBadge';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';

import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import ClrEvidenceDetailPanel from './ClrEvidenceDetailPanel';

import type { VC } from '@learncard/types';
import type { ClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    model: ClrTranscriptDisplayModel;
    credential: VC;
    adminMode?: boolean;
};

const ClrTranscriptSummaryHeader = ({ model, credential, adminMode = false }: Props) => {
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const issuerLogo = model.header.image?.value;
    const transcriptTitle = model.header.title?.value || 'Official Academic Transcript';
    const scrollToCourseHistory = () => {
        document.getElementById('course-history')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };
    const openEvidenceModal = () => {
        newModal(<ClrEvidenceDetailPanel evidence={model.evidence} />);
    };

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
                <UserProfilePicture
                    user={{ displayName: model.header.learnerName?.value }}
                    customContainerClass="w-16 h-16 shrink-0 text-2xl"
                    customImageClass="w-16 h-16"
                />

                <div className="flex-1 min-w-0">
                    <p className="text-[22px] text-grayscale-900 leading-tight truncate">
                        {model.header.learnerName?.value ?? 'Unknown learner'}
                    </p>
                    <div className="border-t border-grayscale-200 my-2" />
                    {model.header.issuerName?.value && (
                        <p className="text-sm font-bold uppercase text-blue-900 tracking-wide">
                            {model.header.issuerName.value}
                        </p>
                    )}
                    <p className="text-xs font-medium uppercase tracking-wider text-grayscale-800 mt-1">
                        {transcriptTitle}
                        {model.header.issuedAt?.value && (
                            <> • Issued {formatClrDate(model.header.issuedAt.value)}</>
                        )}
                    </p>
                    {adminMode && model.header.issuerId?.value && (
                        <p className="text-xs font-semibold text-grayscale-600 mt-1 truncate">
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
                    <StatCard
                        type="courses"
                        value={model.summary.courseCount}
                        onClick={scrollToCourseHistory}
                    />
                )}
                {model.summary.explicitCompetencyCount > 0 && (
                    <StatCard type="competencies" value={model.summary.explicitCompetencyCount} />
                )}
                {model.summary.evidenceCount > 0 && (
                    <StatCard
                        type="evidence"
                        value={model.summary.evidenceCount}
                        onClick={openEvidenceModal}
                    />
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
                <div className="bg-grayscale-100 rounded-full px-2 py-1">
                    <CredentialVerificationDisplay credential={credential} showText />
                </div>

                <ClrIssuerBadge logoSrc={issuerLogo} issuerName={model.header.issuerName?.value} />
            </div>
        </div>
    );
};

export default ClrTranscriptSummaryHeader;
