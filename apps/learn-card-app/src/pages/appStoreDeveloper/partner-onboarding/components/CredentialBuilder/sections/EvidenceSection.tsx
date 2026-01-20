/**
 * EvidenceSection - Evidence items for the credential
 */

import React from 'react';
import { FileCheck, Plus, X } from 'lucide-react';

import { 
    OBv3CredentialTemplate, 
    EvidenceTemplate, 
    TemplateFieldValue, 
    staticField,
} from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface EvidenceSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
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

    const updateEvidenceItem = (index: number, field: keyof EvidenceTemplate, value: TemplateFieldValue) => {
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
            title="Evidence"
            icon={<FileCheck className="w-4 h-4 text-indigo-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            optional
            badge={evidence.length > 0 ? `${evidence.length} item${evidence.length > 1 ? 's' : ''}` : undefined}
        >
            <p className="text-xs text-gray-500 mb-3">
                Evidence supports claims made by the credential with artifacts like projects, assessments, or portfolios.
            </p>

            <button
                type="button"
                onClick={addEvidence}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors mb-4"
            >
                <Plus className="w-4 h-4" />
                Add Evidence
            </button>

            {evidence.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No evidence items added</p>
            ) : (
                <div className="space-y-4">
                    {evidence.map((item, index) => (
                        <div key={item.id} className="pl-3 border-l-2 border-indigo-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-indigo-700">
                                    Evidence {index + 1}
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
                                label="Evidence Type"
                                field={item.type || staticField('Evidence')}
                                onChange={(f) => updateEvidenceItem(index, 'type', f)}
                                placeholder="Evidence"
                                helpText="Type of evidence (e.g., Evidence, Artifact)"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label="Name"
                                field={item.name || staticField('')}
                                onChange={(f) => updateEvidenceItem(index, 'name', f)}
                                placeholder="e.g., Final Project"
                                helpText="Name of the evidence item"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label="Description"
                                field={item.description || staticField('')}
                                onChange={(f) => updateEvidenceItem(index, 'description', f)}
                                placeholder="Describe the evidence..."
                                helpText="Description of the evidence"
                                type="textarea"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label="Narrative"
                                field={item.narrative || staticField('')}
                                onChange={(f) => updateEvidenceItem(index, 'narrative', f)}
                                placeholder="Detailed narrative..."
                                helpText="Detailed narrative about the evidence"
                                type="textarea"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label="Genre"
                                field={item.genre || staticField('')}
                                onChange={(f) => updateEvidenceItem(index, 'genre', f)}
                                placeholder="e.g., Portfolio, Assessment"
                                helpText="Category or genre of the evidence"
                                showDynamicToggle={!disableDynamicFields}
                            />

                            <FieldEditor
                                label="Audience"
                                field={item.audience || staticField('')}
                                onChange={(f) => updateEvidenceItem(index, 'audience', f)}
                                placeholder="e.g., Employers, Educators"
                                helpText="Intended audience for this evidence"
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
