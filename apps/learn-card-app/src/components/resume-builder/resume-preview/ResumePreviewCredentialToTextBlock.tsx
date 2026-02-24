import React, { useState } from 'react';
import { IonReorderGroup, IonReorder, IonItem, IonIcon } from '@ionic/react';
import type { ItemReorderEventDetail } from '@ionic/react';

import { reorderTwoOutline } from 'ionicons/icons';
import ResumePreviewEditBlockButton from './ResumePreviewEditBlockButton';
import ResumePreviewEditableTextBlock from './ResumePreviewEditableTextBlock';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { useGetResolvedCredential } from 'learn-card-base';
import { ResumeField } from '../resume-builder.helpers';

const ResumePreviewCredentialToTextBlock: React.FC<{ uri: string }> = ({ uri }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const { data: vc } = useGetResolvedCredential(uri);

    const selfAttested = resumeBuilderStore.useTracked.selfAttested();
    const setSelfAttestedDescription = resumeBuilderStore.set.setSelfAttestedDescription;
    const addSelfAttestedDetail = resumeBuilderStore.set.addSelfAttestedDetail;
    const updateSelfAttestedDetail = resumeBuilderStore.set.updateSelfAttestedDetail;
    const removeSelfAttestedDetail = resumeBuilderStore.set.removeSelfAttestedDetail;
    const reorderAllSelfAttestedFields = resumeBuilderStore.set.reorderAllSelfAttestedFields;

    const selfAttestedFields = selfAttested[uri] ?? { additionalDetails: [] };

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

    const descriptionField: ResumeField = selfAttestedFields.description ?? {
        value: vcDescription,
        source: vcDescription ? 'vc' : 'selfAttested',
    };

    const handleDescriptionChange = (val: string) => {
        const source: ResumeField['source'] =
            val === vcDescription && vcDescription ? 'vc' : 'selfAttested';
        setSelfAttestedDescription(uri, { value: val, source });
    };

    const handleAddDetail = () => {
        addSelfAttestedDetail(uri, { value: '', source: 'selfAttested' });
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

                {/* ── All fields: description + additional details, unified reorderable list ── */}
                <IonReorderGroup
                    disabled={!isEditing}
                    onIonItemReorder={(e: CustomEvent<ItemReorderEventDetail>) => {
                        const allFields = [
                            descriptionField,
                            ...selfAttestedFields.additionalDetails,
                        ];
                        const reordered = [...allFields];
                        const [moved] = reordered.splice(e.detail.from, 1);
                        reordered.splice(e.detail.to, 0, moved);
                        reorderAllSelfAttestedFields(uri, reordered);
                        e.detail.complete();
                    }}
                >
                    <IonItem
                        lines="none"
                        className="w-full"
                        style={
                            {
                                '--background': 'transparent',
                                '--inner-padding-end': '0',
                                '--padding-start': '0',
                                '--min-height': '0',
                                '--border-width': '0',
                                '--inner-border-width': '0',
                                '--padding-top': isEditing ? '4px' : '0',
                                '--padding-bottom': isEditing ? '4px' : '0',
                            } as any
                        }
                    >
                        <ResumePreviewEditableTextBlock
                            value={descriptionField.value}
                            placeholder="Add a description…"
                            isEditing={isEditing}
                            isSelfAttested={descriptionField.source === 'selfAttested'}
                            onChange={handleDescriptionChange}
                            multiline
                        />
                        {isEditing && (
                            <IonReorder slot="end">
                                <span className="flex items-center gap-1 text-[10px] text-grayscale-400 select-none pr-1">
                                    <IonIcon
                                        icon={reorderTwoOutline}
                                        className="w-[24px] h-[24px]"
                                    />
                                </span>
                            </IonReorder>
                        )}
                    </IonItem>
                    {selfAttestedFields.additionalDetails.map((detail, i) => (
                        <IonItem
                            key={i}
                            lines="none"
                            className="w-full"
                            style={
                                {
                                    '--background': 'transparent',
                                    '--inner-padding-end': '0',
                                    '--padding-start': '0',
                                    '--min-height': '0',
                                    '--border-width': '0',
                                    '--inner-border-width': '0',
                                    '--padding-top': isEditing ? '4px' : '0',
                                    '--padding-bottom': isEditing ? '4px' : '0',
                                } as any
                            }
                        >
                            <ResumePreviewEditableTextBlock
                                value={detail.value}
                                placeholder="Add detail…"
                                isEditing={isEditing}
                                isSelfAttested
                                onChange={val =>
                                    updateSelfAttestedDetail(uri, i, {
                                        value: val,
                                        source: 'selfAttested',
                                    })
                                }
                                onRemove={() => removeSelfAttestedDetail(uri, i)}
                            />
                            {isEditing && (
                                <IonReorder slot="end">
                                    <span className="flex items-center gap-1 text-[10px] text-grayscale-400 select-none pr-1">
                                        <IonIcon
                                            icon={reorderTwoOutline}
                                            className="w-[24px] h-[24px]"
                                        />
                                    </span>
                                </IonReorder>
                            )}
                        </IonItem>
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

            {/* ── Edit toggle button ── */}
            <ResumePreviewEditBlockButton isEditing={isEditing} setIsEditing={setIsEditing} />
        </div>
    );
};

export default ResumePreviewCredentialToTextBlock;
