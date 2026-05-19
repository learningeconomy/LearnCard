import { useState } from 'react';

import type {
    CourseDisplayModel,
    ClrTranscriptDisplayModel,
    ViewOptions,
} from '../../../helpers/clrRenderer.helpers';
import { selectClrTranscriptView } from '../../../helpers/clrRenderer.helpers';

import ClrTranscriptSummaryHeader from '../ClrTranscriptSummaryHeader';
import ClrCourseTable from '../ClrCourseTable';
import ClrCourseDetailPanel from '../ClrCourseDetailPanel';
import ClrTranscriptWarningsPanel from '../ClrTranscriptWarningsPanel';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import SparseAcademicRecordView from '../views/SparseAcademicRecordView';
import CredentialSummaryView from '../views/CredentialSummaryView';

type Props = {
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
};

const ClrTranscriptFullPage = ({ model, options }: Props) => {
    const adminMode = options.viewer === 'admin' || options.viewer === 'registrar';
    const [selectedCourse, setSelectedCourse] = useState<CourseDisplayModel | null>(null);

    const selectedView = selectClrTranscriptView(model, options);

    const handleSelectCourse = (course: CourseDisplayModel) => {
        setSelectedCourse(prev =>
            prev?.sourceCredentialId === course.sourceCredentialId ? null : course
        );
    };

    return (
        <div className="space-y-4">
            {/* Warnings — admin only */}
            {adminMode && model.warnings.length > 0 && (
                <ClrTranscriptWarningsPanel warnings={model.warnings} />
            )}

            {/* Summary hero card */}
            <ClrTranscriptSummaryHeader model={model} adminMode={adminMode} />

            {/* Structured transcript: term accordion + course table */}
            {(selectedView === 'StructuredTranscriptView' ||
                selectedView === 'VerifierInspectionView') &&
                model.courses.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-sm font-semibold text-grayscale-900">Course History</p>
                            <p className="text-xs text-grayscale-500">
                                {model.summary.courseCount} course
                                {model.summary.courseCount !== 1 ? 's' : ''}
                                {model.summary.totalCreditsAvailable !== undefined &&
                                    ` · ${model.summary.totalCreditsAvailable} credits`}
                            </p>
                        </div>
                        <ClrCourseTable
                            courses={model.courses}
                            onSelectCourse={handleSelectCourse}
                            selectedCourseId={selectedCourse?.sourceCredentialId}
                            adminMode={adminMode}
                        />
                    </div>
                )}

            {/* Programs section */}
            {model.programs.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-grayscale-900 px-1">Programs</p>
                    {model.programs.map(p => (
                        <div
                            key={p.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-[20px] p-4 space-y-1"
                        >
                            <p className="text-sm font-medium text-grayscale-900">
                                {p.name?.value ?? 'Program'}
                            </p>
                            <p className="text-xs text-grayscale-500">{p.achievementType.value}</p>
                            {p.description?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {p.description.value}
                                </p>
                            )}
                            {p.earnedAt?.value && (
                                <p className="text-xs text-grayscale-400">
                                    Conferred: {p.earnedAt.value}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Sparse / summary views */}
            {selectedView === 'SparseAcademicRecordView' && (
                <SparseAcademicRecordView model={model} showSource={adminMode} />
            )}
            {selectedView === 'CredentialSummaryView' && <CredentialSummaryView model={model} />}

            {/* Evidence */}
            {model.evidence.length > 0 && (
                <ClrTranscriptEvidenceList evidence={model.evidence} />
            )}

            {/* Admin: verification detail footer */}
            {adminMode && (
                <div className="bg-white border border-grayscale-200 rounded-[20px] p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                        Signing Authority
                    </p>
                    {model.header.issuerId?.value && (
                        <p className="text-xs font-mono text-grayscale-500 break-all">
                            Issuer DID: {model.header.issuerId.value}
                        </p>
                    )}
                    <p className="text-xs text-grayscale-600">
                        Parent credential:{' '}
                        <span
                            className={
                                model.verification.credentialSigned
                                    ? 'text-blue-700'
                                    : 'text-grayscale-400'
                            }
                        >
                            {model.verification.credentialSigned ? 'Signed' : 'Unsigned'}
                        </span>
                    </p>
                    <p className="text-xs text-grayscale-600">
                        Nested credentials: {model.verification.nestedCredentialSignedCount} signed
                        {model.verification.nestedCredentialUnsignedCount > 0 &&
                            ` · ${model.verification.nestedCredentialUnsignedCount} unsigned`}
                    </p>
                    {model.verification.hasCredentialStatus && (
                        <p className="text-xs text-grayscale-600">
                            Status method: {model.verification.credentialStatusType ?? 'present'}
                        </p>
                    )}
                    <p className="text-xs font-mono text-grayscale-400 break-all">
                        Credential ID: {model.header.id.value}
                    </p>
                </div>
            )}

            {/* Course detail side panel */}
            <ClrCourseDetailPanel
                course={selectedCourse}
                onClose={() => setSelectedCourse(null)}
                adminMode={adminMode}
            />
        </div>
    );
};

export default ClrTranscriptFullPage;
