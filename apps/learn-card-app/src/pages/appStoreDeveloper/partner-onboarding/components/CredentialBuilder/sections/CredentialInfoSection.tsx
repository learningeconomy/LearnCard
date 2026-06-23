/**
 * CredentialInfoSection - Core credential info (name, description, image)
 */

import React from 'react';
import { FileText } from 'lucide-react';

import * as m from '../../../../../../paraglide/messages.js';

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
            title={m['developerPortal.credentialBuilder.sectionTitles.credentialInfo']()}
            icon={<FileText className="w-4 h-4 text-cyan-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label={m['developerPortal.credentialBuilder.credentialInfo.name']()}
                field={template.name || staticField('')}
                onChange={(f) => updateField('name', f)}
                placeholder={m['developerPortal.credentialBuilder.credentialInfo.namePlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.credentialInfo.nameHelp']()}
                required
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.credentialInfo.description']()}
                field={template.description || staticField('')}
                onChange={(f) => updateField('description', f)}
                placeholder={m['developerPortal.credentialBuilder.credentialInfo.descriptionPlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.credentialInfo.descriptionHelp']()}
                type="textarea"
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.credentialInfo.image']()}
                field={template.image || staticField('')}
                onChange={(f) => updateField('image', f)}
                placeholder={m['developerPortal.credentialBuilder.credentialInfo.imagePlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.credentialInfo.imageHelp']()}
                type="url"
                enableFileUpload
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.credentialInfo.id']()}
                field={template.id || staticField('')}
                onChange={(f) => updateField('id', f)}
                placeholder={m['developerPortal.credentialBuilder.credentialInfo.idPlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.credentialInfo.idHelp']()}
                showDynamicToggle={!disableDynamicFields}
            />
        </CollapsibleSection>
    );
};

export default CredentialInfoSection;
