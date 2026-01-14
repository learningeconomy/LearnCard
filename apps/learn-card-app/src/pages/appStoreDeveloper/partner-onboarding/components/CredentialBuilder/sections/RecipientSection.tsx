/**
 * RecipientSection - Credential subject/recipient information (OBv3 AchievementSubject)
 */

import React from 'react';
import { User, Plus, X } from 'lucide-react';

import { 
    OBv3CredentialTemplate, 
    CredentialSubjectTemplate, 
    TemplateFieldValue, 
    ResultTemplate,
    staticField, 
    systemField 
} from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface RecipientSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const RecipientSection: React.FC<RecipientSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
}) => {
    const subject = template.credentialSubject;

    const updateSubject = (key: keyof CredentialSubjectTemplate, value: TemplateFieldValue | ResultTemplate[]) => {
        onChange({
            ...template,
            credentialSubject: { ...subject, [key]: value },
        });
    };

    const addResult = () => {
        const newResult: ResultTemplate = {
            id: `result_${Date.now()}`,
            value: staticField(''),
        };
        updateSubject('result', [...(subject.result || []), newResult]);
    };

    const updateResult = (index: number, field: keyof ResultTemplate, value: TemplateFieldValue) => {
        const results = [...(subject.result || [])];
        results[index] = { ...results[index], [field]: value };
        updateSubject('result', results);
    };

    const removeResult = (index: number) => {
        const results = [...(subject.result || [])];
        results.splice(index, 1);
        updateSubject('result', results);
    };

    return (
        <CollapsibleSection
            title="Recipient & Activity"
            icon={<User className="w-4 h-4 text-emerald-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Recipient Name"
                field={subject.name || staticField('')}
                onChange={(f) => updateSubject('name', f)}
                placeholder="Recipient's full name"
                helpText="The name of the person receiving this credential"
            />

            <FieldEditor
                label="Recipient ID (DID)"
                field={systemField('The recipient\'s Decentralized Identifier (DID) resolved from their email or wallet')}
                onChange={() => {}}
                helpText="Automatically set when the credential is sent to the recipient"
            />

            {/* Activity Details */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Details</h4>

                <div className="grid grid-cols-2 gap-3">
                    <FieldEditor
                        label="Credits Earned"
                        field={subject.creditsEarned || staticField('')}
                        onChange={(f) => updateSubject('creditsEarned', f)}
                        placeholder="e.g., 3"
                        helpText="Credits earned by recipient"
                    />

                    <FieldEditor
                        label="Term"
                        field={subject.term || staticField('')}
                        onChange={(f) => updateSubject('term', f)}
                        placeholder="e.g., Fall 2024"
                        helpText="Academic term"
                    />

                    <FieldEditor
                        label="Activity Start Date"
                        field={subject.activityStartDate || staticField('')}
                        onChange={(f) => updateSubject('activityStartDate', f)}
                        placeholder="YYYY-MM-DD"
                        helpText="When the activity started"
                        type="date"
                    />

                    <FieldEditor
                        label="Activity End Date"
                        field={subject.activityEndDate || staticField('')}
                        onChange={(f) => updateSubject('activityEndDate', f)}
                        placeholder="YYYY-MM-DD"
                        helpText="When the activity ended (completion date)"
                        type="date"
                    />

                    <FieldEditor
                        label="License Number"
                        field={subject.licenseNumber || staticField('')}
                        onChange={(f) => updateSubject('licenseNumber', f)}
                        placeholder="e.g., A-12345"
                        helpText="License or certificate number"
                    />

                    <FieldEditor
                        label="Role"
                        field={subject.role || staticField('')}
                        onChange={(f) => updateSubject('role', f)}
                        placeholder="e.g., Student"
                        helpText="Recipient's role"
                    />
                </div>
            </div>

            {/* Results (Grades/Scores) */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Results (Grades/Scores)</h4>

                    <button
                        type="button"
                        onClick={addResult}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Add Result
                    </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                    Record grades, scores, or completion status
                </p>

                {(subject.result || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-3">No results added</p>
                ) : (
                    <div className="space-y-4">
                        {(subject.result || []).map((result, index) => (
                            <div key={result.id} className="pl-3 border-l-2 border-emerald-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-emerald-700">
                                        Result {index + 1}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => removeResult(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                <FieldEditor
                                    label="Value"
                                    field={result.value || staticField('')}
                                    onChange={(f) => updateResult(index, 'value', f)}
                                    placeholder="e.g., A, 95%, Pass"
                                    helpText="The achieved result"
                                />

                                <FieldEditor
                                    label="Status"
                                    field={result.status || staticField('')}
                                    onChange={(f) => updateResult(index, 'status', f)}
                                    placeholder="e.g., Completed, Passed"
                                    helpText="Result status"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default RecipientSection;
