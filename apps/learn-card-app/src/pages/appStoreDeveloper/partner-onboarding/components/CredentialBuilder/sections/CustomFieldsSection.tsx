/**
 * CustomFieldsSection - Custom extension fields
 */

import React, { useState } from 'react';
import { Puzzle, Plus, X } from 'lucide-react';

import { 
    OBv3CredentialTemplate, 
    CustomFieldTemplate, 
    TemplateFieldValue, 
    staticField,
    dynamicField,
} from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';
import { labelToVariableName } from '../utils';

interface CustomFieldsSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
}) => {
    const [newFieldKey, setNewFieldKey] = useState('');

    const customFields = template.customFields;

    const updateCustomFields = (fields: CustomFieldTemplate[]) => {
        onChange({ ...template, customFields: fields });
    };

    const addCustomField = () => {
        if (!newFieldKey.trim()) return;

        const key = labelToVariableName(newFieldKey.trim());

        const newField: CustomFieldTemplate = {
            id: `custom_${Date.now()}`,
            key: staticField(key),
            value: dynamicField(key, ''),
        };

        updateCustomFields([...customFields, newField]);
        setNewFieldKey('');
    };

    const updateField = (index: number, prop: 'key' | 'value', value: TemplateFieldValue) => {
        const fields = [...customFields];
        fields[index] = { ...fields[index], [prop]: value };
        updateCustomFields(fields);
    };

    const removeField = (index: number) => {
        const fields = [...customFields];
        fields.splice(index, 1);
        updateCustomFields(fields);
    };

    return (
        <CollapsibleSection
            title="Custom Fields"
            icon={<Puzzle className="w-4 h-4 text-purple-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            optional
            badge={customFields.length > 0 ? `${customFields.length} field${customFields.length > 1 ? 's' : ''}` : undefined}
        >
            <p className="text-xs text-gray-500 mb-3">
                Add custom fields to store additional data in the credential's extensions.
                These will appear in <code className="bg-gray-100 px-1 rounded">credentialSubject.extensions</code>.
            </p>

            {/* Add new field */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="Field name (e.g., courseId)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                />

                <button
                    type="button"
                    onClick={addCustomField}
                    disabled={!newFieldKey.trim()}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </button>
            </div>

            {customFields.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No custom fields added</p>
            ) : (
                <div className="space-y-4">
                    {customFields.map((field, index) => (
                        <div key={field.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                                <code className="text-sm font-medium text-purple-700">
                                    {field.key.value || 'unnamed'}
                                </code>

                                <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <FieldEditor
                                    label="Field Key"
                                    field={field.key}
                                    onChange={(f) => updateField(index, 'key', f)}
                                    placeholder="fieldKey"
                                    helpText="The key name in the extensions object"
                                    showDynamicToggle={false}
                                />

                                <FieldEditor
                                    label="Field Value"
                                    field={field.value}
                                    onChange={(f) => updateField(index, 'value', f)}
                                    placeholder="Value or leave empty for dynamic"
                                    helpText="The value for this field"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CollapsibleSection>
    );
};

export default CustomFieldsSection;
