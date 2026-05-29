import React from 'react';

import ClrCourseTable from '../ClrCourseTable';
import ClrProgramsSection from '../ClrProgramsSection';
import ClrCourseDetailPanel from '../ClrCourseDetailPanel';
import CredentialSummaryView from '../views/CredentialSummaryView';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import ClrTranscriptSummaryHeader from '../ClrTranscriptSummaryHeader';
import ClrTranscriptWarningsPanel from '../ClrTranscriptWarningsPanel';
import SparseAcademicRecordView from '../views/SparseAcademicRecordView';

import { ModalTypes, useModal } from 'learn-card-base';

import type { VC } from '@learncard/types';
import type {
    ViewOptions,
    CourseDisplayModel,
    ClrTranscriptDisplayModel,
} from '../../../helpers/clrRenderer.helpers';

import { selectClrTranscriptView } from '../../../helpers/clrRenderer.helpers';

type Props = {
    model: ClrTranscriptDisplayModel;
    credential: VC;
    options: ViewOptions;
};

const ClrTranscriptFullPage = ({ model, credential, options }: Props) => {
    const adminMode = options.viewer === 'admin' || options.viewer === 'registrar';
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    const selectedView = selectClrTranscriptView(model, options);

    const handleSelectCourse = (course: CourseDisplayModel) => {
        newModal(
            <ClrCourseDetailPanel
                course={course}
                adminMode={adminMode}
                associations={model.associations}
            />
        );
    };

    return (
        <div className="flex flex-col w-full min-h-full bg-grayscale-50">
            <div className="py-10 px-4 flex justify-center">
                <div className="max-w-[800px] w-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-xl p-10 space-y-4">
                    {/* Warnings — admin only */}
                    {adminMode && model.warnings.length > 0 && (
                        <ClrTranscriptWarningsPanel warnings={model.warnings} />
                    )}

                    {/* Summary hero card */}
                    <ClrTranscriptSummaryHeader
                        model={model}
                        credential={credential}
                        adminMode={adminMode}
                    />

                    {/* Programs section */}
                    {model.programs.length > 0 && (
                        <ClrProgramsSection programs={model.programs} adminMode={adminMode} />
                    )}

                    {/* Structured transcript: term accordion + course table */}
                    {(selectedView === 'StructuredTranscriptView' ||
                        selectedView === 'VerifierInspectionView') &&
                        model.courses.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-sm font-semibold text-grayscale-900">
                                        Course History
                                    </p>
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
                                    adminMode={adminMode}
                                />
                            </div>
                        )}

                    {/* Sparse / summary views */}
                    {selectedView === 'SparseAcademicRecordView' && (
                        <SparseAcademicRecordView model={model} showSource={adminMode} />
                    )}
                    {selectedView === 'CredentialSummaryView' && (
                        <CredentialSummaryView model={model} />
                    )}

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
                                Nested credentials: {model.verification.nestedCredentialSignedCount}{' '}
                                signed
                                {model.verification.nestedCredentialUnsignedCount > 0 &&
                                    ` · ${model.verification.nestedCredentialUnsignedCount} unsigned`}
                            </p>
                            {model.verification.hasCredentialStatus && (
                                <p className="text-xs text-grayscale-600">
                                    Status method:{' '}
                                    {model.verification.credentialStatusType ?? 'present'}
                                </p>
                            )}
                            <p className="text-xs font-mono text-grayscale-400 break-all">
                                Credential ID: {model.header.id.value}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClrTranscriptFullPage;
