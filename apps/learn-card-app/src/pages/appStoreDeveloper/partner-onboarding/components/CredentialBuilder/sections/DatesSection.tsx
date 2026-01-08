/**
 * DatesSection - Issuance and expiration dates
 */

import React from 'react';
import { Calendar } from 'lucide-react';

import { OBv3CredentialTemplate, TemplateFieldValue, staticField } from '../types';
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
    const updateField = (key: 'issuanceDate' | 'expirationDate', value: TemplateFieldValue) => {
        onChange({ ...template, [key]: value });
    };

    const hasExpiration = template.expirationDate !== undefined;

    const toggleExpiration = () => {
        if (hasExpiration) {
            const { expirationDate, ...rest } = template;
            onChange(rest as OBv3CredentialTemplate);
        } else {
            onChange({ ...template, expirationDate: staticField('') });
        }
    };

    return (
        <CollapsibleSection
            title="Dates"
            icon={<Calendar className="w-4 h-4 text-rose-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg mb-4">
                <span className="text-xs text-rose-700">
                    <strong>Note:</strong> Dates are typically dynamic. The issuance date is usually set 
                    at the time of credential issuance. Use ISO 8601 format (e.g., 2024-01-15T00:00:00Z).
                </span>
            </div>

            <FieldEditor
                label="Issuance Date"
                field={template.issuanceDate}
                onChange={(f) => updateField('issuanceDate', f)}
                placeholder="2024-01-15T00:00:00Z"
                helpText="When the credential was issued (ISO 8601 format)"
                required
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
                        field={template.expirationDate || staticField('')}
                        onChange={(f) => updateField('expirationDate', f)}
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
