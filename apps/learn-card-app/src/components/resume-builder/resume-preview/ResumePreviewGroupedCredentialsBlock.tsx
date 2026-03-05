import React from 'react';

import { IonReorderGroup, ReorderEndCustomEvent } from '@ionic/react';
import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewCredentialActionRail from './ResumePreviewCredentialActionRail';
import ResumePreviewCurrentJobSelector from './ResumePreviewCurrentJobSelector';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { CredentialCategoryEnum } from 'learn-card-base';

const ResumePreviewGroupedCredentialsBlock: React.FC<{
    section: (typeof RESUME_SECTIONS)[number];
    /** When provided, only render these URIs (used for per-page slicing) */
    filteredUris?: string[];
    /** When true, render without interactive controls (used for hidden measurement) */
    measureOnly?: boolean;
}> = ({ section, filteredUris, measureOnly = false }) => {
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const currentJobCredentialUri = resumeBuilderStore.useTracked.currentJobCredentialUri();
    const setCurrentJobCredentialUri = resumeBuilderStore.set.setCurrentJobCredentialUri;

    const sectionKey = section.key as ResumeSectionKey;
    const isWorkExperienceSection = sectionKey === CredentialCategoryEnum.workHistory;
    const allEntries = [...(credentialEntries[sectionKey] ?? [])].sort((a, b) => a.index - b.index);
    const entries = filteredUris
        ? allEntries.filter(e => filteredUris.includes(e.uri))
        : allEntries;

    if (!entries.length) return null;

    if (measureOnly) {
        return (
            <div className="mb-6" data-pdf-break-anchor>
                <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                    {section.label}
                </h2>
                {entries.map(entry => (
                    <div
                        key={entry.uri}
                        className="flex items-start gap-2 py-1"
                        data-pdf-break-anchor
                    >
                        <div className="flex-1">
                            <ResumePreviewCredentialToTextBlock
                                uri={entry.uri}
                                section={sectionKey}
                                isEditing={false}
                                setIsEditing={() => {}}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-6" data-pdf-break-anchor>
            <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                {section.label}
            </h2>
            {/* credentials selected converted to resume text block */}
            <IonReorderGroup
                disabled={false}
                // https://ionicframework.com/docs/api/reorder
                onIonReorderEnd={(e: ReorderEndCustomEvent) => {
                    e.stopPropagation();
                    const { from, to } = e.detail;
                    const reordered = [...entries];
                    const [moved] = reordered.splice(from, 1);
                    reordered.splice(to, 0, moved);
                    resumeBuilderStore.set.reorderCredentials(
                        sectionKey,
                        reordered.map(entry => entry.uri)
                    );
                    e.detail.complete();
                }}
            >
                {entries.map(entry => {
                    return (
                        <div
                            key={entry.uri}
                            className="flex items-start gap-2 py-1"
                            data-pdf-break-anchor
                        >
                            <div className="flex-1">
                                {isWorkExperienceSection && (
                                    <div data-pdf-hide className="mb-1">
                                        <ResumePreviewCurrentJobSelector
                                            isSelected={currentJobCredentialUri === entry.uri}
                                            onClick={() =>
                                                setCurrentJobCredentialUri(
                                                    currentJobCredentialUri === entry.uri
                                                        ? null
                                                        : entry.uri
                                                )
                                            }
                                        />
                                    </div>
                                )}
                                <ResumePreviewCredentialToTextBlock
                                    uri={entry.uri}
                                    section={sectionKey}
                                    isEditing
                                    setIsEditing={() => {}}
                                />
                            </div>
                            <div data-pdf-hide className="flex items-center gap-1 shrink-0 mt-1">
                                <ResumePreviewCredentialActionRail
                                    onDelete={() =>
                                        resumeBuilderStore.set.toggleCredential(
                                            sectionKey,
                                            entry.uri
                                        )
                                    }
                                />
                            </div>
                        </div>
                    );
                })}
            </IonReorderGroup>
        </div>
    );
};

export default ResumePreviewGroupedCredentialsBlock;
