/**
 * DatesSection - Issuance and expiration dates
 */

import React from 'react';
import { Calendar } from 'lucide-react';

import { OBv3CredentialTemplate, TemplateFieldValue, staticField, systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface DatesSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const DatesSection: React.FC<DatesSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
}) => {
    const updateField = (key: 'validFrom' | 'validUntil', value: TemplateFieldValue) => {
        onChange({ ...template, [key]: value });
    };

    const hasExpiration = template.validUntil !== undefined;

    const toggleExpiration = () => {
        if (hasExpiration) {
            const { validUntil, ...rest } = template;
            onChange(rest as OBv3CredentialTemplate);
        } else {
            onChange({ ...template, validUntil: staticField('') });
        }
    };

    return (
        <CollapsibleSection
            title="Dates"
            icon={<Calendar className="w-4 h-4 text-rose-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Issuance Date"
                field={systemField('The current timestamp when the credential is issued (ISO 8601 format)')}
                onChange={() => {}}
                helpText="Automatically set to the current date/time when the credential is issued"
            />

            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Expiration Date</label>

                    <button
                        type="button"
                        onClick={toggleExpiration}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                            hasExpiration
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {hasExpiration ? 'Remove Expiration' : 'Add Expiration'}
                    </button>
                </div>

                {hasExpiration && (
                    <FieldEditor
                        label=""
                        field={template.validUntil || staticField('')}
                        onChange={(f) => updateField('validUntil', f)}
                        placeholder="2025-01-15T00:00:00Z"
                        helpText="When the credential expires (optional, ISO 8601 format)"
                    />
                )}

                {!hasExpiration && (
                    <p className="text-xs text-gray-400 italic">
                        No expiration date - credential will be valid indefinitely
                    </p>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default DatesSection;
