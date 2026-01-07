/**
 * RecipientSection - Credential subject/recipient information
 */

import React from 'react';
import { User } from 'lucide-react';

import { OBv3CredentialTemplate, CredentialSubjectTemplate, TemplateFieldValue, staticField } from '../types';
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
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <span className="text-xs text-emerald-700">
                    <strong>Note:</strong> Recipient fields are typically dynamic since they change for each credential issued.
                    The recipient's DID is automatically set when the credential is sent.
                </span>
            </div>

            <FieldEditor
                label="Recipient Name"
                field={subject.name || staticField('')}
                onChange={(f) => updateSubject('name', f)}
                placeholder="Recipient's full name"
                helpText="The name of the person receiving this credential"
            />

            <FieldEditor
                label="Recipient ID"
                field={subject.id || staticField('')}
                onChange={(f) => updateSubject('id', f)}
                placeholder="did:..."
                helpText="The recipient's DID (usually set automatically when issuing)"
            />
        </CollapsibleSection>
    );
};

export default RecipientSection;
