import React from 'react';

import { StatCard } from './ClrStatCard';
import ClrIssuerBadge from './ClrIssuerBadge';
import ClrEvidenceDetailPanel from './ClrEvidenceDetailPanel';
import ClrCompetencyDetailPanel from './ClrCompetencyDetailPanel';
import ClrVerificationPills from './ClrVerificationPills';
import { createTranscriptEvidenceSourceSummaries } from './ClrTranscriptEvidenceList';
import ShareBoostLink from '../boost/boost-options-menu/ShareBoostLink';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import { CredentialCategoryEnum, ModalTypes, useModal } from 'learn-card-base';

import type { VC } from '@learncard/types';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import type { ClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrGpa } from './clr.helpers';

const ClrTranscriptSummaryHeader: React.FC<{
    model: ClrTranscriptDisplayModel;
    boost: VC;
    boostUri?: string;
    adminMode?: boolean;
}> = ({ model, boost, boostUri, adminMode = false }) => {
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
        newModal(
            <ClrEvidenceDetailPanel
                evidence={model.evidence}
                sourceSummaries={createTranscriptEvidenceSourceSummaries({
                    transcriptCredentialId: model.header.id.value,
                    transcriptTitle,
                    transcriptIssuedAt: model.header.issuedAt?.value,
                    courses: model.courses,
                    programs: model.programs,
                })}
            />
        );
    };
    const openCompetenciesModal = () => {
        newModal(
            <ClrCompetencyDetailPanel
                competencies={model.competencies}
                courses={model.courses}
                programs={model.programs}
                associations={model.associations}
                adminMode={adminMode}
            />
        );
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
            <div className="relative flex flex-col gap-4 md:flex-row md:items-start">
                <UserProfilePicture
                    user={{ displayName: model.header.learnerName?.value }}
                    customContainerClass="w-16 h-16 shrink-0 text-2xl self-start"
                    customImageClass="w-16 h-16"
                />

                <div className="w-full min-w-0 md:flex-1 md:pt-1">
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

                <div className="absolute right-[-10px] top-[-15px] md:static md:ml-auto">
                    <ShareBoostLink
                        boost={boost}
                        boostUri={boostUri ?? model.header.id.value}
                        categoryType={CredentialCategoryEnum.learningHistory}
                        compact
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3">
                {model.summary.gpa && (
                    <StatCard type="gpa" value={formatClrGpa(model.summary.gpa.value)} />
                )}
                {model.summary.courseCount > 0 && (
                    <StatCard
                        type="courses"
                        value={model.summary.courseCount}
                        onClick={scrollToCourseHistory}
                    />
                )}
                {model.summary.explicitCompetencyCount > 0 && (
                    <StatCard
                        type="competencies"
                        value={model.summary.explicitCompetencyCount}
                        onClick={openCompetenciesModal}
                    />
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

            {/* Verification badge + pills + issuer logo */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-grayscale-100 rounded-full px-2 !py-0">
                        <CredentialVerificationDisplay
                            className="!bg-grayscale-100"
                            iconClassName="!w-4 !h-4"
                            credential={boost}
                            showText
                        />
                    </div>
                    <ClrVerificationPills boost={boost} />
                </div>

                <ClrIssuerBadge logoSrc={issuerLogo} issuerName={model.header.issuerName?.value} />
            </div>
        </div>
    );
};

export default ClrTranscriptSummaryHeader;
