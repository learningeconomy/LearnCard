/**
 * EvidenceSection - Evidence items for the credential
 */

import React from 'react';
import { FileCheck, Plus, X } from 'lucide-react';

import * as m from '../../../../../../paraglide/messages.js';

import {
    OBv3CredentialTemplate,
    EvidenceTemplate,
    TemplateFieldValue,
    staticField,
} from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';
import { FieldValidationError, getFieldError } from '../utils';

interface EvidenceSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
    validationErrors?: FieldValidationError[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
    validationErrors = [],
}) => {
    const evidence = template.credentialSubject.evidence || [];

    const updateEvidence = (newEvidence: EvidenceTemplate[]) => {
        onChange({
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                evidence: newEvidence,
            },
        });
    };

    const addEvidence = () => {
        const newItem: EvidenceTemplate = {
            id: `evidence_${Date.now()}`,
            type: staticField('Evidence'),
            name: staticField(''),
        };

        updateEvidence([...evidence, newItem]);
    };

    const updateEvidenceItem = (
        index: number,
        field: keyof EvidenceTemplate,
        value: TemplateFieldValue
    ) => {
        const items = [...evidence];
        items[index] = { ...items[index], [field]: value };
        updateEvidence(items);
    };

    const removeEvidence = (index: number) => {
        const items = [...evidence];
        items.splice(index, 1);
        updateEvidence(items);
    };

    return (
        <CollapsibleSection
            title={m['developerPortal.credentialBuilder.sectionTitles.evidence']()}
            icon={<FileCheck className="w-4 h-4 text-indigo-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            optional
            badge={
                evidence.length > 0
                    ? `${evidence.length} ${m['developerPortal.credentialBuilder.evidence.evidenceName']().toLowerCase()}${evidence.length > 1 ? 's' : ''}`
                    : undefined
            }
        >
            <p className="text-xs text-gray-500 mb-3">
                {m['developerPortal.credentialBuilder.evidence.description']()}
            </p>

            <button
                type="button"
                onClick={addEvidence}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors mb-4"
            >
                <Plus className="w-4 h-4" />
                {m['developerPortal.credentialBuilder.evidence.addEvidence']()}
            </button>

            {evidence.length === 0 ? (
                <p className="text-xs text-gray-400 italic">{m['developerPortal.credentialBuilder.evidence.noEvidence']()}</p>
            ) : (
                <div className="space-y-4">
                    {evidence.map((item, index) => (
                        <div key={item.id} className="pl-3 border-l-2 border-indigo-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-indigo-700">
                                    {m['developerPortal.credentialBuilder.evidence.evidenceNumber']({ n: index + 1 })}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeEvidence(index)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            <FieldEditor
                                label={m['developerPortal.credentialBuilder.evidence.evidenceName']()}
                                field={item.name || staticField('')}
                                onChange={f => updateEvidenceItem(index, 'name', f)}
                                placeholder={m['developerPortal.credentialBuilder.evidence.evidenceNamePlaceholder']()}
                                helpText={m['developerPortal.credentialBuilder.evidence.evidenceNameHelp']()}
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label={m['developerPortal.credentialBuilder.evidence.evidenceUrl']()}
                                field={item.evidenceUrl || staticField('')}
                                onChange={f => updateEvidenceItem(index, 'evidenceUrl', f)}
                                placeholder={m['developerPortal.credentialBuilder.evidence.evidenceUrlPlaceholder']()}
                                helpText={m['developerPortal.credentialBuilder.evidence.evidenceUrlHelp']()}
                                type="url"
                                showDynamicToggle={!disableDynamicFields}
                                error={getFieldError(
                                    validationErrors,
                                    `evidence.${index}.evidenceUrl`
                                )}
                            />

                            <FieldEditor
                                label={m['developerPortal.credentialBuilder.evidence.narrative']()}
                                field={item.narrative || staticField('')}
                                onChange={f => updateEvidenceItem(index, 'narrative', f)}
                                placeholder={m['developerPortal.credentialBuilder.evidence.narrativePlaceholder']()}
                                helpText={m['developerPortal.credentialBuilder.evidence.narrativeHelp']()}
                                type="textarea"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label={m['developerPortal.credentialBuilder.evidence.description']()}
                                field={item.description || staticField('')}
                                onChange={f => updateEvidenceItem(index, 'description', f)}
                                placeholder={m['developerPortal.credentialBuilder.evidence.descriptionPlaceholder']()}
                                helpText={m['developerPortal.credentialBuilder.evidence.descriptionHelp']()}
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <div className="grid grid-cols-2 gap-3 xs:flex xs:flex-col">
                                <FieldEditor
                                    label={m['developerPortal.credentialBuilder.evidence.genre']()}
                                    field={item.genre || staticField('')}
                                    onChange={f => updateEvidenceItem(index, 'genre', f)}
                                    placeholder={m['developerPortal.credentialBuilder.evidence.genrePlaceholder']()}
                                    helpText={m['developerPortal.credentialBuilder.evidence.genreHelp']()}
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label={m['developerPortal.credentialBuilder.evidence.audience']()}
                                    field={item.audience || staticField('')}
                                    onChange={f => updateEvidenceItem(index, 'audience', f)}
                                    placeholder={m['developerPortal.credentialBuilder.evidence.audiencePlaceholder']()}
                                    helpText={m['developerPortal.credentialBuilder.evidence.audienceHelp']()}
                                    showDynamicToggle={!disableDynamicFields}
                                />
                            </div>

                            <FieldEditor
                                label={m['developerPortal.credentialBuilder.evidence.evidenceType']()}
                                field={item.type || staticField('Evidence')}
                                onChange={f => updateEvidenceItem(index, 'type', f)}
                                placeholder={m['developerPortal.credentialBuilder.evidence.evidenceTypePlaceholder']()}
                                helpText={m['developerPortal.credentialBuilder.evidence.evidenceTypeHelp']()}
                                showDynamicToggle={!disableDynamicFields}
                            />
                        </div>
                    ))}
                </div>
            )}
        </CollapsibleSection>
    );
};

export default EvidenceSection;
