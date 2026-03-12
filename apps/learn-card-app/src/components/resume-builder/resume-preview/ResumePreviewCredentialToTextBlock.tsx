import React, { useEffect } from 'react';
import { add } from 'ionicons/icons';
import moment from 'moment';
import { VC } from '@learncard/types';

import {
    IonDatetime,
    IonIcon,
    IonReorder,
    IonReorderGroup,
    ReorderEndCustomEvent,
} from '@ionic/react';
import ResumeBuilderToggle from '../ResumeBuilderToggle';
import { TrustedIcon } from 'learn-card-base/svgs/TrustedIcon';
import VerticalArrowsIcon from '../../../components/svgs/VerticalArrowsIcon';
import ResumePreviewEditableTextBlock from './ResumePreviewEditableTextBlock';
import ResumePreviewCredentialDateDisplay from './ResumePreviewCredentialDateDisplay';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { ModalTypes, useGetResolvedCredential, useGetVCInfo, useModal } from 'learn-card-base';
import { ResumeSectionKey } from '../resume-builder.helpers';

const ResumePreviewCredentialToTextBlock: React.FC<{
    uri: string;
    section: ResumeSectionKey;
    resolvedCredential?: VC | null;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}> = ({ uri, section, resolvedCredential, isEditing, setIsEditing: _setIsEditing }) => {
    const hasResolvedCredentialOverride = resolvedCredential !== undefined;
    const { data: queriedCredential } = useGetResolvedCredential(
        uri,
        !hasResolvedCredentialOverride
    );
    const vc = resolvedCredential ?? queriedCredential;
    const { title, description: vcDescription } = useGetVCInfo(
        (vc ?? ({ '@context': [], type: [] } as VC)),
        section
    );

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const credentialStartDates = resumeBuilderStore.useTracked.credentialStartDates();
    const credentialEndDates = resumeBuilderStore.useTracked.credentialEndDates();
    const initCredentialFields = resumeBuilderStore.set.initCredentialFields;
    const addCredentialField = resumeBuilderStore.set.addCredentialField;
    const updateCredentialField = resumeBuilderStore.set.updateCredentialField;
    const removeCredentialField = resumeBuilderStore.set.removeCredentialField;
    const setCredentialFieldHidden = resumeBuilderStore.set.setCredentialFieldHidden;
    const setCredentialStartDate = resumeBuilderStore.set.setCredentialStartDate;
    const setCredentialEndDate = resumeBuilderStore.set.setCredentialEndDate;
    const { newModal, closeModal } = useModal();

    const entry = (credentialEntries[section] ?? []).find(e => e.uri === uri);
    const fields = [...(entry?.fields ?? [])].sort((a, b) => a.index - b.index);
    const visibleExportFields = fields.filter(field => {
        if (!field.value.trim()) return false;
        if (field.type === 'description' && field.hidden) return false;
        return true;
    });
    const metadataFields = fields.filter(field => field.type === 'metadata');
    const lastMetadataField = metadataFields[metadataFields.length - 1];

    const info = vc ? getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false }) : null;
    const selectedStartDate = credentialStartDates?.[uri] ?? '';
    const selectedEndDate = credentialEndDates?.[uri] ?? '';
    const fallbackStartLabel = info?.createdAt ?? '';
    const formattedStartDate = selectedStartDate
        ? moment(selectedStartDate, 'YYYY-MM-DD').format('MMM yyyy')
        : '';
    const formattedEndDate = selectedEndDate
        ? moment(selectedEndDate, 'YYYY-MM-DD').format('MMM yyyy')
        : '';
    const visibleStartLabel = formattedStartDate || fallbackStartLabel;
    let dateLabel = '';
    if (visibleStartLabel && formattedEndDate) {
        dateLabel = `${visibleStartLabel} - ${formattedEndDate}`;
    } else if (!visibleStartLabel && formattedEndDate) {
        dateLabel = formattedEndDate;
    } else if (visibleStartLabel) {
        dateLabel = visibleStartLabel;
    }

    const openInlineDatePicker = (mode: 'start' | 'end') => {
        newModal(
            <div className="w-full h-full transparent flex items-center justify-center">
                <IonDatetime
                    onIonChange={e => {
                        if (e.detail.value) {
                            const formattedDate = moment(e.detail.value).format('YYYY-MM-DD');
                            if (mode === 'start') setCredentialStartDate(uri, formattedDate);
                            else setCredentialEndDate(uri, formattedDate);
                            closeModal();
                        }
                    }}
                    value={(mode === 'start' ? selectedStartDate : selectedEndDate) || undefined}
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

    useEffect(() => {
        if (!isEditing || !entry) return;
        if (metadataFields.length > 0) return;
        addCredentialField(uri, section, '', 'selfAttested', 'metadata');
    }, [isEditing, entry?.fields.length, metadataFields.length]);

    const handleAddDetail = (fieldValue: string) => {
        if (!fieldValue.trim()) return;
        addCredentialField(uri, section, '', 'selfAttested', 'metadata');
    };

    return (
        <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {/* ── Locked anchor: title · issuer · date ── */}
                <div className="flex items-start gap-1.5 min-w-0">
                    <span data-pdf-hide className="inline-flex mt-0.5 shrink-0">
                        <TrustedIcon className="w-4 h-4 inline-block" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                            <span className="text-sm font-semibold text-grayscale-800 leading-tight break-words">
                                {title || 'Credential'}
                            </span>
                            <div className="mt-1 sm:mt-0 min-w-0">
                                <ResumePreviewCredentialDateDisplay
                                    isEditing={isEditing}
                                    startLabel={fallbackStartLabel}
                                    formattedStartDate={formattedStartDate}
                                    formattedEndDate={formattedEndDate}
                                    dateLabel={dateLabel}
                                    onOpenStartDatePicker={() => openInlineDatePicker('start')}
                                    onOpenEndDatePicker={() => openInlineDatePicker('end')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <>
                        <div data-pdf-screen-only>
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
                                    const isDescriptionHidden =
                                        isDescriptionField && Boolean(field.hidden);
                                    const isMetadataAddRow =
                                        field.type === 'metadata' &&
                                        field.id === lastMetadataField?.id;

                                    return (
                                        <div
                                            key={field.id}
                                            className={`flex items-center gap-1 w-full ${
                                                !isDescriptionField ? 'max-w-[581px]' : ''
                                            }`}
                                        >
                                            <div className="flex-1">
                                                {isDescriptionField ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1">
                                                            <ResumePreviewEditableTextBlock
                                                                value={field.value}
                                                                placeholder="Add a description..."
                                                                isEditing
                                                                isSelfAttested={
                                                                    field.source === 'selfAttested'
                                                                }
                                                                multiline
                                                                showDefaultSummaryDecoration
                                                                onRestoreDefault={
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
                                                                    const source =
                                                                        vcDescription &&
                                                                        val === vcDescription
                                                                            ? 'vc'
                                                                            : 'selfAttested';
                                                                    updateCredentialField(
                                                                        uri,
                                                                        section,
                                                                        field.id,
                                                                        val,
                                                                        source
                                                                    );
                                                                }}
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
                                                        placeholder="Add item"
                                                        isEditing
                                                        isSelfAttested={
                                                            field.source === 'selfAttested'
                                                        }
                                                        onChange={val =>
                                                            updateCredentialField(
                                                                uri,
                                                                section,
                                                                field.id,
                                                                val,
                                                                'selfAttested'
                                                            )
                                                        }
                                                        onRemove={
                                                            !isMetadataAddRow
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
                                            {field.type === 'metadata' && isMetadataAddRow ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddDetail(field.value)}
                                                    className="shrink-0 w-[32px] h-[32px] rounded-xl bg-grayscale-100 flex items-center justify-center text-grayscale-700"
                                                    title="Add item"
                                                >
                                                    <IonIcon icon={add} className="w-6 h-6" />
                                                </button>
                                            ) : (
                                                field.type === 'metadata' &&
                                                metadataFields.length > 1 && (
                                                    <div className="shrink-0 text-grayscale-700 bg-grayscale-100 rounded-[10px] leading-none h-[32px] w-[32px] flex items-center justify-center">
                                                        <IonReorder>
                                                            <VerticalArrowsIcon />
                                                        </IonReorder>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </IonReorderGroup>
                        </div>

                        <div
                            data-pdf-export-block
                            style={{ display: 'none' }}
                            className="flex flex-col gap-1"
                        >
                            {visibleExportFields.map(field => (
                                <ResumePreviewEditableTextBlock
                                    key={field.id}
                                    value={field.value}
                                    placeholder=""
                                    isEditing={false}
                                    isSelfAttested={field.source === 'selfAttested'}
                                    multiline={field.type === 'description'}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-1">
                        {visibleExportFields.map(field => (
                            <ResumePreviewEditableTextBlock
                                key={field.id}
                                value={field.value}
                                placeholder=""
                                isEditing={false}
                                isSelfAttested={field.source === 'selfAttested'}
                                multiline={field.type === 'description'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumePreviewCredentialToTextBlock;
