/**
 * IssuerSection - Issuer/Profile information
 */

import React from 'react';
import { Building2 } from 'lucide-react';

import { OBv3CredentialTemplate, IssuerTemplate, TemplateFieldValue, staticField, systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface IssuerSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const IssuerSection: React.FC<IssuerSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
}) => {
    const updateIssuer = (key: keyof IssuerTemplate, value: TemplateFieldValue) => {
        onChange({
            ...template,
            issuer: { ...template.issuer, [key]: value },
        });
    };

    return (
        <CollapsibleSection
            title="Issuer"
            icon={<Building2 className="w-4 h-4 text-blue-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Issuer Name"
                field={template.issuer.name}
                onChange={(f) => updateIssuer('name', f)}
                placeholder="e.g., Your Organization"
                helpText="The name of the organization issuing this credential"
                required
            />

            <FieldEditor
                label="Issuer URL"
                field={template.issuer.url || staticField('')}
                onChange={(f) => updateIssuer('url', f)}
                placeholder="https://your-organization.com"
                helpText="Website URL of the issuing organization"
                type="url"
            />

            <FieldEditor
                label="Issuer Email"
                field={template.issuer.email || staticField('')}
                onChange={(f) => updateIssuer('email', f)}
                placeholder="contact@your-organization.com"
                helpText="Contact email for the issuing organization"
                type="email"
            />

            <FieldEditor
                label="Issuer Description"
                field={template.issuer.description || staticField('')}
                onChange={(f) => updateIssuer('description', f)}
                placeholder="About the issuing organization..."
                helpText="Brief description of the issuing organization"
                type="textarea"
            />

            <FieldEditor
                label="Issuer Logo"
                field={template.issuer.image || staticField('')}
                onChange={(f) => updateIssuer('image', f)}
                placeholder="https://example.com/logo.png"
                helpText="URL to the issuer's logo image"
                type="url"
                enableFileUpload
            />

            <FieldEditor
                label="Issuer ID (DID)"
                field={systemField('Your organization\'s Decentralized Identifier (DID) from your LearnCard wallet')}
                onChange={() => {}}
                helpText="Automatically set to your wallet's DID when the credential is issued"
            />
        </CollapsibleSection>
    );
};

export default IssuerSection;
