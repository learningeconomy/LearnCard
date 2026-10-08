import React, { useMemo } from 'react';
import type { VC } from '@learncard/types';
import { ModalTypes, useModal, CredentialCategoryEnum } from 'learn-card-base';
import {
    ClrTranscriptSurface,
    inferClrLayout,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import AcademicClrFullPage from '../clr-transcript/views/AcademicClrFullPage';
import AcademicClrCard from '../clr-transcript/views/AcademicClrCard';
import AcademicClrEmbed from '../clr-transcript/views/AcademicClrEmbed';
import ClrTranscriptDetailModal from '../clr-transcript/ClrTranscriptDetailModal';
import ClrTranscriptEvidenceList from '../clr-transcript/ClrTranscriptEvidenceList';
import ClrTranscriptWarningsPanel from '../clr-transcript/ClrTranscriptWarningsPanel';
import ShareBoostLink from '../boost/boost-options-menu/ShareBoostLink';
import { ClrCollectionFrame } from './ClrCollectionFrame';
import { ClrCollectionHeader } from './ClrCollectionHeader';
import { ClrRecordSections } from './ClrRecordSections';
import { createClrRecordNavigator } from './recordNavigation';
import type { ClrRendererProps } from './types';
import * as m from '../../paraglide/messages.js';

/** One collection-layout decision for every CLR surface; normalization remains upstream. */
export const ClrRenderer = (props: ClrRendererProps) => {
    const { model, options, boostUri, insetTop = true, onViewDetails } = props;
    const boost = props.boost ?? (model.canonical.collection.sourceCredential as VC);
    const { kind } = inferClrLayout(model.canonical);
    const adminMode = options.viewer === 'admin' || options.viewer === 'registrar';
    const full = options.surface === ClrTranscriptSurface.Full;
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const navigator = useMemo(
        () =>
            createClrRecordNavigator({
                model,
                boost,
                adminMode,
                openPanel: panel => newModal(panel),
            }),
        [model, boost, adminMode, newModal]
    );
    const openDetails = (): void => {
        if (onViewDetails) {
            onViewDetails();
            return;
        }
        newModal(
            <ClrTranscriptDetailModal
                model={model}
                boost={boost}
                boostUri={boostUri}
                options={{ ...options, surface: ClrTranscriptSurface.Full }}
            />
        );
    };
    if (kind === 'academic') {
        if (options.surface === ClrTranscriptSurface.Card)
            return <AcademicClrCard model={model} boost={boost} onViewDetails={openDetails} />;
        if (options.surface === ClrTranscriptSurface.Embed)
            return <AcademicClrEmbed model={model} />;
        return <AcademicClrFullPage {...props} boost={boost} />;
    }
    const warnings = model.warnings.filter(
        warning =>
            !['MISSING_GPA', 'MISSING_COURSES', 'MISSING_TERMS', 'MISSING_CREDITS'].includes(
                warning.code
            )
    );
    return (
        <ClrCollectionFrame layout={kind} insetTop={full && insetTop}>
            <div className={`mx-auto w-full space-y-5 ${full ? 'max-w-[800px] p-4 sm:p-8' : ''}`}>
                {adminMode && warnings.length > 0 && (
                    <ClrTranscriptWarningsPanel warnings={warnings} />
                )}
                <ClrCollectionHeader
                    model={model}
                    layout={kind}
                    compact={!full}
                    actions={
                        full && props.boost ? (
                            <ShareBoostLink
                                boost={boost}
                                boostUri={boostUri ?? model.header.id.value}
                                categoryType={CredentialCategoryEnum.learningHistory}
                                compact
                            />
                        ) : undefined
                    }
                />
                {full && (
                    <ClrRecordSections
                        model={model}
                        layout={kind}
                        onSelectRecord={navigator.selectRecord}
                    />
                )}
                <ClrTranscriptEvidenceList evidence={model.evidence} compact={!full} />
                {!full && (
                    <button
                        type="button"
                        onClick={openDetails}
                        className="rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {m['clrRenderer.viewDetails']()}
                    </button>
                )}
            </div>
        </ClrCollectionFrame>
    );
};
