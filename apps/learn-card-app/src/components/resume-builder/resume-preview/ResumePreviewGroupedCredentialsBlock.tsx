import React, { useState } from 'react';
import { IonIcon, IonReorder, IonReorderGroup, ReorderEndCustomEvent } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';

import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewEditBlockButton from './ResumePreviewEditBlockButton';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const ResumePreviewGroupedCredentialsBlock: React.FC<{
    section: (typeof RESUME_SECTIONS)[number];
    /** When provided, only render these URIs (used for per-page slicing) */
    filteredUris?: string[];
    /** When true, render without interactive controls (used for hidden measurement) */
    measureOnly?: boolean;
    /** When true, hide all editing UI for clean preview/PDF mode */
    isPreviewing?: boolean;
}> = ({ section, filteredUris, measureOnly = false, isPreviewing = false }) => {
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const [editingUris, setEditingUris] = useState<string[]>([]);

    const toggleEditing = (uri: string, val: boolean) => {
        setEditingUris(prev => (val ? [...prev, uri] : prev.filter(u => u !== uri)));
    };

    const sectionKey = section.key as ResumeSectionKey;
    const allEntries = [...(credentialEntries[sectionKey] ?? [])].sort((a, b) => a.index - b.index);
    const entries = filteredUris
        ? allEntries.filter(e => filteredUris.includes(e.uri))
        : allEntries;

    if (!entries.length) return null;

    if (measureOnly || isPreviewing) {
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
                    const isEditing = editingUris.includes(entry.uri);
                    return (
                        <div
                            key={entry.uri}
                            className="flex items-start gap-2 py-1"
                            data-pdf-break-anchor
                        >
                            <div className="flex-1">
                                <ResumePreviewCredentialToTextBlock
                                    uri={entry.uri}
                                    section={sectionKey}
                                    isEditing={isEditing}
                                    setIsEditing={val => toggleEditing(entry.uri, val)}
                                />
                            </div>
                            <div data-pdf-hide className="flex items-center gap-1 shrink-0 mt-1">
                                {!isEditing && (
                                    <button
                                        onClick={() =>
                                            resumeBuilderStore.set.toggleCredential(
                                                sectionKey,
                                                entry.uri
                                            )
                                        }
                                        className="shrink-0 text-grayscale-300 leading-none"
                                        title="Deselect credential"
                                        aria-label="Deselect credential"
                                    >
                                        <IonIcon
                                            icon={trashOutline}
                                            className="w-[24px] h-[24px]"
                                        />
                                    </button>
                                )}
                                <ResumePreviewEditBlockButton
                                    isEditing={isEditing}
                                    setIsEditing={val => toggleEditing(entry.uri, val)}
                                />
                                {!isEditing && <IonReorder />}
                            </div>
                        </div>
                    );
                })}
            </IonReorderGroup>
        </div>
    );
};

export default ResumePreviewGroupedCredentialsBlock;
