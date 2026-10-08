import React from 'react';
import type { VC } from '@learncard/types';
import {
    createClrRecordSelection,
    inferClrLayout,
    type ClrRecordNavigator,
    type ClrTranscriptDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { getClrIssuerLogo } from 'learn-card-base/helpers/credentials/clr/kind';
import ClrGenericRecordDetailPanel from '../clr-transcript/ClrGenericRecordDetailPanel';
import ClrCourseDetailPanel from '../clr-transcript/ClrCourseDetailPanel';
import ClrProgramDetailPanel from '../clr-transcript/ClrProgramDetailPanel';
import ClrAssessmentDetailPanel from '../clr-transcript/ClrAssessmentDetailPanel';
import ClrCompetencyDetailPanel from '../clr-transcript/ClrCompetencyDetailPanel';

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
}: ClrRecordNavigatorOptions): ClrRecordNavigator => {
    const issuerLogo = getClrIssuerLogo(model);
    const navigator = createClrRecordSelection(model, selected => {
        if (inferClrLayout(model.canonical).kind !== 'academic') {
            openPanel(
                <ClrGenericRecordDetailPanel
                    record={selected.record}
                    model={model}
                    onSelectRecord={navigator.selectRecord}
                    adminMode={adminMode}
                    prominentFields
                />
            );
            return;
        }
        switch (selected.kind) {
            case 'course':
                openPanel(
                    <ClrCourseDetailPanel
                        course={selected.record}
                        boost={boost}
                        model={model}
                        onSelectRecord={navigator.selectRecord}
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
                        onSelectRecord={navigator.selectRecord}
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
                        onSelectRecord={navigator.selectRecord}
                        adminMode={adminMode}
                        issuerName={model.header.issuerName?.value}
                        issuerLogo={issuerLogo}
                    />
                );
                break;
            case 'award':
            case 'other':
                openPanel(
                    <ClrGenericRecordDetailPanel
                        record={selected.record}
                        model={model}
                        onSelectRecord={navigator.selectRecord}
                        adminMode={adminMode}
                    />
                );
                break;
            case 'competency':
                openPanel(
                    <ClrCompetencyDetailPanel
                        model={model}
                        initialCompetencyId={selected.record.sourceCredentialId}
                        onSelectRecord={navigator.selectRecord}
                        adminMode={adminMode}
                    />
                );
                break;
        }
    });

    return navigator;
};
