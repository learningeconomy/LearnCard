import React from 'react';

import ClrCourseSection from '../ClrCourseSection';
import ClrAssessmentSection from '../ClrAssessmentSection';
import ClrAssessmentDetailPanel from '../ClrAssessmentDetailPanel';
import ClrProgramsSection from '../ClrProgramsSection';
import ClrAwardsSection from '../ClrAwardsSection';
import ClrCourseDetailPanel from '../ClrCourseDetailPanel';
import ClrProgramDetailPanel from '../ClrProgramDetailPanel';
import ClrCompetencyDetailPanel from '../ClrCompetencyDetailPanel';
import CredentialSummaryView from '../views/CredentialSummaryView';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import ClrTranscriptSummaryHeader from '../ClrTranscriptSummaryHeader';
import ClrTranscriptWarningsPanel from '../ClrTranscriptWarningsPanel';
import SparseAcademicRecordView from '../views/SparseAcademicRecordView';

import { ModalTypes, useModal } from 'learn-card-base';

import type {
    ViewOptions,
    AssessmentDisplayModel,
    CourseDisplayModel,
    ProgramDisplayModel,
    ClrTranscriptDisplayModel,
} from '../../../helpers/clrRenderer.helpers';
import { findClrRecordById, selectClrTranscriptView } from '../../../helpers/clrRenderer.helpers';

import type { VC } from '@learncard/types';
import { getClrIssuerLogo } from '../clrKind.helpers';

type ClrRecordNavigatorOptions = {
    model: ClrTranscriptDisplayModel;
    boost: VC;
    adminMode: boolean;
    openPanel: (panel: React.ReactElement) => void;
};

export const createClrRecordNavigator = ({
    model,
    boost,
    adminMode,
    openPanel,
}: ClrRecordNavigatorOptions): ((recordId: string) => void) => {
    const issuerLogo = getClrIssuerLogo(model);

    const selectRecord = (recordId: string): void => {
        const selected = findClrRecordById(model, recordId);
        if (!selected) return;

        switch (selected.kind) {
            case 'course':
                openPanel(
                    <ClrCourseDetailPanel
                        course={selected.record}
                        boost={boost}
                        model={model}
                        onSelectRecord={selectRecord}
                        adminMode={adminMode}
                        issuerName={model.header.issuerName?.value}
                        issuerLogo={issuerLogo}
                    />
                );
                break;
            case 'program':
                openPanel(
                    <ClrProgramDetailPanel
                        program={selected.record}
                        boost={boost}
                        model={model}
                        onSelectRecord={selectRecord}
                        adminMode={adminMode}
                        issuerName={model.header.issuerName?.value}
                        issuerLogo={issuerLogo}
                    />
                );
                break;
            case 'assessment':
                openPanel(
                    <ClrAssessmentDetailPanel
                        assessment={selected.record}
                        boost={boost}
                        model={model}
                        onSelectRecord={selectRecord}
                        adminMode={adminMode}
                        issuerName={model.header.issuerName?.value}
                        issuerLogo={issuerLogo}
                    />
                );
                break;
            case 'competency':
                openPanel(
                    <ClrCompetencyDetailPanel
                        model={model}
                        initialCompetencyId={selected.record.sourceCredentialId}
                        onSelectRecord={selectRecord}
                        adminMode={adminMode}
                    />
                );
                break;
        }
    };

    return selectRecord;
};

const ClrTranscriptFullPage: React.FC<{
    model: ClrTranscriptDisplayModel;
    boost: VC;
    options: ViewOptions;
    boostUri?: string;
}> = ({ model, boost, options, boostUri }) => {
    const adminMode = options.viewer === 'admin' || options.viewer === 'registrar';
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    const selectedView = selectClrTranscriptView(model, options);
    const issuerLogo = getClrIssuerLogo(model);
    const handleSelectRecord = createClrRecordNavigator({
        model,
        boost,
        adminMode,
        openPanel: panel => {
            newModal(panel);
        },
    });

    const handleSelectProgram = (program: ProgramDisplayModel): void => {
        handleSelectRecord(program.sourceCredentialId);
    };

    const handleSelectAssessment = (assessment: AssessmentDisplayModel): void => {
        handleSelectRecord(assessment.sourceCredentialId);
    };

    const handleSelectCourse = (course: CourseDisplayModel): void => {
        handleSelectRecord(course.sourceCredentialId);
    };

    return (
        <div className="flex flex-col w-full min-h-full pt-[var(--ion-safe-area-top,0px)]">
            <div className="py-0 sm:pb-10 px-0 sm:px-4 flex justify-center sm:rounded-xl">
                <div className="max-w-[800px] w-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-xl sm:rounded-xl p-2 sm:p-10 space-y-3">
                    {/* Warnings — admin only */}
                    {adminMode && model.warnings.length > 0 && (
                        <ClrTranscriptWarningsPanel warnings={model.warnings} />
                    )}

                    {/* Summary hero card */}
                    <ClrTranscriptSummaryHeader
                        model={model}
                        boost={boost}
                        boostUri={boostUri}
                        adminMode={adminMode}
                        onSelectRecord={handleSelectRecord}
                    />

                    {/* Programs section */}
                    {model.programs.length > 0 && (
                        <ClrProgramsSection
                            programs={model.programs}
                            onSelectProgram={handleSelectProgram}
                        />
                    )}

                    {/* Structured transcript: term accordion + course table */}
                    {(selectedView === 'StructuredTranscriptView' ||
                        selectedView === 'VerifierInspectionView') &&
                        model.courses.length > 0 && (
                            <ClrCourseSection
                                model={model}
                                onSelectCourse={handleSelectCourse}
                                adminMode={adminMode}
                            />
                        )}

                    {/* Assessments (ACT, rubric-based skills assessments, ...) */}
                    {(selectedView === 'StructuredTranscriptView' ||
                        selectedView === 'VerifierInspectionView') &&
                        model.assessments.length > 0 && (
                            <ClrAssessmentSection
                                assessments={model.assessments}
                                onSelectAssessment={handleSelectAssessment}
                                adminMode={adminMode}
                            />
                        )}

                    {/* Awards & Recognitions */}
                    {(selectedView === 'StructuredTranscriptView' ||
                        selectedView === 'VerifierInspectionView') &&
                        model.awards.length > 0 && <ClrAwardsSection awards={model.awards} />}

                    {/* Sparse / summary views */}
                    {selectedView === 'SparseAcademicRecordView' && (
                        <SparseAcademicRecordView model={model} showSource={adminMode} />
                    )}
                    {selectedView === 'CredentialSummaryView' && (
                        <CredentialSummaryView model={model} />
                    )}

                    {/* Evidence */}
                    {/* {model.evidence.length > 0 && (
                        <ClrTranscriptEvidenceList evidence={model.evidence} />
                    )} */}

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
                                            ? 'text-emerald-700'
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
