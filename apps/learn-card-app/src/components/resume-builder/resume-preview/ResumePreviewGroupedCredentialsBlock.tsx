import React, { useState } from 'react';
import { IonReorder, IonReorderGroup, ReorderEndCustomEvent } from '@ionic/react';

import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewEditBlockButton from './ResumePreviewEditBlockButton';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const ResumePreviewGroupedCredentialsBlock: React.FC<{
    section: (typeof RESUME_SECTIONS)[number];
}> = ({ section }) => {
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const [editingUris, setEditingUris] = useState<Set<string>>(new Set());

    const toggleEditing = (uri: string, val: boolean) => {
        setEditingUris(prev => {
            const next = new Set(prev);
            if (val) next.add(uri);
            else next.delete(uri);
            return next;
        });
    };

    const sectionKey = section.key as ResumeSectionKey;
    const entries = [...(credentialEntries[sectionKey] ?? [])].sort((a, b) => a.index - b.index);

    if (!entries.length) return null;

    return (
        <div key={section.key} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                {section.label}
            </h2>
            {/* credentials selected converted to resume text block */}
            <IonReorderGroup
                disabled={false}
                // https://ionicframework.com/docs/api/reorder
                onIonReorderEnd={(e: ReorderEndCustomEvent) => {
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
                    const isEditing = editingUris.has(entry.uri);
                    return (
                        <div key={entry.uri} className="flex items-start gap-2 py-1">
                            <div className="flex-1">
                                <ResumePreviewCredentialToTextBlock
                                    uri={entry.uri}
                                    section={sectionKey}
                                    isEditing={isEditing}
                                    setIsEditing={val => toggleEditing(entry.uri, val)}
                                />
                            </div>
                            <div className="flex items-center gap-1 shrink-0 mt-1">
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
