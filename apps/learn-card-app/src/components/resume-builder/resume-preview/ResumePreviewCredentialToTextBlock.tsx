import React, { useEffect } from 'react';
import { IonReorder, IonReorderGroup, ReorderEndCustomEvent } from '@ionic/react';

import ResumePreviewEditableTextBlock from './ResumePreviewEditableTextBlock';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { useGetResolvedCredential } from 'learn-card-base';
import { ResumeSectionKey } from '../resume-builder.helpers';

const ResumePreviewCredentialToTextBlock: React.FC<{
    uri: string;
    section: ResumeSectionKey;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}> = ({ uri, section, isEditing, setIsEditing }) => {
    const { data: vc } = useGetResolvedCredential(uri);

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const initCredentialFields = resumeBuilderStore.set.initCredentialFields;
    const addCredentialField = resumeBuilderStore.set.addCredentialField;
    const updateCredentialField = resumeBuilderStore.set.updateCredentialField;
    const removeCredentialField = resumeBuilderStore.set.removeCredentialField;

    const entry = (credentialEntries[section] ?? []).find(e => e.uri === uri);
    const fields = [...(entry?.fields ?? [])].sort((a, b) => a.index - b.index);

    const info = vc ? getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false }) : null;
    const rawIssuer =
        vc && typeof vc.issuer === 'string'
            ? vc.issuer
            : (vc?.issuer as any)?.name ?? (vc?.issuer as any)?.id ?? '';
    const issuerStr = rawIssuer.startsWith('did:') ? '' : rawIssuer;
    const subject = vc
        ? Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject
        : null;

    const vcDescription: string =
        (subject as any)?.achievement?.description ||
        (subject as any)?.achievement?.criteria?.narrative ||
        '';

    useEffect(() => {
        if (!vc || !entry) return;
        if (entry.fields.length > 0) return;
        initCredentialFields(uri, section, [
            {
                value: vcDescription,
                source: vcDescription ? 'vc' : 'selfAttested',
                type: 'description',
            },
        ]);
    }, [vc, entry?.fields.length]);

    const handleAddDetail = () => {
        addCredentialField(uri, section, '', 'selfAttested', 'metadata');
    };

    return (
        <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {/* ── Locked anchor: title · issuer · date ── */}
                <p className="text-sm font-semibold text-grayscale-800">
                    {info?.title || 'Credential'}
                    {(issuerStr || info?.createdAt) && (
                        <span className="font-normal text-grayscale-500">
                            {' · '}
                            {[issuerStr, info?.createdAt].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </p>

                {/* ── All fields (description + metadata) rendered uniformly ── */}
                <IonReorderGroup
                    disabled={!isEditing}
                    onIonReorderEnd={(e: ReorderEndCustomEvent) => {
                        e.stopPropagation();
                        const { from, to } = e.detail;
                        const reordered = [...fields];
                        const [moved] = reordered.splice(from, 1);
                        reordered.splice(to, 0, moved);
                        resumeBuilderStore.set.reorderCredentialFields(
                            uri,
                            section,
                            reordered.map(f => f.id)
                        );
                        e.detail.complete();
                    }}
                >
                    {fields.map(field => (
                        <div key={field.id} className="flex items-center gap-1">
                            <div className="flex-1">
                                <ResumePreviewEditableTextBlock
                                    value={field.value}
                                    placeholder={
                                        field.type === 'description'
                                            ? 'Add a description…'
                                            : 'Add detail…'
                                    }
                                    isEditing={isEditing}
                                    isSelfAttested={field.source === 'selfAttested'}
                                    multiline={field.type === 'description'}
                                    onChange={val => {
                                        let source: 'vc' | 'selfAttested';
                                        if (
                                            field.type === 'description' &&
                                            val === vcDescription &&
                                            vcDescription
                                        ) {
                                            source = 'vc';
                                        } else {
                                            source = 'selfAttested';
                                        }
                                        updateCredentialField(uri, section, field.id, val, source);
                                    }}
                                    onRemove={
                                        field.type === 'metadata'
                                            ? () => removeCredentialField(uri, section, field.id)
                                            : undefined
                                    }
                                />
                            </div>
                            {isEditing && <IonReorder />}
                        </div>
                    ))}
                </IonReorderGroup>

                {/* ── Add detail + Done buttons (edit mode only) ── */}
                {isEditing && (
                    <div className="flex items-center gap-1 mt-1">
                        <button
                            onClick={handleAddDetail}
                            className="text-xs border border-solid border-indigo-500 text-indigo-500 font-medium flex items-center px-2 py-1 rounded-lg"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-xs bg-emerald-600 font-medium text-white px-2 py-1 rounded-lg"
                        >
                            Save
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumePreviewCredentialToTextBlock;
