import type { ClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

type Props = {
    model: ClrTranscriptDisplayModel;
    adminMode?: boolean;
};

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="flex flex-col bg-grayscale-50 border border-grayscale-200 rounded-2xl px-4 py-3 min-w-[100px]">
        <p className="text-xs font-medium text-grayscale-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-grayscale-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-grayscale-500 mt-0.5">{sub}</p>}
    </div>
);

const ClrTranscriptSummaryHeader = ({ model, adminMode = false }: Props) => {
    const topSkills = model.competencies.slice(0, 6);
    const initial = model.header.learnerName?.value?.charAt(0).toUpperCase() ?? '?';

    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 space-y-5">
            {model.meta.partial && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-medium text-amber-800">
                        Partial transcript — the issuer indicated this record does not contain all known achievements.
                    </p>
                </div>
            )}

            {/* Learner identity row */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-grayscale-900 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-white">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-grayscale-900 leading-tight truncate">
                        {model.header.learnerName?.value ?? 'Unknown learner'}
                    </p>
                    {model.header.issuerName?.value && (
                        <p className="text-sm text-grayscale-600">{model.header.issuerName.value}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {model.header.issuedAt?.value && (
                            <p className="text-xs text-grayscale-500">
                                Issued {formatClrDate(model.header.issuedAt.value)}
                            </p>
                        )}
                        {model.header.awardedDate?.value && (
                            <p className="text-xs text-grayscale-500">
                                · Awarded {formatClrDate(model.header.awardedDate.value)}
                            </p>
                        )}
                        {model.header.validUntil?.value && (
                            <p className="text-xs text-grayscale-500">
                                · Expires {formatClrDate(model.header.validUntil.value)}
                            </p>
                        )}
                    </div>
                    {adminMode && model.header.issuerId?.value && (
                        <p className="text-[10px] font-mono text-grayscale-400 mt-0.5 truncate">
                            {model.header.issuerId.value}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3">
                {model.summary.gpa && (
                    <StatCard label="Cumulative GPA" value={String(model.summary.gpa.value)} />
                )}
                {model.summary.courseCount > 0 && (
                    <StatCard label="Courses" value={model.summary.courseCount} />
                )}
                {model.summary.totalCreditsAvailable !== undefined && (
                    <StatCard label="Credits" value={model.summary.totalCreditsAvailable} />
                )}
                {model.summary.explicitCompetencyCount > 0 && (
                    <StatCard label="Competencies" value={model.summary.explicitCompetencyCount} />
                )}
                {model.summary.evidenceCount > 0 && (
                    <StatCard label="Evidence" value={model.summary.evidenceCount} />
                )}
            </div>

            {/* Top skills */}
            {topSkills.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-grayscale-600">Top Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                        {topSkills.map(c => (
                            <span
                                key={c.sourceCredentialId}
                                className="text-xs text-grayscale-800 bg-grayscale-100 border border-grayscale-200 px-2.5 py-1 rounded-full"
                            >
                                {c.name?.value ?? 'Competency'}
                            </span>
                        ))}
                        {model.competencies.length > 6 && (
                            <span className="text-xs text-grayscale-400 py-1">
                                +{model.competencies.length - 6} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Verification badges */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-grayscale-100">
                <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        model.verification.credentialVerified
                            ? 'bg-emerald-50 text-emerald-700'
                            : model.verification.credentialSigned
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-grayscale-100 text-grayscale-500'
                    }`}
                >
                    {model.verification.credentialVerified
                        ? 'Verified'
                        : model.verification.credentialSigned
                          ? 'Signed — unverified'
                          : 'Unsigned'}
                </span>
                {model.verification.hasCredentialStatus && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-grayscale-100 text-grayscale-600">
                        {model.verification.credentialStatusType ?? 'Revocation check available'}
                    </span>
                )}
                {model.header.description?.value && (
                    <span className="text-xs text-grayscale-500 py-1 flex-[1_1_100%] leading-relaxed">
                        {model.header.description.value}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ClrTranscriptSummaryHeader;
