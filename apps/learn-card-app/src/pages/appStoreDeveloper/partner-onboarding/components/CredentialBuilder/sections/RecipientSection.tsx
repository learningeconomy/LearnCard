/**
 * RecipientSection - Credential subject/recipient information
 */

import React from 'react';
import { User } from 'lucide-react';

import { OBv3CredentialTemplate, CredentialSubjectTemplate, TemplateFieldValue, staticField, systemField } from '../types';
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

    const updateSubject = (key: keyof CredentialSubjectTemplate, value: TemplateFieldValue) => {
        onChange({
            ...template,
            credentialSubject: { ...subject, [key]: value },
        });
    };

    return (
        <CollapsibleSection
            title="Recipient"
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
        </CollapsibleSection>
    );
};

export default RecipientSection;
