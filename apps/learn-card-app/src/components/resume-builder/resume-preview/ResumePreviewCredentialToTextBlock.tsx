import React, { useEffect } from 'react';
import { IonDatetime, IonReorder, IonReorderGroup, ReorderEndCustomEvent } from '@ionic/react';
import moment from 'moment';

import ResumeBuilderToggle from '../ResumeBuilderToggle';
import ResumePreviewEditableTextBlock from './ResumePreviewEditableTextBlock';
import ResumePreviewCredentialDateDisplay from './ResumePreviewCredentialDateDisplay';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import {
    CredentialCategoryEnum,
    ModalTypes,
    useGetResolvedCredential,
    useGetVCInfo,
    useModal,
} from 'learn-card-base';
import { ResumeSectionKey } from '../resume-builder.helpers';
import { TrustedIcon } from 'learn-card-base/svgs/TrustedIcon';

const ResumePreviewCredentialToTextBlock: React.FC<{
    uri: string;
    section: ResumeSectionKey;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}> = ({ uri, section, isEditing, setIsEditing }) => {
    const { data: vc } = useGetResolvedCredential(uri);
    const { title, description: vcDescription } = useGetVCInfo(vc || {}, section);

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const currentJobCredentialUri = resumeBuilderStore.useTracked.currentJobCredentialUri();
    const workExperienceEndDates = resumeBuilderStore.useTracked.workExperienceEndDates();
    const initCredentialFields = resumeBuilderStore.set.initCredentialFields;
    const addCredentialField = resumeBuilderStore.set.addCredentialField;
    const updateCredentialField = resumeBuilderStore.set.updateCredentialField;
    const removeCredentialField = resumeBuilderStore.set.removeCredentialField;
    const setCredentialFieldHidden = resumeBuilderStore.set.setCredentialFieldHidden;
    const setWorkExperienceEndDate = resumeBuilderStore.set.setWorkExperienceEndDate;
    const { newModal, closeModal } = useModal();

    const entry = (credentialEntries[section] ?? []).find(e => e.uri === uri);
    const fields = [...(entry?.fields ?? [])].sort((a, b) => a.index - b.index);

    const info = vc ? getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false }) : null;
    const selectedEndDate = workExperienceEndDates?.[uri] ?? '';
    const isWorkExperienceSection = section === CredentialCategoryEnum.workHistory;
    const isCurrentJob = isWorkExperienceSection && currentJobCredentialUri === uri;
    const formattedEndDate = selectedEndDate
        ? moment(selectedEndDate, 'YYYY-MM-DD').format('MMM yyyy')
        : '';
    let dateLabel = '';
    if (info?.createdAt) {
        dateLabel = info.createdAt;

        if (isCurrentJob) {
            dateLabel = `${info.createdAt} - Present`;
        } else if (isWorkExperienceSection && formattedEndDate) {
            dateLabel = `${info.createdAt} - ${formattedEndDate}`;
        }
    }

    const openInlineDatePicker = () => {
        newModal(
            <div className="w-full h-full transparent flex items-center justify-center">
                <IonDatetime
                    onIonChange={e => {
                        if (e.detail.value) {
                            setWorkExperienceEndDate(
                                uri,
                                moment(e.detail.value).format('YYYY-MM-DD')
                            );
                            closeModal();
                        }
                    }}
                    value={selectedEndDate || undefined}
                    presentation="date"
                    className="bg-white text-black rounded-[20px] w-full shadow-3xl z-50 font-notoSans"
                    showDefaultButtons
                    color="indigo-500"
                    max={moment().format('YYYY-MM-DD')}
                    onIonCancel={closeModal}
                />
            </div>,
            {
                disableCloseHandlers: true,
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
            },
            {
                desktop: ModalTypes.Center,
                mobile: ModalTypes.Center,
            }
        );
    };

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
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {/* ── Locked anchor: title · issuer · date ── */}
                <p className="gap-1 text-sm flex items-center font-semibold text-grayscale-800">
                    <TrustedIcon className="w-4 h-4 inline-block mr-1" /> {title || 'Credential'}
                    <ResumePreviewCredentialDateDisplay
                        isWorkExperienceSection={isWorkExperienceSection}
                        createdAt={info?.createdAt}
                        isCurrentJob={isCurrentJob}
                        formattedEndDate={formattedEndDate}
                        dateLabel={dateLabel}
                        onOpenInlineDatePicker={openInlineDatePicker}
                    />
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
                    {fields.map(field => {
                        const isDescriptionField = field.type === 'description';
                        const isDescriptionHidden = isDescriptionField && Boolean(field.hidden);

                        return (
                            <div key={field.id} className="flex items-center gap-1">
                                <div className="flex-1">
                                    {isDescriptionField && isEditing ? (
                                        <div data-pdf-hide className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <ResumePreviewEditableTextBlock
                                                    value={field.value}
                                                    placeholder={
                                                        field.type === 'description'
                                                            ? 'Add a description…'
                                                            : 'Add more details…'
                                                    }
                                                    isEditing={isEditing}
                                                    isSelfAttested={field.source === 'selfAttested'}
                                                    multiline={field.type === 'description'}
                                                    showDefaultSummaryDecoration={
                                                        field.type === 'description'
                                                    }
                                                    onRestoreDefault={
                                                        field.type === 'description' &&
                                                        vcDescription
                                                            ? () => {
                                                                  updateCredentialField(
                                                                      uri,
                                                                      section,
                                                                      field.id,
                                                                      vcDescription,
                                                                      'vc'
                                                                  );
                                                              }
                                                            : undefined
                                                    }
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
                                                        updateCredentialField(
                                                            uri,
                                                            section,
                                                            field.id,
                                                            val,
                                                            source
                                                        );
                                                    }}
                                                    onRemove={
                                                        field.type === 'metadata'
                                                            ? () =>
                                                                  removeCredentialField(
                                                                      uri,
                                                                      section,
                                                                      field.id
                                                                  )
                                                            : undefined
                                                    }
                                                />
                                            </div>
                                            <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                                                <ResumeBuilderToggle
                                                    checked={!isDescriptionHidden}
                                                    onChange={checked =>
                                                        setCredentialFieldHidden(
                                                            uri,
                                                            section,
                                                            field.id,
                                                            !checked
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <ResumePreviewEditableTextBlock
                                            value={field.value}
                                            placeholder={
                                                field.type === 'description'
                                                    ? 'Add a description…'
                                                    : 'Add more details…'
                                            }
                                            isEditing={isEditing}
                                            isSelfAttested={field.source === 'selfAttested'}
                                            multiline={field.type === 'description'}
                                            showDefaultSummaryDecoration={
                                                field.type === 'description'
                                            }
                                            onRestoreDefault={
                                                field.type === 'description' && vcDescription
                                                    ? () => {
                                                          updateCredentialField(
                                                              uri,
                                                              section,
                                                              field.id,
                                                              vcDescription,
                                                              'vc'
                                                          );
                                                      }
                                                    : undefined
                                            }
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
                                                updateCredentialField(
                                                    uri,
                                                    section,
                                                    field.id,
                                                    val,
                                                    source
                                                );
                                            }}
                                            onRemove={
                                                field.type === 'metadata'
                                                    ? () =>
                                                          removeCredentialField(
                                                              uri,
                                                              section,
                                                              field.id
                                                          )
                                                    : undefined
                                            }
                                        />
                                    )}
                                </div>
                                {isEditing && field.type !== 'description' && <IonReorder />}
                            </div>
                        );
                    })}
                </IonReorderGroup>

                {/* ── Add detail + Done buttons (edit mode only) ── */}
                {isEditing && (
                    <div data-pdf-hide className="flex items-center gap-1 mt-1">
                        <button
                            onClick={handleAddDetail}
                            className="text-xs border border-solid border-indigo-500/45 text-indigo-500 font-medium flex items-center px-2 py-1 rounded-lg"
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
