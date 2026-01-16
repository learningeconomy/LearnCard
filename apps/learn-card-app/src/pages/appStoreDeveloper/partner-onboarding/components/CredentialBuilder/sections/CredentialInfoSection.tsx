/**
 * CredentialInfoSection - Core credential info (name, description, image)
 */

import React from 'react';
import { FileText } from 'lucide-react';

import { OBv3CredentialTemplate, TemplateFieldValue, staticField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface CredentialInfoSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const CredentialInfoSection: React.FC<CredentialInfoSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
}) => {
    const updateField = (key: keyof OBv3CredentialTemplate, value: TemplateFieldValue) => {
        onChange({ ...template, [key]: value });
    };

    return (
        <CollapsibleSection
            title="Credential Info"
            icon={<FileText className="w-4 h-4 text-cyan-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Credential Name"
                field={template.name}
                onChange={(f) => updateField('name', f)}
                placeholder="e.g., Course Completion Certificate"
                helpText="The name displayed on the credential"
                required
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label="Description"
                field={template.description || staticField('')}
                onChange={(f) => updateField('description', f)}
                placeholder="Describe what this credential represents..."
                helpText="A brief description of the credential"
                type="textarea"
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label="Credential Image"
                field={template.image || staticField('')}
                onChange={(f) => updateField('image', f)}
                placeholder="https://example.com/credential-image.png"
                helpText="URL to an image representing the credential"
                type="url"
                enableFileUpload
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label="Credential ID"
                field={template.id || staticField('')}
                onChange={(f) => updateField('id', f)}
                placeholder="urn:uuid:..."
                helpText="Unique identifier for this credential (usually auto-generated)"
                showDynamicToggle={!disableDynamicFields}
            />
        </CollapsibleSection>
    );
};

export default CredentialInfoSection;
