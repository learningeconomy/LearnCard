/**
 * RecipientSection - Credential subject/recipient information (OBv3 AchievementSubject)
 */

import React from 'react';
import { User, Plus, X } from 'lucide-react';

import * as m from '../../../../../../paraglide/messages.js';

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
    disableDynamicFields?: boolean;
}

export const RecipientSection: React.FC<RecipientSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
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
            title={m['developerPortal.credentialBuilder.sectionTitles.recipient']()}
            icon={<User className="w-4 h-4 text-emerald-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label={m['developerPortal.credentialBuilder.recipient.recipientName']()}
                field={subject.name || staticField('')}
                onChange={(f) => updateSubject('name', f)}
                placeholder={m['developerPortal.credentialBuilder.recipient.recipientNamePlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.recipient.recipientNameHelp']()}
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.recipient.recipientDid']()}
                field={systemField('The recipient\'s Decentralized Identifier (DID) resolved from their email or wallet')}
                onChange={() => {}}
                helpText={m['developerPortal.credentialBuilder.recipient.recipientDidHelp']()}
            />

            {/* Activity Details */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{m['developerPortal.credentialBuilder.recipient.activityDetails']()}</h4>

                <div className="grid grid-cols-2 gap-3">
                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.creditsEarned']()}
                        field={subject.creditsEarned || staticField('')}
                        onChange={(f) => updateSubject('creditsEarned', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.creditsEarnedPlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.creditsEarnedHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.term']()}
                        field={subject.term || staticField('')}
                        onChange={(f) => updateSubject('term', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.termPlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.termHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.activityStartDate']()}
                        field={subject.activityStartDate || staticField('')}
                        onChange={(f) => updateSubject('activityStartDate', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.activityStartDatePlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.activityStartDateHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.activityEndDate']()}
                        field={subject.activityEndDate || staticField('')}
                        onChange={(f) => updateSubject('activityEndDate', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.activityEndDatePlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.activityEndDateHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.licenseNumber']()}
                        field={subject.licenseNumber || staticField('')}
                        onChange={(f) => updateSubject('licenseNumber', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.licenseNumberPlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.licenseNumberHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.recipient.role']()}
                        field={subject.role || staticField('')}
                        onChange={(f) => updateSubject('role', f)}
                        placeholder={m['developerPortal.credentialBuilder.recipient.rolePlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.recipient.roleHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />
                </div>
            </div>

            {/* Results (Grades/Scores) */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">{m['developerPortal.credentialBuilder.recipient.results']()}</h4>

                    <button
                        type="button"
                        onClick={addResult}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        {m['developerPortal.credentialBuilder.recipient.addResult']()}
                    </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                    {m['developerPortal.credentialBuilder.recipient.resultsDescription']()}
                </p>

                {(subject.result || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-3">{m['developerPortal.credentialBuilder.recipient.noResults']()}</p>
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
                                    label={m['developerPortal.credentialBuilder.recipient.resultValue']()}
                                    field={result.value || staticField('')}
                                    onChange={(f) => updateResult(index, 'value', f)}
                                    placeholder={m['developerPortal.credentialBuilder.recipient.resultValuePlaceholder']()}
                                    helpText={m['developerPortal.credentialBuilder.recipient.resultValueHelp']()}
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label={m['developerPortal.credentialBuilder.recipient.resultStatus']()}
                                    field={result.status || staticField('')}
                                    onChange={(f) => updateResult(index, 'status', f)}
                                    placeholder={m['developerPortal.credentialBuilder.recipient.resultStatusPlaceholder']()}
                                    helpText={m['developerPortal.credentialBuilder.recipient.resultStatusHelp']()}
                                    showDynamicToggle={!disableDynamicFields}
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
