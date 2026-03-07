/**
 * IssuerSection - Issuer profile fields (name, logo, website, email) + auto-injected DID
 */

import React from 'react';
import { Building2 } from 'lucide-react';

import { OBv3CredentialTemplate, IssuerTemplate, TemplateFieldValue, systemField, staticField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';
import { FieldValidationError, getFieldError } from '../utils';

interface IssuerSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
    validationErrors?: FieldValidationError[];
}

export const IssuerSection: React.FC<IssuerSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
    validationErrors = [],
}) => {
    const issuer = template.issuer;

    const updateIssuer = (key: keyof IssuerTemplate, value: TemplateFieldValue) => {
        onChange({
            ...template,
            issuer: { ...issuer, [key]: value },
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
                label="Issuer (DID)"
                field={issuer.id ?? systemField('issuer_did')}
                onChange={() => {}}
                helpText="Automatically set to your wallet's DID when the credential is issued"
            />

            <FieldEditor
                label="Organization Name"
                field={issuer.name}
                onChange={(value) => updateIssuer('name', value)}
                showDynamicToggle={!disableDynamicFields}
                error={getFieldError(validationErrors, 'issuer.name')}
            />

            <FieldEditor
                label="Logo / Image URL"
                field={issuer.image ?? staticField('')}
                onChange={(value) => updateIssuer('image', value)}
                showDynamicToggle={!disableDynamicFields}
                placeholder="https://example.com/logo.png"
                error={getFieldError(validationErrors, 'issuer.image')}
            />

            <FieldEditor
                label="Website URL"
                field={issuer.url ?? staticField('')}
                onChange={(value) => updateIssuer('url', value)}
                showDynamicToggle={!disableDynamicFields}
                placeholder="https://example.com"
                error={getFieldError(validationErrors, 'issuer.url')}
            />

            <FieldEditor
                label="Email"
                field={issuer.email ?? staticField('')}
                onChange={(value) => updateIssuer('email', value)}
                showDynamicToggle={!disableDynamicFields}
                placeholder="contact@example.com"
                error={getFieldError(validationErrors, 'issuer.email')}
            />
        </CollapsibleSection>
    );
};

export default IssuerSection;
