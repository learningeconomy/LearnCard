/**
 * DatesSection - Issuance and expiration dates
 */

import React from 'react';
import { Calendar } from 'lucide-react';

import * as m from '../../../../../../paraglide/messages.js';

import { OBv3CredentialTemplate, TemplateFieldValue, staticField, systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface DatesSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const DatesSection: React.FC<DatesSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
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
            title={m['developerPortal.credentialBuilder.sectionTitles.dates']()}
            icon={<Calendar className="w-4 h-4 text-rose-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label={m['developerPortal.credentialBuilder.dates.issuanceDate']()}
                field={systemField('The current timestamp when the credential is issued (ISO 8601 format)')}
                onChange={() => {}}
                helpText={m['developerPortal.credentialBuilder.dates.issuanceDateHelp']()}
            />

            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{m['developerPortal.credentialBuilder.dates.expirationDate']()}</label>

                    <button
                        type="button"
                        onClick={toggleExpiration}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                            hasExpiration
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {hasExpiration ? m['developerPortal.credentialBuilder.dates.removeExpiration']() : m['developerPortal.credentialBuilder.dates.addExpiration']()}
                    </button>
                </div>

                {hasExpiration && (
                    <FieldEditor
                        label=""
                        field={template.validUntil || staticField('')}
                        onChange={(f) => updateField('validUntil', f)}
                        placeholder={m['developerPortal.credentialBuilder.dates.expirationPlaceholder']()}
                        helpText={m['developerPortal.credentialBuilder.dates.expirationHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />
                )}

                {!hasExpiration && (
                    <p className="text-xs text-gray-400 italic">
                        {m['developerPortal.credentialBuilder.dates.noExpiration']()}
                    </p>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default DatesSection;
